<?php
/**
 * API Realtime Akun Jabar - FORBASI v3.0
 * 
 * API realtime untuk autentikasi & sinkronisasi akun users, pengcab, dan pengda
 * di wilayah Pengda Jawa Barat. Password diverifikasi langsung ke database,
 * sehingga jika password diganti di FORBASI → otomatis berlaku di sini.
 * 
 * Endpoints:
 *   POST ?action=login              → Login/autentikasi realtime (semua role)
 *   GET  ?action=accounts           → Daftar akun (filter: role, search, page)
 *   GET  ?action=account&id=x       → Detail satu akun by ID atau username
 *   POST ?action=update_profile     → Edit profil akun
 *   POST ?action=change_password    → Ganti password
 *   GET  ?action=sync&since=...     → Akun berubah sejak timestamp
 *   GET  ?action=ping               → Health check & statistik
 */

// ============================================================
// ERROR HANDLING: Output harus selalu JSON bersih
// ============================================================
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);
ini_set('log_errors', 1);

ob_start();

set_error_handler(function($errno, $errstr, $errfile, $errline) {
    ob_clean();
    header('Content-Type: application/json; charset=UTF-8');
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal server error',
        'detail' => $errstr
    ], JSON_UNESCAPED_UNICODE);
    exit;
});

register_shutdown_function(function() {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        ob_clean();
        header('Content-Type: application/json; charset=UTF-8');
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Fatal server error',
            'detail' => $error['message']
        ], JSON_UNESCAPED_UNICODE);
    }
});

// ============================================================
// KONFIGURASI
// ============================================================
define('API_KEY', 'fbsi-jabar-2026-S3cur3K3y!');
define('API_VERSION', '3.0');
define('PENGDA_REGION', 'Jawa Barat');
define('PROVINCE_ID_JABAR', 12);

// Role IDs
define('ROLE_USER', 1);
define('ROLE_PENGCAB', 2);
define('ROLE_PENGDA', 3);

// Allowed roles for this API
define('ALLOWED_ROLES', [ROLE_USER, ROLE_PENGCAB, ROLE_PENGDA]);

// Fields yang boleh di-edit via update_profile
define('EDITABLE_FIELDS', ['club_name', 'email', 'phone', 'address', 'school_name']);

// Pagination default
define('DEFAULT_PER_PAGE', 50);
define('MAX_PER_PAGE', 200);

// Base URL untuk file KTA (production)
define('BASE_URL', 'https://forbasi.or.id/forbasi/php/');

// ============================================================
// SETUP
// ============================================================
ob_clean();

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-API-Key, Authorization');
header('Cache-Control: no-cache, no-store, must-revalidate');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Load database
try {
    require_once __DIR__ . '/db_config.php';
} catch (Exception $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database config error']);
    exit;
}

if (!isset($conn) || $conn->connect_error) {
    ob_clean();
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}

