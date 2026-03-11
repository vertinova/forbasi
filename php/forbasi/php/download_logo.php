<?php
// Clear any output buffer to prevent file corruption
if (ob_get_level()) {
    ob_end_clean();
}

session_start();
require_once 'db_config.php';

// Enable error logging for debugging
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php_error_log_download.txt');

// Debug: Log session info
error_log("Session data: " . print_r($_SESSION, true));
error_log("GET parameters: " . print_r($_GET, true));

// Cek apakah user sudah login dan memiliki role admin (Pengcab, Pengda, atau PB)
if (!isset($_SESSION['user_id']) || !in_array($_SESSION['role_id'], [2, 3, 4])) {
    http_response_code(403);
    die("Akses tidak diizinkan. User ID: " . ($_SESSION['user_id'] ?? 'tidak ada') . ", Role: " . ($_SESSION['role_id'] ?? 'tidak ada'));
}

// Validasi parameter - support both application_id and kta_id
$application_id = null;
if (isset($_GET['application_id']) && is_numeric($_GET['application_id'])) {
    $application_id = (int)$_GET['application_id'];
} elseif (isset($_GET['kta_id']) && is_numeric($_GET['kta_id'])) {
    $application_id = (int)$_GET['kta_id'];
} else {
    http_response_code(400);
    die("Parameter tidak valid. Gunakan application_id atau kta_id.");
}
$admin_id = $_SESSION['user_id'];
$admin_role = $_SESSION['role_id'];

// Query untuk mengambil data aplikasi KTA
$query = "SELECT ka.id, ka.user_id, ka.club_name, ka.logo_path, ka.status,
                 u.province_id, u.city_id, u.username
          FROM kta_applications ka
          JOIN users u ON ka.user_id = u.id
          WHERE ka.id = ?";

$stmt = $conn->prepare($query);
if (!$stmt) {
    http_response_code(500);
    die("Error preparing query: " . $conn->error);
}

$stmt->bind_param("i", $application_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(404);
    die("Data aplikasi tidak ditemukan.");
}

$app_data = $result->fetch_assoc();
$stmt->close();

// Validasi akses berdasarkan role
$access_granted = false;

if ($admin_role == 2) { // Pengcab
    // Ambil data lokasi admin Pengcab
    $query_admin = "SELECT province_id, city_id FROM users WHERE id = ? AND role_id = 2";
    $stmt_admin = $conn->prepare($query_admin);
    if ($stmt_admin) {
        $stmt_admin->bind_param("i", $admin_id);
        $stmt_admin->execute();
        $result_admin = $stmt_admin->get_result();
        if ($admin_data = $result_admin->fetch_assoc()) {
            // Pengcab hanya bisa download logo dari aplikasi di wilayahnya
            if ($admin_data['province_id'] == $app_data['province_id'] && 
                $admin_data['city_id'] == $app_data['city_id']) {
                $access_granted = true;
            }
        }
        $stmt_admin->close();
    }
} elseif ($admin_role == 3) { // Pengda
    // Ambil data lokasi admin Pengda
    $query_admin = "SELECT province_id FROM users WHERE id = ? AND role_id = 3";
    $stmt_admin = $conn->prepare($query_admin);
    if ($stmt_admin) {
        $stmt_admin->bind_param("i", $admin_id);
        $stmt_admin->execute();
        $result_admin = $stmt_admin->get_result();
        if ($admin_data = $result_admin->fetch_assoc()) {
            // Pengda hanya bisa download logo dari aplikasi di provinsinya
            if ($admin_data['province_id'] == $app_data['province_id']) {
                $access_granted = true;
            }
        }
        $stmt_admin->close();
    }
} elseif ($admin_role == 4) { // PB
    // PB bisa mengakses semua aplikasi
    $access_granted = true;
}

if (!$access_granted) {
    http_response_code(403);
    die("Anda tidak memiliki akses untuk mendownload logo ini.");
}