// ============================================================
// HELPERS
// ============================================================
function json_response($data, $code = 200) {
    while (ob_get_level()) ob_end_clean();
    http_response_code($code);
    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

function json_error($msg, $code = 400) {
    json_response(['success' => false, 'error' => $msg], $code);
}

function validate_api_key() {
    $key = $_SERVER['HTTP_X_API_KEY'] ?? '';
    if (empty($key)) $key = $_GET['api_key'] ?? $_POST['api_key'] ?? '';
    if (empty($key)) {
        $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (preg_match('/Bearer\s+(.+)$/i', $auth, $m)) $key = $m[1];
    }
    if (empty($key) || !hash_equals(API_KEY, $key)) {
        json_error('Unauthorized. API key tidak valid.', 401);
    }
}

function get_json_input() {
    $data = json_decode(file_get_contents('php://input'), true);
    return (json_last_error() === JSON_ERROR_NONE && is_array($data)) ? $data : $_POST;
}

function get_role_label($role_id) {
    $map = [ROLE_USER => 'User', ROLE_PENGCAB => 'Pengcab', ROLE_PENGDA => 'Pengda'];
    return $map[$role_id] ?? 'Unknown';
}

function get_roles_sql_in() {
    return implode(',', ALLOWED_ROLES);
}

function build_logo_url($logo_path) {
    if (empty($logo_path)) return null;
    if (strpos($logo_path, 'kta_files/') === 0 || strpos($logo_path, 'uploads/') === 0) {
        return BASE_URL . $logo_path;
    }
    return BASE_URL . 'uploads/' . $logo_path;
}

function format_account($row, $include_address = false) {
    $account = [
        'id'            => (int) $row['id'],
        'club_name'     => $row['club_name'],
        'username'      => $row['username'],
        'email'         => $row['email'],
        'phone'         => $row['phone'],
        'role'          => get_role_label((int) $row['role_id']),
        'role_id'       => (int) $row['role_id'],
        'logo_url'      => build_logo_url($row['user_logo_path'] ?? null),
        'province_id'   => $row['province_id'] ? (int) $row['province_id'] : null,
        'city_id'       => $row['city_id'] ? (int) $row['city_id'] : null,
        'province_name' => $row['province_name'] ?? null,
        'city_name'     => $row['city_name'] ?? null,
        'region'        => PENGDA_REGION,
        'created_at'    => $row['created_at'],
        'updated_at'    => $row['updated_at'],
    ];
    if ($include_address) {
        $account['address'] = $row['address'] ?? null;
        $account['school_name'] = $row['school_name'] ?? null;
    }
    return $account;
}

function format_kta($row) {
    $kta = [
        'kta_id'             => (int) $row['kta_id'],
        'status'             => $row['kta_status'],
        'status_label'       => get_kta_status_label($row['kta_status']),
        'club_name'          => $row['kta_club_name'],
        'school_name'        => $row['kta_school_name'] ?? null,
        'leader_name'        => $row['leader_name'],
        'coach_name'         => $row['coach_name'],
        'manager_name'       => $row['manager_name'],
        'club_address'       => $row['club_address'],
        'province'           => $row['kta_province'] ?? null,
        'regency'            => $row['kta_regency'] ?? null,
        'barcode_id'         => $row['kta_barcode_unique_id'] ?? null,
        'kta_issued_at'      => $row['kta_issued_at'] ?? null,
        'created_at'         => $row['kta_created_at'],
        'nominal_paid'       => $row['nominal_paid'] ? (int) $row['nominal_paid'] : null,
    ];

    // Logo URL
    if (!empty($row['kta_logo_path'])) {
        $logo = $row['kta_logo_path'];
        // Beberapa logo disimpan di kta_files/, beberapa langsung filename
        if (strpos($logo, 'kta_files/') === 0 || strpos($logo, 'uploads/') === 0) {
            $kta['logo_url'] = BASE_URL . $logo;
        } else {
            $kta['logo_url'] = BASE_URL . 'uploads/' . $logo;
        }
    } else {
        $kta['logo_url'] = null;
    }

    // KTA PDF download URL (final PB version)
    if (!empty($row['generated_kta_file_path_pb'])) {
        $kta['kta_pdf_url'] = BASE_URL . $row['generated_kta_file_path_pb'];
    } else {
        $kta['kta_pdf_url'] = null;
    }

    // KTA detail / verification page
    if (!empty($row['kta_barcode_unique_id'])) {
        $kta['kta_detail_url'] = BASE_URL . 'view_kta_details.php?barcode_id=' . urlencode($row['kta_barcode_unique_id']);
    } else {
        $kta['kta_detail_url'] = null;
    }

    return $kta;
}

function get_kta_status_label($status) {
    $map = [
        'pending'                   => 'Menunggu Persetujuan Pengcab',
        'approved_pengcab'          => 'Disetujui Pengcab, Menunggu Pengda',
        'approved_pengda'           => 'Disetujui Pengda, Menunggu PB',
        'approved_pb'               => 'Disetujui PB, Menunggu Cetak',
        'kta_issued'                => 'KTA Terbit',
        'rejected_pengcab'          => 'Ditolak Pengcab',
        'rejected_pengda'           => 'Ditolak Pengda',
        'rejected_pb'               => 'Ditolak PB',
        'pending_pengda_resubmit'   => 'Menunggu Pengajuan Ulang ke Pengda',
    ];
    return $map[$status] ?? $status;
}

function get_user_kta_data($conn, $user_id) {
    $sql = "SELECT ka.id AS kta_id, ka.status AS kta_status, ka.club_name AS kta_club_name,
                   ka.school_name AS kta_school_name,
                   ka.leader_name, ka.coach_name, ka.manager_name,
                   ka.club_address, ka.province AS kta_province, ka.regency AS kta_regency,
                   ka.logo_path AS kta_logo_path,
                   ka.kta_barcode_unique_id, ka.generated_kta_file_path_pb,
                   ka.kta_issued_at, ka.nominal_paid,
                   ka.created_at AS kta_created_at
            FROM kta_applications ka
            WHERE ka.user_id = ?
            ORDER BY ka.id DESC";
    $stmt = $conn->prepare($sql);
    if (!$stmt) return [];
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $kta_list = [];
    while ($row = $result->fetch_assoc()) {
        $kta_list[] = format_kta($row);
    }
    $stmt->close();
    return $kta_list;
}

// ============================================================
// AUTENTIKASI API KEY
// ============================================================
validate_api_key();

// ============================================================
// ROUTING
// ============================================================
$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch ($action) {
    case 'login':           handle_login($conn); break;
    case 'accounts':        handle_accounts($conn); break;
    case 'account':         handle_account($conn); break;
    case 'kta':             handle_kta($conn); break;
    case 'update_profile':  handle_update_profile($conn); break;
    case 'change_password': handle_change_password($conn); break;
    case 'sync':            handle_sync($conn); break;
    case 'ping':            handle_ping($conn); break;
    default:
        json_response([
            'success' => true,
            'message' => 'FORBASI Jabar Realtime API',
            'version' => API_VERSION,
            'region'  => PENGDA_REGION,
            'endpoints' => [
                'POST ?action=login'                 => 'Login realtime (body: username, password). Semua role: User, Pengcab, Pengda.',
                'GET  ?action=accounts'              => 'Daftar semua akun Jabar (User + Pengcab + Pengda)',
                'GET  ?action=accounts&role=user'    => 'Filter hanya users',
                'GET  ?action=accounts&role=pengcab'  => 'Filter hanya pengcab',
                'GET  ?action=accounts&role=pengda'   => 'Filter hanya pengda',
                'GET  ?action=accounts&search=keyword' => 'Cari berdasarkan nama/username/email',
                'GET  ?action=accounts&page=1&per_page=50' => 'Pagination',
                'GET  ?action=account&username=xxx'  => 'Detail akun by username (termasuk data KTA)',
                'GET  ?action=account&id=123'        => 'Detail akun by ID (termasuk data KTA)',
                'GET  ?action=kta&user_id=123'       => 'Data KTA user (download link, status, detail)',
                'GET  ?action=kta&username=xxx'      => 'Data KTA user by username',
                'POST ?action=update_profile'        => 'Edit profil (body: id, fields...)',
                'POST ?action=change_password'       => 'Ganti password (body: id, old_password, new_password)',
                'GET  ?action=sync&since=2026-01-01T00:00:00' => 'Akun berubah sejak timestamp',
                'GET  ?action=ping'                  => 'Health check & statistik',
            ],
            'auth' => 'Header X-API-Key, parameter api_key, atau Authorization: Bearer <key>',
            'editable_fields' => EDITABLE_FIELDS,
            'note' => 'API realtime - semua verifikasi langsung ke database FORBASI.'
        ]);
}

// ============================================================
// HANDLER: Login realtime
// Mendukung semua role: User, Pengcab, Pengda
// ============================================================
function handle_login($conn) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        json_error('Method harus POST.', 405);
    }
    
    $input = get_json_input();
    $username = trim($input['username'] ?? '');
    $password = $input['password'] ?? '';
    
    if (empty($username) || empty($password)) {
        json_error('Username dan password wajib diisi.');
    }
    
    $province_id = PROVINCE_ID_JABAR;
    $roles_in = get_roles_sql_in();
    
    $sql = "SELECT u.id, u.club_name, u.username, u.password, u.email, u.phone,
                   u.role_id, u.province_id, u.city_id, u.school_name,
                   p.name AS province_name,
                   c.name AS city_name,
                   u.created_at, u.updated_at,
                   (SELECT ka.logo_path FROM kta_applications ka WHERE ka.user_id = u.id ORDER BY ka.id DESC LIMIT 1) AS user_logo_path
            FROM users u
            LEFT JOIN provinces p ON u.province_id = p.id
            LEFT JOIN cities c ON u.city_id = c.id
            WHERE u.username = ?
              AND u.role_id IN ({$roles_in})
              AND u.province_id = ?";
    
    $stmt = $conn->prepare($sql);
    if (!$stmt) json_error('Query error', 500);
    
    $stmt->bind_param("si", $username, $province_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        json_error('Akun tidak ditemukan di wilayah Pengda Jawa Barat.', 401);
    }
    
    $user = $result->fetch_assoc();
    $stmt->close();
    
    // Verifikasi password REALTIME dari database FORBASI
    if (!password_verify($password, $user['password'])) {
        json_error('Password salah.', 401);
    }
    
    $account = format_account($user, true);
    $account['kta'] = get_user_kta_data($conn, (int) $user['id']);
    
    json_response([
        'success'   => true,
        'message'   => 'Login berhasil.',
        'timestamp' => date('c'),
        'user'      => $account
    ]);
}

// ============================================================
// HANDLER: Daftar akun dengan filter, search, pagination
// ?role=user|pengcab|pengda  &search=keyword  &page=1  &per_page=50
// ============================================================
function handle_accounts($conn) {
    $province_id = PROVINCE_ID_JABAR;
    $role_filter = strtolower(trim($_GET['role'] ?? ''));
    $search = trim($_GET['search'] ?? '');
    $page = max(1, intval($_GET['page'] ?? 1));
    $per_page = min(MAX_PER_PAGE, max(1, intval($_GET['per_page'] ?? DEFAULT_PER_PAGE)));
    $offset = ($page - 1) * $per_page;
    
    // Role filter
    $role_map = ['user' => ROLE_USER, 'pengcab' => ROLE_PENGCAB, 'pengda' => ROLE_PENGDA];
    if (isset($role_map[$role_filter])) {
        $where_role = "u.role_id = " . $role_map[$role_filter];
    } else {
        $where_role = "u.role_id IN (" . get_roles_sql_in() . ")";
    }
    
    // Search condition
    $where_search = "";
    $bind_types = "i";
    $bind_params = [&$province_id];
    
    if (!empty($search)) {
        $where_search = "AND (u.club_name LIKE ? OR u.username LIKE ? OR u.email LIKE ?)";
        $search_param = "%{$search}%";
        $bind_types = "isss";
        $bind_params[] = &$search_param;
        $bind_params[] = &$search_param;
        $bind_params[] = &$search_param;
    }
    
    // Count total
    $count_sql = "SELECT COUNT(*) as total FROM users u WHERE {$where_role} AND u.province_id = ? {$where_search}";
    $count_stmt = $conn->prepare($count_sql);
    if (!$count_stmt) json_error('Query error', 500);
    $count_stmt->bind_param($bind_types, ...$bind_params);
    $count_stmt->execute();
    $total = $count_stmt->get_result()->fetch_assoc()['total'];
    $count_stmt->close();
    
    // Fetch data
    $sql = "SELECT u.id, u.club_name, u.username, u.email, u.phone,
                   u.role_id, u.province_id, u.city_id,
                   p.name AS province_name,
                   c.name AS city_name,
                   u.created_at, u.updated_at,
                   (SELECT ka.logo_path FROM kta_applications ka WHERE ka.user_id = u.id ORDER BY ka.id DESC LIMIT 1) AS user_logo_path
            FROM users u
            LEFT JOIN provinces p ON u.province_id = p.id
            LEFT JOIN cities c ON u.city_id = c.id
            WHERE {$where_role}
              AND u.province_id = ?
              {$where_search}
            ORDER BY u.role_id ASC, u.club_name ASC
            LIMIT ? OFFSET ?";
    
    $data_bind_types = $bind_types . "ii";
    $data_bind_params = $bind_params;
    $data_bind_params[] = &$per_page;
    $data_bind_params[] = &$offset;
    
    $stmt = $conn->prepare($sql);
    if (!$stmt) json_error('Query error', 500);
    $stmt->bind_param($data_bind_types, ...$data_bind_params);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $accounts = [];
    $summary = ['user' => 0, 'pengcab' => 0, 'pengda' => 0];
    while ($row = $result->fetch_assoc()) {
        $accounts[] = format_account($row);
        $role = get_role_label((int)$row['role_id']);
        $key = strtolower($role);
        if (isset($summary[$key])) $summary[$key]++;
    }
    $stmt->close();
    
    $total_pages = ceil($total / $per_page);
    
    json_response([
        'success'    => true,
        'timestamp'  => date('c'),
        'region'     => PENGDA_REGION,
        'total'      => (int) $total,
        'page'       => $page,
        'per_page'   => $per_page,
        'total_pages' => (int) $total_pages,
        'summary'    => $summary,
        'data'       => $accounts
    ]);
}