// Debug: Log application data
error_log("Application ID: " . $application_id);
error_log("Application data: " . print_r($app_data, true));

// Cek apakah file logo ada
if (empty($app_data['logo_path'])) {
    http_response_code(404);
    die("Logo tidak tersedia untuk aplikasi ini. Logo path kosong dalam database.");
}

// Tentukan path file logo
$upload_base_path = __DIR__ . '/uploads/';
$logo_file_path = $upload_base_path . $app_data['logo_path'];

// Debug: Log path for troubleshooting
error_log("Logo path from DB: " . $app_data['logo_path']);
error_log("Full logo file path: " . $logo_file_path);
error_log("Upload base path: " . $upload_base_path);
error_log("File exists check: " . (file_exists($logo_file_path) ? 'YES' : 'NO'));

// Cek apakah file fisik ada
if (!file_exists($logo_file_path)) {
    // Try alternative paths
    $alternative_paths = [
        $upload_base_path . 'kta_files/' . $app_data['logo_path'],
        $upload_base_path . 'logos/' . $app_data['logo_path'],
        dirname(__DIR__) . '/uploads/' . $app_data['logo_path'],
        dirname(__DIR__) . '/uploads/kta_files/' . $app_data['logo_path']
    ];
    
    $found = false;
    foreach ($alternative_paths as $alt_path) {
        if (file_exists($alt_path)) {
            $logo_file_path = $alt_path;
            $found = true;
            error_log("Found logo at alternative path: " . $alt_path);
            break;
        }
    }
    
    if (!$found) {
        http_response_code(404);
        die("File logo tidak ditemukan di server. Checked paths: " . implode(', ', array_merge([$logo_file_path], $alternative_paths)));
    }
}

// Validasi tipe file untuk keamanan
$file_info = pathinfo($logo_file_path);
$allowed_extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
$file_extension = strtolower($file_info['extension']);

if (!in_array($file_extension, $allowed_extensions)) {
    http_response_code(400);
    die("Tipe file tidak diperbolehkan.");
}

// Generate nama file untuk download
$club_name_clean = preg_replace('/[^a-zA-Z0-9_-]/', '_', strtolower($app_data['club_name']));
$download_filename = "logo_" . $club_name_clean . "_" . $application_id . "." . $file_extension;

// Get file size
$file_size = filesize($logo_file_path);

// Log aktivitas download SEBELUM mengirim headers
$activity_description = "Download logo klub {$app_data['club_name']} (ID: {$application_id}) oleh " . 
                       ($_SESSION['role_id'] == 2 ? 'Pengcab' : 
                        ($_SESSION['role_id'] == 3 ? 'Pengda' : 'PB'));

$query_log = "INSERT INTO activity_log (user_id, user_role, activity_type, description, application_id, created_at) 
              VALUES (?, ?, 'Download Logo', ?, ?, NOW())";
$stmt_log = $conn->prepare($query_log);
if ($stmt_log) {
    $user_role_text = $_SESSION['role_id'] == 2 ? 'Pengcab' : 
                     ($_SESSION['role_id'] == 3 ? 'Pengda' : 'PB');
    $stmt_log->bind_param("issi", $admin_id, $user_role_text, $activity_description, $application_id);
    $stmt_log->execute();
    $stmt_log->close();
}

// Close database connection
$conn->close();

// Clear any remaining output
if (ob_get_level()) {
    ob_end_clean();
}

// Set headers untuk download
header('Content-Type: application/octet-stream');
header('Content-Disposition: attachment; filename="' . $download_filename . '"');
header('Content-Length: ' . $file_size);
header('Cache-Control: must-revalidate');
header('Pragma: public');
header('Accept-Ranges: bytes');

// Flush output and read file
flush();

// Use readfile for better memory efficiency
if (readfile($logo_file_path) === false) {
    http_response_code(500);
    die("Error reading file.");
}

exit();
?>