// ============================================================
// HANDLER: Detail satu akun (by username atau id)
// ============================================================
function handle_account($conn) {
    $username = trim($_GET['username'] ?? '');
    $id = intval($_GET['id'] ?? 0);
    
    if (empty($username) && $id <= 0) {
        json_error('Parameter username atau id wajib diisi.');
    }
    
    $province_id = PROVINCE_ID_JABAR;
    $roles_in = get_roles_sql_in();
    
    if (!empty($username)) {
        $sql = "SELECT u.id, u.club_name, u.username, u.email, u.phone,
                       u.role_id, u.province_id, u.city_id, u.address, u.school_name,
                       p.name AS province_name,
                       c.name AS city_name,
                       u.created_at, u.updated_at,
                       (SELECT ka.logo_path FROM kta_applications ka WHERE ka.user_id = u.id ORDER BY ka.id DESC LIMIT 1) AS user_logo_path
                FROM users u
                LEFT JOIN provinces p ON u.province_id = p.id
                LEFT JOIN cities c ON u.city_id = c.id
                WHERE u.username = ?
                  AND u.role_id IN ({$roles_in})
                  AND u.province_id = ?";
        $stmt = $conn->prepare($sql);
        if (!$stmt) json_error('Query error', 500);
        $stmt->bind_param("si", $username, $province_id);
    } else {
        $sql = "SELECT u.id, u.club_name, u.username, u.email, u.phone,
                       u.role_id, u.province_id, u.city_id, u.address, u.school_name,
                       p.name AS province_name,
                       c.name AS city_name,
                       u.created_at, u.updated_at,
                       (SELECT ka.logo_path FROM kta_applications ka WHERE ka.user_id = u.id ORDER BY ka.id DESC LIMIT 1) AS user_logo_path
                FROM users u
                LEFT JOIN provinces p ON u.province_id = p.id
                LEFT JOIN cities c ON u.city_id = c.id
                WHERE u.id = ?
                  AND u.role_id IN ({$roles_in})
                  AND u.province_id = ?";
        $stmt = $conn->prepare($sql);
        if (!$stmt) json_error('Query error', 500);
        $stmt->bind_param("ii", $id, $province_id);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        json_error('Akun tidak ditemukan di wilayah Jawa Barat.', 404);
    }
    
    $user = $result->fetch_assoc();
    $stmt->close();
    
    $account = format_account($user, true);
    $account['kta'] = get_user_kta_data($conn, (int) $user['id']);
    
    json_response([
        'success'   => true,
        'timestamp' => date('c'),
        'data'      => $account
    ]);
}

// ============================================================
// HANDLER: Data KTA user
// ?action=kta&user_id=123  atau  ?action=kta&username=xxx
// ============================================================
function handle_kta($conn) {
    $user_id = intval($_GET['user_id'] ?? 0);
    $username = trim($_GET['username'] ?? '');
    
    if ($user_id <= 0 && empty($username)) {
        json_error('Parameter user_id atau username wajib diisi.');
    }
    
    $province_id = PROVINCE_ID_JABAR;
    $roles_in = get_roles_sql_in();
    
    // Cari user dulu
    if ($user_id > 0) {
        $sql = "SELECT id, club_name, username, role_id FROM users WHERE id = ? AND role_id IN ({$roles_in}) AND province_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ii", $user_id, $province_id);
    } else {
        $sql = "SELECT id, club_name, username, role_id FROM users WHERE username = ? AND role_id IN ({$roles_in}) AND province_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("si", $username, $province_id);
    }
    
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    
    if (!$user) {
        json_error('Akun tidak ditemukan di wilayah Jawa Barat.', 404);
    }
    
    $uid = (int) $user['id'];
    $kta_list = get_user_kta_data($conn, $uid);
    
    json_response([
        'success'   => true,
        'timestamp' => date('c'),
        'user'      => [
            'id'        => $uid,
            'username'  => $user['username'],
            'club_name' => $user['club_name'],
            'role'      => get_role_label((int) $user['role_id']),
        ],
        'total_kta' => count($kta_list),
        'kta'       => $kta_list
    ]);
}

// ============================================================
// HANDLER: Edit profil akun
// Body JSON: { "id": 123, "club_name": "...", "email": "...", ... }
// Hanya field dalam EDITABLE_FIELDS yang diizinkan.
// ============================================================
function handle_update_profile($conn) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        json_error('Method harus POST.', 405);
    }
    
    $input = get_json_input();
    $id = intval($input['id'] ?? 0);
    $username_input = trim($input['username'] ?? '');
    
    // Bisa identifikasi pakai id atau username
    if ($id <= 0 && empty($username_input)) {
        json_error('Parameter id atau username wajib diisi untuk identifikasi akun.');
    }
    
    $province_id = PROVINCE_ID_JABAR;
    $roles_in = get_roles_sql_in();
    
    // Cari akun dulu
    if ($id > 0) {
        $find_sql = "SELECT id, username, role_id FROM users WHERE id = ? AND role_id IN ({$roles_in}) AND province_id = ?";
        $find_stmt = $conn->prepare($find_sql);
        $find_stmt->bind_param("ii", $id, $province_id);
    } else {
        $find_sql = "SELECT id, username, role_id FROM users WHERE username = ? AND role_id IN ({$roles_in}) AND province_id = ?";
        $find_stmt = $conn->prepare($find_sql);
        $find_stmt->bind_param("si", $username_input, $province_id);
    }
    
    $find_stmt->execute();
    $user = $find_stmt->get_result()->fetch_assoc();
    $find_stmt->close();
    
    if (!$user) {
        json_error('Akun tidak ditemukan di wilayah Jawa Barat.', 404);
    }
    
    $user_id = (int) $user['id'];
    
    // Kumpulkan field yang mau diupdate
    $updates = [];
    $types = '';
    $values = [];
    
    foreach (EDITABLE_FIELDS as $field) {
        if (array_key_exists($field, $input)) {
            $value = trim($input[$field]);
            
            // Validasi email
            if ($field === 'email' && !empty($value)) {
                if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
                    json_error("Format email tidak valid.");
                }
                // Cek duplikat email
                $dup_stmt = $conn->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
                $dup_stmt->bind_param("si", $value, $user_id);
                $dup_stmt->execute();
                if ($dup_stmt->get_result()->num_rows > 0) {
                    json_error("Email sudah digunakan oleh akun lain.");
                }
                $dup_stmt->close();
            }
            
            // Validasi phone
            if ($field === 'phone' && !empty($value)) {
                if (!preg_match('/^[0-9+\-\s]{8,20}$/', $value)) {
                    json_error("Format nomor telepon tidak valid.");
                }
            }
            
            $updates[] = "`{$field}` = ?";
            $types .= 's';
            $values[] = $value;
        }
    }
    
    if (empty($updates)) {
        json_error('Tidak ada field yang diupdate. Field yang diizinkan: ' . implode(', ', EDITABLE_FIELDS));
    }
    
    // Execute update
    $update_sql = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = ?";
    $types .= 'i';
    $values[] = $user_id;
    
    $update_stmt = $conn->prepare($update_sql);
    if (!$update_stmt) json_error('Query error', 500);
    
    $update_stmt->bind_param($types, ...$values);
    $update_stmt->execute();
    
    if ($update_stmt->affected_rows === 0 && $update_stmt->errno > 0) {
        json_error('Gagal mengupdate profil: ' . $update_stmt->error, 500);
    }
    $update_stmt->close();
    
    // Ambil data terbaru
    $roles_in2 = get_roles_sql_in();
    $fresh_sql = "SELECT u.id, u.club_name, u.username, u.email, u.phone,
                         u.role_id, u.province_id, u.city_id, u.address, u.school_name,
                         p.name AS province_name,
                         c.name AS city_name,
                         u.created_at, u.updated_at,
                         (SELECT ka.logo_path FROM kta_applications ka WHERE ka.user_id = u.id ORDER BY ka.id DESC LIMIT 1) AS user_logo_path
                  FROM users u
                  LEFT JOIN provinces p ON u.province_id = p.id
                  LEFT JOIN cities c ON u.city_id = c.id
                  WHERE u.id = ?";
    $fresh_stmt = $conn->prepare($fresh_sql);
    $fresh_stmt->bind_param("i", $user_id);
    $fresh_stmt->execute();
    $updated_user = $fresh_stmt->get_result()->fetch_assoc();
    $fresh_stmt->close();
    
    json_response([
        'success'   => true,
        'message'   => 'Profil berhasil diupdate.',
        'timestamp' => date('c'),
        'data'      => format_account($updated_user, true)
    ]);
}

// ============================================================
// HANDLER: Ganti password
// Body JSON: { "id": 123, "old_password": "...", "new_password": "..." }
// Atau: { "username": "xxx", "old_password": "...", "new_password": "..." }
// ============================================================
function handle_change_password($conn) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        json_error('Method harus POST.', 405);
    }
    
    $input = get_json_input();
    $id = intval($input['id'] ?? 0);
    $username_input = trim($input['username'] ?? '');
    $old_password = $input['old_password'] ?? '';
    $new_password = $input['new_password'] ?? '';
    
    if ($id <= 0 && empty($username_input)) {
        json_error('Parameter id atau username wajib diisi.');
    }
    if (empty($old_password) || empty($new_password)) {
        json_error('old_password dan new_password wajib diisi.');
    }
    if (strlen($new_password) < 6) {
        json_error('Password baru minimal 6 karakter.');
    }
    
    $province_id = PROVINCE_ID_JABAR;
    $roles_in = get_roles_sql_in();
    
    // Cari akun
    if ($id > 0) {
        $sql = "SELECT id, username, password FROM users WHERE id = ? AND role_id IN ({$roles_in}) AND province_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ii", $id, $province_id);
    } else {
        $sql = "SELECT id, username, password FROM users WHERE username = ? AND role_id IN ({$roles_in}) AND province_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("si", $username_input, $province_id);
    }
    
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    
    if (!$user) {
        json_error('Akun tidak ditemukan di wilayah Jawa Barat.', 404);
    }
    
    // Verifikasi password lama
    if (!password_verify($old_password, $user['password'])) {
        json_error('Password lama salah.', 401);
    }
    
    // Update password baru
    $hashed = password_hash($new_password, PASSWORD_BCRYPT);
    $update_stmt = $conn->prepare("UPDATE users SET password = ? WHERE id = ?");
    $user_id = (int) $user['id'];
    $update_stmt->bind_param("si", $hashed, $user_id);
    $update_stmt->execute();
    $update_stmt->close();
    
    json_response([
        'success'   => true,
        'message'   => 'Password berhasil diubah.',
        'timestamp' => date('c'),
        'user_id'   => $user_id,
        'username'  => $user['username'],
        'note'      => 'Password baru langsung berlaku di semua aplikasi yang menggunakan API ini.'
    ]);
}

// ============================================================
// HANDLER: Sync - akun yang berubah sejak timestamp tertentu
// ============================================================
function handle_sync($conn) {
    $since = trim($_GET['since'] ?? '');
    
    if (empty($since)) {
        json_error('Parameter since wajib diisi (format: 2026-01-01T00:00:00).');
    }
    
    $ts = strtotime($since);
    if ($ts === false) {
        json_error('Format since tidak valid. Gunakan format ISO 8601.');
    }
    $since_formatted = date('Y-m-d H:i:s', $ts);
    
    $province_id = PROVINCE_ID_JABAR;
    $roles_in = get_roles_sql_in();
    
    $sql = "SELECT u.id, u.club_name, u.username, u.email, u.phone,
                   u.role_id, u.province_id, u.city_id,
                   p.name AS province_name,
                   c.name AS city_name,
                   u.created_at, u.updated_at,
                   (SELECT ka.logo_path FROM kta_applications ka WHERE ka.user_id = u.id ORDER BY ka.id DESC LIMIT 1) AS user_logo_path
            FROM users u
            LEFT JOIN provinces p ON u.province_id = p.id
            LEFT JOIN cities c ON u.city_id = c.id
            WHERE u.role_id IN ({$roles_in})
              AND u.province_id = ?
              AND u.updated_at > ?
            ORDER BY u.updated_at DESC";
    
    $stmt = $conn->prepare($sql);
    if (!$stmt) json_error('Query error', 500);
    
    $stmt->bind_param("is", $province_id, $since_formatted);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $changed = [];
    while ($row = $result->fetch_assoc()) {
        $changed[] = format_account($row);
    }
    $stmt->close();
    
    json_response([
        'success'       => true,
        'timestamp'     => date('c'),
        'since'         => $since_formatted,
        'total_changed' => count($changed),
        'data'          => $changed,
        'note'          => 'Akun yang di-update (termasuk ganti password, edit profil) sejak timestamp tersebut'
    ]);
}

// ============================================================
// HANDLER: Health check + statistik
// ============================================================
function handle_ping($conn) {
    $province_id = PROVINCE_ID_JABAR;
    
    $sql = "SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN role_id = ? THEN 1 ELSE 0 END) as total_user,
                SUM(CASE WHEN role_id = ? THEN 1 ELSE 0 END) as total_pengcab,
                SUM(CASE WHEN role_id = ? THEN 1 ELSE 0 END) as total_pengda,
                MAX(updated_at) as last_updated
            FROM users
            WHERE role_id IN (?, ?, ?)
              AND province_id = ?";
    
    $stmt = $conn->prepare($sql);
    if (!$stmt) json_error('Query error', 500);
    
    $ru = ROLE_USER; $rp = ROLE_PENGCAB; $rd = ROLE_PENGDA;
    $stmt->bind_param("iiiiiii", $ru, $rp, $rd, $ru, $rp, $rd, $province_id);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    
    // KTA stats
    $kta_sql = "SELECT 
                    COUNT(*) as total_kta,
                    SUM(CASE WHEN ka.status = 'kta_issued' THEN 1 ELSE 0 END) as kta_issued,
                    SUM(CASE WHEN ka.status = 'pending' THEN 1 ELSE 0 END) as kta_pending,
                    SUM(CASE WHEN ka.status LIKE 'approved%' THEN 1 ELSE 0 END) as kta_in_process,
                    SUM(CASE WHEN ka.status LIKE 'rejected%' THEN 1 ELSE 0 END) as kta_rejected
                FROM kta_applications ka
                JOIN users u ON ka.user_id = u.id
                WHERE u.province_id = ? AND u.role_id IN (" . get_roles_sql_in() . ")";
    $kta_stmt = $conn->prepare($kta_sql);
    $kta_stmt->bind_param("i", $province_id);
    $kta_stmt->execute();
    $kta_row = $kta_stmt->get_result()->fetch_assoc();
    $kta_stmt->close();
    
    json_response([
        'success'        => true,
        'status'         => 'online',
        'version'        => API_VERSION,
        'region'         => PENGDA_REGION,
        'server_time'    => date('c'),
        'total_accounts' => (int) $row['total'],
        'total_user'     => (int) $row['total_user'],
        'total_pengcab'  => (int) $row['total_pengcab'],
        'total_pengda'   => (int) $row['total_pengda'],
        'last_updated'   => $row['last_updated'],
        'kta_stats'      => [
            'total'       => (int) ($kta_row['total_kta'] ?? 0),
            'issued'      => (int) ($kta_row['kta_issued'] ?? 0),
            'pending'     => (int) ($kta_row['kta_pending'] ?? 0),
            'in_process'  => (int) ($kta_row['kta_in_process'] ?? 0),
            'rejected'    => (int) ($kta_row['kta_rejected'] ?? 0),
        ],
        'note'           => 'Gunakan last_updated sebagai parameter since di endpoint sync'
    ]);
}

$conn->close();
?>
