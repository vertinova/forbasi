<?php

session_start();

// Set timezone to Indonesia (WIB - Western Indonesian Time / Jakarta)
date_default_timezone_set('Asia/Jakarta');

// Pastikan Anda sudah menjalankan 'composer install' di direktori proyek utama Anda.
// Sesuaikan jalur ini jika struktur proyek Anda berbeda.
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Cell\DataType; // <-- Tambahkan baris ini untuk DataType

require_once __DIR__ . '/db_config.php';

// Path Composer Autoloader
// Jika pb.php ada di C:\xampp\htdocs\forbasi\php\, maka vendor ada di C:\xampp\htdocs\forbasi\vendor\
$composerAutoloadPath = __DIR__ . '/../vendor/autoload.php';

if (file_exists($composerAutoloadPath)) {
    require_once $composerAutoloadPath;
} else {
    // Log error jika Composer autoloader tidak ditemukan
    error_log("Composer autoloader not found at " . $composerAutoloadPath . ". PhpSpreadsheet library is required for Excel export. Please run 'composer install' in the correct directory (e.g., C:\\xampp\\htdocs\\forbasi\\).");
    // Tampilkan pesan error hanya jika request terkait dengan export Excel
    if (isset($_GET['export_saldo_to_excel']) || isset($_GET['export_rekening_to_excel'])) {
        echo "Error: Library PhpSpreadsheet tidak ditemukan. Pastikan dependensi Composer telah terinstal. (Jalur Autoload: " . htmlspecialchars($composerAutoloadPath) . ")";
        exit();
    }
    // Untuk request lain, cukup log error dan biarkan script berlanjut tanpa fungsionalitas PhpSpreadsheet
}

// Mulai output buffering untuk mencegah pengiriman header HTTP terlalu dini
// Ini penting untuk AJAX responses dan file downloads
ob_start();

// Konfigurasi Error Reporting
ini_set('display_errors', 0); // Atur ke 1 untuk debugging di lingkungan pengembangan
ini_set('display_startup_errors', 0); // Atur ke 1 untuk debugging di lingkungan pengembangan
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php_error_log_pb.txt');

// Autentikasi dan Otorisasi
if (!isset($_SESSION['user_id']) || $_SESSION['role_id'] != 4) {
    header("Location: login.php");
    exit();
}

$admin_id = $_SESSION['user_id'];
$success_message = '';
$error_message = '';

// Konfigurasi URL dan Direktori
// Deteksi environment lokal vs production
if ($_SERVER['HTTP_HOST'] === 'localhost' || $_SERVER['HTTP_HOST'] === '127.0.0.1' || strpos($_SERVER['HTTP_HOST'], 'laragon') !== false) {
    define('BASE_URL', 'http://localhost/forbasi/forbasi/php/uploads/'); // Local development
    define('BASE_URL_FOR_PDF', 'http://localhost/forbasi/forbasi/php/');
} else {
    define('BASE_URL', 'https://forbasi.or.id/forbasi/php/uploads/'); // Production
    define('BASE_URL_FOR_PDF', 'https://forbasi.or.id/forbasi/php/');
}

$uploadBaseDirPhysical = __DIR__ .'/uploads/';
$pengcab_payment_proofs_subfolder = 'pengcab_payment_proofs/';
$pengda_payment_proofs_subfolder = 'pengda_payment_proofs/';
$pb_kta_configs_subfolder = 'pb_kta_configs/';
$generated_kta_pb_subfolder = 'generated_kta_pb/';
$generated_kta_pengda_subfolder = 'generated_kta_pengda/';
$generated_kta_pengcab_subfolder = 'generated_kta/';
$barcode_images_subfolder = 'barcodes/';

$pengcab_payment_physical_path = $uploadBaseDirPhysical . $pengcab_payment_proofs_subfolder;
$pengda_payment_physical_path = $uploadBaseDirPhysical . $pengda_payment_proofs_subfolder;
$pb_kta_configs_physical_path = $uploadBaseDirPhysical . $pb_kta_configs_subfolder;
$generated_kta_pb_physical_path = $uploadBaseDirPhysical . $generated_kta_pb_subfolder;
$generated_kta_pengda_physical_path = $uploadBaseDirPhysical . $generated_kta_pengda_subfolder;
$generated_kta_pengcab_physical_path = $uploadBaseDirPhysical . $generated_kta_pengcab_subfolder;
$barcode_images_physical_path = $uploadBaseDirPhysical . $barcode_images_subfolder;

// Pastikan direktori-direktori ada
$directories_to_create = [
    $pengcab_payment_physical_path,
    $pengda_payment_physical_path,
    $pb_kta_configs_physical_path,
    $generated_kta_pb_physical_path,
    $generated_kta_pengda_physical_path,
    $generated_kta_pengcab_physical_path,
    $barcode_images_physical_path
];
foreach ($directories_to_create as $dir) {
    if (!is_dir($dir)) {
        if (!mkdir($dir, 0755, true)) {
            error_log("Failed to create directory: " . $dir);
        }
    }
}

/**
 * Logs user activity to the database.
 * @param mysqli $conn Database connection object.
 * @param int $user_id ID of the user performing the activity.
 * @param string $role_name Role name of the user.
 * @param string $activity_type Type of activity (e.g., 'Update Status', 'Login').
 * @param string $description Detailed description of the activity.
 * @param int|null $application_id Optional: ID of the KTA application involved.
 * @param string|null $old_status Optional: Old status of the application.
 * @param string|null $new_status Optional: New status of the application.
 */
function logActivity($conn, $user_id, $role_name, $activity_type, $description, $application_id = null, $old_status = null, $new_status = null) {
    $application_id_for_db = (is_numeric($application_id)) ? (int)$application_id : null;

    $stmt = $conn->prepare("INSERT INTO activity_logs (user_id, role_name, activity_type, description, application_id, old_status, new_status) VALUES (?, ?, ?, ?, ?, ?, ?)");
    if ($stmt) {
        $stmt->bind_param("isssiss",
            $user_id,
            $role_name,
            $activity_type,
            $description,
            $application_id_for_db,
            $old_status,
            $new_status
        );

        if (!$stmt->execute()) {
            error_log("Failed to execute activity log insert: " . $stmt->error);
        }
        $stmt->close();
    } else {
        error_log("Failed to prepare activity log insert statement: " . $conn->error);
    }
}

/**
 * Fetches total incoming balance based on KTA applications.
 * @param mysqli $conn Database connection object.
 * @param int|null $province_id_filter Optional: Filter by province ID.
 * @param int|null $city_id_filter Optional: Filter by city ID.
 * @param int|null $month_filter Optional: Filter by month (1-12).
 * @param int|null $year_filter Optional: Filter by year.
 * @param string|null $kta_status_filter Optional: Filter by KTA status.
 * @return float Total incoming balance.
 */
function getSaldoMasuk($conn, $province_id_filter = null, $city_id_filter = null, $month_filter = null, $year_filter = null, $kta_status_filter = null) {
    $total_saldo_masuk = 0;
    $params = [];
    $types = "";
    $where_clauses = [];

    $query = "SELECT SUM(nominal_paid) AS total_nominal_paid FROM kta_applications WHERE nominal_paid IS NOT NULL AND nominal_paid > 0";

    if ($province_id_filter) {
        $where_clauses[] = "province_id = ?";
        $params[] = $province_id_filter;
        $types .= "i";
    }
    if ($city_id_filter) {
        $where_clauses[] = "city_id = ?";
        $params[] = $city_id_filter;
        $types .= "i";
    }
    if ($month_filter) {
        $where_clauses[] = "MONTH(created_at) = ?";
        $params[] = $month_filter;
        $types .= "i";
    }
    if ($year_filter) {
        $where_clauses[] = "YEAR(created_at) = ?";
        $params[] = $year_filter;
        $types .= "i";
    }
    if ($kta_status_filter) {
        $where_clauses[] = "status = ?";
        $params[] = $kta_status_filter;
        $types .= "s";
    }

    if (!empty($where_clauses)) {
        $query .= " AND " . implode(" AND ", $where_clauses);
    }

    $stmt = $conn->prepare($query);
    if ($stmt) {
        if (!empty($params)) {
            $bind_names = array_merge([$types], $params);
            $refs = [];
            foreach ($bind_names as $key => $value) {
                $refs[$key] = &$bind_names[$key];
            }
            call_user_func_array([$stmt, 'bind_param'], $refs);
        }
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $total_saldo_masuk = (float)($row['total_nominal_paid'] ?? 0);
        $stmt->close();
    } else {
        error_log("Error preparing getSaldoMasuk query: " . $conn->error);
    }
    return $total_saldo_masuk;
}

/**
 * Fetches total outgoing balance (payments from PB to Pengda/Pengcab) based on `pb_payments_recap`.
 * @param mysqli $conn Database connection object.
 * @param int|null $province_id_filter Optional: Filter by recipient user's province ID.
 * @param int|null $city_id_filter Optional: Filter by recipient user's city ID.
 * @param int|null $month_filter Optional: Filter by month of `paid_at`.
 * @param int|null $year_filter Optional: Filter by year of `paid_at`.
 * @param string|null $kta_status_filter Optional: Filter by KTA status.
 * @return float Total outgoing balance.
 */
function getSaldoKeluar($conn, $province_id_filter = null, $city_id_filter = null, $month_filter = null, $year_filter = null, $kta_status_filter = null) {
    $total_saldo_keluar = 0;
    $params = [];
    $types = "";
    $where_clauses = [];

    $query = "SELECT SUM(pr.amount) AS total_amount_paid
              FROM pb_payments_recap pr
              JOIN users u ON pr.recipient_id = u.id
              WHERE pr.amount IS NOT NULL AND pr.amount > 0";

    if ($province_id_filter) {
        $where_clauses[] = "u.province_id = ?";
        $params[] = $province_id_filter;
        $types .= "i";
    }
    if ($city_id_filter) {
        $where_clauses[] = "u.city_id = ?";
        $params[] = $city_id_filter;
        $types .= "i";
    }
    if ($month_filter) {
        $where_clauses[] = "MONTH(pr.paid_at) = ?";
        $params[] = $month_filter;
        $types .= "i";
    }
    if ($year_filter) {
        $where_clauses[] = "YEAR(pr.paid_at) = ?";
        $params[] = $year_filter;
        $types .= "i";
    }

    if (!empty($where_clauses)) {
        $query .= " AND " . implode(" AND ", $where_clauses);
    }

    $stmt = $conn->prepare($query);
    if ($stmt) {
        if (!empty($params)) {
            $bind_names = array_merge([$types], $params);
            $refs = [];
            foreach ($bind_names as $key => $value) {
                $refs[$key] = &$bind_names[$key];
            }
            call_user_func_array([$stmt, 'bind_param'], $refs);
        }
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $total_saldo_keluar = (float)($row['total_amount_paid'] ?? 0);
        $stmt->close();
    } else {
        error_log("Error preparing getSaldoKeluar query: " . $conn->error);
    }
    return $total_saldo_keluar;
}


/**
 * Calculates the amount payable to a specific recipient type (pengda, pengcab, developer)
 * based on 'kta_issued' applications that HAVE NOT YET been included in PB recap payments.
 * @param mysqli $conn Database connection object.
 * @param string $recipient_type Recipient type ('pengda', 'pengcab', 'developer', 'pb_net').
 * @param int|null $province_id_filter Optional: Filter by province ID.
 * @param int|null $city_id_filter Optional: Filter by city ID.
 * @param int|null $month_filter Optional: Filter by month of `kta_issued_at`.
 * @param int|null $year_filter Optional: Filter by year of `kta_issued_at`.
 * @param string $kta_status_filter Required KTA status (defaults to 'kta_issued').
 * @return float Total amount payable.
 */
function getAmountToPay($conn, $recipient_type, $province_id_filter = null, $city_id_filter = null, $month_filter = null, $year_filter = null, $kta_status_filter = 'kta_issued') {
    $total_amount_to_pay = 0;
    $where_clauses = [];
    $params = [];
    $types = "";

    $where_clauses[] = "status = ?";
    $params[] = $kta_status_filter;
    $types .= "s";
    
    // Crucial correction: filter based on whether the specific payment column is NULL or 0
    $payment_column = '';
    switch ($recipient_type) {
        case 'pengda':
            $payment_column = 'amount_pb_to_pengda';
            break;
        case 'pengcab':
            $payment_column = 'amount_pb_to_pengcab';
            break;
        case 'developer':
            // Developer payments might not be linked per-KTA, or might be handled differently.
            // If they are linked per-KTA and marked when paid, adjust this logic.
            // For now, assume they are counted based on issued KTA regardless of pb_payment_recap_id.
            // If developer payments are also part of a recap, then pb_payment_recap_id should be used.
            // Given the original code, this still counts all issued for developer/pb_net.
            break;
        case 'pb_net':
            break;
        default:
            return 0; // Invalid recipient type
    }

    if (!empty($payment_column)) {
        // Only count if the specific payment for this recipient type is NULL or 0
        $where_clauses[] = "({$payment_column} IS NULL OR {$payment_column} = 0)";
    } else {
        // For 'developer' and 'pb_net', we still ensure they haven't been 'recapped'
        // if your recap system tracks them via pb_payment_recap_id, you'd check pb_payment_recap_id IS NULL.
        // If developer/pb_net payments are NOT linked to pb_payment_recap_id, remove this condition for them.
        $where_clauses[] = "pb_payment_recap_id IS NULL"; 
    }


    if ($province_id_filter) {
        $where_clauses[] = "province_id = ?";
        $params[] = $province_id_filter;
        $types .= "i";
    }
    if ($city_id_filter) {
        $where_clauses[] = "city_id = ?";
        $params[] = $city_id_filter;
        $types .= "i";
    }
    if ($month_filter) {
        $where_clauses[] = "MONTH(kta_issued_at) = ?";
        $params[] = $month_filter;
        $types .= "i";
    }
    if ($year_filter) {
        $where_clauses[] = "YEAR(kta_issued_at) = ?";
        $params[] = $year_filter;
        $types .= "i";
    }

    $where_sql = implode(" AND ", $where_clauses);

    $amount_per_kta = 0;
    switch ($recipient_type) {
        case 'pengda':
            $amount_per_kta = 35000;
            break;
        case 'pengcab':
            $amount_per_kta = 50000;
            break;
        case 'developer':
            $amount_per_kta = 5000;
            break;
        case 'pb_net':
            $amount_per_kta = 10000;
            break;
        default:
            return 0;
    }

    $query = "SELECT COUNT(*) AS total_ktas_issued FROM kta_applications WHERE {$where_sql}";

    $stmt = $conn->prepare($query);
    if ($stmt) {
        if (!empty($params)) {
            $bind_names = array_merge([$types], $params);
            $refs = [];
            foreach ($bind_names as $key => $value) {
                $refs[$key] = &$bind_names[$key];
            }
            call_user_func_array([$stmt, 'bind_param'], $refs);
        }

        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $total_ktas_issued = (int)($row['total_ktas_issued'] ?? 0);
        $stmt->close();

        $total_amount_to_pay = $total_ktas_issued * $amount_per_kta;
    } else {
        error_log("Error calculating amount to pay for {$recipient_type}: " . $conn->error);
    }
    return $total_amount_to_pay;
}

/**
 * Fetches all provinces from the database.
 * @param mysqli $conn Database connection object.
 * @return array Array containing province data (id, name).
 */
function fetchProvinces($conn) {
    $provinces = [];
    $result = $conn->query("SELECT id, name FROM provinces ORDER BY name ASC");
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $provinces[] = $row;
        }
    }
    return $provinces;
}

/**
 * Fetches cities based on the given province ID.
 * @param mysqli $conn Database connection object.
 * @param int $province_id Province ID to filter by.
 * @return array Array containing city data (id, name).
 */
function fetchCitiesByProvinceId($conn, $province_id) {
    $cities = [];
    if ($province_id) {
        $stmt = $conn->prepare("SELECT id, name FROM cities WHERE province_id = ? ORDER BY name ASC");
        if ($stmt) {
            $stmt->bind_param("i", $province_id);
            $stmt->execute();
            $result = $stmt->get_result();
            while ($row = $result->fetch_assoc()) {
                $cities[] = $row;
            }
            $stmt->close();
        }
    }
    return $cities;
}

/**
 * Counts KTA applications with 'kta_issued' status based on filters.
 * @param mysqli $conn Database connection object.
 * @param string $province_filter Optional: Filter by province name.
 * @param string $city_filter Optional: Filter by city name.
 * @param string $search_query Optional: Search by club name, leader name, or KTA barcode ID.
 * @return int Total count of issued KTA applications matching the criteria.
 */
function countIssuedKTAApplications($conn, $province_filter = '', $city_filter = '', $search_query = '') {
    $count = 0;
    $query = "SELECT COUNT(*) FROM kta_applications ka
              LEFT JOIN provinces p ON ka.province_id = p.id
              LEFT JOIN cities c ON ka.city_id = c.id
              WHERE ka.status = 'kta_issued' AND ka.generated_kta_file_path_pb IS NOT NULL";

    $params = [];
    $types = "";

    if (!empty($province_filter)) {
        $query .= " AND p.name = ?";
        $params[] = $province_filter;
        $types .= "s";
    }
    if (!empty($city_filter)) {
        $query .= " AND c.name = ?";
        $params[] = $city_filter;
        $types .= "s";
    }
    if (!empty($search_query)) {
        $search_term = "%" . $search_query . "%";
        $query .= " AND (ka.club_name LIKE ? OR ka.leader_name LIKE ? OR ka.kta_barcode_unique_id LIKE ?)";
        $params[] = $search_term;
        $params[] = $search_term;
        $params[] = $search_term;
        $types .= "sss";
    }

    $stmt = $conn->prepare($query);
    if ($stmt) {
        if (!empty($params)) {
            $bind_names = array_merge([$types], $params);
            $refs = [];
            foreach ($bind_names as $key => $value) {
                $refs[$key] = &$bind_names[$key];
            }
            call_user_func_array([$stmt, 'bind_param'], $refs);
        }
        $stmt->execute();
        $result = $stmt->get_result();
        $count = $result->fetch_row()[0];
        $stmt->close();
    } else {
        error_log("Error counting issued KTA applications: " . $conn->error);
    }
    return $count;
}

/**
 * Fetches issued KTA applications with pagination and filters.
 * @param mysqli $conn Database connection object.
 * @param string $generated_kta_pb_subfolder Subfolder for PB generated KTA files.
 * @param string $base_url Base URL for file access.
 * @param int $limit Max number of records to return.
 * @param int $offset Starting offset for records.
 * @param string $province_filter Optional: Filter by province name.
 * @param string $city_filter Optional: Filter by city name.
 * @param string $search_query Optional: Search by club name, leader name, or KTA barcode ID.
 * @return array Array containing issued KTA applications or an error array.
 */
function fetchIssuedKTAApplications($conn, $generated_kta_pb_subfolder, $base_url, $limit = 10, $offset = 0, $province_filter = '', $city_filter = '', $search_query = '') {
    $issued_ktas = [];
    $query = "SELECT ka.id, ka.club_name, ka.leader_name, ka.kta_barcode_unique_id, ka.kta_issued_at,
                     ka.generated_kta_file_path_pb,
                     p.name AS province_name, c.name AS city_name
              FROM kta_applications ka
              LEFT JOIN provinces p ON ka.province_id = p.id
              LEFT JOIN cities c ON ka.city_id = c.id
              WHERE ka.status = 'kta_issued' AND ka.generated_kta_file_path_pb IS NOT NULL";

    $params = [];
    $types = "";

    if (!empty($province_filter)) {
        $query .= " AND p.name = ?";
        $params[] = $province_filter;
        $types .= "s";
    }
    if (!empty($city_filter)) {
        $query .= " AND c.name = ?";
        $params[] = $city_filter;
        $types .= "s";
    }
    if (!empty($search_query)) {
        $search_term = "%" . $search_query . "%";
        $query .= " AND (ka.club_name LIKE ? OR ka.leader_name LIKE ? OR ka.kta_barcode_unique_id LIKE ?)";
        $params[] = $search_term;
        $params[] = $search_term;
        $params[] = $search_term;
        $types .= "sss";
    }

    $query .= " ORDER BY ka.kta_issued_at DESC LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;
    $types .= "ii";

    $stmt = $conn->prepare($query);
    if ($stmt) {
        if (!empty($params)) {
            $bind_names = array_merge([$types], $params);
            $refs = [];
            foreach ($bind_names as $key => $value) {
                $refs[$key] = &$bind_names[$key];
            }
            call_user_func_array([$stmt, 'bind_param'], $refs);
        }
        $stmt->execute();
        $result = $stmt->get_result();
        while ($row = $result->fetch_assoc()) {
            $row['kta_file_url'] = BASE_URL . $generated_kta_pb_subfolder . htmlspecialchars(basename($row['generated_kta_file_path_pb']));
            $issued_ktas[] = $row;
        }
        $stmt->close();
    } else {
        error_log("Error fetching issued KTA applications: " . $conn->error);
        return ['error' => "Failed to fetch issued KTA data: " . $conn->error];
    }
    return $issued_ktas;
}

/**
 * Counts KTA applications by status and other filters.
 * Used for status cards and main table pagination.
 * @param mysqli $conn Database connection object.
 * @param string|array|null $status_filter Optional: Single status string or array of status strings.
 * @param int|null $province_id_filter Optional: Filter by province ID.
 * @param int|null $city_id_filter Optional: Filter by city ID.
 * @param string $search_query Optional: Search by club name, leader name, or KTA barcode ID.
 * @return int Total count of KTA applications matching criteria.
 */
function countKTAApplicationsByStatus($conn, $status_filter = null, $province_id_filter = null, $city_id_filter = null, $search_query = '') {
    $count = 0;
    $params = [];
    $types = "";

    $query = "SELECT COUNT(*) FROM kta_applications ka
              LEFT JOIN provinces p ON ka.province_id = p.id
              LEFT JOIN cities c ON ka.city_id = c.id
              WHERE 1=1";

    if (!empty($status_filter)) {
        if (is_array($status_filter)) {
            $placeholders = implode(',', array_fill(0, count($status_filter), '?'));
            $query .= " AND ka.status IN ({$placeholders})";
            $params = array_merge($params, $status_filter);
            $types .= str_repeat('s', count($status_filter));
        } else {
            $query .= " AND ka.status = ?";
            $params[] = $status_filter;
            $types .= "s";
        }
    } else {
        $default_statuses = ['approved_pengda', 'approved_pb', 'rejected_pb', 'kta_issued', 'pending_pengda_resubmit'];
        $placeholders = implode(',', array_fill(0, count($default_statuses), '?'));
        $query .= " AND ka.status IN ({$placeholders})";
        $params = array_merge($params, $default_statuses);
        $types .= str_repeat('s', count($default_statuses));
    }

    if ($province_id_filter) {
        $query .= " AND ka.province_id = ?";
        $params[] = $province_id_filter;
        $types .= "i";
    }
    if ($city_id_filter) {
        $query .= " AND ka.city_id = ?";
        $params[] = $city_id_filter;
        $types .= "i";
    }
    if (!empty($search_query)) {
        $search_term = "%" . $search_query . "%";
        $query .= " AND (ka.club_name LIKE ? OR ka.leader_name LIKE ? OR ka.kta_barcode_unique_id LIKE ?)";
        $params[] = $search_term;
        $params[] = $search_term;
        $params[] = $search_term;
        $types .= "sss";
    }

    $stmt = $conn->prepare($query);
    if ($stmt) {
        if (!empty($params)) {
            $bind_names = array_merge([$types], $params);
            $refs = [];
            foreach ($bind_names as $key => $value) {
                $refs[$key] = &$bind_names[$key];
            }
            call_user_func_array([$stmt, 'bind_param'], $refs);
        }
        $stmt->execute();
        $result = $stmt->get_result();
        $count = $result->fetch_row()[0];
        $stmt->close();
    } else {
        error_log("Error counting KTA applications by status: " . $conn->error);
    }
    return $count;
}

/**
 * Fetches KTA applications for the PB dashboard with filters and pagination.
 * @param mysqli $conn Database connection object.
 * @param string $uploadBaseDirPhysical Physical base directory for uploads.
 * @param string $pengcab_payment_proofs_subfolder Subfolder for Pengcab payment proofs.
 * @param string $pengda_payment_proofs_subfolder Subfolder for Pengda payment proofs.
 * @param string $generated_kta_pb_subfolder Subfolder for PB generated KTA files.
 * @param string $generated_kta_pengda_subfolder Subfolder for Pengda generated KTA files.
 * @param string $generated_kta_pengcab_subfolder Subfolder for Pengcab generated KTA files.
 * @param string $base_url Base URL for file access.
 * @param string|array|null $status_filter Optional: Single status string or array of status strings.
 * @param int|null $province_id_filter Optional: Filter by province ID.
 * @param int|null $city_id_filter Optional: Filter by city ID.
 * @param string $search_query Optional: Search by club name, leader name, or KTA barcode ID.
 * @param int $limit Max number of records to return.
 * @param int $offset Starting offset for records.
 * @return array Array containing KTA applications or an error array.
 */
function fetchKTAApplications($conn, $uploadBaseDirPhysical, $pengcab_payment_proofs_subfolder, $pengda_payment_proofs_subfolder, $generated_kta_pb_subfolder, $generated_kta_pengda_subfolder, $generated_kta_pengcab_subfolder, $base_url, $status_filter = null, $province_id_filter = null, $city_id_filter = null, $search_query = '', $limit = 10, $offset = 0) {
    $kta_applications = [];
    $params = [];
    $types = "";

    $query_kta = "SELECT ka.*, u.club_name AS user_club_name, u.email AS user_email, u.phone AS user_phone,
                                     p.name AS province_name_kta, c.name AS city_name_kta
                                     FROM kta_applications ka
                                     JOIN users u ON ka.user_id = u.id
                                     LEFT JOIN provinces p ON ka.province_id = p.id
                                     LEFT JOIN cities c ON ka.city_id = c.id
                                     WHERE 1=1";

    if (!empty($status_filter)) {
        if (is_array($status_filter)) {
            $placeholders = implode(',', array_fill(0, count($status_filter), '?'));
            $query_kta .= " AND ka.status IN ({$placeholders})";
            $params = array_merge($params, $status_filter);
            $types .= str_repeat('s', count($status_filter));
        } else {
            $query_kta .= " AND ka.status = ?";
            $params[] = $status_filter;
            $types .= "s";
        }
    } else {
        $default_statuses = ['approved_pengda', 'approved_pb', 'rejected_pb', 'kta_issued', 'pending_pengda_resubmit'];
        $placeholders = implode(',', array_fill(0, count($default_statuses), '?'));
        $query_kta .= " AND ka.status IN ({$placeholders})";
        $params = array_merge($params, $default_statuses);
        $types .= str_repeat('s', count($default_statuses));
    }


    if ($province_id_filter) {
        $query_kta .= " AND ka.province_id = ?";
        $params[] = $province_id_filter;
        $types .= "i";
    }
    if ($city_id_filter) {
        $query_kta .= " AND ka.city_id = ?";
        $params[] = $city_id_filter;
        $types .= "i";
    }
    if (!empty($search_query)) {
        $search_term = "%" . $search_query . "%";
        $query_kta .= " AND (ka.club_name LIKE ? OR ka.leader_name LIKE ? OR ka.kta_barcode_unique_id LIKE ?)";
        $params[] = $search_term;
        $params[] = $search_term;
        $params[] = $search_term;
        $types .= "sss";
    }

    $query_kta .= " ORDER BY
                        CASE
                            WHEN ka.status = 'approved_pengda' THEN 1
                            WHEN ka.status = 'pending_pengda_resubmit' THEN 2
                            WHEN ka.status = 'rejected_pb' THEN 3
                            WHEN ka.status = 'approved_pb' THEN 4
                            WHEN ka.status = 'kta_issued' THEN 5
                            ELSE 6
                        END,
                        ka.created_at DESC";
    $query_kta .= " LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;
    $types .= "ii";


    $stmt = $conn->prepare($query_kta);
    if ($stmt) {
        if (!empty($params)) {
            $bind_names = array_merge([$types], $params);
            $refs = [];
            foreach ($bind_names as $key => $value) {
                $refs[$key] = &$bind_names[$key];
            }
            call_user_func_array([$stmt, 'bind_param'], $refs);
        }
        $stmt->execute();
        $result_kta = $stmt->get_result();
        while ($row = $result_kta->fetch_assoc()) {
            $row['logo_path_display'] = !empty($row['logo_path']) ? $base_url . 'kta_files/' . htmlspecialchars(basename($row['logo_path'])) : '';
            $row['ad_file_path_display'] = !empty($row['ad_file_path']) ? $base_url . 'kta_files/' . htmlspecialchars(basename($row['ad_file_path'])) : '';
            $row['art_file_path_display'] = !empty($row['art_file_path']) ? $base_url . 'kta_files/' . htmlspecialchars(basename($row['art_file_path'])) : '';
            $row['sk_file_path_display'] = !empty($row['sk_file_path']) ? $base_url . 'kta_files/' . htmlspecialchars(basename($row['sk_file_path'])) : '';
            $row['payment_proof_path_display'] = !empty($row['payment_proof_path']) ? $base_url . 'kta_files/' . htmlspecialchars(basename($row['payment_proof_path'])) : '';

            $row['pengcab_payment_proof_path_display'] = !empty($row['pengcab_payment_proof_path']) ? $base_url . $pengcab_payment_proofs_subfolder . htmlspecialchars(basename($row['pengcab_payment_proof_path'])) : '';
            $row['pengda_payment_proof_path_display'] = !empty($row['pengda_payment_proof_path']) ? $base_url . $pengda_payment_proofs_subfolder . htmlspecialchars(basename($row['pengda_payment_proof_path'])) : '';

            // Jalur untuk bukti pembayaran PB ke Pengda/Pengcab sekarang akan mengacu ke bukti rekap jika berlaku
            $row['pb_to_pengda_payment_proof_path_display'] = '';
            $row['pb_to_pengcab_payment_proof_path_display'] = '';

            // Jika ada ID rekap, tautkan ke bukti rekap
            if (!empty($row['pb_payment_recap_id'])) {
                $stmt_recap_proof = $conn->prepare("SELECT payment_proof_path, recipient_type FROM pb_payments_recap WHERE id = ?");
                if ($stmt_recap_proof) {
                    $stmt_recap_proof->bind_param("i", $row['pb_payment_recap_id']);
                    $stmt_recap_proof->execute();
                    $recap_result = $stmt_recap_proof->get_result();
                    if ($recap_row = $recap_result->fetch_assoc()) {
                        $recap_proof_path = $recap_row['payment_proof_path'];
                        $recap_recipient_type = $recap_row['recipient_type'];

                        if ($recap_recipient_type === 'pengda' && !empty($recap_proof_path)) {
                            $row['pb_to_pengda_payment_proof_path_display'] = BASE_URL . $pengda_payment_proofs_subfolder . htmlspecialchars(basename($recap_proof_path));
                        } elseif ($recap_recipient_type === 'pengcab' && !empty($recap_proof_path)) {
                            $row['pb_to_pengcab_payment_proof_path_display'] = BASE_URL . $pengcab_payment_proofs_subfolder . htmlspecialchars(basename($recap_proof_path));
                        }
                    }
                    $stmt_recap_proof->close();
                }
            }

            $row['amount_pb_to_pengda_display'] = !empty($row['amount_pb_to_pengda']) ? 'Rp ' . number_format($row['amount_pb_to_pengda'], 0, ',', '.') : 'Belum';
            $row['amount_pb_to_pengcab_display'] = !empty($row['amount_pb_to_pengcab']) ? 'Rp ' . number_format($row['amount_pb_to_pengcab'], 0, ',', '.') : 'Belum';
            $row['nominal_paid_display'] = !empty($row['nominal_paid']) ? 'Rp ' . number_format($row['nominal_paid'], 0, ',', '.') : 'Belum Bayar';

            $row['generated_kta_file_path_pengcab_display'] = !empty($row['generated_kta_file_path']) ? $base_url . $generated_kta_pengcab_subfolder . htmlspecialchars(basename($row['generated_kta_file_path'])) : '';
            $row['generated_kta_file_path_pengda_display'] = !empty($row['generated_kta_file_path_pengda']) ? $base_url . $generated_kta_pengda_subfolder . htmlspecialchars(basename($row['generated_kta_file_path_pengda'])) : '';
            $row['generated_kta_file_path_pb_display'] = !empty($row['generated_kta_file_path_pb']) ? $base_url . $generated_kta_pb_subfolder . htmlspecialchars(basename($row['generated_kta_file_path_pb'])) : '';

            $row['province'] = $row['province_name_kta'] ?? 'N/A';
            $row['regency'] = $row['city_name_kta'] ?? 'N/A';

            $kta_applications[] = $row;
        }
        $stmt->close();
    } else {
        error_log("Error fetching KTA applications for PB: " . $conn->error);
        return ['error' => "Failed to fetch KTA applications: " . $conn->error];
    }
    return $kta_applications;
}

/**
 * Counts all users in the system based on role and search query for pagination.
 * @param mysqli $conn Database connection object.
 * @param string $role_filter Optional: Filter by role name.
 * @param string $search_query Optional: Search by username, email, or club name.
 * @return int Total count of users matching criteria.
 */
function countAllUsers($conn, $role_filter = '', $search_query = '') {
    $count = 0;
    $query = "SELECT COUNT(*) FROM users u JOIN roles r ON u.role_id = r.id WHERE 1=1";

    $params = [];
    $types = "";

    if (!empty($role_filter)) {
        $query .= " AND r.role_name = ?";
        $params[] = $role_filter;
        $types .= "s";
    }
    if (!empty($search_query)) {
        $search_term = "%" . $search_query . "%";
        $query .= " AND (u.username LIKE ? OR u.email LIKE ? OR u.club_name LIKE ?)";
        $params[] = $search_term;
        $params[] = $search_term;
        $params[] = $search_term;
        $types .= "sss";
    }

    $stmt = $conn->prepare($query);
    if ($stmt) {
        if (!empty($params)) {
            $bind_names = array_merge([$types], $params);
            $refs = [];
            foreach ($bind_names as $key => $value) {
                $refs[$key] = &$bind_names[$key];
            }
            call_user_func_array([$stmt, 'bind_param'], $refs);
        }
        $stmt->execute();
        $result = $stmt->get_result();
        $count = $result->fetch_row()[0];
        $stmt->close();
    } else {
        error_log("Error counting all users: " . $conn->error);
    }
    return $count;
}

/**
 * Fetches all users with optional role and search filters, and pagination.
 * @param mysqli $conn Database connection object.
 * @param string $role_filter Optional: Filter by role name.
 * @param string $search_query Optional: Search by username, email, or club name.
 * @param int $limit Max number of records to return.
 * @param int $offset Starting offset for records.
 * @return array Array containing user data or an error array.
 */
function fetchAllUsers($conn, $role_filter = '', $search_query = '', $limit = 10, $offset = 0) {
    $users = [];
    $query = "SELECT u.id, u.username, u.email, u.phone, u.club_name, u.role_id,
                     r.role_name, p.name AS province_name, c.name AS city_name,
                     u.province_id, u.city_id, u.bank_account_number,
                     latest_kta.kta_application_id, latest_kta.logo_path
              FROM users u
              JOIN roles r ON u.role_id = r.id
              LEFT JOIN provinces p ON u.province_id = p.id
              LEFT JOIN cities c ON u.city_id = c.id
              LEFT JOIN (
                  SELECT ka.user_id, ka.id as kta_application_id, ka.logo_path
                  FROM kta_applications ka
                  INNER JOIN (
                      SELECT user_id, MAX(created_at) AS max_created_at
                      FROM kta_applications
                      GROUP BY user_id
                  ) AS latest_ka ON ka.user_id = latest_ka.user_id AND ka.created_at = latest_ka.max_created_at
              ) AS latest_kta ON u.id = latest_kta.user_id
              WHERE 1=1";

    $params = [];
    $types = "";

    if (!empty($role_filter)) {
        $query .= " AND r.role_name = ?";
        $params[] = $role_filter;
        $types .= "s";
    }

    if (!empty($search_query)) {
        $search_term = "%" . $search_query . "%";
        $query .= " AND (u.username LIKE ? OR u.email LIKE ? OR u.club_name LIKE ?)";
        $params[] = $search_term;
        $params[] = $search_term;
        $params[] = $search_term;
        $types .= "sss";
    }

    $query .= " ORDER BY r.role_name ASC, u.username ASC";
    $query .= " LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;
    $types .= "ii";

    $stmt = $conn->prepare($query);
    if ($stmt) {
        if (!empty($params)) {
            $bind_names = array_merge([$types], $params);
            $refs = [];
            foreach ($bind_names as $key => $value) {
                $refs[$key] = &$bind_names[$key];
            }
            call_user_func_array([$stmt, 'bind_param'], $refs);
        }
        $stmt->execute();
        $result = $stmt->get_result();
        while ($row = $result->fetch_assoc()) {
            // Set logo_path_display for easy checking in templates
            $row['logo_path_display'] = !empty($row['logo_path']) ? $row['logo_path'] : '';
            $users[] = $row;
        }
        $stmt->close();
    } else {
        error_log("Error preparing fetchAllUsers query: " . $conn->error);
        return ['error' => "Failed to fetch user data: " . $conn->error];
    }
    return $users;
}

/**
 * Fetches transaction history (incoming from users and outgoing from PB recaps) with pagination and filters.
 * @param mysqli $conn Database connection object.
 * @param int $limit Max number of records to return.
 * @param int $offset Starting offset for records.
 * @param int|null $province_id_filter Optional: Filter by province ID.
 * @param int|null $city_id_filter Optional: Filter by city ID.
 * @param int|null $month_filter Optional: Filter by month (1-12).
 * @param int|null $year_filter Optional: Filter by year.
 * @param string|null $kta_status_filter Optional: Filter by KTA status (only for incoming payments).
 * @return array Array containing transaction data or an error array.
 */
function fetchTransactionHistory($conn, $limit = 10, $offset = 0, $province_id_filter = null, $city_id_filter = null, $month_filter = null, $year_filter = null, $kta_status_filter = null) {
    $transactions = [];
    
    $params_part1 = []; $types_part1 = ""; $where_clauses_part1 = [];    
    $params_part2 = []; $types_part2 = ""; $where_clauses_part2 = [];    

    if ($province_id_filter) { $where_clauses_part1[] = "ka.province_id = ?"; $params_part1[] = $province_id_filter; $types_part1 .= "i"; }
    if ($city_id_filter) { $where_clauses_part1[] = "ka.city_id = ?"; $params_part1[] = $city_id_filter; $types_part1 .= "i"; }
    if ($month_filter) { $where_clauses_part1[] = "MONTH(ka.created_at) = ?"; $params_part1[] = $month_filter; $types_part1 .= "i"; }
    if ($year_filter) { $where_clauses_part1[] = "YEAR(ka.created_at) = ?"; $params_part1[] = $year_filter; $types_part1 .= "i"; }
    if ($kta_status_filter) { $where_clauses_part1[] = "ka.status = ?"; $params_part1[] = $kta_status_filter; $types_part1 .= "s"; }
    $where_sql_part1 = count($where_clauses_part1) > 0 ? " AND " . implode(" AND ", $where_clauses_part1) : "";

    if ($province_id_filter) { $where_clauses_part2[] = "u.province_id = ?"; $params_part2[] = $province_id_filter; $types_part2 .= "i"; }
    if ($city_id_filter) { $where_clauses_part2[] = "u.city_id = ?"; $params_part2[] = $city_id_filter; $types_part2 .= "i"; }
    if ($month_filter) { $where_clauses_part2[] = "MONTH(pr.paid_at) = ?"; $params_part2[] = $month_filter; $types_part2 .= "i"; }
    if ($year_filter) { $where_clauses_part2[] = "YEAR(pr.paid_at) = ?"; $params_part2[] = $year_filter; $types_part2 .= "i"; }
    $where_sql_part2 = count($where_clauses_part2) > 0 ? " AND " . implode(" AND ", $where_clauses_part2) : "";

    $query = "
        (SELECT
            ka.id AS transaction_id, 
            ka.created_at AS transaction_date,
            'Masuk' AS transaction_type,
            ka.club_name AS related_party_name,
            p.name AS province_name,
            c.name AS city_name,
            ka.nominal_paid AS amount,
            'Pembayaran KTA dari user' AS description,
            ka.status AS kta_status,
            NULL AS recipient_type_name, 
            NULL AS recipient_bank_account_number 
        FROM
            kta_applications ka
        LEFT JOIN provinces p ON ka.province_id = p.id
        LEFT JOIN cities c ON ka.city_id = c.id
        WHERE ka.nominal_paid IS NOT NULL AND ka.nominal_paid > 0
        {$where_sql_part1})

        UNION ALL

        (SELECT
            pr.id AS transaction_id, 
            pr.paid_at AS transaction_date,
            'Keluar' AS transaction_type,
            u.club_name AS related_party_name,
            prov.name AS province_name,
            city.name AS city_name,
            pr.amount AS amount,
            CONCAT('Pembayaran rekap ke ', pr.recipient_type, ' (', pr.notes, ')') AS description,
            'N/A' AS kta_status, 
            pr.recipient_type AS recipient_type_name,
            u.bank_account_number AS recipient_bank_account_number
        FROM
            pb_payments_recap pr
        JOIN users u ON pr.recipient_id = u.id
        LEFT JOIN provinces prov ON u.province_id = prov.id
        LEFT JOIN cities city ON u.city_id = city.id
        WHERE pr.amount IS NOT NULL AND pr.amount > 0
        {$where_sql_part2})

        ORDER BY transaction_date DESC
        LIMIT ? OFFSET ?;
    ";

    $stmt = $conn->prepare($query);
    if ($stmt) {
        $combined_params = array_merge($params_part1, $params_part2);
        $combined_params[] = $limit;
        $combined_params[] = $offset;

        $combined_types = $types_part1 . $types_part2 . "ii";

        if (count($combined_params) !== strlen($combined_types)) {
            error_log("Parameter count mismatch in fetchTransactionHistory. Expected: " . strlen($combined_types) . ", Got: " . count($combined_params) . ". Query: " . $query);
            return ['error' => "Internal server error: Parameter count mismatch in transaction history query."];
        }

        // Correct way to pass parameters by reference to call_user_func_array
        $bind_names = [$combined_types];
        foreach ($combined_params as $key => $value) {
            $bind_names[] = &$combined_params[$key];
        }
        call_user_func_array([$stmt, 'bind_param'], $bind_names);

        $stmt->execute();
        $result = $stmt->get_result();
        while ($row = $result->fetch_assoc()) {
            $row['amount_display'] = 'Rp ' . number_format((float)$row['amount'], 0, ',', '.');
            $transactions[] = $row;
        }
        $stmt->close();
    } else {
        error_log("Error preparing fetchTransactionHistory query: " . $conn->error);
        return ['error' => "Failed to retrieve transaction history: " . $conn->error];
    }
    return $transactions;
}

/**
 * Counts all transaction history records (incoming from users and outgoing from PB recaps) based on filters for pagination.
 * @param mysqli $conn Database connection object.
 * @param int|null $province_id_filter Optional: Filter by province ID.
 * @param int|null $city_id_filter Optional: Filter by city ID.
 * @param int|null $month_filter Optional: Filter by month (1-12).
 * @param int|null $year_filter Optional: Filter by year.
 * @param string|null $kta_status_filter Optional: Filter by KTA status (only for incoming payments).
 * @return int Total count of transaction history records.
 */
function countTransactionHistory($conn, $province_id_filter = null, $city_id_filter = null, $month_filter = null, $year_filter = null, $kta_status_filter = null) {
    $count = 0;

    $params_in = []; $types_in = ""; $where_clauses_in = [];
    if ($province_id_filter) { $where_clauses_in[] = "province_id = ?"; $params_in[] = $province_id_filter; $types_in .= "i"; }
    if ($city_id_filter) { $where_clauses_in[] = "city_id = ?"; $params_in[] = $city_id_filter; $types_in .= "i"; }
    if ($month_filter) { $where_clauses_in[] = "MONTH(created_at) = ?"; $params_in[] = $month_filter; $types_in .= "i"; }
    if ($year_filter) { $where_clauses_in[] = "YEAR(created_at) = ?"; $params_in[] = $year_filter; $types_in .= "i"; }
    if ($kta_status_filter) { $where_clauses_in[] = "status = ?"; $params_in[] = $kta_status_filter; $types_in .= "s"; }
    $where_sql_in = count($where_clauses_in) > 0 ? " AND " . implode(" AND ", $where_clauses_in) : "";

    $query_in = "SELECT COUNT(*) FROM kta_applications WHERE nominal_paid IS NOT NULL AND nominal_paid > 0 {$where_sql_in}";
    $stmt_in = $conn->prepare($query_in);
    if ($stmt_in) {
        // Correct way to pass parameters by reference to call_user_func_array
        $bind_names_in = [$types_in];
        foreach ($params_in as $key => $value) {
            $bind_names_in[] = &$params_in[$key];
        }
        if (!empty($params_in)) { call_user_func_array([$stmt_in, 'bind_param'], $bind_names_in); }
        $stmt_in->execute();
        $result_in = $stmt_in->get_result();
        $count += $result_in->fetch_row()[0];
        $stmt_in->close();
    } else { error_log("Error preparing countTransactionHistory (incoming) query: " . $conn->error); }

    $params_out = []; $types_out = ""; $where_clauses_out = [];
    $query_out = "SELECT COUNT(*) FROM pb_payments_recap pr JOIN users u ON pr.recipient_id = u.id WHERE pr.amount IS NOT NULL AND pr.amount > 0";
    if ($province_id_filter) { $where_clauses_out[] = "u.province_id = ?"; $params_out[] = $province_id_filter; $types_out .= "i"; }
    if ($city_id_filter) { $where_clauses_out[] = "u.city_id = ?"; $params_out[] = $city_id_filter; $types_out .= "i"; }
    if ($month_filter) { $where_clauses_out[] = "MONTH(pr.paid_at) = ?"; $params_out[] = $month_filter; $types_out .= "i"; }
    if ($year_filter) { $where_clauses_out[] = "YEAR(pr.paid_at) = ?"; $params_out[] = $year_filter; $types_out .= "i"; }
    $where_sql_out = count($where_clauses_out) > 0 ? " AND " . implode(" AND ", $where_clauses_out) : "";
    $query_out .= $where_sql_out;

    $stmt_out = $conn->prepare($query_out);
    if ($stmt_out) {
        // Correct way to pass parameters by reference to call_user_func_array
        $bind_names_out = [$types_out];
        foreach ($params_out as $key => $value) {
            $bind_names_out[] = &$params_out[$key];
        }
        if (!empty($params_out)) { call_user_func_array([$stmt_out, 'bind_param'], $bind_names_out); }
        $stmt_out->execute();
        $result_out = $stmt_out->get_result();
        $count += $result_out->fetch_row()[0];
        $stmt_out->close();
    } else { error_log("Error preparing countTransactionHistory (outgoing) query: " . $conn->error); }

    return $count;
}

/**
 * Fetches recipient user bank details for Pengda or Pengcab.
 * @param mysqli $conn Database connection object.
 * @param int $user_id Recipient user ID.
 * @return array Associative array with bank details (bank_account_number, recipient_name, recipient_type).
 */
function getRecipientUserBankDetails($conn, $user_id) {
    $bank_details = ['bank_account_number' => 'Nomor Rekening Tidak Ditemukan', 'recipient_name' => '', 'recipient_type' => ''];

    $stmt = $conn->prepare("SELECT u.bank_account_number, u.club_name, r.role_name
                            FROM users u JOIN roles r ON u.role_id = r.id
                            WHERE u.id = ? AND r.role_name IN ('Pengurus Daerah', 'Pengurus Cabang') LIMIT 1");
    if (!$stmt) {
        error_log("Failed to prepare recipient user bank details query: " . $conn->error);
        return $bank_details;
    }
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($user_data = $result->fetch_assoc()) {
        $bank_details['bank_account_number'] = htmlspecialchars($user_data['bank_account_number'] ?? 'Belum Disetel');
        $bank_details['recipient_name'] = htmlspecialchars($user_data['club_name'] ?? 'Tidak Ditemukan');
        $bank_details['recipient_type'] = $user_data['role_name'] === 'Pengurus Daerah' ? 'pengda' : 'pengcab';
    }
    $stmt->close();
    return $bank_details;
}

/**
 * Fetches transaction data specifically for Excel export, including bank account numbers.
 * Adjusted to fetch from `pb_payments_recap` for outgoing transactions.
 * @param mysqli $conn Database connection object.
 * @param int|null $province_id_filter Optional: Filter by province ID.
 * @param int|null $city_id_filter Optional: Filter by city ID.
 * @param int|null $month_filter Optional: Filter by month (1-12).
 * @param int|null $year_filter Optional: Filter by year.
 * @param string|null $kta_status_filter Optional: Filter by KTA status.
 * @return array Array containing transaction data with additional details for export.
 */
function fetchTransactionsForExcel($conn, $province_id_filter = null, $city_id_filter = null, $month_filter = null, $year_filter = null, $kta_status_filter = null) {
    $transactions = [];

    $params_part1 = []; $types_part1 = ""; $where_clauses_part1 = [];
    $params_part2 = []; $types_part2 = ""; $where_clauses_part2 = [];

    if ($province_id_filter) { $where_clauses_part1[] = "ka.province_id = ?"; $params_part1[] = $province_id_filter; $types_part1 .= "i"; }
    if ($city_id_filter) { $where_clauses_part1[] = "ka.city_id = ?"; $params_part1[] = $city_id_filter; $types_part1 .= "i"; }
    if ($month_filter) { $where_clauses_part1[] = "MONTH(ka.created_at) = ?"; $params_part1[] = $month_filter; $types_part1 .= "i"; }
    if ($year_filter) { $where_clauses_part1[] = "YEAR(ka.created_at) = ?"; $params_part1[] = $year_filter; $types_part1 .= "i"; }
    if ($kta_status_filter) { $where_clauses_part1[] = "ka.status = ?"; $params_part1[] = $kta_status_filter; $types_part1 .= "s"; }
    $where_sql_part1 = count($where_clauses_part1) > 0 ? " AND " . implode(" AND ", $where_clauses_part1) : "";

    if ($province_id_filter) { $where_clauses_part2[] = "u.province_id = ?"; $params_part2[] = $province_id_filter; $types_part2 .= "i"; }
    if ($city_id_filter) { $where_clauses_part2[] = "u.city_id = ?"; $params_part2[] = $city_id_filter; $types_part2 .= "i"; }
    if ($month_filter) { $where_clauses_part2[] = "MONTH(pr.paid_at) = ?"; $params_part2[] = $month_filter; $types_part2 .= "i"; }
    if ($year_filter) { $where_clauses_part2[] = "YEAR(pr.paid_at) = ?"; $params_part2[] = $year_filter; $types_part2 .= "i"; }
    $where_sql_part2 = count($where_clauses_part2) > 0 ? " AND " . implode(" AND ", $where_clauses_part2) : "";

    $query = "
        (SELECT
            ka.id AS id,
            ka.created_at AS transaction_date,
            'Masuk' AS transaction_type,
            COALESCE(ka.club_name, 'Pengguna Tidak Ditemukan') AS related_party_name,
            p.name AS province_name,
            c.name AS city_name,
            ka.nominal_paid AS amount,
            'Pembayaran KTA dari user' AS description,
            ka.status AS kta_status,
            u.bank_account_number AS user_bank_account_number,
            NULL AS recipient_bank_account_number,
            NULL AS recipient_type_name,
            NULL AS recap_notes
        FROM
            kta_applications ka
        LEFT JOIN provinces p ON ka.province_id = p.id
        LEFT JOIN cities c ON ka.city_id = c.id
        LEFT JOIN users u ON ka.user_id = u.id
        WHERE ka.nominal_paid IS NOT NULL AND ka.nominal_paid > 0
        {$where_sql_part1})

        UNION ALL

        (SELECT
            pr.id AS id,
            pr.paid_at AS transaction_date,
            'Keluar' AS transaction_type,
            COALESCE(u.club_name, 'Pengurus Tidak Ditemukan') AS related_party_name,
            prov.name AS province_name,
            city.name AS city_name,
            pr.amount AS amount,
            pr.description AS description, 
            'N/A' AS kta_status, 
            NULL AS user_bank_account_number,
            u.bank_account_number AS recipient_bank_account_number,
            pr.recipient_type AS recipient_type_name,
            pr.notes AS recap_notes
        FROM
            pb_payments_recap pr
        JOIN users u ON pr.recipient_id = u.id
        LEFT JOIN provinces prov ON u.province_id = prov.id
        LEFT JOIN cities city ON u.city_id = city.id
        WHERE pr.amount IS NOT NULL AND pr.amount > 0
        {$where_sql_part2})

        ORDER BY transaction_date DESC;
    ";

    $stmt = $conn->prepare($query);
    if ($stmt) {
        $combined_params = array_merge($params_part1, $params_part2);
        $combined_types = $types_part1 . $types_part2;

        if (!empty($combined_params)) {
            // Fix: Create references for bind_param
            $bind_names = [$combined_types];
            foreach ($combined_params as $key => $value) {
                $bind_names[] = &$combined_params[$key];
            }
            call_user_func_array([$stmt, 'bind_param'], $bind_names);
        }

        $stmt->execute();
        $result = $stmt->get_result();
        while ($row = $result->fetch_assoc()) {
            $transactions[] = $row;
        }
        $stmt->close();
    } else {
        error_log("Error preparing fetchTransactionsForExcel query: " . $conn->error);
        return ['error' => "Failed to retrieve transaction data for export: " . $conn->error];
    }
    return $transactions;
}


/**
 * Fetches a single KTA application's data by its ID.
 * Used for displaying detailed information when a card is clicked.
 * @param mysqli $conn Database connection object.
 * @param int $application_id The ID of the KTA application to fetch.
 * @param string $uploadBaseDirPhysical Physical base directory for uploads.
 * @param string $pengcab_payment_proofs_subfolder Subfolder for Pengcab payment proofs.
 * @param string $pengda_payment_proofs_subfolder Subfolder for Pengda payment proofs.
 * @param string $generated_kta_pb_subfolder Subfolder for PB generated KTA files.
 * @param string $generated_kta_pengda_subfolder Subfolder for Pengda generated KTA files.
 * @param string $generated_kta_pengcab_subfolder Subfolder for Pengcab generated KTA files.
 * @param string $base_url Base URL for file access.
 * @return array|null Associative array of KTA application data if found, or null.
 */
function fetchSingleKTAApplicationById($conn, $application_id, $uploadBaseDirPhysical, $pengcab_payment_proofs_subfolder, $pengda_payment_proofs_subfolder, $generated_kta_pb_subfolder, $generated_kta_pengda_subfolder, $generated_kta_pengcab_subfolder, $base_url) {
    $kta_application = null;
    $query_kta = "SELECT ka.*, u.club_name AS user_club_name, u.email AS user_email, u.phone AS user_phone,
                                     p.name AS province_name_kta, c.name AS city_name_kta
                                     FROM kta_applications ka
                                     JOIN users u ON ka.user_id = u.id
                                     LEFT JOIN provinces p ON ka.province_id = p.id
                                     LEFT JOIN cities c ON ka.city_id = c.id
                                     WHERE ka.id = ?";

    $stmt = $conn->prepare($query_kta);
    if ($stmt) {
        $stmt->bind_param("i", $application_id);
        $stmt->execute();
        $result_kta = $stmt->get_result();
        if ($row = $result_kta->fetch_assoc()) {
            $row['logo_path_display'] = !empty($row['logo_path']) ? $base_url . 'kta_files/' . htmlspecialchars(basename($row['logo_path'])) : '';
            $row['ad_file_path_display'] = !empty($row['ad_file_path']) ? $base_url . 'kta_files/' . htmlspecialchars(basename($row['ad_file_path'])) : '';
            $row['art_file_path_display'] = !empty($row['art_file_path']) ? $base_url . 'kta_files/' . htmlspecialchars(basename($row['art_file_path'])) : '';
            $row['sk_file_path_display'] = !empty($row['sk_file_path']) ? $base_url . 'kta_files/' . htmlspecialchars(basename($row['sk_file_path'])) : '';
            $row['payment_proof_path_display'] = !empty($row['payment_proof_path']) ? $base_url . 'kta_files/' . htmlspecialchars(basename($row['payment_proof_path'])) : '';

            $row['pengcab_payment_proof_path_display'] = !empty($row['pengcab_payment_proof_path']) ? $base_url . $pengcab_payment_proofs_subfolder . htmlspecialchars(basename($row['pengcab_payment_proof_path'])) : '';
            $row['pengda_payment_proof_path_display'] = !empty($row['pengda_payment_proof_path']) ? $base_url . $pengda_payment_proofs_subfolder . htmlspecialchars(basename($row['pengda_payment_proof_path'])) : '';

            // Jalur untuk bukti pembayaran PB ke Pengda/Pengcab sekarang akan mengacu ke bukti rekap jika berlaku
            $row['pb_to_pengda_payment_proof_path_display'] = '';
            $row['pb_to_pengcab_payment_proof_path_display'] = '';

            // Jika ada ID rekap, tautkan ke bukti rekap
            if (!empty($row['pb_payment_recap_id'])) {
                $stmt_recap_proof = $conn->prepare("SELECT payment_proof_path, recipient_type FROM pb_payments_recap WHERE id = ?");
                if ($stmt_recap_proof) {
                    $stmt_recap_proof->bind_param("i", $row['pb_payment_recap_id']);
                    $stmt_recap_proof->execute();
                    $recap_result = $stmt_recap_proof->get_result();
                    if ($recap_row = $recap_result->fetch_assoc()) {
                        $recap_proof_path = $recap_row['payment_proof_path'];
                        $recap_recipient_type = $recap_row['recipient_type'];

                        if ($recap_recipient_type === 'pengda' && !empty($recap_proof_path)) {
                            $row['pb_to_pengda_payment_proof_path_display'] = BASE_URL . $pengda_payment_proofs_subfolder . htmlspecialchars(basename($recap_proof_path));
                        } elseif ($recap_recipient_type === 'pengcab' && !empty($recap_proof_path)) {
                            $row['pb_to_pengcab_payment_proof_path_display'] = BASE_URL . $pengcab_payment_proofs_subfolder . htmlspecialchars(basename($recap_proof_path));
                        }
                    }
                    $stmt_recap_proof->close();
                }
            }

            $row['amount_pb_to_pengda_display'] = !empty($row['amount_pb_to_pengda']) ? 'Rp ' . number_format($row['amount_pb_to_pengda'], 0, ',', '.') : 'Belum';
            $row['amount_pb_to_pengcab_display'] = !empty($row['amount_pb_to_pengcab']) ? 'Rp ' . number_format($row['amount_pb_to_pengcab'], 0, ',', '.') : 'Belum';
            $row['nominal_paid_display'] = !empty($row['nominal_paid']) ? 'Rp ' . number_format($row['nominal_paid'], 0, ',', '.') : 'Belum Bayar';

            $row['generated_kta_file_path_pengcab_display'] = !empty($row['generated_kta_file_path']) ? $base_url . $generated_kta_pengcab_subfolder . htmlspecialchars(basename($row['generated_kta_file_path'])) : '';
            $row['generated_kta_file_path_pengda_display'] = !empty($row['generated_kta_file_path_pengda']) ? $base_url . $generated_kta_pengda_subfolder . htmlspecialchars(basename($row['generated_kta_file_path_pengda'])) : '';
            $row['generated_kta_file_path_pb_display'] = !empty($row['generated_kta_file_path_pb']) ? $base_url . $generated_kta_pb_subfolder . htmlspecialchars(basename($row['generated_kta_file_path_pb'])) : '';

            $row['province'] = $row['province_name_kta'] ?? 'N/A';
            $row['regency'] = $row['city_name_kta'] ?? 'N/A';

            $kta_application = $row;
        }
        $stmt->close();
    } else {
        error_log("Error fetching single KTA application for PB: " . $conn->error);
        return ['error' => "Failed to fetch KTA application data: " . $conn->error];
    }
    return $kta_application;
}

// Global data needed for initial page load or repeated access
$admin_profile = [];
$query_admin_profile = "SELECT id, username, email, phone, club_name FROM users WHERE id = ? AND role_id = 4";
$stmt_admin_profile = $conn->prepare($query_admin_profile);
if ($stmt_admin_profile) {
    $stmt_admin_profile->bind_param("i", $admin_id);
    $stmt_admin_profile->execute();
    $result_admin_profile = $stmt_admin_profile->get_result();
    $admin_profile = $result_admin_profile->fetch_assoc();
    $stmt_admin_profile->close();
} else {
    error_log("Failed to prepare admin profile query: " . $conn->error);
}

// Load PB KTA configuration initially for form population
$pb_ketua_umum_name = '';
$pb_signature_image_path = '';
$pb_kta_config_exists = false;
$query_pb_config = "SELECT ketua_umum_name, signature_image_path FROM pb_kta_configs WHERE user_id = ?";
$stmt_pb_config = $conn->prepare($query_pb_config);
if ($stmt_pb_config) {
    $stmt_pb_config->bind_param("i", $admin_id);
    $stmt_pb_config->execute();
    $result_pb_config = $stmt_pb_config->get_result();
    if ($row_pb_config = $result_pb_config->fetch_assoc()) {
        $pb_ketua_umum_name = htmlspecialchars($row_pb_config['ketua_umum_name']);
        $pb_signature_image_path = htmlspecialchars($row_pb_config['signature_image_path']);
        $pb_kta_config_exists = true;
    }
    $stmt_pb_config->close();
} else {
    error_log("Failed to prepare PB KTA configuration query: " . $conn->error);
}

// Initial Balance Data
$saldo_masuk = getSaldoMasuk($conn);
$saldo_keluar = getSaldoKeluar($conn);    // Assuming kta_status_filter not relevant for general outgoing balance calculation
$total_saldo = $saldo_masuk - $saldo_keluar;

// Initial amounts to pay based on currently issued (unpaid) KTAs
$to_pay_pengda_initial = getAmountToPay($conn, 'pengda', null, null, null, null, 'kta_issued');
$to_pay_pengcab_initial = getAmountToPay($conn, 'pengcab', null, null, null, null, 'kta_issued');
$to_pay_developer_initial = getAmountToPay($conn, 'developer', null, null, null, null, 'kta_issued'); // Developer might need a different logic if not tied to pb_payment_recap_id directly

$saldo_masuk_display = 'Rp ' . number_format($saldo_masuk, 0, ',', '.');
$saldo_keluar_display = 'Rp ' . number_format($saldo_keluar, 0, ',', '.');
$total_saldo_display = 'Rp ' . number_format($total_saldo, 0, ',', '.');

$to_pay_pengda_display_initial = 'Rp ' . number_format($to_pay_pengda_initial, 0, ',', '.');
$to_pay_pengcab_display_initial = 'Rp ' . number_format($to_pay_pengcab_initial, 0, ',', '.');
$to_pay_developer_display_initial = 'Rp ' . number_format($to_pay_developer_initial, 0, ',', '.');


$roles_for_edit = [];
$query_roles = "SELECT id, role_name FROM roles WHERE id IN (1, 2, 3)";
$result_roles = $conn->query($query_roles);
if ($result_roles) {
    while ($row = $result_roles->fetch_assoc()) {
        $roles_for_edit[] = $row;
    }
} else {
    error_log("Error fetching roles for editing: " . $conn->error);
}

$all_provinces = fetchProvinces($conn);

// Initial Activity Log Data
$activity_log_data = [];
$query_log = "SELECT al.*, ka.club_name AS application_club_name
              FROM activity_logs al
              LEFT JOIN kta_applications ka ON al.application_id = ka.id
              WHERE al.role_name = 'Pengurus Besar'
              ORDER BY al.created_at DESC LIMIT 50";
$result_log = $conn->query($query_log);
if ($result_log) {
    while ($row = $result_log->fetch_assoc()) {
        $activity_log_data[] = $row;
    }
} else {
    error_log("Error fetching initial activity log: " . $conn->error);
}

// Initial KTA Applications table load data (now handled by JS, but keeping the variables for clarity if needed)
$kta_applications_initial_load_limit = 5;
$kta_applications_initial_load_offset = 0;
// Note: Actual data for the table and counts will be loaded dynamically via AJAX in JavaScript.
// The initial PHP variables below are mostly for displaying default values before JS kicks in.
$kta_applications_initial_load = []; // Will be populated by JS
$kta_status_counts_initial = []; // Will be populated by JS
$all_users_initial_load = []; // Will be populated by JS
$total_users_initial = 0; // Will be calculated by JS
$total_pages_initial = 0; // Will be calculated by JS


// --- START: All AJAX Handlers (These usually contain exit() and must be placed before any HTML output) ---

// Handle AJAX request to update Admin Password
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['update_password_ajax'])) {
    ob_clean();    // Clear output buffer to ensure only JSON is sent
    header('Content-Type: application/json');
    $response = ['success' => false, 'message' => ''];

    $current_password = $_POST['current_password'] ?? '';
    $new_password = $_POST['new_password'] ?? '';
    $confirm_new_password = $_POST['confirm_new_password'] ?? '';

    if (empty($current_password) || empty($new_password) || empty($confirm_new_password)) {
        $response['message'] = "All password fields must be filled.";
        echo json_encode($response);
        exit();
    }

    if ($new_password !== $confirm_new_password) {
        $response['message'] = "New password and confirm password do not match.";
        echo json_encode($response);
        exit();
    }

    $query_current_password = "SELECT password FROM users WHERE id = ?";
    $stmt_current_password = $conn->prepare($query_current_password);
    if (!$stmt_current_password) {
        $response['message'] = "Error preparing password check query: " . $conn->error;
        echo json_encode($response);
        exit();
    }
    $stmt_current_password->bind_param("i", $admin_id);
    $stmt_current_password->execute();
    $result_current_password = $stmt_current_password->get_result();
    $user_data = $result_current_password->fetch_assoc();
    $stmt_current_password->close();

    if (!$user_data || !password_verify($current_password, $user_data['password'])) {
        $response['message'] = "Current password is incorrect.";
        echo json_encode($response);
        exit();
    }

    $hashed_new_password = password_hash($new_password, PASSWORD_DEFAULT);

    $conn->begin_transaction();
    try {
        $update_query = "UPDATE users SET password = ?, updated_at = NOW() WHERE id = ? AND role_id = 4";
        $stmt = $conn->prepare($update_query);
        if (!$stmt) {
            throw new Exception("Failed to prepare password update statement: " . $conn->error);
        }
        $stmt->bind_param("si", $hashed_new_password, $admin_id);

        if (!$stmt->execute()) {
            throw new Exception("Failed to update password: " . $stmt->error);
        }
        $stmt->close();

        logActivity($conn, $admin_id, 'Pengurus Besar', 'Update Password', 'PB admin password successfully updated.');

        $conn->commit();
        $response['success'] = true;
        $response['message'] = "Password updated successfully!";
    } catch (Exception $e) {
        $conn->rollback();
        $response['message'] = "An error occurred: " . $e->getMessage();
        error_log("Error PB Password Update: " . $e->getMessage() . " for admin ID: " . $admin_id);
    }
    echo json_encode($response);
    exit();
}


// Handle AJAX request to reset *other user's* password (by PB admin, does not require current password)
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['reset_user_password_ajax'])) {
    ob_clean();
    header('Content-Type: application/json');
    $response = ['success' => false, 'message' => ''];

    $user_id = filter_var($_POST['user_id'] ?? '', FILTER_VALIDATE_INT);
    $new_password = $_POST['new_password'] ?? '';
    $confirm_new_password = $_POST['confirm_new_password'] ?? ''; // Fixed: Corrected variable name

    if ($user_id === false || $user_id <= 0) {
        $response['message'] = "Invalid user ID.";
        echo json_encode($response);
        exit();
    }
    if (empty($new_password) || empty($confirm_new_password)) {
        $response['message'] = "New password and confirm password fields cannot be empty.";
        echo json_encode($response);
        exit();
    }
    if ($new_password !== $confirm_new_password) {
        $response['message'] = "New password and confirm password do not match.";
        echo json_encode($response);
        exit();
    }

    $stmt_check_role = $conn->prepare("SELECT role_id, username FROM users WHERE id = ?");
    if (!$stmt_check_role) {
        $response['message'] = "Error checking user role for password reset: " . $conn->error;
        echo json_encode($response);
        exit();
    }
    $stmt_check_role->bind_param("i", $user_id);
    $stmt_check_role->execute();
    $user_to_reset_data = $stmt_check_role->get_result()->fetch_assoc();
    $stmt_check_role->close();

    if (!$user_to_reset_data) {
        $response['message'] = "User not found.";
        echo json_encode($response);
        exit();
    }

    if ($user_to_reset_data['role_id'] == 4 && $user_id != $admin_id) {
        $response['message'] = "You are not allowed to reset other PB admin accounts.";
        echo json_encode($response);
        exit();
    }
    if ($user_to_reset_data['role_id'] == 4 && $user_id == $admin_id) {
        $response['message'] = "To reset your own password, please use the 'Change Password' feature in 'Admin Profile' section.";
        echo json_encode($response);
        exit();
    }

    $hashed_new_password = password_hash($new_password, PASSWORD_DEFAULT);

    $conn->begin_transaction();
    try {
        $update_query = "UPDATE users SET password = ?, updated_at = NOW(), reset_token = NULL, reset_token_expires_at = NULL WHERE id = ?";
        $stmt = $conn->prepare($update_query);
        if (!$stmt) {
            throw new Exception("Failed to prepare password reset statement: " . $conn->error);
        }
        $stmt->bind_param("si", $hashed_new_password, $user_id);

        if (!$stmt->execute()) {
            throw new Exception("Failed to reset password: " . $stmt->error);
        }
        $stmt->close();

        $username_for_log = htmlspecialchars($user_to_reset_data['username'] ?? 'ID ' . $user_id);
        logActivity($conn, $admin_id, 'Pengurus Besar', 'Reset User Password', "User {$username_for_log} (ID: {$user_id}) password successfully reset.", $user_id);

        $conn->commit();
        $response['success'] = true;
        $response['message'] = "User password successfully reset!";
    } catch (Exception $e) {
        $conn->rollback();
        $response['message'] = "An error occurred: " . $e->getMessage();
        error_log("Error PB User Password Reset: " . $e->getMessage() . " for user ID: " . $user_id);
    }
    echo json_encode($response);
    exit();
}


// Handle AJAX request to save PB KTA configuration
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['save_pb_kta_config_ajax'])) {
    ob_clean();    // Clear output buffer
    header('Content-Type: application/json');
    $response = ['success' => false, 'message' => ''];

    if (!isset($conn) || $conn->connect_error) {
        $response['message'] = "Database connection error.";
        echo json_encode($response);
        exit();
    }

    $new_pb_ketua_umum_name = trim(htmlspecialchars($_POST['ketua_umum_name'] ?? '', ENT_QUOTES, 'UTF-8'));
    $signature_data_url = $_POST['signature_data_url'] ?? ''; // Base64 data from canvas

    $conn->begin_transaction();

    try {
        $current_pb_signature_filename = '';

        // Get old file path before updating to delete the old file
        // Ensure $pb_kta_config_exists is correctly determined before this block.
        // It's determined at the top level, so it should be available.
        $query_current_pb_paths = "SELECT signature_image_path FROM pb_kta_configs WHERE user_id = ?";
        $stmt_current_pb_paths = $conn->prepare($query_current_pb_paths);
        if ($stmt_current_pb_paths) {
            $stmt_current_pb_paths->bind_param("i", $admin_id);
            $stmt_current_pb_paths->execute();
            $result_current_pb_paths = $stmt_current_pb_paths->get_result();
            if ($row_paths = $result_current_pb_paths->fetch_assoc()) {
                $current_pb_signature_filename = $row_paths['signature_image_path'];
                // Update $pb_kta_config_exists here if not already set, for this specific request context.
                // However, it's safer to rely on the top-level load for page rendering,
                // and for AJAX, just retrieve previous state.
            }
            $stmt_current_pb_paths->close();
        }


        $new_pb_signature_filename = $current_pb_signature_filename; // Retain old if no new one provided

        // Handle signature image upload
        if (!empty($signature_data_url) && strpos($signature_data_url, 'data:image/png;base64,') !== false) {
            if (!is_dir($pb_kta_configs_physical_path)) {
                if (!mkdir($pb_kta_configs_physical_path, 0755, true)) {
                    throw new Exception("Critical: Failed to create target directory at '{$pb_kta_configs_physical_path}'. Check permissions on the 'uploads' folder.");
                }
            }
            if (!is_writable($pb_kta_configs_physical_path)) {
                throw new Exception("Critical: Target directory '{$pb_kta_configs_physical_path}' is not writable. Please change folder permissions to 755 or 0777.");
            }

            $data = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $signature_data_url));
            if ($data === false) {
                throw new Exception("Invalid signature data (base64 decode failed).");
            }

            $new_pb_signature_filename = 'pb_signature_' . $admin_id . '_' . uniqid() . '.png';
            $signature_target_path = $pb_kta_configs_physical_path . $new_pb_signature_filename;

            if (file_put_contents($signature_target_path, $data) === false) {
                throw new Exception("Failed to save signature image. Ensure server has enough disk space.");
            }

            // Delete old signature file if it exists and is different from the new one
            if ($current_pb_signature_filename && $current_pb_signature_filename != $new_pb_signature_filename && file_exists($pb_kta_configs_physical_path . $current_pb_signature_filename)) {
                @unlink($pb_kta_configs_physical_path . $current_pb_signature_filename);
            }
        } else if (empty($signature_data_url) && $current_pb_signature_filename) {
            // If signature is explicitly cleared, delete the old file and set filename to NULL
            if (file_exists($pb_kta_configs_physical_path . $current_pb_signature_filename)) {
                @unlink($pb_kta_configs_physical_path . $current_pb_signature_filename);
            }
            $new_pb_signature_filename = null;
        }

        // Process update/insert to database
        // We re-check pb_kta_config_exists here to ensure correct DB operation for this specific request
        $check_config_query = "SELECT COUNT(*) FROM pb_kta_configs WHERE user_id = ?";
        $stmt_check_config = $conn->prepare($check_config_query);
        $stmt_check_config->bind_param("i", $admin_id);
        $stmt_check_config->execute();
        $config_exists_for_user = $stmt_check_config->get_result()->fetch_row()[0] > 0;
        $stmt_check_config->close();

        if ($config_exists_for_user) {
            $update_query = "UPDATE pb_kta_configs SET ketua_umum_name = ?, signature_image_path = ?, updated_at = NOW() WHERE user_id = ?";
            $stmt = $conn->prepare($update_query);
            if (!$stmt) {
                throw new Exception("Failed to prepare PB configuration update statement: " . $conn->error);
            }
            $stmt->bind_param("ssi", $new_pb_ketua_umum_name, $new_pb_signature_filename, $admin_id);
        } else {
            $insert_query = "INSERT INTO pb_kta_configs (user_id, ketua_umum_name, signature_image_path) VALUES (?, ?, ?)";
            $stmt = $conn->prepare($insert_query);
            if (!$stmt) {
                throw new Exception("Failed to prepare PB configuration insert statement: " . $conn->error);
            }
            $stmt->bind_param("iss", $admin_id, $new_pb_ketua_umum_name, $new_pb_signature_filename);
        }

        if (!$stmt->execute()) {
            throw new Exception("Failed to save PB KTA configuration to database: " . $stmt->error);
        }
        $stmt->close();

        logActivity($conn, $admin_id, 'Pengurus Besar', 'Konfigurasi KTA PB', 'PB updated KTA auto-configuration.');

        $conn->commit();
        $response['success'] = true;
        $response['message'] = "PB KTA configuration saved successfully!";
        $response['signature_path'] = !empty($new_pb_signature_filename) ? BASE_URL . $pb_kta_configs_subfolder . $new_pb_signature_filename : '';

    } catch (Exception $e) {
        $conn->rollback();
        $response['message'] = "An error occurred: " . $e->getMessage();
        error_log("Error Saving PB KTA Config: " . $e->getMessage() . " for admin ID: " . $admin_id);
        // Attempt to clean up partially uploaded file if transaction failed
        if (!empty($new_pb_signature_filename) && file_exists($pb_kta_configs_physical_path . $new_pb_signature_filename) && $new_pb_signature_filename != $current_pb_signature_filename) {
            @unlink($pb_kta_configs_physical_path . $new_pb_signature_filename);
        }
    }

    echo json_encode($response);
    exit();
}


// Handle AJAX request to fetch single user details (currently for password reset only)
if ($_SERVER['REQUEST_METHOD'] == 'GET' && isset($_GET['fetch_user_details'])) {
    ob_clean();
    header('Content-Type: application/json');
    $response = ['success' => false, 'message' => ''];

    $user_id = filter_var($_GET['user_id'] ?? '', FILTER_VALIDATE_INT);

    if ($user_id === false || $user_id <= 0) {
        $response['message'] = "Invalid user ID.";
        echo json_encode($response);
        exit();
    }

    $query = "SELECT u.id, u.username, u.email, u.phone, u.club_name, u.role_id,
                     u.province_id, u.city_id, u.bank_account_number, r.role_name
              FROM users u
              JOIN roles r ON u.role_id = r.id
              WHERE u.id = ?";
    $stmt = $conn->prepare($query);
    if ($stmt) {
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($user_data = $result->fetch_assoc()) {
            if ($user_data['role_id'] == 4 && $user_data['id'] != $admin_id) {
                $response['message'] = "You are not allowed to edit other PB admin profiles.";
            } else {
                $response['success'] = true;
                $response['data'] = $user_data;
            }
        } else {
            $response['message'] = "User not found.";
        }
        $stmt->close();
    } else {
        $response['message'] = "Failed to prepare query: " . $conn->error;
    }
    echo json_encode($response);
    exit();
}


// Handle AJAX request to delete user data
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['delete_user_data_ajax'])) {
    ob_clean();
    header('Content-Type: application/json');
    $response = ['success' => false, 'message' => ''];

    $user_id = filter_var($_POST['user_id'] ?? '', FILTER_VALIDATE_INT);

    if ($user_id === false || $user_id <= 0) {
        $response['message'] = "Invalid user ID.";
        echo json_encode($response);
        exit();
    }

    $stmt_check_role = $conn->prepare("SELECT role_id, username FROM users WHERE id = ?");
    if (!$stmt_check_role) {
        $response['message'] = "Error checking user role for deletion: " . $conn->error;
        echo json_encode($response);
        exit();
    }
    $stmt_check_role->bind_param("i", $user_id);
    $stmt_check_role->execute();
    $user_to_delete_data = $stmt_check_role->get_result()->fetch_assoc();
    $stmt_check_role->close();

    if (!$user_to_delete_data) {
        $response['message'] = "User not found.";
        echo json_encode($response);
        exit();
    }

    if ($user_to_delete_data['role_id'] == 4) {
        $response['message'] = "Cannot delete PB admin accounts.";
        echo json_encode($response);
        exit();
    }

    $stmt_check_kta = $conn->prepare("SELECT COUNT(*) FROM kta_applications WHERE user_id = ?");
    if ($stmt_check_kta) {
        $stmt_check_kta->bind_param("i", $user_id);
        $stmt_check_kta->execute();
        $kta_count = $stmt_check_kta->get_result()->fetch_row()[0];
        $stmt_check_kta->close();

        if ($kta_count > 0) {
            $response['message'] = "Cannot delete this user because they still have {$kta_count} related KTA applications. Please delete or archive KTA applications first.";
            echo json_encode($response);
            exit();
        }
    } else {
        error_log("Error checking KTA applications before user deletion: " . $conn->error);
    }

    $conn->begin_transaction();
    try {
        $delete_query = "DELETE FROM users WHERE id = ?";
        $stmt = $conn->prepare($delete_query);
        if (!$stmt) {
            throw new Exception("Failed to prepare user deletion statement: " . $conn->error);
        }
        $stmt->bind_param("i", $user_id);

        if (!$stmt->execute()) {
            throw new Exception("Failed to delete user: " . $stmt->error);
        }
        $stmt->close();

        logActivity($conn, $admin_id, 'Pengurus Besar', 'Delete User', "User ID {$user_id} ({$user_to_delete_data['username']}) successfully deleted.", $user_id);

        $conn->commit();
        $response['success'] = true;
        $response['message'] = "User successfully deleted!";
    } catch (Exception $e) {
        $conn->rollback();
        $response['message'] = "An error occurred: " . $e->getMessage();
        error_log("Error PB User Deletion: " . $e->getMessage() . " for user ID: " . $user_id);
    }
    echo json_encode($response);
    exit();
}

// Handle AJAX request to fetch cities by province ID for dropdowns
if ($_SERVER['REQUEST_METHOD'] == 'GET' && isset($_GET['get_cities_by_province'])) {
    ob_clean();
    header('Content-Type: application/json');
    $response = ['success' => false, 'cities' => [], 'message' => ''];
    $province_id = filter_var($_GET['province_id'] ?? '', FILTER_VALIDATE_INT);

    if ($province_id === false || $province_id <= 0) {
        $response['message'] = "Invalid province ID.";
        echo json_encode($response);
        exit();
    }

    $cities = fetchCitiesByProvinceId($conn, $province_id);
    if (!empty($cities)) {
        $response['success'] = true;
        $response['cities'] = $cities;
    } else {
        $response['message'] = "No cities/regencies found for this province.";
    }
    echo json_encode($response);
    exit();
}

// NEW AJAX Handler: Fetch recipient bank details (for recap payment modal)
if ($_SERVER['REQUEST_METHOD'] == 'GET' && isset($_GET['fetch_recipient_bank_details'])) {
    ob_clean();
    header('Content-Type: application/json');
    $response = ['success' => false, 'message' => '', 'bank_account_number' => 'N/A', 'recipient_name' => '', 'amount_to_pay' => 0, 'recipient_type' => ''];

    $recipient_user_id = filter_var($_GET['recipient_user_id'] ?? '', FILTER_VALIDATE_INT);
    $recipient_type = trim($_GET['recipient_type'] ?? '');    
    $recap_month = filter_var($_GET['recap_month'] ?? null, FILTER_VALIDATE_INT);
    $recap_year = filter_var($_GET['recap_year'] ?? null, FILTER_VALIDATE_INT);

    if ($recipient_user_id === false || $recipient_user_id <= 0 || !in_array($recipient_type, ['pengda', 'pengcab'])) {
        $response['message'] = "Invalid payment parameters.";
        echo json_encode($response);
        exit();
    }

    $bank_details = getRecipientUserBankDetails($conn, $recipient_user_id);

    if ($bank_details) {
        $response['success'] = true;
        $response['bank_account_number'] = $bank_details['bank_account_number'];
        $response['recipient_name'] = $bank_details['recipient_name'];
        $response['recipient_type'] = $bank_details['recipient_type'];

        // Get province/city ID from recipient user
        $stmt_user_region = $conn->prepare("SELECT province_id, city_id FROM users WHERE id = ?");
        $user_province_id = null;
        $user_city_id = null;
        if ($stmt_user_region) {
            $stmt_user_region->bind_param("i", $recipient_user_id);
            $stmt_user_region->execute();
            $result_user_region = $stmt_user_region->get_result();
            if ($row_user_region = $result_user_region->fetch_assoc()) {
                $user_province_id = $row_user_region['province_id'];
                $user_city_id = $row_user_region['city_id'];
            }
            $stmt_user_region->close();
        }

        // Calculate amount to pay for this recap
        $amount_to_pay_recap = 0;
        if ($recipient_type === 'pengda') {
            // For Pengda, filter by Pengda user's province ID
            $amount_to_pay_recap = getAmountToPay($conn, 'pengda', $user_province_id, null, $recap_month, $recap_year, 'kta_issued');    
        } elseif ($recipient_type === 'pengcab') {
            // For Pengcab, filter by Pengcab user's city ID
            $amount_to_pay_recap = getAmountToPay($conn, 'pengcab', null, $user_city_id, $recap_month, $recap_year, 'kta_issued');
        }
        
        $response['amount_to_pay'] = $amount_to_pay_recap;    
        $response['message'] = "Account and recap nominal details fetched successfully.";
    } else {
        $response['message'] = "Failed to fetch account details. Recipient might not be found.";
    }
    echo json_encode($response);
    exit();
}

// NEW AJAX Handler: Process PB Recap Payment
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['process_pb_recap_payment'])) {
    ob_clean();
    header('Content-Type: application/json');
    $response = ['success' => false, 'message' => ''];

    $recipient_user_id = filter_var($_POST['recipient_user_id'] ?? '', FILTER_VALIDATE_INT);
    $recipient_type = trim($_POST['recipient_type'] ?? '');    
    $recap_period_type = trim($_POST['recap_period_type'] ?? 'monthly');    
    $recap_month = filter_var($_POST['recap_month'] ?? null, FILTER_VALIDATE_INT);
    $recap_year = filter_var($_POST['recap_year'] ?? null, FILTER_VALIDATE_INT);
    $amount_paid = filter_var(str_replace('.', '', $_POST['amount_paid'] ?? ''), FILTER_VALIDATE_FLOAT);
    $notes = trim(htmlspecialchars($_POST['notes_transfer'] ?? '', ENT_QUOTES, 'UTF-8'));

    if ($recipient_user_id === false || $recipient_user_id <= 0 || !in_array($recipient_type, ['pengda', 'pengcab'])) {
        $response['message'] = "Invalid payment parameters.";
        echo json_encode($response);
        exit();
    }
    if ($amount_paid === false || $amount_paid <= 0) {
        $response['message'] = "Invalid amount paid. Amount must be greater than zero.";
        echo json_encode($response);
        exit();
    }
    if (empty($recap_period_type) || empty($recap_year) || ($recap_period_type !== 'yearly' && empty($recap_month))) {
        $response['message'] = "Invalid recap period (month/year).";
        echo json_encode($response);
        exit();
    }

    if (!isset($_FILES['payment_proof_file']) || $_FILES['payment_proof_file']['error'] !== UPLOAD_ERR_OK) {
        $response['message'] = "Payment proof file not uploaded or an error occurred.";
        echo json_encode($response);
        exit();
    }

    $file = $_FILES['payment_proof_file'];
    $file_ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $allowed_extensions = ['jpg', 'jpeg', 'png', 'pdf'];
    if (!in_array($file_ext, $allowed_extensions)) {
        $response['message'] = "File format not allowed. Only JPG, JPEG, PNG, and PDF.";
        echo json_encode($response);
        exit();
    }
    if ($file['size'] > 5 * 1024 * 1024) {
        $response['message'] = "File size too large (max 5MB).";
        echo json_encode($response);
        exit();
    }

    $target_subfolder = $recipient_type === 'pengda' ? $pengda_payment_proofs_subfolder : $pengcab_payment_proofs_subfolder;
    $unique_filename = "pb_rekap_{$recipient_type}_" . $recipient_user_id . '_' . uniqid() . '.' . $file_ext;
    $target_file_physical_path = $uploadBaseDirPhysical . $target_subfolder . $unique_filename;

    $conn->begin_transaction();
    try {
        if (!is_dir($uploadBaseDirPhysical . $target_subfolder)) {
            mkdir($uploadBaseDirPhysical . $target_subfolder, 0755, true);
        }
        if (!is_writable($uploadBaseDirPhysical . $target_subfolder)) {
            throw new Exception("Destination directory for payment proof is not writable: " . $uploadBaseDirPhysical . $target_subfolder);
        }

        if (!move_uploaded_file($file['tmp_name'], $target_file_physical_path)) {
            throw new Exception("Failed to move uploaded file to storage location. Ensure server folder permissions are correct.");
        }

        // 1. Insert into `pb_payments_recap`
        $insert_recap_query = "INSERT INTO pb_payments_recap (recap_date, recipient_type, recipient_id, amount, payment_proof_path, notes, paid_at, processed_by_pb_id) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)";
        $stmt_recap = $conn->prepare($insert_recap_query);
        if (!$stmt_recap) {
            throw new Exception("Failed to prepare payment recap insert statement: " . $conn->error);
        }
        
        $recap_date = ($recap_period_type === 'yearly') ? "{$recap_year}-12-31" : "{$recap_year}-{$recap_month}-" . date('t', mktime(0, 0, 0, $recap_month, 1, $recap_year));
        
        $stmt_recap->bind_param("ssidsis", $recap_date, $recipient_type, $recipient_user_id, $amount_paid, $unique_filename, $notes, $admin_id);
        if (!$stmt_recap->execute()) {
            throw new Exception("Failed to save payment recap to database: " . $stmt_recap->error);
        }
        $recap_id = $conn->insert_id;
        $stmt_recap->close();

        // 2. Update `kta_applications` records now paid through this recap
        // Get province/city ID from recipient user
        $stmt_user_region = $conn->prepare("SELECT province_id, city_id FROM users WHERE id = ?");
        $user_province_id = null;
        $user_city_id = null;
        if ($stmt_user_region) {
            $stmt_user_region->bind_param("i", $recipient_user_id);
            $stmt_user_region->execute();
            $result_user_region = $stmt_user_region->get_result();
            if ($row_user_region = $result_user_region->fetch_assoc()) {
                $user_province_id = $row_user_region['province_id'];
                $user_city_id = $row_user_region['city_id'];
            }
            $stmt_user_region->close();
        }

        $kta_ids_to_update = [];
        $query_kta_ids = "SELECT id FROM kta_applications WHERE status = 'kta_issued'";
        $kta_params = [];
        $kta_types = '';

        if ($recipient_type === 'pengda') {
            $query_kta_ids .= " AND province_id = ?";
            $kta_params[] = $user_province_id;
            $kta_types .= 'i';
            // Only update if amount_pb_to_pengda is NULL or 0
            $query_kta_ids .= " AND (amount_pb_to_pengda IS NULL OR amount_pb_to_pengda = 0)";
        } elseif ($recipient_type === 'pengcab') {
            $query_kta_ids .= " AND city_id = ?";
            $kta_params[] = $user_city_id;
            $kta_types .= 'i';
            // Only update if amount_pb_to_pengcab is NULL or 0
            $query_kta_ids .= " AND (amount_pb_to_pengcab IS NULL OR amount_pb_to_pengcab = 0)";
        }

        if ($recap_month) {
            $query_kta_ids .= " AND MONTH(kta_issued_at) = ?";
            $kta_params[] = $recap_month;
            $kta_types .= 'i';
        }
        if ($recap_year) {
            $query_kta_ids .= " AND YEAR(kta_issued_at) = ?";
            $kta_params[] = $recap_year;
            $kta_types .= 'i';
        }
        // Ensure KTA applications are not already part of a recap, or this specific payment type is not yet recorded.
        // This condition is important if a KTA could be part of multiple recaps or has different payment types.
        // Given that amount_pb_to_pengda/pengcab directly mark payment, we check them.
        
        $stmt_get_kta_ids = $conn->prepare($query_kta_ids);
        if (!$stmt_get_kta_ids) {
            throw new Exception("Failed to prepare KTA query for recap: " . $conn->error);
        }
        if(!empty($kta_params)) {
            // Correct way to pass parameters by reference to call_user_func_array
            $bind_names_kta_ids = [$kta_types];
            foreach ($kta_params as $key => $value) {
                $bind_names_kta_ids[] = &$kta_params[$key];
            }
            call_user_func_array([$stmt_get_kta_ids, 'bind_param'], $bind_names_kta_ids);
        }
        $stmt_get_kta_ids->execute();
        $result_kta_ids = $stmt_get_kta_ids->get_result();
        while ($row = $result_kta_ids->fetch_assoc()) {
            $kta_ids_to_update[] = $row['id'];
        }
        $stmt_get_kta_ids->close();

        if (empty($kta_ids_to_update)) {
            error_log("No KTA applications found for recap for recipient ID: {$recipient_user_id}, type: {$recipient_type}, period: {$recap_month}/{$recap_year}.");
            // If no KTAs found to update, you might still want to commit the recap record
            // if the payment was for a general balance or previous discrepancy.
            // For now, we allow the transaction to proceed even if no KTAs were linked this time.
            // Consider if this should be an error case based on business logic.
        } else {
            $update_kta_query_base = "UPDATE kta_applications SET pb_payment_recap_id = ?, updated_at = NOW()";
            $update_kta_params = [$recap_id];
            $update_kta_types = 'i';

            $amount_per_kta_pengda = 35000;    
            $amount_per_kta_pengcab = 50000;    

            if ($recipient_type === 'pengda') {
                $update_kta_query_base .= ", amount_pb_to_pengda = ?";
                $update_kta_params[] = $amount_per_kta_pengda;
                $update_kta_types .= 'd';
            } elseif ($recipient_type === 'pengcab') {
                $update_kta_query_base .= ", amount_pb_to_pengcab = ?";
                $update_kta_params[] = $amount_per_kta_pengcab;
                $update_kta_types .= 'd';
            }

            // Construct IN clause dynamically
            $in_clause_placeholders = implode(',', array_fill(0, count($kta_ids_to_update), '?'));
            $update_kta_query = $update_kta_query_base . " WHERE id IN (" . $in_clause_placeholders . ")";
            $update_kta_types .= str_repeat('i', count($kta_ids_to_update));
            $update_kta_params = array_merge($update_kta_params, $kta_ids_to_update);

            $stmt_update_kta = $conn->prepare($update_kta_query);
            if (!$stmt_update_kta) {
                throw new Exception("Failed to prepare KTA application update statement for recap: " . $conn->error);
            }
            // Correct way to pass parameters by reference to call_user_func_array
            $bind_names_update_kta = [$update_kta_types];
            foreach ($update_kta_params as $key => $value) {
                $bind_names_update_kta[] = &$update_kta_params[$key];
            }
            call_user_func_array([$stmt_update_kta, 'bind_param'], $bind_names_update_kta);
            if (!$stmt_update_kta->execute()) {
                throw new Exception("Failed to update KTA applications with recap ID: " . $stmt_update_kta->error);
            }
            $stmt_update_kta->close();
        }
        
        logActivity($conn, $admin_id, 'Pengurus Besar', 'Recap Payment', "Processed recap payment of Rp " . number_format($amount_paid, 0, ',', '.') . " to {$recipient_type} (ID: {$recipient_user_id}) for period {$recap_month}/{$recap_year}.", null, null, null);

        $conn->commit();
        $response['success'] = true;
        $response['message'] = "Recap payment and proof of transfer uploaded and saved successfully!";
        $response['uploaded_file_url'] = BASE_URL . $target_subfolder . $unique_filename;
        $response['new_amount_display'] = 'Rp ' . number_format($amount_paid, 0, ',', '.');
        $response['recipient_type'] = $recipient_type;

    } catch (Exception $e) {
        $conn->rollback();
        $response['message'] = "An error occurred: " . $e->getMessage();
        error_log("Error PB Recap Payment Upload: " . $e->getMessage());

        if (file_exists($target_file_physical_path)) {
            @unlink($target_file_physical_path);
            error_log("Attempting to clean up partially uploaded file: " . $target_file_physical_path);
        }
    }
    echo json_encode($response);
    exit();
}


// Handle KTA application approval/rejection
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    if (isset($_POST['update_kta_status_ajax'])) {
        ob_clean();
        header('Content-Type: application/json');
        $response = ['success' => false, 'message' => ''];

        $application_id = filter_var($_POST['application_id'] ?? '', FILTER_VALIDATE_INT);
        $new_status_action = trim($_POST['new_status'] ?? '');
        $notes = trim(htmlspecialchars($_POST['notes'] ?? '', ENT_QUOTES, 'UTF-8'));

        if ($application_id === false || $application_id <= 0) {
            $response['message'] = "Invalid application ID.";
            echo json_encode($response);
            exit();
        }
        if (!in_array($new_status_action, ['approved_pb', 'rejected'])) {
            $response['message'] = "Invalid new status.";
            echo json_encode($response);
            exit();
        }

        // Validate PB KTA configuration before approval
        if ($new_status_action == 'approved_pb') {
            $pb_ketua_umum_name_check = '';
            $pb_signature_image_path_check = '';    
            $query_pb_config_check = "SELECT ketua_umum_name, signature_image_path FROM pb_kta_configs WHERE user_id = ?";    
            $stmt_pb_config_check = $conn->prepare($query_pb_config_check);
            if ($stmt_pb_config_check) {
                $stmt_pb_config_check->bind_param("i", $admin_id);
                $stmt_pb_config_check->execute();
                $result_pb_config_check = $stmt_pb_config_check->get_result();
                if ($row_pb_config_check = $result_pb_config_check->fetch_assoc()) {
                    $pb_ketua_umum_name_check = $row_pb_config_check['ketua_umum_name'];
                    $pb_signature_image_path_check = $row_pb_config_check['signature_image_path'];    
                }
                $stmt_pb_config_check->close();
            }

            // Validation: ensure both ketua umum name AND signature exist
            if (empty($pb_ketua_umum_name_check) || empty($pb_signature_image_path_check)) {
                $response['message'] = "To approve KTA application, PB KTA configuration (Chairman's Name AND Signature) is incomplete. Please complete it first in the 'PB KTA Configuration' section.";
                echo json_encode($response);
                exit();
            }
        }


        $current_app_data_query = "SELECT status, province_id, city_id FROM kta_applications WHERE id = ?";
        $stmt_current_app_data = $conn->prepare($current_app_data_query);
        if (!$stmt_current_app_data) {
            $response['message'] = "Error preparing current status query: " . $conn->error;
            error_log("Error preparing current status query: " . $conn->error);
            echo json_encode($response);
            exit();
        }
        $stmt_current_app_data->bind_param("i", $application_id);
        $stmt_current_app_data->execute();
        $current_app_result = $stmt_current_app_data->get_result();
        $app_details = $current_app_result->fetch_assoc();
        $current_app_status = $app_details['status'] ?? null;
        $app_province_id = $app_details['province_id'] ?? null;
        $app_city_id = $app_details['city_id'] ?? null;
        $stmt_current_app_data->close();

        $allowed_statuses_for_pb_action = ['approved_pengda', 'rejected_pb', 'pending_pengda_resubmit'];

        if (in_array($current_app_status, $allowed_statuses_for_pb_action)) {
            $conn->begin_transaction();
            try {
                $actual_new_db_status = $new_status_action;

                $update_fields = [];
                $param_values = [];
                $param_types = "";

                $update_fields[] = "status = ?";
                $param_types .= "s";

                if ($new_status_action == 'approved_pb') {
                    $actual_new_db_status = 'approved_pb';
                    $param_values[] = $actual_new_db_status;
                    $update_fields[] = "approved_by_pb_id = ?";
                    $param_values[] = $admin_id;
                    $param_types .= "i";
                    $update_fields[] = "approved_at_pb = NOW()";
                    $update_fields[] = "notes_pb = ?";
                    $param_values[] = $notes;
                    $param_types .= "s";
                    $update_fields[] = "rejection_reason = NULL";
                    $update_fields[] = "rejected_by_pb_id = NULL";
                    $update_fields[] = "rejected_at_pb = NULL";
                    $update_fields[] = "kta_issued_at = NULL";
                    $update_fields[] = "generated_kta_file_path_pb = NULL";
                    $update_fields[] = "kta_barcode_unique_id = NULL";
                } elseif ($new_status_action == 'rejected') {
                    $actual_new_db_status = 'rejected_pb';
                    $param_values[] = $actual_new_db_status;
                    $update_fields[] = "rejected_by_pb_id = ?";
                    $param_values[] = $admin_id;
                    $param_types .= "i";
                    $update_fields[] = "rejected_at_pb = NOW()";
                    $update_fields[] = "notes_pb = ?";
                    $param_values[] = $notes;
                    $param_types .= "s";
                    $update_fields[] = "rejection_reason = ?";
                    $param_values[] = $notes;
                    $param_types .= "s";

                    $update_fields[] = "approved_by_pb_id = NULL";
                    $update_fields[] = "approved_at_pb = NULL";
                    $update_fields[] = "kta_issued_at = NULL";
                    $update_fields[] = "generated_kta_file_path_pb = NULL";
                    $update_fields[] = "kta_barcode_unique_id = NULL";
                }

                $update_query = "UPDATE kta_applications SET " . implode(', ', $update_fields) . " WHERE id = ?";
                $param_values[] = $application_id;
                $param_types .= "i";

                $stmt = $conn->prepare($update_query);
                if (!$stmt) {
                    throw new Exception("Error preparing update statement: " . $conn->error);
                }

                // Correct way to pass parameters by reference to call_user_func_array
                $bind_names = [$param_types];
                foreach ($param_values as $key => $value) {
                    $bind_names[] = &$param_values[$key];
                }
                call_user_func_array([$stmt, 'bind_param'], $bind_names);

                if (!$stmt->execute()) {
                    throw new Exception("Failed to update status: " . $stmt->error);
                }
                $stmt->close();

                $insert_history_query = "INSERT INTO kta_application_history (application_id, status, notes) VALUES (?, ?, ?)";
                $stmt_history = $conn->prepare($insert_history_query);
                if ($stmt_history) {
                    $history_status_desc = ($actual_new_db_status == 'approved_pb' ? 'Approved by PB' : 'Rejected by PB');
                    $history_notes = $history_status_desc . ". Notes: " . $notes;
                    $stmt_history->bind_param("iss", $application_id, $actual_new_db_status, $history_notes);
                    if (!$stmt_history->execute()) {
                        error_log("Failed to execute history insert: " . $stmt_history->error);
                    }
                    $stmt_history->close();
                } else {
                    error_log("Failed to prepare history insert: " . $conn->error);
                }

                logActivity($conn, $admin_id, 'Pengurus Besar', 'Update KTA Application Status',
                    "Updated KTA application ID {$application_id} status from '{$current_app_status}' to '{$actual_new_db_status}'. Notes: {$notes}",
                    $application_id, $current_app_status, $actual_new_db_status);

                $conn->commit();
                $response['success'] = true;
                $response['message'] = "KTA application status successfully updated to '" . ucfirst(str_replace('_', ' ', $actual_new_db_status)) . "'.";

                if ($new_status_action == 'rejected') {
                    $response['redirect_to_pengda'] = true;
                    $response['rejected_kta_id'] = $application_id;
                    $response['reject_reason'] = $notes;
                    $response['province_id'] = $app_province_id;
                    $response['city_id'] = $app_city_id;
                }

            } catch (Exception $e) {
                $conn->rollback();
                $response['message'] = "An error occurred: " . $e->getMessage();
                error_log("Error KTA Status Update (PB): " . $e->getMessage() . " on application ID: " . $application_id);
            }
        } else {
            $response['message'] = "Invalid status transition for PB. Application is not in a PB-processable status. Current status: " . ucfirst(str_replace('_', ' ', $current_app_status));
        }
        echo json_encode($response);
        exit();
    } elseif (isset($_POST['generate_pb_kta_ajax'])) {
        ob_clean();
        header('Content-Type: application/json');
        $response = ['success' => false, 'message' => ''];

        $application_id = filter_var($_POST['application_id'] ?? '', FILTER_VALIDATE_INT);

        if ($application_id === false || $application_id <= 0) {
            $response['message'] = "Invalid application ID.";
            echo json_encode($response);
            exit();
        }

        // Check if PB KTA configuration is complete (chairman name AND signature)
        $pb_ketua_umum_name_check = '';
        $pb_signature_image_path_check = '';    
        $query_pb_config_check = "SELECT ketua_umum_name, signature_image_path FROM pb_kta_configs WHERE user_id = ?";    
        $stmt_pb_config_check = $conn->prepare($query_pb_config_check);
        if ($stmt_pb_config_check) {
            $stmt_pb_config_check->bind_param("i", $admin_id);
            $stmt_pb_config_check->execute();
            $result_pb_config_check = $stmt_pb_config_check->get_result();
            if ($row_pb_config_check = $result_pb_config_check->fetch_assoc()) {
                $pb_ketua_umum_name_check = $row_pb_config_check['ketua_umum_name'];
                $pb_signature_image_path_check = $row_pb_config_check['signature_image_path'];    
            }
            $stmt_pb_config_check->close();
        }

        if (empty($pb_ketua_umum_name_check) || empty($pb_signature_image_path_check)) {
            $response['message'] = "PB KTA configuration (Chairman's Name AND Signature) is incomplete. Please complete it first in the 'Automatic KTA Configuration' section.";
            echo json_encode($response);
            exit();
        }


        $check_query = "SELECT status, generated_kta_file_path_pb, kta_barcode_unique_id FROM kta_applications WHERE id = ?";
        $stmt_check = $conn->prepare($check_query);
        if (!$stmt_check) {
            $response['message'] = "Error preparing status check query: " . $conn->error;
            error_log("Error preparing status check query for KTA generation: " . $conn->error);
            echo json_encode($response);
            exit();
        }
        $stmt_check->bind_param("i", $application_id);
        $stmt_check->execute();
        $check_result = $stmt_check->get_result();
        $app_data = $check_result->fetch_assoc();
        $app_status = $app_data['status'] ?? null;
        $existing_generated_kta_pb_path = $app_data['generated_kta_file_path_pb'] ?? null;
        $existing_kta_barcode_unique_id = $app_data['kta_barcode_unique_id'] ?? null;
        $stmt_check->close();

        if ($app_status == 'approved_pb' && empty($existing_generated_kta_pb_path)) {
            $barcode_to_use = $existing_kta_barcode_unique_id;
            if (empty($barcode_to_use)) {
                $barcode_to_use = 'FORBASI' . date('YmdHis') . str_pad($application_id, 5, '0', STR_PAD_LEFT) . substr(uniqid(), -4);
            }

            $generate_kta_url = BASE_URL_FOR_PDF . 'generate_kta_pdf.php';

            $post_data = [
                'application_id' => $application_id,
                'admin_id' => $admin_id,
                'role_caller' => 'pb',
                'unique_barcode_id' => $barcode_to_use,
                // Pass Chairman's name and signature path to generate_kta_pdf.php
                'ketua_umum_name' => $pb_ketua_umum_name_check,
                'signature_image_path' => $pb_signature_image_path_check // Include signature path
            ];

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $generate_kta_url);
            curl_setopt($ch, CURLOPT_POST, 1);
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($post_data));
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 120);
            curl_setopt($ch, CURLOPT_FAILONERROR, true);

            $curl_response = curl_exec($ch);
            $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curl_error = curl_error($ch);
            curl_close($ch);

            if ($curl_response === false) {
                $response['message'] = "Error calling generate_kta_pdf.php: " . $curl_error . " (HTTP Code: " . $http_code . ")";
                error_log("cURL error for generate_kta_pdf.php (PB): " . $curl_error . " HTTP Code: " . $http_code);
            } else {
                $generate_response_data = json_decode($curl_response, true);

                if (json_last_error() !== JSON_ERROR_NONE) {
                    $response['message'] = "Failed to process response from PDF server: " . json_last_error_msg() . ". Raw response: " . $curl_response;
                    error_log("JSON Decode error from generate_kta_pdf.php (PB): " . json_last_error_msg() . ". Raw response: " . $curl_response);
                } elseif (isset($generate_response_data['success']) && $generate_response_data['success']) {
                    $update_status_query = "UPDATE kta_applications SET status = 'kta_issued', generated_kta_file_path_pb = ?, kta_issued_at = NOW(), kta_barcode_unique_id = ? WHERE id = ?";
                    $stmt_update_status = $conn->prepare($update_status_query);
                    if ($stmt_update_status) {
                        // Ensure path stored in DB is relative to BASE_URL/uploads
                        $path_for_db = str_replace(BASE_URL, '', $generate_response_data['kta_url']);

                        $stmt_update_status->bind_param("ssi", $path_for_db, $barcode_to_use, $application_id);
                        if (!$stmt_update_status->execute()) {
                            error_log("Failed to update status to 'kta_issued' after PB KTA generation: " . $stmt_update_status->error);
                            $response['message'] = "Failed to update status to 'kta_issued' after PB KTA generation: " . $stmt_update_status->error;
                            // Attempt to delete the generated PDF if DB update fails
                            $generated_physical_path = $uploadBaseDirPhysical . $path_for_db;
                            if (file_exists($generated_physical_path)) {
                                @unlink($generated_physical_path);
                            }
                        } else {
                            logActivity($conn, $admin_id, 'Pengurus Besar', 'Generate PB KTA & Issue',
                                "PB KTA successfully generated and issued for application ID {$application_id}. Path: " . $path_for_db . ". Barcode: " . $barcode_to_use,
                                $application_id, $app_status, 'kta_issued');

                            $response['success'] = true;
                            $response['message'] = "PB KTA successfully generated and **issued**.";
                            $response['kta_url'] = $generate_response_data['kta_url'];
                            $response['redirect_user_with_kta_issued'] = true;
                        }
                        $stmt_update_status->close();
                    } else {
                        $response['message'] = "Error preparing status update statement for PB KTA (to issued): " . $conn->error;
                        error_log("Error preparing status update statement for PB KTA (to issued): " . $conn->error);
                    }
                } else {
                    $response['message'] = "Failed to generate PB KTA: " . ($generate_response_data['message'] ?? 'Unclear response from PDF server.');
                    error_log("Failed to generate PB KTA. Message from generate_kta_pdf.php: " . ($generate_response_data['message'] ?? 'No message'));
                }
            }
        } else if ($app_status != 'approved_pb') {
            $response['message'] = "PB KTA can only be generated for applications that have been approved by the Grand Board. Current status: " . ucfirst(str_replace('_', ' ', $app_status));
        } else if (!empty($existing_generated_kta_pb_path)) {
            $response['message'] = "PB KTA has already been generated for this application.";
        } else {
            $response['message'] = "Application status does not qualify for PB KTA generation.";
        }
        echo json_encode($response);
        exit();
    }
}

// NEW AJAX Handler: Get KTA Status Counts
if (isset($_GET['get_kta_status_counts']) && $_GET['get_kta_status_counts'] == 'true') {
    ob_clean();
    header('Content-Type: application/json');
    $response = [
        'success' => true,
        'approved_pengda' => 0,
        'approved_pb' => 0,
        'rejected_pb' => 0,
        'kta_issued' => 0,
        'pending_pengda_resubmit' => 0,
        'total_applications' => 0
    ];

    $response['approved_pengda'] = countKTAApplicationsByStatus($conn, 'approved_pengda');
    $response['approved_pb'] = countKTAApplicationsByStatus($conn, 'approved_pb');
    $response['rejected_pb'] = countKTAApplicationsByStatus($conn, 'rejected_pb');
    $response['kta_issued'] = countKTAApplicationsByStatus($conn, 'kta_issued');
    $response['pending_pengda_resubmit'] = countKTAApplicationsByStatus($conn, 'pending_pengda_resubmit');
    $response['total_applications'] = countKTAApplicationsByStatus($conn, ['approved_pengda', 'approved_pb', 'rejected_pb', 'kta_issued', 'pending_pengda_resubmit']);

    echo json_encode($response);
    exit();
}

// NEW AJAX Handler: Fetch KTA Applications with filters and pagination for main table
if (isset($_GET['fetch_kta_table_only']) && $_GET['fetch_kta_table_only'] == 'true') {
    ob_clean();
    header('Content-Type: application/json');

    $status_filter = $_GET['status_filter'] ?? null;
    $province_id_filter = filter_var($_GET['province_id_filter'] ?? null, FILTER_VALIDATE_INT);
    $city_id_filter = filter_var($_GET['city_id_filter'] ?? null, FILTER_VALIDATE_INT);
    $search_query = $_GET['search_query'] ?? '';

    $page = filter_var($_GET['page'] ?? 1, FILTER_VALIDATE_INT);
    $limit = filter_var($_GET['limit'] ?? 10, FILTER_VALIDATE_INT);

    if ($page === false || $page < 1) {
        $page = 1;
    }
    if ($limit === false || $limit < 1) {
        $limit = 10;
    }

    $offset = ($page - 1) * $limit;

    $total_applications = countKTAApplicationsByStatus($conn, $status_filter, $province_id_filter, $city_id_filter, $search_query);
    $total_pages = ceil($total_applications / $limit);

    $kta_applications_data = fetchKTAApplications($conn, $uploadBaseDirPhysical, $pengcab_payment_proofs_subfolder, $pengda_payment_proofs_subfolder, $generated_kta_pb_subfolder, $generated_kta_pengda_subfolder, $generated_kta_pengcab_subfolder, BASE_URL, $status_filter, $province_id_filter, $city_id_filter, $search_query, $limit, $offset);

    $response = [
        'success' => true,
        'data' => $kta_applications_data,
        'current_page' => $page,
        'total_pages' => $total_pages,
        'total_items' => $total_applications,
        'message' => 'KTA data loaded successfully.'
    ];

    if (isset($kta_applications_data['error'])) {
        $response['success'] = false;
        $response['message'] = $kta_applications_data['error'];
        $response['data'] = [];
    }

    echo json_encode($response);
    exit();
}


// NEW AJAX Handler: Fetch single KTA application details
if (isset($_GET['fetch_single_kta_application']) && $_GET['fetch_single_kta_application'] == 'true') {
    ob_clean();
    header('Content-Type: application/json');
    $response = ['success' => false, 'message' => '', 'data' => null];

    $application_id = filter_var($_GET['application_id'] ?? '', FILTER_VALIDATE_INT);

    if ($application_id === false || $application_id <= 0) {
        $response['message'] = "Invalid application ID.";
        echo json_encode($response);
        exit();
    }

    $kta_data = fetchSingleKTAApplicationById($conn, $application_id, $uploadBaseDirPhysical, $pengcab_payment_proofs_subfolder, $pengda_payment_proofs_subfolder, $generated_kta_pb_subfolder, $generated_kta_pengda_subfolder, $generated_kta_pengcab_subfolder, BASE_URL);

    if (isset($kta_data['error'])) {
        $response['message'] = $kta_data['error'];
    } elseif ($kta_data) {
        $response['success'] = true;
        $response['data'] = $kta_data;
    } else {
        $response['message'] = "KTA application data not found.";
    }
    echo json_encode($response);
    exit();
}


// Handle AJAX request to load Users table (for View Members section)
if (isset($_GET['fetch_users_table_only']) && $_GET['fetch_users_table_only'] == 'true') {
    ob_clean();
    header('Content-Type: application/json');

    $role_filter = $_GET['role_filter'] ?? '';
    $search_query = $_GET['search_query'] ?? '';

    $page = filter_var($_GET['page'] ?? 1, FILTER_VALIDATE_INT);
    $limit = filter_var($_GET['limit'] ?? 10, FILTER_VALIDATE_INT);

    if ($page === false || $page < 1) {
        $page = 1;
    }
    if ($limit === false || $limit < 1) {
        $limit = 10;
    }

    $offset = ($page - 1) * $limit;

    $total_users = countAllUsers($conn, $role_filter, $search_query);
    $total_pages = ceil($total_users / $limit);

    $all_users = fetchAllUsers($conn, $role_filter, $search_query, $limit, $offset);

    echo json_encode(['success' => true, 'data' => $all_users, 'current_page' => $page, 'total_pages' => $total_pages, 'total_items' => $total_users]);
    exit();
}


// Handle AJAX request to load Activity Log
if (isset($_GET['fetch_activity_log_only']) && $_GET['fetch_activity_log_only'] == 'true') {
    ob_clean();    
    header('Content-Type: application/json');

    $activity_log_data_for_ajax = [];
    $query_log_ajax = "SELECT al.*, ka.club_name AS application_club_name
                         FROM activity_logs al
                         LEFT JOIN kta_applications ka ON al.application_id = ka.id
                         WHERE al.role_name = 'Pengurus Besar'
                         ORDER BY al.created_at DESC LIMIT 50";
    $result_log_ajax = $conn->query($query_log_ajax);

    if ($result_log_ajax) {
        while ($row_ajax = $result_log_ajax->fetch_assoc()) {
            $activity_log_data_for_ajax[] = $row_ajax;
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to load activity log: ' . $conn->error]);
        exit();
    }

    echo json_encode(['success' => true, 'data' => $activity_log_data_for_ajax]);
    exit();
}

// Handle AJAX request to load Issued KTA cards
if (isset($_GET['fetch_issued_kta_cards_only']) && $_GET['fetch_issued_kta_cards_only'] == 'true') {
    ob_clean();
    header('Content-Type: application/json');

    $page = filter_var($_GET['page'] ?? 1, FILTER_VALIDATE_INT);
    $limit = filter_var($_GET['limit'] ?? 12, FILTER_VALIDATE_INT);
    $province_filter = $_GET['province_filter'] ?? '';
    $city_filter = $_GET['city_filter'] ?? '';
    $search_query = $_GET['search_query'] ?? '';

    if ($page === false || $page < 1) $page = 1;
    if ($limit === false || $limit < 1) $limit = 12;

    $offset = ($page - 1) * $limit;

    $total_ktas = countIssuedKTAApplications($conn, $province_filter, $city_filter, $search_query);
    $total_pages = ceil($total_ktas / $limit);

    $issued_ktas_for_ajax = fetchIssuedKTAApplications($conn, $generated_kta_pb_subfolder, BASE_URL, $limit, $offset, $province_filter, $city_filter, $search_query);

    $response = [
        'success' => true,
        'data' => $issued_ktas_for_ajax,
        'current_page' => $page,
        'total_pages' => $total_pages,
        'total_items' => $total_ktas,
        'message' => 'Issued KTA data loaded successfully.'
    ];

    if (isset($issued_ktas_for_ajax['error'])) {
        $response['success'] = false;
        $response['message'] = $issued_ktas_for_ajax['error'];
        $response['data'] = [];
    }

    echo json_encode($response);
    exit();
}

// Handle AJAX request to get saldo summary (counts for cards)
if ($_SERVER['REQUEST_METHOD'] == 'GET' && isset($_GET['get_saldo_summary'])) {
    ob_clean();
    header('Content-Type: application/json');
    $response = ['success' => false, 'message' => '', 'saldo_masuk' => 0, 'saldo_keluar' => 0, 'total_saldo' => 0, 'saldo_masuk_display' => '', 'saldo_keluar_display' => '', 'total_saldo_display' => '', 'to_pay_pengda' => 0, 'to_pay_pengcab' => 0, 'to_pay_developer' => 0];

    $province_id_filter = filter_var($_GET['province_filter_id'] ?? null, FILTER_VALIDATE_INT);
    $city_id_filter = filter_var($_GET['city_filter_id'] ?? null, FILTER_VALIDATE_INT);
    $month_filter = filter_var($_GET['month_filter'] ?? null, FILTER_VALIDATE_INT);
    $year_filter = filter_var($_GET['year_filter'] ?? null, FILTER_VALIDATE_INT);
    $kta_status_filter = $_GET['kta_status_filter'] ?? null;

    $filtered_saldo_masuk = getSaldoMasuk($conn, $province_id_filter, $city_id_filter, $month_filter, $year_filter, $kta_status_filter);
    $filtered_saldo_keluar = getSaldoKeluar($conn, $province_id_filter, $city_id_filter, $month_filter, $year_filter, $kta_status_filter);
    $filtered_total_saldo = $filtered_saldo_masuk - $filtered_saldo_keluar;

    $to_pay_pengda = getAmountToPay($conn, 'pengda', $province_id_filter, $city_id_filter, $month_filter, $year_filter, 'kta_issued');
    $to_pay_pengcab = getAmountToPay($conn, 'pengcab', $province_id_filter, $city_id_filter, $month_filter, $year_filter, 'kta_issued');
    $to_pay_developer = getAmountToPay($conn, 'developer', null, null, null, null, 'kta_issued');    

    $response['success'] = true;
    $response['saldo_masuk'] = $filtered_saldo_masuk;
    $response['saldo_keluar'] = $filtered_saldo_keluar;
    $response['total_saldo'] = $filtered_total_saldo;
    $response['saldo_masuk_display'] = 'Rp ' . number_format($filtered_saldo_masuk, 0, ',', '.');
    $response['saldo_keluar_display'] = 'Rp ' . number_format($filtered_saldo_keluar, 0, ',', '.');
    $response['total_saldo_display'] = 'Rp ' . number_format($filtered_total_saldo, 0, ',', '.');
    $response['to_pay_pengda'] = $to_pay_pengda;
    $response['to_pay_pengcab'] = $to_pay_pengcab;
    $response['to_pay_developer'] = $to_pay_developer;

    echo json_encode($response);
    exit();
}

// Handle AJAX request to fetch transaction history table
if (isset($_GET['fetch_transaction_history_only']) && $_GET['fetch_transaction_history_only'] == 'true') {
    ob_clean();
    header('Content-Type: application/json');

    $page = filter_var($_GET['page'] ?? 1, FILTER_VALIDATE_INT);
    $limit = filter_var($_GET['limit'] ?? 10, FILTER_VALIDATE_INT);

    $province_id_filter = filter_var($_GET['province_filter_id'] ?? null, FILTER_VALIDATE_INT);
    $city_id_filter = filter_var($_GET['city_filter_id'] ?? null, FILTER_VALIDATE_INT);
    $month_filter = filter_var($_GET['month_filter'] ?? null, FILTER_VALIDATE_INT);
    $year_filter = filter_var($_GET['year_filter'] ?? null, FILTER_VALIDATE_INT);
    $kta_status_filter = $_GET['kta_status_filter'] ?? null;

    if ($page === false || $page < 1) {
        $page = 1;
    }
    if ($limit === false || $limit < 1) {
        $limit = 10;
    }

    $offset = ($page - 1) * $limit;

    $total_transactions = countTransactionHistory($conn, $province_id_filter, $city_id_filter, $month_filter, $year_filter, $kta_status_filter);
    $total_pages_transactions = ceil($total_transactions / $limit);

    $transaction_history = fetchTransactionHistory($conn, $limit, $offset, $province_id_filter, $city_id_filter, $month_filter, $year_filter, $kta_status_filter);

    echo json_encode(['success' => true, 'data' => $transaction_history, 'current_page' => $page, 'total_pages' => $total_pages_transactions, 'total_items' => $total_transactions]);
    exit();
}

// NEW: Handle Excel Export Request
if (isset($_GET['export_saldo_to_excel']) && $_GET['export_saldo_to_excel'] == 'true') {
    ob_end_clean(); // Penting: Hapus semua buffer output sebelum mengirim header file

    // Periksa jika pustaka PhpSpreadsheet tersedia
    if (!class_exists('PhpOffice\PhpSpreadsheet\Spreadsheet')) {
        echo "Error: PhpSpreadsheet library not found. Ensure Composer dependencies are installed.";
        error_log("Attempted Excel export but PhpSpreadsheet class not found.");
        exit();
    }
    if (!class_exists('PhpOffice\PhpSpreadsheet\Cell\DataType')) {
        echo "Error: PhpSpreadsheet DataType class not found. This indicates a library issue.";
        error_log("PhpSpreadsheet DataType class not found during Excel export.");
        exit();
    }

    $province_id_filter = filter_var($_GET['province_filter_id'] ?? null, FILTER_VALIDATE_INT);
    $city_id_filter = filter_var($_GET['city_filter_id'] ?? null, FILTER_VALIDATE_INT);
    $month_filter = filter_var($_GET['month_filter'] ?? null, FILTER_VALIDATE_INT);
    $year_filter = filter_var($_GET['year_filter'] ?? null, FILTER_VALIDATE_INT);
    $kta_status_filter = $_GET['kta_status_filter'] ?? null;

    if ($year_filter && $year_filter < 2025) {
        echo "Error: Export is only available for the year 2025 and onwards.";
        exit();
    }

    $transactions = fetchTransactionsForExcel($conn, $province_id_filter, $city_id_filter, $month_filter, $year_filter, $kta_status_filter);

    $spreadsheet = new Spreadsheet();
    $sheet = $spreadsheet->getActiveSheet();
    $sheet->setTitle('Laporan Keuangan PB');

    $headerStyle = [
        'font' => [
            'bold' => true,
            'color' => ['argb' => 'FFFFFFFF'],
        ],
        'fill' => [
            'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
            'startColor' => ['argb' => 'FF4CAF50'],
        ],
        'borders' => [
            'allBorders' => [
                'borderStyle' => Border::BORDER_THIN,
                'color' => ['argb' => 'FF000000'],
            ],
        ],
        'alignment' => [
            'horizontal' => Alignment::HORIZONTAL_CENTER,
            'vertical' => Alignment::VERTICAL_CENTER,
        ],
    ];

    $dataStyle = [
        'borders' => [
            'allBorders' => [
                'borderStyle' => Border::BORDER_THIN,
                'color' => ['argb' => 'FF000000'],
            ],
        ],
        'alignment' => [
            'horizontal' => Alignment::HORIZONTAL_LEFT,
        ],
    ];

    $rupiahFormatCode = '_("Rp"* #,##0_);_("Rp"* (#,##0);_("Rp"* "-"??_);_(@_)';

    $amountStyle = [
        'alignment' => [
            'horizontal' => Alignment::HORIZONTAL_RIGHT,
        ],
        'numberFormat' => [
            'formatCode' => $rupiahFormatCode,
        ],
    ];
    
    $summaryLabelStyle = [
        'font' => [
            'bold' => true,
        ],
        'alignment' => [
            'horizontal' => Alignment::HORIZONTAL_RIGHT,
        ],
    ];

    $summaryAmountStyle = [
        'font' => [
            'bold' => true,
        ],
        'numberFormat' => [
            'formatCode' => $rupiahFormatCode,
        ],
        'borders' => [
            'top' => ['borderStyle' => Border::BORDER_DOUBLE],
            'bottom' => ['borderStyle' => Border::BORDER_THIN],
        ],
    ];

    $headers = [
        'ID Transaksi',
        'Tanggal Transaksi',
        'Tipe Transaksi',
        'Pihak Terkait (Klub/Pengcab/Pengda)',
        'Provinsi',
        'Kota/Kabupaten',
        'Nominal (Rp)',
        'Deskripsi',
        'Status KTA',
        'No. Rekening Pihak Terkait'
    ];
    $sheet->fromArray($headers, NULL, 'A1');
    $sheet->getStyle('A1:J1')->applyFromArray($headerStyle);

    $row_num = 2;
    $total_incoming = 0;
    $total_outgoing = 0;
    
    foreach ($transactions as $row) {
        $amount = (float) $row['amount'];
        
        $bank_account_number_for_excel = '';

        // Tentukan role_id dari pihak terkait
        $related_party_role_id = $row['related_party_role_id'] ?? null;

        if ($row['transaction_type'] == 'Masuk') {
            $total_incoming += $amount;
            // Hanya ambil no rekening jika role_id adalah Pengda (3) atau Pengcab (4)
            if ($related_party_role_id == 3 || $related_party_role_id == 4) {
                $bank_account_number_raw = $row['user_bank_account_number'] ?? 'N/A';
                $bank_account_number_for_excel = preg_replace('/[^0-9]/', '', $bank_account_number_raw);
            }
        } else {
            $total_outgoing += $amount;
            // Hanya ambil no rekening jika role_id adalah Pengda (3) atau Pengcab (4)
            if ($related_party_role_id == 3 || $related_party_role_id == 4) {
                $bank_account_number_raw = $row['recipient_bank_account_number'] ?? 'N/A';
                $bank_account_number_for_excel = preg_replace('/[^0-9]/', '', $bank_account_number_raw);
            }
        }

        $sheet->setCellValue('A' . $row_num, $row['id']);
        $sheet->setCellValue('B' . $row_num, $row['transaction_date']);
        $sheet->setCellValue('C' . $row_num, $row['transaction_type']);
        $sheet->setCellValue('D' . $row_num, $row['related_party_name']);
        $sheet->setCellValue('E' . $row_num, $row['province_name'] ?? 'N/A');
        $sheet->setCellValue('F' . $row_num, $row['city_name'] ?? 'N/A');
        $sheet->setCellValue('G' . $row_num, $amount);
        $sheet->setCellValue('H' . $row_num, $row['description']);
        $sheet->setCellValue('I' . $row_num, ucfirst(str_replace('_', ' ', $row['kta_status'] ?? 'N/A')));
        
        // Memastikan nomor rekening disimpan sebagai teks
        $sheet->setCellValueExplicit('J' . $row_num, $bank_account_number_for_excel, \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_STRING);

        $sheet->getStyle('A' . $row_num . ':J' . $row_num)->applyFromArray($dataStyle);
        $sheet->getStyle('G' . $row_num)->applyFromArray($amountStyle);
        $row_num++;
    }

    $row_num++;
    $sheet->setCellValue('F' . $row_num, 'Total Saldo Masuk');
    $sheet->setCellValue('G' . $row_num, $total_incoming);
    $sheet->getStyle('F' . $row_num)->applyFromArray($summaryLabelStyle);
    $sheet->getStyle('G' . $row_num)->applyFromArray($summaryAmountStyle);
    $row_num++;
    $sheet->setCellValue('F' . $row_num, 'Total Saldo Keluar');
    $sheet->setCellValue('G' . $row_num, $total_outgoing);
    $sheet->getStyle('F' . $row_num)->applyFromArray($summaryLabelStyle);
    $sheet->getStyle('G' . $row_num)->applyFromArray($summaryAmountStyle);
    $row_num++;
    $sheet->setCellValue('F' . $row_num, 'Saldo Akhir');
    $sheet->setCellValue('G' . $row_num, ($total_incoming - $total_outgoing));
    $sheet->getStyle('F' . $row_num)->applyFromArray($summaryLabelStyle);
    $sheet->getStyle('G' . $row_num)->applyFromArray($summaryAmountStyle);
    $row_num++;
    $row_num++;
    $sheet->setCellValue('F' . $row_num, 'Laporan Keuangan Mulai Tahun');
    $sheet->setCellValue('G' . $row_num, '2025');
    $sheet->getStyle('F' . $row_num)->applyFromArray($summaryLabelStyle);
    $sheet->getStyle('G' . $row_num)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);


    foreach (range('A', 'J') as $columnID) {
        $sheet->getColumnDimension($columnID)->setAutoSize(true);
    }

    $filename = "Laporan_Keuangan_PB";
    if ($year_filter) {
        $filename .= "_Tahun_" . $year_filter;
    }
    if ($month_filter) {
        $months = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
        ];
        $month_name = $months[$month_filter] ?? '';
        if ($month_name) {
            $filename .= "_Bulan_" . $month_name;
        }
    }
    if ($province_id_filter) {
        $stmt_prov = $conn->prepare("SELECT name FROM provinces WHERE id = ?");
        $prov_name = '';
        if($stmt_prov){
            $stmt_prov->bind_param("i", $province_id_filter);
            $stmt_prov->execute();
            $result_prov = $stmt_prov->get_result();
            if($row_prov = $result_prov->fetch_assoc()) {
                $prov_name = $row_prov['name'];
            }
            $stmt_prov->close();
        }
        if ($prov_name) {
            $filename .= "_Provinsi_" . str_replace(' ', '_', $prov_name);
        }
    }
    if ($city_id_filter) {
        $stmt_city = $conn->prepare("SELECT name FROM cities WHERE id = ?");
        $city_name = '';
        if($stmt_city){
            $stmt_city->bind_param("i", $city_id_filter);
            $stmt_city->execute();
            $result_city = $stmt_city->get_result();
            if($row_city = $result_city->fetch_assoc()) {
                $city_name = $row_city['name'];
            }
            $stmt_city->close();
        }
        if ($city_name) {
            $filename .= "_Kota_" . str_replace(' ', '_', $city_name);
        }
    }
    if ($kta_status_filter) {
        $filename .= "_Status_" . str_replace(' ', '_', $kta_status_filter);
    }
    $filename .= "_" . date('Ymd_His') . ".xlsx";

    header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Cache-Control: max-age=0');
    header('Cache-Control: max-age=1');
    header('Expires: Mon, 26 Jul 1997 05:00:00 GMT'); // Date in the past
    header('Last-Modified: ' . gmdate('D, d M Y H:i:s') . ' GMT'); // always modified
    header('Pragma: public'); // HTTP/1.0
    // header('Content-Length: ' . filesize($filePath)); // Only if file already exists

    $writer = new Xlsx($spreadsheet);
    $writer->save('php://output');
    exit();
}

/**
 * Fetches user data for Pengda/Pengcab roles specifically for Excel export.
 * @param mysqli $conn Database connection object.
 * @return array Array of user data.
 */
function fetchUsersForExcel($conn) {
    $users = [];
    $query = "SELECT u.username, u.email, u.phone, r.role_name, p.name AS province_name, c.name AS city_name, u.bank_account_number
              FROM users u
              JOIN roles r ON u.role_id = r.id
              LEFT JOIN provinces p ON u.province_id = p.id
              LEFT JOIN cities c ON u.city_id = c.id
              WHERE r.role_name IN ('Pengurus Cabang', 'Pengurus Daerah')
              ORDER BY r.role_name, p.name, c.name";

    $result = $conn->query($query);
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $users[] = $row;
        }
    } else {
        error_log("Error fetching users for Excel export: " . $conn->error);
    }
    return $users;
}

// NEW: Handle Excel Export for User Bank Accounts
if (isset($_GET['export_rekening_to_excel']) && $_GET['export_rekening_to_excel'] == 'true') {
    ob_end_clean(); // Clean all output buffers

    // Check if PhpSpreadsheet library is available
    if (!class_exists('PhpOffice\PhpSpreadsheet\Spreadsheet')) {
        echo "Error: PhpSpreadsheet library not found. Please ensure Composer dependencies are installed.";
        error_log("Attempted Excel export but PhpSpreadsheet class not found.");
        exit();
    }

    $users_data = fetchUsersForExcel($conn);

    $spreadsheet = new Spreadsheet();
    $sheet = $spreadsheet->getActiveSheet();
    $sheet->setTitle('Data Rekening Pengurus');

    $headerStyle = [
        'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
        'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF4CAF50']],
        'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
        'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
    ];
    $dataStyle = [
        'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
    ];

    $headers = ['Nama Pengurus', 'Role', 'Email', 'No. Telepon', 'Provinsi', 'Kota/Kabupaten', 'Nomor Rekening'];
    $sheet->fromArray($headers, NULL, 'A1');
    $sheet->getStyle('A1:G1')->applyFromArray($headerStyle);

    $row_num = 2;
    foreach ($users_data as $user) {
        $sheet->setCellValue('A' . $row_num, $user['username']);
        $sheet->setCellValue('B' . $row_num, $user['role_name']);
        $sheet->setCellValue('C' . $row_num, $user['email']);
        $sheet->setCellValueExplicit('D' . $row_num, $user['phone'], DataType::TYPE_STRING); // Treat phone as text
        $sheet->setCellValue('E' . $row_num, $user['province_name']);
        $sheet->setCellValue('F' . $row_num, $user['city_name']);
        $sheet->setCellValueExplicit('G' . $row_num, $user['bank_account_number'], DataType::TYPE_STRING); // Treat account number as text

        $sheet->getStyle('A' . $row_num . ':G' . $row_num)->applyFromArray($dataStyle);
        $row_num++;
    }

    foreach (range('A', 'G') as $columnID) {
        $sheet->getColumnDimension($columnID)->setAutoSize(true);
    }

    $filename = "Data_Rekening_Pengurus_" . date('Ymd_His') . ".xlsx";
    header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Cache-Control: max-age=0');

    $writer = new Xlsx($spreadsheet);
    $writer->save('php://output');
    exit();
}

// Handle download all competition re-registrations with logos
if (isset($_GET['download_all_reregistrations']) && $_GET['download_all_reregistrations'] == '1') {
    // Clean output buffer to prevent corruption
    if (ob_get_length()) {
        ob_clean();
    }
    
    try {
        // Query all reregistration data with logo_path from kta_applications
        $query = "SELECT cr.id, cr.user_id, cr.kejurnas_registration_id, cr.status, 
                         cr.school_name, cr.total_cost, cr.submitted_at,
                         jr.club_name, jr.level,
                         kc.category_name,
                         u.username, u.province_id, u.city_id,
                         ka.logo_path,
                         prov.name as province_name,
                         reg.name as city_name
                  FROM competition_reregistrations cr
                  INNER JOIN kejurnas_registrations jr ON cr.kejurnas_registration_id = jr.id
                  LEFT JOIN kejurnas_categories kc ON jr.category_id = kc.id
                  INNER JOIN users u ON cr.user_id = u.id
                  LEFT JOIN kta_applications ka ON u.id = ka.user_id
                  LEFT JOIN provinces prov ON u.province_id = prov.id
                  LEFT JOIN regencies reg ON u.city_id = reg.id
                  ORDER BY cr.submitted_at DESC";
        
        $result = $conn->query($query);
        
        if (!$result) {
            throw new Exception("Database query failed: " . $conn->error);
        }
        
        // Create temporary directory for export
        $temp_dir = sys_get_temp_dir() . '/reregistration_export_' . time();
        if (!mkdir($temp_dir, 0755, true)) {
            throw new Exception("Failed to create temporary directory");
        }
        
        $logo_dir = $temp_dir . '/logos';
        if (!mkdir($logo_dir, 0755, true)) {
            throw new Exception("Failed to create logo directory");
        }
        
        // Create CSV file
        $csv_file = $temp_dir . '/data_peserta_daftar_ulang.csv';
        $csv_handle = fopen($csv_file, 'w');
        
        // Add BOM for Excel UTF-8 support
        fprintf($csv_handle, chr(0xEF).chr(0xBB).chr(0xBF));
        
        // CSV Headers
        fputcsv($csv_handle, [
            'No',
            'Nama Club',
            'Nama Sekolah',
            'Kategori',
            'Level',
            'Status',
            'Pengda (Provinsi)',
            'Kota/Kabupaten',
            'Username',
            'Biaya Total',
            'Tanggal Submit',
            'Logo File'
        ]);
        
        $row_num = 1;
        $logo_count = 0;
        $missing_logos = [];
        
        while ($row = $result->fetch_assoc()) {
            // Determine status text
            $status_text = '';
            switch($row['status']) {
                case 'submitted':
                    $status_text = 'Menunggu Review';
                    break;
                case 'approved':
                    $status_text = 'Disetujui';
                    break;
                case 'rejected':
                    $status_text = 'Ditolak';
                    break;
                case 'incomplete':
                    $status_text = 'Tidak Lengkap';
                    break;
                default:
                    $status_text = $row['status'];
            }
            
            $logo_filename = '';
            
            // Copy logo file if exists
            if (!empty($row['logo_path'])) {
                $source_logo = __DIR__ . '/uploads/' . basename($row['logo_path']);
                
                if (file_exists($source_logo)) {
                    $logo_extension = pathinfo($source_logo, PATHINFO_EXTENSION);
                    $safe_club_name = preg_replace('/[^a-zA-Z0-9_-]/', '_', $row['club_name']);
                    $logo_filename = $safe_club_name . '_' . $row['id'] . '.' . $logo_extension;
                    $dest_logo = $logo_dir . '/' . $logo_filename;
                    
                    if (copy($source_logo, $dest_logo)) {
                        $logo_count++;
                    } else {
                        $logo_filename = 'ERROR_COPY_FAILED';
                        $missing_logos[] = $row['club_name'] . " (ID: " . $row['id'] . ") - Copy failed";
                    }
                } else {
                    $logo_filename = 'NOT_FOUND';
                    $missing_logos[] = $row['club_name'] . " (ID: " . $row['id'] . ") - File not found: " . basename($row['logo_path']);
                }
            } else {
                $logo_filename = 'NO_LOGO';
                $missing_logos[] = $row['club_name'] . " (ID: " . $row['id'] . ") - No logo uploaded";
            }
            
            // Write to CSV
            fputcsv($csv_handle, [
                $row_num,
                $row['club_name'] ?? '-',
                $row['school_name'] ?? '-',
                $row['category_name'] ?? '-',
                $row['level'] ?? '-',
                $status_text,
                $row['province_name'] ?? '-',
                $row['city_name'] ?? '-',
                $row['username'] ?? '-',
                $row['total_cost'] ? 'Rp ' . number_format($row['total_cost'], 0, ',', '.') : '-',
                $row['submitted_at'] ? date('d-m-Y H:i', strtotime($row['submitted_at'])) : '-',
                $logo_filename
            ]);
            
            $row_num++;
        }
        
        fclose($csv_handle);
        
        // Create report file for missing logos
        if (!empty($missing_logos)) {
            $report_file = $temp_dir . '/MISSING_LOGOS_REPORT.txt';
            file_put_contents($report_file, "LAPORAN LOGO YANG TIDAK DITEMUKAN\n");
            file_put_contents($report_file, "================================\n\n", FILE_APPEND);
            file_put_contents($report_file, "Total Logo Ditemukan: $logo_count\n", FILE_APPEND);
            file_put_contents($report_file, "Total Logo Hilang: " . count($missing_logos) . "\n\n", FILE_APPEND);
            file_put_contents($report_file, "Detail:\n", FILE_APPEND);
            foreach ($missing_logos as $missing) {
                file_put_contents($report_file, "- $missing\n", FILE_APPEND);
            }
        }
        
        // Create ZIP file
        $zip_filename = 'Data_Peserta_Daftar_Ulang_' . date('Ymd_His') . '.zip';
        $zip_path = $temp_dir . '/' . $zip_filename;
        
        $zip = new ZipArchive();
        if ($zip->open($zip_path, ZipArchive::CREATE) !== TRUE) {
            throw new Exception("Cannot create ZIP file");
        }
        
        // Add CSV to zip
        $zip->addFile($csv_file, 'data_peserta_daftar_ulang.csv');
        
        // Add all logo files
        $logo_files = glob($logo_dir . '/*');
        foreach ($logo_files as $logo_file) {
            $zip->addFile($logo_file, 'logos/' . basename($logo_file));
        }
        
        // Add report if exists
        if (!empty($missing_logos)) {
            $zip->addFile($temp_dir . '/MISSING_LOGOS_REPORT.txt', 'MISSING_LOGOS_REPORT.txt');
        }
        
        $zip->close();
        
        // Verify ZIP file was created successfully
        if (!file_exists($zip_path) || filesize($zip_path) == 0) {
            throw new Exception("Failed to create ZIP file or file is empty");
        }
        
        // Clear any output buffers
        while (ob_get_level()) {
            ob_end_clean();
        }
        
        // Send ZIP file to browser with proper headers
        header('Content-Type: application/zip');
        header('Content-Disposition: attachment; filename="' . $zip_filename . '"');
        header('Content-Length: ' . filesize($zip_path));
        header('Cache-Control: no-cache, no-store, must-revalidate');
        header('Pragma: no-cache');
        header('Expires: 0');
        
        // Flush system output buffer
        flush();
        
        // Read and output file in chunks to handle large files
        $file_handle = fopen($zip_path, 'rb');
        while (!feof($file_handle)) {
            echo fread($file_handle, 8192);
            flush();
        }
        fclose($file_handle);
        
        // Cleanup temporary files
        array_map('unlink', glob($logo_dir . '/*'));
        rmdir($logo_dir);
        unlink($csv_file);
        if (file_exists($temp_dir . '/MISSING_LOGOS_REPORT.txt')) {
            unlink($temp_dir . '/MISSING_LOGOS_REPORT.txt');
        }
        unlink($zip_path);
        rmdir($temp_dir);
        
        exit();
        
    } catch (Exception $e) {
        error_log("Error in download_all_reregistrations: " . $e->getMessage());
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'message' => 'Error: ' . $e->getMessage()
        ]);
        exit();
    }
}

// Handle get competition re-registrations request
if (isset($_GET['get_competition_reregistrations']) && $_GET['get_competition_reregistrations'] == '1') {
    header('Content-Type: application/json');
    
    try {
        // Get filter parameters
        $status_filter = isset($_GET['status']) ? $conn->real_escape_string($_GET['status']) : '';
        $category_filter = isset($_GET['category']) ? $conn->real_escape_string($_GET['category']) : '';
        $level_filter = isset($_GET['level']) ? $conn->real_escape_string($_GET['level']) : '';
        $search_query = isset($_GET['search']) ? $conn->real_escape_string($_GET['search']) : '';
        $items_per_page = isset($_GET['items_per_page']) ? (int)$_GET['items_per_page'] : 10;
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $offset = ($page - 1) * $items_per_page;
        
        // Build WHERE clause
        $where_conditions = [];
        if (!empty($status_filter)) {
            $where_conditions[] = "cr.status = '$status_filter'";
        }
        if (!empty($category_filter)) {
            $where_conditions[] = "kc.category_name = '$category_filter'";
        }
        if (!empty($level_filter)) {
            $where_conditions[] = "jr.level = '$level_filter'";
        }
        if (!empty($search_query)) {
            $where_conditions[] = "jr.club_name LIKE '%$search_query%'";
        }
        
        $where_clause = !empty($where_conditions) ? 'WHERE ' . implode(' AND ', $where_conditions) : '';
        
        // Get total count
        $count_query = "SELECT COUNT(*) as total FROM competition_reregistrations cr
                        INNER JOIN kejurnas_registrations jr ON cr.kejurnas_registration_id = jr.id
                        LEFT JOIN kejurnas_categories kc ON jr.category_id = kc.id
                        INNER JOIN users u ON cr.user_id = u.id
                        $where_clause";
        
        $count_result = $conn->query($count_query);
        $count_row = $count_result->fetch_assoc();
        $total_records = $count_row['total'];
        $total_pages = ceil($total_records / $items_per_page);
        
        // Get paginated data
        $query = "SELECT cr.id, cr.user_id, cr.kejurnas_registration_id, cr.status, 
                         cr.school_permission_letter, cr.parent_permission_letter, cr.team_photo,
                         cr.payment_proof, cr.total_cost, cr.school_name,
                         cr.submitted_at, cr.reviewed_at, cr.admin_notes,
                         jr.club_name, jr.level,
                         kc.category_name,
                         u.username
                  FROM competition_reregistrations cr
                  INNER JOIN kejurnas_registrations jr ON cr.kejurnas_registration_id = jr.id
                  LEFT JOIN kejurnas_categories kc ON jr.category_id = kc.id
                  INNER JOIN users u ON cr.user_id = u.id
                  $where_clause
                  ORDER BY cr.submitted_at DESC
                  LIMIT $offset, $items_per_page";
        
        $result = $conn->query($query);
        
        if (!$result) {
            throw new Exception("Database query failed: " . $conn->error);
        }
        
        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }
        
        echo json_encode([
            'success' => true, 
            'data' => $data,
            'pagination' => [
                'current_page' => $page,
                'total_pages' => $total_pages,
                'total_records' => $total_records,
                'items_per_page' => $items_per_page
            ]
        ]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    
    exit();
}

// Handle get competition re-registration detail
// Handle get reregistration statistics (saldo, counts)
if (isset($_GET['get_reregistration_stats'])) {
    ob_clean();
    header('Content-Type: application/json');
    
    try {
        $stats_query = "SELECT 
                        COUNT(*) as total,
                        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
                        SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as pending,
                        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
                        SUM(CASE WHEN status = 'approved' THEN COALESCE(total_cost, 0) ELSE 0 END) as total_saldo,
                        SUM(CASE WHEN status = 'submitted' THEN COALESCE(total_cost, 0) ELSE 0 END) as pending_saldo
                       FROM competition_reregistrations";
        
        $result = $conn->query($stats_query);
        $stats = $result->fetch_assoc();
        
        echo json_encode([
            'success' => true, 
            'stats' => [
                'total' => (int)$stats['total'],
                'approved' => (int)$stats['approved'],
                'pending' => (int)$stats['pending'],
                'rejected' => (int)$stats['rejected'],
                'total_saldo' => (int)$stats['total_saldo'],
                'pending_saldo' => (int)$stats['pending_saldo']
            ]
        ]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    
    exit();
}

if (isset($_GET['get_reregistration_detail']) && isset($_GET['id'])) {
    ob_clean(); // Clear any output buffer
    header('Content-Type: application/json');
    
    try {
        $id = (int)$_GET['id'];
        $query = "SELECT cr.*, jr.club_name, jr.level, kc.category_name, u.username
                  FROM competition_reregistrations cr
                  INNER JOIN kejurnas_registrations jr ON cr.kejurnas_registration_id = jr.id
                  LEFT JOIN kejurnas_categories kc ON jr.category_id = kc.id
                  INNER JOIN users u ON cr.user_id = u.id
                  WHERE cr.id = ?";
        
        $stmt = $conn->prepare($query);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            throw new Exception("Data tidak ditemukan");
        }
        
        $data = $result->fetch_assoc();
        echo json_encode(['success' => true, 'data' => $data]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    
    exit();
}

// Handle update competition re-registration status
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['update_reregistration_status']) && $_POST['update_reregistration_status'] == '1') {
    ob_clean(); // Clear any output buffer
    header('Content-Type: application/json');
    
    $id = (int)$_POST['id'];
    $status = $_POST['status'];
    
    if (!in_array($status, ['approved', 'rejected'])) {
        echo json_encode(['success' => false, 'message' => 'Invalid status']);
        exit();
    }
    
    try {
        // First, get user details for notification
        $get_user_query = "SELECT cr.user_id, cr.kejurnas_registration_id, u.username, jr.club_name, kc.category_name
                          FROM competition_reregistrations cr
                          INNER JOIN users u ON cr.user_id = u.id
                          INNER JOIN kejurnas_registrations jr ON cr.kejurnas_registration_id = jr.id
                          LEFT JOIN kejurnas_categories kc ON jr.category_id = kc.id
                          WHERE cr.id = ?";
        
        $get_stmt = $conn->prepare($get_user_query);
        if (!$get_stmt) {
            throw new Exception("Prepare get user statement failed: " . $conn->error);
        }
        
        $get_stmt->bind_param("i", $id);
        $get_stmt->execute();
        $user_result = $get_stmt->get_result();
        
        if ($user_result->num_rows === 0) {
            throw new Exception("Re-registration not found");
        }
        
        $user_data = $user_result->fetch_assoc();
        $get_stmt->close();
        
        // Update status
        $query = "UPDATE competition_reregistrations 
                  SET status = ?, reviewed_at = NOW(), reviewed_by = ?
                  WHERE id = ?";
        
        $stmt = $conn->prepare($query);
        if (!$stmt) {
            throw new Exception("Prepare statement failed: " . $conn->error);
        }
        
        $stmt->bind_param("sii", $status, $_SESSION['user_id'], $id);
        
        if (!$stmt->execute()) {
            throw new Exception("Execute failed: " . $stmt->error);
        }
        
        if ($stmt->affected_rows === 0) {
            throw new Exception("No rows affected. Re-registration ID might not exist.");
        }
        
        $stmt->close();
        
        // Create notification for user
        $status_text = $status === 'approved' ? 'disetujui' : 'ditolak';
        $notification_message = "Daftar ulang kompetisi {$user_data['category_name']} untuk {$user_data['club_name']} telah {$status_text} oleh PB.";
        
        $notif_query = "INSERT INTO notifications (user_id, title, message, type, is_read, created_at) 
                       VALUES (?, 'Status Daftar Ulang Kompetisi', ?, 'competition_status', 0, NOW())";
        
        $notif_stmt = $conn->prepare($notif_query);
        if ($notif_stmt) {
            $notif_stmt->bind_param("is", $user_data['user_id'], $notification_message);
            $notif_stmt->execute();
            $notif_stmt->close();
        }
        
        $message = $status === 'approved' ? 'Daftar ulang kompetisi berhasil disetujui' : 'Daftar ulang kompetisi ditolak';
        echo json_encode(['success' => true, 'message' => $message]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    
    exit();
}

ob_end_flush();
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FORBASI - Dashboard Pengurus Besar</title>
    <link rel="shortcut icon" href="../assets/LOGO-FORBASI.png" type="image/x-icon" />
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css">
    <link rel="stylesheet" href="../css/pb.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"/>
    
</head>
<body>
    <aside class="sidebar" id="sidebar">
        <div class="logo">
            <img src="../assets/LOGO-FORBASI.png" alt="FORBASI Logo">
            <span>FORBASI Admin</span>
            <span>Pengurus Besar</span>
        </div>

        <ul class="menu">
            <li><a href="#kta_applications_section" class="active" data-section="kta_applications_section"><i class="fas fa-file-invoice"></i> <span>Pengajuan KTA</span></a></li>
            <li><a href="#saldo_overview_section" data-section="saldo_overview_section"><i class="fas fa-balance-scale"></i> <span>Ringkasan Saldo</span></a></li>
            <li><a href="#view_issued_kta_section" data-section="view_issued_kta_section"><i class="fas fa-id-card"></i> <span>Lihat KTA Diterbitkan</span></a></li>
            <li><a href="#view_members_section" data-section="view_members_section"><i class="fas fa-users"></i> <span>Lihat Anggota</span></a></li>
            <li><a href="#pb_kta_config_section" data-section="pb_kta_config_section"><i class="fas fa-cogs"></i> <span>Konfigurasi KTA PB</span></a></li>
            <li><a href="manage_lisensi.php"><i class="fas fa-certificate"></i> <span>Lisensi Pelatih & Juri</span></a></li>
            <li class="has-submenu">
                <a href="#kejurnas_section" data-section="kejurnas_section"><i class="fas fa-trophy"></i> <span>Kompetisi</span> <i class="fas fa-chevron-down submenu-toggle"></i></a>
                <ul class="submenu">
                    <li><a href="#kejurnas_section" data-section="kejurnas_section"><i class="fas fa-trophy"></i> <span>Pendaftaran Kejurnas</span></a></li>
                    <li><a href="#competition_reregistrations_section" data-section="competition_reregistrations_section"><i class="fas fa-file-upload"></i> <span>Daftar Ulang Kompetisi</span></a></li>
                </ul>
            </li>
            <li><a href="#admin_profile_section" data-section="admin_profile_section"><i class="fas fa-user-circle"></i> <span>Profil Admin</span></a></li>
            <li><a href="#activity_log_section" data-section="activity_log_section"><i class="fas fa-clipboard-list"></i> <span>Riwayat Aktivitas</span></a></li>
            <li><a href="logout.php"><i class="fas fa-sign-out-alt"></i> <span>Logout</span></a></li>
        </ul>
    </aside>


    <main class="main-content" id="main-content">
        <header class="header">
            <button class="toggle-btn" id="sidebar-toggle" aria-label="Toggle Sidebar"><i class="fas fa-bars"></i></button>

            <div>
                <h1>Selamat Datang, Pengurus Besar</h1>
                <p>Kelola Pengajuan KTA di seluruh Indonesia</p>
            </div>
        </header>

        <section class="container animated fadeIn" id="kta_applications_section">
            <h2>Daftar Pengajuan KTA</h2>
            <div class="status-cards-container" id="kta-status-cards-container">
                <div class="status-card" id="card-approved_pengda" data-status-filter="approved_pengda">
                    <h3>Disetujui Pengda</h3>
                    <p id="count-approved_pengda" class="count-number">0</p>
                </div>
                <div class="status-card" id="card-approved_pb" data-status-filter="approved_pb">
                    <h3>Disetujui PB</h3>
                    <p id="count-approved_pb" class="count-number">0</p>
                </div>
                <div class="status-card" id="card-rejected_pb" data-status-filter="rejected_pb">
                    <h3>Ditolak PB</h3>
                    <p id="count-rejected_pb" class="count-number">0</p>
                </div>
                <div class="status-card" id="card-kta_issued" data-status-filter="kta_issued">
                    <h3>KTA Diterbitkan</h3>
                    <p id="count-kta_issued" class="count-number">0</p>
                </div>
                <div class="status-card" id="card-pending_pengda_resubmit" data-status-filter="pending_pengda_resubmit">
                    <h3>Menunggu Pengajuan Ulang (Pengda)</h3>
                    <p id="count-pending_pengda_resubmit" class="count-number">0</p>
                </div>
                <div class="status-card all-applications-card" id="card-all_applications" data-status-filter="">
                    <h3>Total Pengajuan</h3>
                    <p id="count-total_applications" class="count-number">0</p>
                </div>
            </div>
            <hr>

            <h3><i class="fas fa-filter"></i> Filter & Pencarian Pengajuan KTA</h3>
            <div class="filter-controls">
                <div class="form-group">
                    <label for="ktaProvinceFilter">Provinsi:</label>
                    <select id="ktaProvinceFilter" class="form-control">
                        <option value="">Semua Provinsi</option>
                        <?php
                            // Fetch all provinces for filter dropdown
                            $provinces_query_kta = $conn->query("SELECT id, name FROM provinces ORDER BY name ASC");
                            if ($provinces_query_kta) {
                                while ($p_row_kta = $provinces_query_kta->fetch_assoc()) {
                                    echo '<option value="' . htmlspecialchars($p_row_kta['id']) . '">' . htmlspecialchars($p_row_kta['name']) . '</option>';
                                }
                            }
                        ?>
                    </select>
                </div>
                <div class="form-group">
                    <label for="ktaCityFilter">Kota/Kabupaten:</label>
                    <select id="ktaCityFilter" class="form-control" disabled>
                        <option value="">Semua Kota/Kabupaten</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="ktaSearchInput">Cari (Klub, PJ, Barcode ID):</label>
                    <input type="text" id="ktaSearchInput" class="form-control" placeholder="Cari pengajuan...">
                </div>
            </div>
            <div class="filter-controls">
                <button type="button" class="btn btn-primary" onclick="loadKtaTable(1)">Terapkan Filter</button>
                <button type="button" class="btn btn-secondary" onclick="resetKtaTableFilters()">Reset Filter</button>
            </div>
            <div id="kta-applications-table-container">
                <p class="text-center text-muted no-data-message animated fadeIn">Memuat pengajuan KTA...</p>
            </div>

            <div id="ktaDetailModal" class="modal">
                <div class="modal-content large-modal">
                    <span class="close-button" onclick="closeModal('ktaDetailModal')">&times;</span>
                    <h2>Detail Pengajuan KTA <span id="kta-detail-id"></span></h2>
                    <div id="kta-detail-content">
                        <p class="text-center text-muted">Memuat detail pengajuan...</p>
                    </div>
                </div>
            </div>

        </section>

        <section class="container animated fadeIn" id="saldo_overview_section" style="display:none;">
            <h2>Ringkasan Saldo Keuangan PB</h2>
            <div class="saldo-cards-grid">
                <div class="saldo-card animated fadeInUp">
                    <i class="fas fa-money-bill-wave-alt income-icon"></i>
                    <h3>Saldo Masuk</h3>
                    <p class="amount-in" id="total-saldo-masuk-display">Rp 0</p>
                    <span class="detail-text">Total pembayaran dari pengguna</span>
                </div>
                <div class="saldo-card animated fadeInUp" style="animation-delay: 0.1s;">
                    <i class="fas fa-money-bill-wave-alt outcome-icon"></i>
                    <h3>Saldo Keluar</h3>
                    <p class="amount-out" id="total-saldo-keluar-display">Rp 0</p>
                    <span class="detail-text">Total transfer ke Pengda dan Pengcab (dengan bukti terunggah)</span>
                </div>
                <div class="saldo-card total-saldo animated fadeInUp" style="animation-delay: 0.2s;">
                    <i class="fas fa-wallet total-icon"></i>
                    <h3>Total Saldo PB Saat Ini</h3>
                    <p class="amount-total" id="total-saldo-display">Rp 0</p>
                    <span class="detail-text">Selisih saldo masuk dan keluar</span>
                </div>
                <div class="saldo-card animated fadeInUp" style="animation-delay: 0.3s;">
                    <i class="fas fa-handshake developer-icon"></i>
                    <h3>Estimasi Dibayarkan ke Pengda</h3>
                    <p class="amount-to-pay" id="estimate-to-pengda-display">Rp 0</p>
                    <span class="detail-text">Jumlah yang harus dibayarkan ke Pengda (KTA Diterbitkan PB)</span>
                </div>
                <div class="saldo-card animated fadeInUp" style="animation-delay: 0.4s;">
                    <i class="fas fa-handshake developer-icon"></i>
                    <h3>Estimasi Dibayarkan ke Pengcab</h3>
                    <p class="amount-to-pay" id="estimate-to-pengcab-display">Rp 0</p>
                    <span class="detail-text">Jumlah yang harus dibayarkan ke Pengcab (KTA Diterbitkan PB)</span>
                </div>
                <div class="saldo-card animated fadeInUp" style="animation-delay: 0.5s;">
                    <i class="fas fa-handshake-alt-slash developer-icon"></i>
                    <h3>Estimasi Dibayarkan ke Developer</h3>
                    <p class="amount-to-pay" id="estimate-to-developer-display">Rp 0</p>
                    <span class="detail-text">Jumlah yang harus dibayarkan ke Developer (KTA Diterbitkan PB)</span>
                </div>
            </div>

            <hr>

            <h3><i class="fas fa-filter"></i> Filter Riwayat Saldo</h3>
            <div class="filter-controls">
                <div class="form-group">
                    <label for="saldoProvinceFilter">Provinsi:</label>
                    <select id="saldoProvinceFilter" class="form-control">
                        <option value="">Semua Provinsi</option>
                        <?php
                            $provinces_query_saldo = $conn->query("SELECT id, name FROM provinces ORDER BY name ASC");
                            if ($provinces_query_saldo) {
                                while ($p_row_saldo = $provinces_query_saldo->fetch_assoc()) {
                                    echo '<option value="' . htmlspecialchars($p_row_saldo['id']) . '">' . htmlspecialchars($p_row_saldo['name']) . '</option>';
                                }
                            }
                        ?>
                    </select>
                </div>
                <div class="form-group">
                    <label for="saldoCityFilter">Kota/Kabupaten:</label>
                    <select id="saldoCityFilter" class="form-control">
                        <option value="">Semua Kota/Kabupaten</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="saldoMonthFilter">Bulan:</label>
                    <select id="saldoMonthFilter" class="form-control">
                        <option value="">Semua Bulan</option>
                        <?php
                            $months = [
                                1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
                                5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
                                9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
                            ];
                            for ($i = 1; $i <= 12; $i++) {
                                echo '<option value="' . $i . '">' . $months[$i] . '</option>';
                            }
                        ?>
                    </select>
                </div>
                <div class="form-group">
                    <label for="saldoYearFilter">Tahun:</label>
                    <select id="saldoYearFilter" class="form-control">
                        <option value="">Semua Tahun</option>
                        <?php
                            $current_year = date('Y');
                            for ($y = $current_year; $y >= 2025; $y--) {
                                echo '<option value="' . $y . '">' . $y . '</option>';
                            }
                        ?>
                    </select>
                </div>
                <div class="form-group">
                    <label for="saldoKTAStatusFilter">Status KTA:</label>
                    <select id="saldoKTAStatusFilter" class="form-control">
                        <option value="">Semua Status KTA</option>
                        <option value="kta_issued">KTA Diterbitkan</option>
                        <option value="approved_pb">Disetujui PB</option>
                        <option value="approved_pengda">Disetujui Pengda</option>
                        <option value="pending_pengda_resubmit">Memerlukan Pengajuan Ulang</option>
                        <option value="rejected_pb">Ditolak PB</option>
                    </select>
                </div>
            </div>
            <div class="filter-controls">
                <button type="button" class="btn btn-primary" onclick="loadSaldoDataAndHistory()">Terapkan Filter</button>
                <button type="button" class="btn btn-secondary" onclick="resetSaldoFilters()">Reset Filter</button>
                <button type="button" class="btn btn-success" id="exportSaldoExcelBtn"><i class="fas fa-file-excel"></i> Ekspor Laporan Keuangan</button>
            </div>

            <div class="recap-payment-controls">
                <h3><i class="fas fa-money-check-alt"></i> Rekap Pembayaran PB ke Pengda/Pengcab</h3>
                <div class="form-group">
                    <label for="recapRecipientType">Pilih Penerima Rekap:</label>
                    <select id="recapRecipientType" class="form-control">
                        <option value="">Pilih Penerima</option>
                        <option value="pengda">Pengurus Daerah</option>
                        <option value="pengcab">Pengurus Cabang</option>
                    </select>
                </div>
                <div class="form-group" id="recapRecipientSelectGroup" style="display:none;">
                    <label for="recapRecipientId">Pilih Entitas:</label>
                    <select id="recapRecipientId" class="form-control">
                        <option value="">Pilih Entitas</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="recapPeriodType">Jenis Rekap:</label>
                    <select id="recapPeriodType" class="form-control">
                        <option value="monthly">Bulanan</option>
                        <option value="yearly">Tahunan</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="recapYear">Tahun Rekap:</label>
                    <select id="recapYear" class="form-control">
                        <?php
                            $current_year = date('Y');
                            for ($y = $current_year; $y >= 2025; $y--) {
                                echo '<option value="' . $y . '">' . $y . '</option>';
                            }
                        ?>
                    </select>
                </div>
                <div class="form-group" id="recapMonthGroup">
                    <label for="recapMonth">Bulan Rekap:</label>
                    <select id="recapMonth" class="form-control">
                        <?php
                            $months = [
                                1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
                                5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
                                9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
                            ];
                            for ($i = 1; $i <= 12; $i++) {
                                echo '<option value="' . $i . '">' . $months[$i] . '</option>';
                            }
                        ?>
                    </select>
                </div>
                <button type="button" class="btn btn-warning" id="openRecapPaymentModalBtn" disabled><i class="fas fa-coins"></i> Lakukan Pembayaran Rekap</button>
            </div>
            <div id="transaction-history-table-container">
                <p class="text-center text-muted no-data-message animated fadeIn">Memuat riwayat transaksi...</p>
            </div>
        </section>

        <section class="container animated fadeIn" id="view_issued_kta_section" style="display:none;">
            <h2>KTA yang Telah Diterbitkan</h2>
            <h3><i class="fas fa-filter"></i> Filter & Pencarian KTA</h3>

            <div class="filter-controls">
                <div class="form-group">
                    <label for="issuedKTAProvinceFilter">Provinsi:</label>
                    <select id="issuedKTAProvinceFilter" class="form-control">
                        <option value="">Semua Provinsi</option>
                        <?php
                                $provinces_query = $conn->query("SELECT id, name FROM provinces ORDER BY name ASC");
                                if ($provinces_query) {
                                    while ($p_row = $provinces_query->fetch_assoc()) {
                                        echo '<option value="' . htmlspecialchars($p_row['name']) . '">' . htmlspecialchars($p_row['name']) . '</option>';
                                    }
                                }
                        ?>
                    </select>
                </div>
                <div class="form-group">
                    <label for="issuedKTACityFilter">Kota/Kabupaten:</label>
                    <select id="issuedKTACityFilter" class="form-control">
                        <option value="">Semua Kota/Kabupaten</option>
                        <?php
                                $cities_query = $conn->query("SELECT id, name FROM cities ORDER BY name ASC");
                                if ($cities_query) {
                                    while ($c_row = $cities_query->fetch_assoc()) {
                                        echo '<option value="' . htmlspecialchars($c_row['name']) . '">' . htmlspecialchars($c_row['name']) . '</option>';
                                    }
                                }
                        ?>
                    </select>
                </div>
                <div class="form-group">
                    <label for="issuedKTASearchInput">Cari (Klub, PJ, Barcode ID):</label>
                    <input type="text" id="issuedKTASearchInput" class="form-control" placeholder="Cari KTA...">
                </div>
            </div>
            <div class="filter-controls">
                <button type="button" class="btn btn-primary" onclick="loadIssuedKTA()">Terapkan Filter</button>
                <button type="button" class="btn btn-secondary" onclick="resetIssuedKTAFilter()">Reset Filter</button>
            </div>

            <div id="issued-kta-cards-container">
                <p class="text-center text-muted no-data-message animated fadeIn">Memuat KTA yang diterbitkan...</p>
            </div>
        </section>


        <section class="container animated fadeIn" id="view_members_section" style="display:none;">
            <h2>Lihat Anggota</h2>
            <h3><i class="fas fa-filter"></i> Filter & Pencarian Anggota</h3>

            <div class="filter-controls">
                <div class="form-group">
                    <label for="memberRoleFilter">Filter Peran:</label>
                    <select id="memberRoleFilter" class="form-control">
                        <option value="">Semua Peran</option>
                        <option value="Pengurus Besar">Pengurus Besar</option>
                        <option value="Pengurus Daerah">Pengurus Daerah</option>
                        <option value="Pengurus Cabang">Pengurus Cabang</option>
                        <option value="User">Pengguna</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="memberSearchInput">Cari (Username, Email, Klub):</label>
                    <input type="text" id="memberSearchInput" class="form-control" placeholder="Cari anggota...">
                </div>
            </div>
            <div class="filter-controls">
                <button type="button" class="btn btn-primary" onclick="loadUsersTable(1)">Terapkan Filter</button>
                <button type="button" class="btn btn-secondary" onclick="resetUsersFilter()">Reset Filter</button>
                <button type="button" class="btn btn-success" id="exportRekeningExcelBtn"><i class="fas fa-file-excel"></i> Ekspor Rekening ke Excel</button>
            </div>
            <div id="users-table-container">
                <p class="text-center text-muted no-data-message animated fadeIn">Memuat daftar anggota...</p>
            </div>
        </section>

        <section class="container animated fadeIn" id="pb_kta_config_section" style="display:none;">
            <h2>Konfigurasi KTA Otomatis Pengurus Besar</h2>
            <form id="pbKtaConfigForm" enctype="multipart/form-data">
                <input type="hidden" name="save_pb_kta_config_ajax" value="1">
                <div class="alert alert-info" role="alert">
                    <i class="fas fa-info-circle"></i> Harap isi informasi di bawah untuk mengotomatiskan pembuatan KTA yang diterbitkan oleh Pengurus Besar. Nama Ketua Umum dan tanda tangan akan ditempelkan pada KTA.
                </div>

                <div class="form-group">
                    <label for="pb_ketua_umum_name">Nama Ketua Umum Pengurus Besar:</label>
                    <input type="text" id="pb_ketua_umum_name" name="ketua_umum_name" class="form-control" value="<?php echo htmlspecialchars($pb_ketua_umum_name); ?>" placeholder="Masukkan Nama Ketua Umum Pengurus Besar" required>
                </div>

                <div class="form-group">
                    <label for="pbSignatureCanvas" id="currentPbSignatureLabel">Tanda Tangan Ketua Umum:</label>
                    <div class="signature-pad-container" >
                        <canvas id="pbSignatureCanvas" ></canvas>
                        <img id="currentPbSignaturePreview" src="<?php echo !empty($pb_signature_image_path) ? BASE_URL . $pb_kta_configs_subfolder . $pb_signature_image_path : ''; ?>"
                             alt="Tanda Tangan Saat Ini"
                             style="<?php echo empty($pb_signature_image_path) ? 'display: none;' : ''; ?>">
                    </div>
                    <small class="form-text text-muted">Gambar tanda tangan akan digunakan pada KTA yang dihasilkan.</small>
                    <input type="hidden" id="pb_signature_data_url" name="signature_data_url">
                    <button type="button" id="clearPbSignatureBtn" class="btn btn-danger btn-sm mt-2" style="<?php echo empty($pb_signature_image_path) ? 'display: none;' : ''; ?>"><i class="fas fa-eraser"></i> Bersihkan Tanda Tangan</button>
                </div>
                
                <button type="submit" class="btn btn-approve"><i class="fas fa-check-circle"></i> Simpan Konfigurasi</button>
            </form>
        </section>

        <!-- Competition Re-registrations Section -->
        <section class="container animated fadeIn" id="competition_reregistrations_section" style="display:none;">
            <h2><i class="fas fa-file-upload"></i> Daftar Ulang Kompetisi</h2>
            <p>Kelola persyaratan daftar ulang kompetisi untuk tim yang sudah disetujui.</p>

            <!-- Statistik Daftar Ulang -->
            <div class="saldo-cards-grid">
                <div class="saldo-card animated fadeInUp">
                    <i class="fas fa-wallet income-icon"></i>
                    <h3>Total Saldo Terkumpul</h3>
                    <p class="amount-in" id="totalSaldoReregistration">Rp 0</p>
                    <span class="detail-text">Saldo dari daftar ulang yang disetujui</span>
                </div>
                <div class="saldo-card animated fadeInUp" style="animation-delay: 0.1s;">
                    <i class="fas fa-check-circle outcome-icon"></i>
                    <h3>Daftar Ulang Disetujui</h3>
                    <p class="amount-out" id="totalApprovedReregistration">0</p>
                    <span class="detail-text">Total pendaftaran yang telah disetujui</span>
                </div>
                <div class="saldo-card total-saldo animated fadeInUp" style="animation-delay: 0.2s;">
                    <i class="fas fa-clock total-icon"></i>
                    <h3>Menunggu Review</h3>
                    <p class="amount-total" id="totalPendingReregistration">0</p>
                    <span class="detail-text">Pendaftaran yang perlu direview</span>
                </div>
            </div>

            <div class="competition-reregistration-content">
                <!-- Filter dan Search Section -->
                <div class="filter-search-section" style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 8px;">
                    <div class="row" style="gap: 10px;">
                        <div class="col-md-3">
                            <label for="filterStatus" style="font-weight: 600; margin-bottom: 5px;">Status</label>
                            <select id="filterStatus" class="form-control" onchange="filterReregistrations()">
                                <option value="">Semua Status</option>
                                <option value="submitted">Menunggu Review</option>
                                <option value="approved">Disetujui</option>
                                <option value="rejected">Ditolak</option>
                                <option value="incomplete">Tidak Lengkap</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label for="filterCategory" style="font-weight: 600; margin-bottom: 5px;">Kategori</label>
                            <select id="filterCategory" class="form-control" onchange="filterReregistrations()">
                                <option value="">Semua Kategori</option>
                                <option value="rukibra">Rukibra</option>
                                <option value="baris_berbaris">Baris Berbaris</option>
                                <option value="varfor_musik">Varfor Musik</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label for="filterLevel" style="font-weight: 600; margin-bottom: 5px;">Level Pendidikan</label>
                            <select id="filterLevel" class="form-control" onchange="filterReregistrations()">
                                <option value="">Semua Level</option>
                                <option value="SD">SD</option>
                                <option value="SMP">SMP</option>
                                <option value="SMA">SMA</option>
                                <option value="SMK">SMK</option>
                            </select>
                        </div>
                    </div>
                    <div class="row" style="gap: 10px; margin-top: 10px;">
                        <div class="col-md-3">
                            <label for="searchReregistration" style="font-weight: 600; margin-bottom: 5px;">Cari Club</label>
                            <input type="text" id="searchReregistration" class="form-control" placeholder="Nama club..." onkeyup="filterReregistrations()">
                        </div>
                        <div class="col-md-3">
                            <label for="itemsPerPage" style="font-weight: 600; margin-bottom: 5px;">Item per halaman</label>
                            <select id="itemsPerPage" class="form-control" onchange="resetPagination(); filterReregistrations()">
                                <option value="5">5</option>
                                <option value="10" selected>10</option>
                                <option value="20">20</option>
                                <option value="50">50</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Download All Button -->
                <div style="margin-bottom: 15px; text-align: right;">
                    <button onclick="downloadAllReregistrations()" class="btn btn-success" style="padding: 10px 20px; font-size: 16px;">
                        <i class="fas fa-download"></i> Download Semua Data & Logo
                    </button>
                </div>

                <div id="reregistrationTableContainer">
                    <!-- Table will be loaded here via AJAX -->
                </div>
                
                <!-- Pagination -->
                <div id="paginationContainer" style="margin-top: 20px; text-align: center; display: none;">
                    <nav aria-label="Pagination">
                        <ul class="pagination justify-content-center">
                            <li class="page-item" id="prevBtn">
                                <a class="page-link" href="#" onclick="goToPage(currentPage - 1); return false;">Sebelumnya</a>
                            </li>
                            <li class="page-item active" id="pageIndicator">
                                <span class="page-link">Halaman <span id="currentPageNum">1</span> dari <span id="totalPagesNum">1</span></span>
                            </li>
                            <li class="page-item" id="nextBtn">
                                <a class="page-link" href="#" onclick="goToPage(currentPage + 1); return false;">Selanjutnya</a>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>
        </section>

        <section class="container animated fadeIn" id="admin_profile_section" style="display:none;">
            <h2>Profil Admin PB</h2>
            <div class="password-card">
                <h3><i class="fas fa-key"></i> Ubah Kata Sandi</h3>
                <form id="changePasswordForm">
                    <input type="hidden" name="update_password_ajax" value="1">
                    <div class="form-group">
                        <label for="current_password">Kata Sandi Saat Ini:</label>
                        <input type="password" id="current_password" name="current_password" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="new_password">Kata Sandi Baru:</label>
                        <input type="password" id="new_password" name="new_password" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="confirm_new_password">Konfirmasi Kata Sandi Baru:</label>
                        <input type="password" id="confirm_new_password" name="confirm_new_password" class="form-control" required>
                    </div>
                    <button type="submit" class="btn btn-warning"><i class="fas fa-lock"></i> Ubah Kata Sandi</button>
                </form>
            </div>
        </section>

        <section class="container animated fadeIn" id="activity_log_section" style="display:none;">
            <h2>Riwayat Aktivitas Pengurus Besar</h2>
            <div id="activity-log-table-container">
                <p class="text-center text-muted no-data-message animated fadeIn">Memuat riwayat aktivitas...</p>
            </div>
        </section>

        <!-- Kejurnas Section -->
        <section class="container animated fadeIn" id="kejurnas_section" style="display:none;">
            <h2 style="margin-bottom: 24px; display: flex; align-items: center; gap: 12px; color: #343a40;">
                <i class="fas fa-trophy" style="color: #0d9500;"></i> 
                Manajemen Kompetisi
            </h2>
            
            <!-- Summary Cards - Total Participants by Category -->
            <div class="summary-cards-grid" id="kejurnas-summary-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 30px;">
                <div class="summary-card" style="background: linear-gradient(135deg, #0d9500 0%, #0a7300 100%); color: white; padding: 24px; border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.15);">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                        <div style="font-size: 1em; font-weight: 600; opacity: 0.95;">Rukibra</div>
                        <i class="fas fa-users" style="font-size: 2.2em; opacity: 0.25;"></i>
                    </div>
                    <div id="total-rukibra" style="font-size: 3em; font-weight: bold; margin: 12px 0; line-height: 1;">0</div>
                    <div style="font-size: 0.9em; opacity: 0.85; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 8px; margin-top: 8px;">Total Peserta</div>
                </div>
                
                <div class="summary-card" style="background: linear-gradient(135deg, #0d9500 0%, #0a7300 100%); color: white; padding: 24px; border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.15);">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                        <div style="font-size: 1em; font-weight: 600; opacity: 0.95;">Baris Berbaris</div>
                        <i class="fas fa-users" style="font-size: 2.2em; opacity: 0.25;"></i>
                    </div>
                    <div id="total-baris-berbaris" style="font-size: 3em; font-weight: bold; margin: 12px 0; line-height: 1;">0</div>
                    <div style="font-size: 0.9em; opacity: 0.85; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 8px; margin-top: 8px;">Total Peserta</div>
                </div>
                
                <div class="summary-card" style="background: linear-gradient(135deg, #0d9500 0%, #0a7300 100%); color: white; padding: 24px; border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.15);">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                        <div style="font-size: 1em; font-weight: 600; opacity: 0.95;">Varfor Musik</div>
                        <i class="fas fa-users" style="font-size: 2.2em; opacity: 0.25;"></i>
                    </div>
                    <div id="total-varfor-musik" style="font-size: 3em; font-weight: bold; margin: 12px 0; line-height: 1;">0</div>
                    <div style="font-size: 0.9em; opacity: 0.85; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 8px; margin-top: 8px;">Total Peserta</div>
                </div>
            </div>
            
            <!-- Level Summary Cards - Total Participants by Level -->
            <h4 style="margin: 24px 0 16px 0; color: #495057; font-size: 1.1em; display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-graduation-cap" style="color: #0d9500;"></i> Peserta Per Tingkat Pendidikan
            </h4>
            <div class="level-cards-grid" id="kejurnas-level-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px; margin-bottom: 30px;">
                <div class="level-card" style="background: linear-gradient(135deg, #17a2b8 0%, #117a8b 100%); color: white; padding: 20px; border-radius: 10px; box-shadow: 0 3px 6px rgba(0,0,0,0.12);">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                        <div style="font-size: 0.95em; font-weight: 600; opacity: 0.95;">SD</div>
                        <i class="fas fa-child" style="font-size: 1.8em; opacity: 0.25;"></i>
                    </div>
                    <div id="total-sd" style="font-size: 2.5em; font-weight: bold; margin: 10px 0; line-height: 1;">0</div>
                    <div style="font-size: 0.85em; opacity: 0.85;">Peserta</div>
                </div>
                
                <div class="level-card" style="background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%); color: white; padding: 20px; border-radius: 10px; box-shadow: 0 3px 6px rgba(0,0,0,0.12);">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                        <div style="font-size: 0.95em; font-weight: 600; opacity: 0.95;">SMP</div>
                        <i class="fas fa-user-graduate" style="font-size: 1.8em; opacity: 0.25;"></i>
                    </div>
                    <div id="total-smp" style="font-size: 2.5em; font-weight: bold; margin: 10px 0; line-height: 1;">0</div>
                    <div style="font-size: 0.85em; opacity: 0.85;">Peserta</div>
                </div>
                
                <div class="level-card" style="background: linear-gradient(135deg, #dc3545 0%, #bd2130 100%); color: white; padding: 20px; border-radius: 10px; box-shadow: 0 3px 6px rgba(0,0,0,0.12);">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                        <div style="font-size: 0.95em; font-weight: 600; opacity: 0.95;">SMA</div>
                        <i class="fas fa-graduation-cap" style="font-size: 1.8em; opacity: 0.25;"></i>
                    </div>
                    <div id="total-sma" style="font-size: 2.5em; font-weight: bold; margin: 10px 0; line-height: 1;">0</div>
                    <div style="font-size: 0.85em; opacity: 0.85;">Peserta</div>
                </div>
                
                <div class="level-card" style="background: linear-gradient(135deg, #6f42c1 0%, #5a32a3 100%); color: white; padding: 20px; border-radius: 10px; box-shadow: 0 3px 6px rgba(0,0,0,0.12);">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                        <div style="font-size: 0.95em; font-weight: 600; opacity: 0.95;">Purna</div>
                        <i class="fas fa-award" style="font-size: 1.8em; opacity: 0.25;"></i>
                    </div>
                    <div id="total-purna" style="font-size: 2.5em; font-weight: bold; margin: 10px 0; line-height: 1;">0</div>
                    <div style="font-size: 0.85em; opacity: 0.85;">Peserta</div>
                </div>
            </div>
            
            <!-- Statistics Cards -->
            <div class="stats-grid" id="kejurnas-stats-container">
                <p class="text-center text-muted"><i class="fas fa-spinner fa-spin"></i> Memuat statistik...</p>
            </div>

            <!-- Filters -->
            <div class="filter-section">
                <h4 style="margin: 0 0 16px 0; color: #495057; font-size: 1em; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-sliders-h" style="color: #0d9500;"></i> Filter Registrasi
                </h4>
                <p style="color: #666; margin-bottom: 15px; font-size: 0.9em;"><i class="fas fa-info-circle"></i> Filter akan diterapkan otomatis saat Anda memilih opsi</p>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px;">
                    <div class="form-group">
                        <label for="kejurnas-filter-status"><i class="fas fa-filter"></i> Status:</label>
                        <select id="kejurnas-filter-status" class="form-control">
                            <option value="all">Semua Status</option>
                            <option value="pending">Menunggu Persetujuan</option>
                            <option value="approved">Disetujui</option>
                            <option value="rejected">Ditolak</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="kejurnas-filter-category"><i class="fas fa-list"></i> Kategori:</label>
                        <select id="kejurnas-filter-category" class="form-control">
                            <option value="all">Semua Kategori</option>
                            <option value="rukibra">Rukibra</option>
                            <option value="varfor_musik">Varfor Musik</option>
                            <option value="baris_berbaris">Baris Berbaris</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="kejurnas-filter-level"><i class="fas fa-graduation-cap"></i> Tingkat:</label>
                        <select id="kejurnas-filter-level" class="form-control">
                            <option value="all">Semua Tingkat</option>
                            <option value="SD">SD</option>
                            <option value="SMP">SMP</option>
                            <option value="SMA">SMA</option>
                            <option value="Purna">Purna</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="kejurnas-filter-pengda"><i class="fas fa-building"></i> Pengda:</label>
                        <select id="kejurnas-filter-pengda" class="form-control">
                            <!-- Will be populated dynamically without "Semua Pengda" option -->
                        </select>
                    </div>
                </div>
                
                <!-- Export Button -->
                <div style="margin-top: 15px; text-align: right;">
                    <button onclick="exportToExcel()" class="btn btn-success" style="background: linear-gradient(135deg, #0d9500 0%, #0a7300 100%); border: none; padding: 10px 20px; border-radius: 6px; font-weight: 500;">
                        <i class="fas fa-file-excel"></i> Ekspor ke Excel
                    </button>
                </div>
            </div>

            <!-- Registrations Table -->
            <div id="kejurnas-registrations-container">
                <div class="no-data-message">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Memuat data registrasi...</p>
                </div>
            </div>
        </section>

    </main>

    <div id="statusModal" class="modal">
        <div class="modal-content">
            <span class="close-button" onclick="closeModal('statusModal')">&times;</span>
            <h2>Perbarui Status Pengajuan KTA</h2>
            <form id="updateStatusForm" enctype="multipart/form-data">
                <input type="hidden" name="update_kta_status_ajax" value="1">
                <input type="hidden" id="modal-application-id" name="application_id">
                <div class="form-group">
                    <label for="modal-new-status-display">Status Baru:</label>
                    <input type="text" id="modal-new-status-display" class="form-control" readonly>
                    <input type="hidden" id="modal-new-status" name="new_status">
                </div>
                <div class="form-group">
                    <label for="modal-notes">Catatan (Opsional):</label>
                    <textarea id="modal-notes" name="notes" class="form-control" rows="3" placeholder="Tambahkan catatan di sini..."></textarea>
                </div>
                <button type="submit" class="btn btn-approve">Simpan</button>
            </form>
        </div>
    </div>

    <div id="recapPaymentModal" class="modal">
        <div class="modal-content">
            <span class="close-button" onclick="closeModal('recapPaymentModal')">&times;</span>
            <h2>Pembayaran Rekap PB <span id="recapModalRecipientTypeDisplay"></span></h2>
            <p>Melakukan pembayaran rekap untuk <strong id="recapModalRecipientNameDisplay"></strong> (No. Rek: <strong id="recapModalBankAccountNumberDisplay">Memuat...</strong>) untuk periode <strong id="recapModalPeriodDisplay"></strong>.</p>
            <p class="text-danger"><i class="fas fa-info-circle"></i> Pastikan nominal pembayaran di bawah sesuai dengan perhitungan yang ditampilkan di kartu "Estimasi Dibayarkan".</p>

            <form id="processRecapPaymentForm" enctype="multipart/form-data">
                <input type="hidden" name="process_pb_recap_payment" value="1">
                <input type="hidden" id="recap-modal-recipient-user-id" name="recipient_user_id">
                <input type="hidden" id="recap-modal-recipient-type-hidden" name="recipient_type">
                <input type="hidden" id="recap-modal-period-type-hidden" name="recap_period_type">
                <input type="hidden" id="recap-modal-month-hidden" name="recap_month">
                <input type="hidden" id="recap-modal-year-hidden" name="recap_year">

                <div class="form-group">
                    <label for="recap_amount_paid">Nominal Dibayarkan (Rp):</label>
                    <input type="text" id="recap_amount_paid" name="amount_paid" class="form-control" placeholder="Contoh: 1.000.000" required pattern="[0-9.,]+" title="Hanya angka, koma, dan titik yang diizinkan.">
                </div>

                <div class="form-group">
                    <label for="recap_payment_proof_file">Pilih File Bukti Transfer (JPG, PNG, PDF, maks 5MB):</label>
                    <input type="file" id="recap_payment_proof_file" name="payment_proof_file" class="form-control" accept=".jpg,.jpeg,.png,.pdf" required>
                </div>
                <div class="form-group">
                    <label for="recap_notes_transfer">Catatan (Opsional):</label>
                    <textarea id="recap_notes_transfer" name="notes_transfer" class="form-control" rows="3" placeholder="Tambahkan catatan mengenai transfer ini..."></textarea>
                </div>
                <button type="submit" class="btn btn-primary"><i class="fas fa-upload"></i> Proses Pembayaran Rekap</button>
            </form>
        </div>
    </div>
    <div id="editUserModal" class="modal">
        <div class="modal-content">
            <span class="close-button" onclick="closeModal('editUserModal')">&times;</span>
            <h2>Reset Kata Sandi Anggota</h2>
            <form id="editUserForm">
                <input type="hidden" id="edit-user-id" name="user_id">

                <hr> <h3><i class="fas fa-key"></i> Reset Kata Sandi Pengguna</h3>
                <div class="alert alert-warning" role="alert">
                    <i class="fas fa-exclamation-triangle"></i> Masukkan kata sandi baru di bawah untuk mereset kata sandi anggota ini.
                </div>
                <div class="form-group">
                    <label for="edit-new-password">Kata Sandi Baru:</label>
                    <input type="password" id="edit-new-password" name="new_password" class="form-control">
                </div>
                <div class="form-group">
                    <label for="edit-confirm-new-password">Konfirmasi Kata Sandi Baru:</label>
                    <input type="password" id="edit-confirm-new-password" name="confirm_new_password" class="form-control">
                </div>
                <hr>

                <button type="button" class="btn btn-warning" id="resetPasswordBtn"><i class="fas fa-lock"></i> Reset Kata Sandi Ini</button>
            </form>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script src="../js/kejurnas_pb.js"></script>
    <script>
    // Constants - Mendapatkan referensi ke elemen-elemen DOM
    const statusModal = document.getElementById("statusModal");
    const modalApplicationId = document.getElementById("modal-application-id");
    const modalNewStatusDisplay = document.getElementById("modal-new-status-display");
    const modalNewStatus = document.getElementById("modal-new-status");
    const modalNotes = document.getElementById("modal-notes");
    const updateStatusForm = document.getElementById("updateStatusForm");

    const ktaTableContainer = document.getElementById("kta-applications-table-container");
    const activityLogTableContainer = document.getElementById("activity-log-table-container");
    const usersTableContainer = document.getElementById("users-table-container");
    const issuedKtaCardsContainer = document.getElementById("issued-kta-cards-container");
    const issuedKTAProvinceFilter = document.getElementById("issuedKTAProvinceFilter");
    const issuedKTACityFilter = document.getElementById("issuedKTACityFilter");
    const issuedKTASearchInput = document.getElementById("issuedKTASearchInput");

    const saldoOverviewSection = document.getElementById("saldo_overview_section");
    const transactionHistoryTableContainer = document.getElementById("transaction-history-table-container");
    const exportSaldoExcelBtn = document.getElementById("exportSaldoExcelBtn");

    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    const sidebarToggle = document.getElementById('sidebar-toggle');

    const pbKtaConfigForm = document.getElementById('pbKtaConfigForm');
    const pbKetuaUmumNameInput = document.getElementById('pb_ketua_umum_name');
    
    // Elemen Kanvas Tanda Tangan
    const pbSignatureCanvas = document.getElementById('pbSignatureCanvas');
    const clearPbSignatureBtn = document.getElementById('clearPbSignatureBtn');
    const pbSignatureDataUrlInput = document.getElementById('pb_signature_data_url');
    const currentPbSignaturePreview = document.getElementById('currentPbSignaturePreview');
    const currentPbSignatureLabel = document.getElementById('currentPbSignatureLabel');
    
    let pbCtx; // Konteks untuk kanvas tanda tangan PB
    let isPbDrawing = false;
    let pbLastX = 0;
    let pbLastY = 0;

    const changePasswordForm = document.getElementById('changePasswordForm');
    const memberRoleFilter = document.getElementById('memberRoleFilter');
    const memberSearchInput = document.getElementById('memberSearchInput');
    const exportRekeningExcelBtn = document.getElementById('exportRekeningExcelBtn');

    const recapPaymentModal = document.getElementById("recapPaymentModal");
    const recapModalRecipientTypeDisplay = document.getElementById("recapModalRecipientTypeDisplay");
    const recapModalRecipientNameDisplay = document.getElementById("recapModalRecipientNameDisplay");
    const recapModalBankAccountNumberDisplay = document.getElementById("recapModalBankAccountNumberDisplay");
    const recapModalPeriodDisplay = document.getElementById("recapModalPeriodDisplay");
    const processRecapPaymentForm = document.getElementById("processRecapPaymentForm");
    const recapPaymentProofFileInput = document.getElementById("recap_payment_proof_file");
    const recapNotesTransferInput = document.getElementById("recap_notes_transfer");
    const recapAmountPaidInput = document.getElementById("recap_amount_paid");

    const recapRecipientTypeSelect = document.getElementById("recapRecipientType");
    const recapRecipientSelectGroup = document.getElementById("recapRecipientSelectGroup");
    const recapRecipientIdSelect = document.getElementById("recapRecipientId");
    const recapPeriodTypeSelect = document.getElementById("recapPeriodType");
    const recapMonthGroup = document.getElementById("recapMonthGroup");    
    const recapMonthSelect = document.getElementById("recapMonth");
    const recapYearSelect = document.getElementById("recapYear");
    const openRecapPaymentModalBtn = document.getElementById("openRecapPaymentModalBtn");

    const recapModalRecipientUserId = document.getElementById("recap-modal-recipient-user-id");
    const recapModalRecipientTypeHidden = document.getElementById("recap-modal-recipient-type-hidden");
    const recapModalPeriodTypeHidden = document.getElementById("recap-modal-period-type-hidden");
    const recapModalMonthHidden = document.getElementById("recap-modal-month-hidden");
    const recapModalYearHidden = document.getElementById("recap-modal-year-hidden");

    const editUserModal = document.getElementById("editUserModal");
    const editUserId = document.getElementById("edit-user-id");
    const editNewPassword = document.getElementById("edit-new-password");
    const editConfirmNewPassword = document.getElementById("edit-confirm-new-password");
    const resetPasswordBtn = document.getElementById("resetPasswordBtn");

    const saldoProvinceFilter = document.getElementById("saldoProvinceFilter");
    const saldoCityFilter = document.getElementById("saldoCityFilter");
    const saldoMonthFilter = document.getElementById("saldoMonthFilter");
    const saldoYearFilter = document.getElementById("saldoYearFilter");
    const saldoKTAStatusFilter = document.getElementById("saldoKTAStatusFilter");

    const estimateToPengdaDisplay = document.getElementById("estimate-to-pengda-display");
    const estimateToPengcabDisplay = document.getElementById("estimate-to-pengcab-display");
    const estimateToDeveloperDisplay = document.getElementById("estimate-to-developer-display");

    const ktaProvinceFilter = document.getElementById("ktaProvinceFilter");
    const ktaCityFilter = document.getElementById("ktaCityFilter");
    const ktaSearchInput = document.getElementById("ktaSearchInput");
    let currentKtaTablePage = 1;
    let currentKtaTableStatusFilter = '';

    const ktaDetailModal = document.getElementById("ktaDetailModal");
    const ktaDetailIdSpan = document.getElementById("kta-detail-id");
    const ktaDetailContent = document.getElementById("kta-detail-content");

    // --- Modal Functions ---
    function openModal(modalElement, data = {}) {
        if (modalElement.id === 'statusModal') {
            modalApplicationId.value = data.appId || '';
            modalNewStatus.value = data.status || '';
            modalNewStatusDisplay.value = data.status === 'approved_pb' ? 'Setujui oleh PB' : 'Tolak';
            modalNotes.value = data.initialNotes || '';
        } else if (modalElement.id === 'recapPaymentModal') {
            recapModalRecipientUserId.value = data.recipientUserId || '';
            recapModalRecipientTypeHidden.value = data.recipientType || '';
            recapModalPeriodTypeHidden.value = data.periodType || '';
            recapModalMonthHidden.value = data.month || '';
            recapModalYearHidden.value = data.year || '';
            
            recapPaymentProofFileInput.value = '';
            recapNotesTransferInput.value = '';
            recapAmountPaidInput.value = '';

            recapModalRecipientTypeDisplay.textContent = data.recipientType === 'pengda' ? 'ke Pengda' : 'ke Pengcab';
            recapModalRecipientNameDisplay.textContent = data.recipientName || 'Memuat...';
            recapModalBankAccountNumberDisplay.textContent = 'Memuat...';
            
            let periodText = '';
            if (data.periodType === 'monthly') {
                const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
                periodText = `Bulan ${monthNames[data.month - 1]} Tahun ${data.year}`;
            } else if (data.periodType === 'yearly') {
                periodText = `Tahun ${data.year}`;
            } else if (data.periodType === 'weekly') {
                periodText = `Minggu ke-${data.week} Tahun ${data.year}`;    
            }
            recapModalPeriodDisplay.textContent = periodText;

            fetchRecipientBankDetailsForRecap(data.recipientUserId, data.recipientType, data.month, data.year);
        } else if (modalElement.id === 'editUserModal') {
            editUserId.value = data.userId || '';
            editNewPassword.value = '';
            editConfirmNewPassword.value = '';
        } else if (modalElement.id === 'ktaDetailModal') {
            ktaDetailIdSpan.textContent = `ID: ${data.appId}`;
            ktaDetailContent.innerHTML = '<p class="text-center text-muted">Loading application details...</p>';
            fetchKtaDetails(data.appId);
        }
        modalElement.classList.add('is-visible');
        modalElement.style.display = "flex";
    }

    function closeModal(modalId) {
        const modalElement = document.getElementById(modalId);
        if (modalElement) {
            modalElement.classList.remove('is-visible');
            setTimeout(() => {
                modalElement.style.display = "none";
            }, 300);
        }
    }

    function openStatusModal(appId, status, initialNotes = '') {
        openModal(statusModal, { appId, status, initialNotes });
    }
    
    function openKtaDetailModal(appId) {
        openModal(ktaDetailModal, { appId });
    }

    function openRecapPaymentModal(recipientUserId, recipientType, periodType, month, year, recipientName) {
        openModal(recapPaymentModal, {    
            recipientUserId,    
            recipientType,    
            periodType,    
            month,    
            year,    
            recipientName    
        });
    }

    function fetchRecipientBankDetailsForRecap(recipientUserId, recipientType, month, year) {
        recapModalBankAccountNumberDisplay.textContent = 'Memuat...';
        recapAmountPaidInput.value = '';    

        const url = `pb.php?fetch_recipient_bank_details=true&recipient_user_id=${recipientUserId}&recipient_type=${recipientType}&recap_month=${month}&recap_year=${year}`;

        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    recapModalBankAccountNumberDisplay.textContent = data.bank_account_number;
                    recapModalRecipientNameDisplay.textContent = data.recipient_name;
                    recapAmountPaidInput.value = formatNumberToRupiah(data.amount_to_pay);    
                } else {
                    recapModalBankAccountNumberDisplay.textContent = 'Error: ' + data.message;
                    recapModalRecipientNameDisplay.textContent = 'Tidak Ditemukan';
                    Swal.fire({
                        icon: 'error',
                        title: 'Failed to Load Account!',
                        text: `Failed to fetch account number for ${recipientType}. ${data.message}`,
                        confirmButtonText: 'Close'
                    });
                }
            })
            .catch(error => {
                console.error('Error fetching bank details:', error);
                recapModalBankAccountNumberDisplay.textContent = 'Error: ' + error.message;
                recapModalRecipientNameDisplay.textContent = 'An Error Occurred';
                Swal.fire({
                    icon: 'error',
                    title: 'Network Error!',
                    text: `An error occurred while fetching account details: ${error.message}.`,
                    confirmButtonText: 'Close'
                });
            });
    }

    function formatNumberToRupiah(number) {
        if (isNaN(number) || number === null) return '';
        let parts = number.toString().split('.');
        let integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        let decimalPart = parts.length > 1 ? ',' + parts[1] : '';
        return integerPart + decimalPart;
    }

    function formatRupiah(input) {
        let value = input.value.replace(/[^0-9]/g, '');
        if (value) {
            value = parseInt(value, 10).toString();
            input.value = formatNumberToRupiah(value);
        } else {
            input.value = '';
        }
    }


    // --- KTA Generation Functions ---
    function generatePbKta(appId) {
        Swal.fire({
            title: 'Confirm PB KTA Generation',
            text: 'Are you sure you want to generate the KTA for this application? Please ensure you have correctly filled in the PB KTA configuration (Chairman Name and Signature).',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#dc3545',
            confirmButtonText: 'Yes, Generate KTA!',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    title: 'Processing KTA Generation...',
                    text: 'Please wait, this process may take a moment.',
                    allowOutsideClick: false,
                    didOpen: () => { Swal.showLoading(); }
                });

                const formData = new FormData();
                formData.append('generate_pb_kta_ajax', '1');
                formData.append('application_id', appId);

                fetch('pb.php', {
                    method: 'POST',
                    body: formData
                })
                .then(response => {
                    if (response.status === 204 || response.headers.get("content-length") === "0") {
                        console.warn("Received empty response from server.");
                        return { success: false, message: "Server returned an empty response." };
                    }
                    const contentType = response.headers.get("content-type");
                    if (contentType && contentType.indexOf("application/json") !== -1) {
                        return response.json();
                    } else {
                        return response.text().then(text => {
                            console.error('Server returned non-JSON response from generate_pb_kta_ajax:', text);
                            throw new Error(`Server Error (non-JSON response). Check console for details: ${text.substring(0, 100)}...`);
                        });
                    }
                })
                .then(data => {
                    Swal.close();
                    if (data.success) {
                        let successText = data.message;
                        if (data.kta_url) {
                            successText += `<br><br><a href="${data.kta_url}" target="_blank" style="background-color: var(--primary-color); color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 10px;"><i class="fas fa-file-pdf"></i> View Generated PB KTA</a>`;
                        }
                        Swal.fire({
                            icon: 'success',
                            title: 'Success!',
                            html: successText,
                            showConfirmButton: true,
                            confirmButtonText: 'OK'
                        });
                        loadKtaTable(currentKtaTablePage, currentKtaTableStatusFilter);
                        loadActivityLog();
                        loadIssuedKTA();
                        loadSaldoDataAndHistory();    
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Failed!',
                            text: data.message,
                            showConfirmButton: true
                        });
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    Swal.close();
                    Swal.fire({
                        icon: 'error',
                        title: 'An Error Occurred!',
                        text: `An error occurred: ${error.message}. Please try again.`,
                        showConfirmButton: true
                    });
                });
            }
        });
    }

    // --- Event Listener for Status Update Form ---
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target.id);
        }
    };

    updateStatusForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = new FormData(this);

        Swal.fire({
            title: 'Processing...',
            text: 'Please wait...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        fetch('pb.php', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (response.status === 204 || response.headers.get("content-length") === "0") {
                console.warn("Server returned an empty response.");
                return { success: false, message: "Server returned an empty response." };
            }
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                return response.json();
            } else {
                return response.text().then(text => {
                    console.error('Server returned non-JSON response:', text);
                    throw new Error(`Server Error (non-JSON response). Check console for details: ${text.substring(0, 100)}...`);
                });
            }
        })
        .then(data => {
            Swal.close();

            if (data.success) {
                closeModal('statusModal');
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: data.message,
                    showConfirmButton: false,
                    timer: 2000,
                    showClass: {
                        popup: 'animate__animated animate__fadeInDown animate__faster'
                    },
                    hideClass: {
                        popup: 'animate__animated animate__fadeOutUp animate__faster'
                    }
                });

                loadKtaTable(currentKtaTablePage, currentKtaTableStatusFilter);
                updateKtaStatusCounts();
                loadActivityLog();
                loadSaldoDataAndHistory();
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Failed!',
                    text: data.message,
                    showConfirmButton: true,
                    confirmButtonText: 'Close',
                    showClass: {
                        popup: 'animate__animated animate__shakeX animate__faster'
                    },
                    hideClass: {
                        popup: 'animate__animated animate__fadeOutUp animate__faster'
                    }
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.close();
            Swal.fire({
                icon: 'error',
                title: 'An Error Occurred!',
                text: `An error occurred: ${error.message}. Please try again.`,
                showConfirmButton: true,
                confirmButtonText: 'Close',
                showClass: {
                    popup: 'animate__animated animate__shakeX animate__faster'
                },
                hideClass: {
                    popup: 'animate__animated animate__fadeOutUp animate__faster'
                }
            });
        });
    });

    // NEW Event listener for PB Recap Payment Form
    processRecapPaymentForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = new FormData(this);
        const amountPaid = recapAmountPaidInput.value;
        const file = recapPaymentProofFileInput.files[0];

        if (!file) {
            Swal.fire('Error!', 'Please select a transfer proof file.', 'error');
            return;
        }

        const cleanAmount = parseFloat(amountPaid.replace(/\./g, '').replace(',', '.'));
        if (isNaN(cleanAmount) || cleanAmount <= 0) {
            Swal.fire('Error!', 'Invalid amount paid. Please enter a positive number.', 'error');
            return;
        }

        formData.set('amount_paid', cleanAmount);    

        Swal.fire({
            title: 'Processing Recap Payment...',
            text: 'Please wait, this process may take a moment.',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        fetch('pb.php', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (response.status === 204 || response.headers.get("content-length") === "0") {
                console.warn("Server returned an empty response.");
                return { success: false, message: "Server returned an empty response." };
            }
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                return response.json();
            } else {
                return response.text().then(text => {
                    console.error('Server returned non-JSON response for recap payment:', text);
                    throw new Error(`Server Error (non-JSON response). Check console for details: ${text.substring(0, 100)}...`);
                });
            }
        })
        .then(data => {
            Swal.close();
            if (data.success) {
                closeModal('recapPaymentModal');
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: data.message,
                    showConfirmButton: false,
                    timer: 2000,
                    showClass: {
                        popup: 'animate__animated animate__fadeInDown animate__faster'
                    },
                    hideClass: {
                        popup: 'animate__animated animate__fadeOutUp animate__faster'
                    }
                });
                loadSaldoDataAndHistory();    
                loadKtaTable(currentKtaTablePage, currentKtaTableStatusFilter);    
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Failed!',
                    text: data.message,
                    showConfirmButton: true,
                    confirmButtonText: 'Close',
                    showClass: {
                        popup: 'animate__animated animate__shakeX animate__faster'
                    },
                    hideClass: {
                        popup: 'animate__animated animate__fadeOutUp animate__faster'
                    }
                });
            }
        })
        .catch(error => {
            console.error('Error processing recap payment:', error);
            Swal.close();
            Swal.fire({
                icon: 'error',
                title: 'An Error Occurred!',
                text: `An error occurred while processing recap payment: ${error.message}. Please try again.`,
                showConfirmButton: true,
                confirmButtonText: 'Close',
                showClass: {
                    popup: 'animate__animated animate__shakeX animate__faster'
                },
                hideClass: {
                    popup: 'animate__animated animate__fadeOutUp animate__faster'
                }
            });
        });
    });


    // --- Table Loading Functions ---
    let currentKtaLimit = 5;    

    /**
     * Loads the KTA applications table with filters and pagination.
     * @param {number} page The page to load.
     * @param {string} statusFilter The status to filter by (e.g., 'approved_pengda', or empty for all).
     */
    function loadKtaTable(page = 1, statusFilter = '') {
        currentKtaTablePage = page;
        currentKtaTableStatusFilter = statusFilter;

        const provinceIdFilter = ktaProvinceFilter.value;
        const cityIdFilter = ktaCityFilter.value;
        const searchQuery = ktaSearchInput.value;

        const url = `pb.php?fetch_kta_table_only=true` +
                                     `&page=${currentKtaTablePage}` +
                                     `&limit=${currentKtaLimit}` +
                                     `&status_filter=${encodeURIComponent(statusFilter)}` +
                                     `&province_id_filter=${encodeURIComponent(provinceIdFilter)}` +
                                     `&city_id_filter=${encodeURIComponent(cityIdFilter)}` +
                                     `&search_query=${encodeURIComponent(searchQuery)}`;

        ktaTableContainer.innerHTML = '<p class="text-center text-muted no-data-message animated fadeIn">Loading KTA applications...</p>';

        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    let tableHtml = '';
                    if (data.data.length === 0) {
                        tableHtml = '<p class="text-center text-muted no-data-message animated fadeIn">No KTA applications to handle with these criteria.</p>';
                    } else {
                        tableHtml = `
                            <div class="table-responsive animated fadeIn">
                                <table class="data-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Club</th>
                                            <th>PIC</th>
                                            <th>Email</th>
                                            <th>Phone</th>
                                            <th>Province</th>
                                            <th>Regency</th>
                                            <th>Address</th>
                                            <th>Logo</th>
                                            <th>AD</th>
                                            <th>ART</th>
                                            <th>SK</th>
                                            <th>User Payment Proof</th>
                                            <th>User Paid Amount</th>
                                            <th>Pengcab KTA</th>
                                            <th>Pengda KTA</th>
                                            <th>PB KTA</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                        `;
                        let animationDelay = 0;
                        data.data.forEach(app => {
                            animationDelay += 0.05;
                            tableHtml += `
                                <tr class="animated fadeInUp" style="animation-delay: ${animationDelay}s;" onclick="openKtaDetailModal(${app.id})">
                                    <td data-label="ID">${app.id}</td>
                                    <td data-label="Club Name">${app.club_name}</td>
                                    <td data-label="PIC">${app.leader_name}</td>
                                    <td data-label="Email">${app.user_email}</td>
                                    <td data-label="Phone">${app.user_phone}</td>
                                    <td data-label="Province">${app.province}</td>
                                    <td data-label="Regency">${app.regency}</td>
                                    <td data-label="Club Address">${app.club_address}</td>
                                    <td data-label="Logo">${app.logo_path_display ? `<a href="${app.logo_path_display}" target="_blank" class="file-link" onclick="event.stopPropagation();"><i class="fas fa-image"></i> View</a>` : `<span class="text-muted">Not Uploaded</span>`}</td>
                                    <td data-label="AD">${app.ad_file_path_display ? `<a href="${app.ad_file_path_display}" target="_blank" class="file-link" onclick="event.stopPropagation();"><i class="fas fa-file-pdf"></i> View</a>` : `<span class="text-muted">Not Uploaded</span>`}</td>
                                    <td data-label="ART">${app.art_file_path_display ? `<a href="${app.art_file_path_display}" target="_blank" class="file-link" onclick="event.stopPropagation();"><i class="fas fa-file-pdf"></i> View</a>` : `<span class="text-muted">Not Uploaded</span>`}</td>
                                    <td data-label="SK">${app.sk_file_path_display ? `<a href="${app.sk_file_path_display}" target="_blank" class="file-link" onclick="event.stopPropagation();"><i class="fas fa-file-pdf"></i> View</a>` : `<span class="text-muted">Not Uploaded</span>`}</td>
                                    <td data-label="User Payment Proof">${app.payment_proof_path_display ? `<a href="${app.payment_proof_path_display}" target="_blank" class="file-link" onclick="event.stopPropagation();"><i class="fas fa-receipt"></i> View</a>` : `<span class="text-muted">Not Uploaded</span>`}</td>
                                    <td data-label="User Paid Amount"> <span class="badge badge-success">${app.nominal_paid_display}</span></td>
                                    <td data-label="Pengcab KTA">
                                        ${app.generated_kta_file_path_pengcab_display ? `<a href="${app.generated_kta_file_path_pengcab_display}" target="_blank" class="file-link" onclick="event.stopPropagation();"><i class="fas fa-file-pdf"></i> View Pengcab KTA</a>` : `<span class="text-muted">Not Generated</span>`}
                                    </td>
                                    <td data-label="Pengda KTA">
                                        ${app.generated_kta_file_path_pengda_display ? `<a href="${app.generated_kta_file_path_pengda_display}" target="_blank" class="file-link" onclick="event.stopPropagation();"><i class="fas fa-file-pdf"></i> View Pengda KTA</a>` : `<span class="text-muted">Not Generated</span>`}
                                    </td>
                                    <td data-label="PB KTA">
                                        ${app.generated_kta_file_path_pb_display ? `<a href="${app.generated_kta_file_path_pb_display}" target="_blank" class="file-link" onclick="event.stopPropagation();"><i class="fas fa-file-pdf"></i> View PB KTA</a>` : `<span class="text-muted">Not Generated</span>`}
                                    </td>
                                    <td data-label="Status"><span class="status-badge status-${app.status}">${app.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span></td>
                                    <td data-label="Actions" class="actions">
                                        ${(app.status === 'approved_pengda' || app.status === 'pending_pengda_resubmit' || app.status === 'rejected_pb') ? `
                                            <button class="btn btn-approve" onclick="event.stopPropagation(); openStatusModal(${app.id}, 'approved_pb', '${app.notes_pb || ''}')"><i class="fas fa-check"></i> Approve</button>
                                            <button class="btn btn-reject" onclick="event.stopPropagation(); openStatusModal(${app.id}, 'rejected', '${app.notes_pb || ''}')"><i class="fas fa-times"></i> Reject</button>
                                        ` : (app.status === 'approved_pb' && !app.generated_kta_file_path_pb) ? `
                                            <button class="btn btn-generate-kta-pb" onclick="event.stopPropagation(); generatePbKta(${app.id})"><i class="fas fa-file-pdf"></i> Generate PB KTA</button>
                                        ` : (app.status === 'kta_issued') ? `
                                            <span class="status-badge status-kta-issued animated pulse"><i class="fas fa-check-circle"></i> KTA Issued</span>
                                        ` : `
                                            <span class="text-muted">No Action</span>
                                        `}
                                    </td>
                                </tr>
                            `;
                        });
                        tableHtml += `
                                    </tbody>
                                </table>
                            </div>
                            <div class="pagination-controls animated fadeIn">
                                <button class="btn btn-primary" onclick="loadKtaTable(${data.current_page - 1}, '${statusFilter}')" ${data.current_page <= 1 ? 'disabled' : ''}>
                                    <i class="fas fa-chevron-left"></i> Previous
                                </button>
                                <span class="pagination-info">Page ${data.current_page} of ${data.total_pages}</span>
                                <button class="btn btn-primary" onclick="loadKtaTable(${data.current_page + 1}, '${statusFilter}')" ${data.current_page >= data.total_pages ? 'disabled' : ''}>
                                    Next <i class="fas fa-chevron-right"></i>
                                </button>
                            </div>
                        `;
                    }
                    ktaTableContainer.innerHTML = tableHtml;
                } else {
                    ktaTableContainer.innerHTML = `<div class="alert alert-danger animated fadeIn"><i class="fas fa-exclamation-circle"></i> Failed to load KTA applications list: ${data.message}</div>`;
                }
            })
            .catch(error => {
                console.error('Error loading KTA table:', error);
                ktaTableContainer.innerHTML = `<div class="alert alert-danger animated fadeIn"><i class="fas fa-exclamation-circle"></i> Failed to load KTA applications list: ${error.message}</div>`;
            });
    }

    function loadCitiesForKtaFilter(provinceId) {
        ktaCityFilter.innerHTML = '<option value="">Loading...</option>';
        ktaCityFilter.disabled = true;

        if (!provinceId) {
            ktaCityFilter.innerHTML = '<option value="">All Cities/Regencies</option>';
            ktaCityFilter.disabled = false;
            return;
        }

        fetch(`pb.php?get_cities_by_province=true&province_id=${provinceId}`)
            .then(response => response.json())
            .then(data => {
                ktaCityFilter.innerHTML = '<option value="">All Cities/Regencies</option>';
                if (data.success && data.cities.length > 0) {
                    data.cities.forEach(city => {
                        const option = document.createElement('option');
                        option.value = city.id;
                        option.textContent = city.name;
                        ktaCityFilter.appendChild(option);
                    });
                } else {
                    ktaCityFilter.innerHTML = '<option value="">No cities/regencies found</option>';
                }
                ktaCityFilter.disabled = false;
            })
            .catch(error => {
                console.error('Error loading cities for KTA filter:', error);
                ktaCityFilter.innerHTML = '<option value="">Failed to load cities</option>';
                ktaCityFilter.disabled = false;
            });
    }

    function resetKtaTableFilters() {
        ktaProvinceFilter.value = '';
        ktaCityFilter.innerHTML = '<option value="">All Cities/Regencies</option>';
        ktaCityFilter.disabled = false;
        ktaSearchInput.value = '';
        loadKtaTable(1, '');
    }

    function fetchKtaDetails(applicationId) {
        fetch(`pb.php?fetch_single_kta_application=true&application_id=${applicationId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success && data.data) {
                    const app = data.data;
                    ktaDetailContent.innerHTML = `
                        <div class="modal-body-detail">
                            <p><strong>Club:</strong> ${app.club_name}</p>
                            <p><strong>Person in Charge:</strong> ${app.leader_name}</p>
                            <p><strong>Email:</strong> ${app.user_email}</p>
                            <p><strong>Phone:</strong> ${app.user_phone}</p>
                            <p><strong>Province:</strong> ${app.province}</p>
                            <p><strong>Regency:</strong> ${app.regency}</p>
                            <p><strong>Club Address:</strong> ${app.club_address}</p>
                            <p><strong>Application Date:</strong> ${app.created_at}</p>
                            <p><strong>Status:</strong> <span class="status-badge status-${app.status}">${app.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span></p>

                            <h4>Documents:</h4>
                            <p><strong>Logo:</strong> ${app.logo_path_display ? `<a href="${app.logo_path_display}" target="_blank" class="file-link"><i class="fas fa-image"></i> View</a>` : `<span class="text-muted">Not Uploaded</span>`}</p>
                            <p><strong>AD:</strong> ${app.ad_file_path_display ? `<a href="${app.ad_file_path_display}" target="_blank" class="file-link"><i class="fas fa-file-pdf"></i> View</a>` : `<span class="text-muted">Not Uploaded</span>`}</p>
                            <p><strong>ART:</strong> ${app.art_file_path_display ? `<a href="${app.art_file_path_display}" target="_blank" class="file-link"><i class="fas fa-file-pdf"></i> View</a>` : `<span class="text-muted">Not Uploaded</span>`}</p>
                            <p><strong>SK:</strong> ${app.sk_file_path_display ? `<a href="${app.sk_file_path_display}" target="_blank" class="file-link"><i class="fas fa-file-pdf"></i> View</a>` : `<span class="text-muted">Not Uploaded</span>`}</p>
                            <p><strong>User Payment Proof:</strong> ${app.payment_proof_path_display ? `<a href="${app.payment_proof_path_display}" target="_blank" class="file-link"><i class="fas fa-receipt"></i> View</a>` : `<span class="text-muted">Not Uploaded</span>`}</p>
                            <p><strong>User Paid Amount:</strong> <span class="badge badge-success">${app.nominal_paid_display}</span></p>

                            <h4>PB Payments:</h4>
                            <p><strong>PB to Pengcab Amount:</strong> <span class="badge badge-info">${app.amount_pb_to_pengcab_display}</span></p>
                            <p><strong>PB to Pengcab Proof:</strong> ${app.pb_to_pengcab_payment_proof_path_display ? `<a href="${app.pb_to_pengcab_payment_proof_path_display}" target="_blank" class="file-link"><i class="fas fa-upload"></i> View (Recap)</a>` : `<span class="text-muted">None</span>`}</p>
                            <p><strong>PB to Pengda Amount:</strong> <span class="badge badge-info">${app.amount_pb_to_pengda_display}</span></p>
                            <p><strong>PB to Pengda Proof:</strong> ${app.pb_to_pengda_payment_proof_path_display ? `<a href="${app.pb_to_pengda_payment_proof_path_display}" target="_blank" class="file-link"><i class="fas fa-upload"></i> View (Recap)</a>` : `<span class="text-muted">None</span>`}</p>

                            <h4>Generated KTA:</h4>
                            <p><strong>Pengcab KTA:</strong> ${app.generated_kta_file_path_pengcab_display ? `<a href="${app.generated_kta_file_path_pengcab_display}" target="_blank" class="file-link"><i class="fas fa-file-pdf"></i> View Pengcab KTA</a>` : `<span class="text-muted">Not Generated</span>`}</p>
                            <p><strong>Pengda KTA:</strong> ${app.generated_kta_file_path_pengda_display ? `<a href="${app.generated_kta_file_path_pengda_display}" target="_blank" class="file-link"><i class="fas fa-file-pdf"></i> View Pengda KTA</a>` : `<span class="text-muted">Not Generated</span>`}</p>
                            <p><strong>PB KTA:</strong> ${app.generated_kta_file_path_pb_display ? `<a href="${app.generated_kta_file_path_pb_display}" target="_blank" class="file-link"><i class="fas fa-file-pdf"></i> View PB KTA</a>` : `<span class="text-muted">Not Generated</span>`}</p>
                            <p><strong>Barcode ID:</strong> ${app.kta_barcode_unique_id || 'N/A'}</p>
                            <p><strong>Issued Date (PB):</strong> ${app.kta_issued_at || 'N/A'}</p>

                            <h4>Admin Notes:</h4>
                            <p><strong>Pengda Notes:</strong> ${app.notes_pengda || 'None'}</p>
                            <p><strong>PB Notes:</strong> ${app.notes_pb || 'None'}</p>
                            <p><strong>Rejection Reason:</strong> ${app.rejection_reason || 'None'}</p>
                        </div>
                    `;
                } else {
                    ktaDetailContent.innerHTML = `<p class="text-center text-danger"><i class="fas fa-exclamation-circle"></i> Failed to load details: ${data.message}</p>`;
                }
            })
            .catch(error => {
                console.error('Error fetching KTA detail:', error);
                ktaDetailContent.innerHTML = `<p class="text-center text-danger"><i class="fas fa-exclamation-circle"></i> Network error: ${error.message}</p>`;
            });
    }

    // Function to load all users table
    let currentPageUsers = 1;
    const itemsPerPageUsers = 5;

    function loadUsersTable(page = 1) {
        currentPageUsers = page;
        const roleFilter = memberRoleFilter.value;
        const searchQuery = memberSearchInput.value;
        const url = `pb.php?fetch_users_table_only=true&role_filter=${encodeURIComponent(roleFilter)}&search_query=${encodeURIComponent(searchQuery)}&page=${currentPageUsers}&limit=${itemsPerPageUsers}`;

        usersTableContainer.innerHTML = '<p class="text-center text-muted no-data-message animated fadeIn">Loading member list...</p>';

        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    let tableHtml = '';
                    if (data.data.length === 0) {
                        tableHtml = '<p class="text-center text-muted no-data-message animated fadeIn">No members found with these criteria.</p>';
                    } else {
                        tableHtml = `
                            <div class="table-responsive animated fadeIn">
                                <table class="data-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Username</th>
                                            <th>Email</th>
                                            <th>Phone</th>
                                            <th>Club/Organization</th>
                                            <th>Role</th>
                                            <th>Province</th>
                                            <th>City/Regency</th>
                                            <th>Account No.</th>
                                            <th>Logo</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                        `;
                        let animationDelay = 0;
                        data.data.forEach(user => {
                            animationDelay += 0.05;
                            tableHtml += `
                                <tr class="animated fadeInUp" style="animation-delay: ${animationDelay}s;">
                                    <td data-label="ID">${user.id}</td>
                                    <td data-label="Username">${user.username}</td>
                                    <td data-label="Email">${user.email}</td>
                                    <td data-label="Phone">${user.phone}</td>
                                    <td data-label="Club/Organization">${user.club_name}</td>
                                    <td data-label="Role"><span class="role-badge role-${user.role_name.toLowerCase().replace(/ /g, '-')}}">${user.role_name}</span></td>
                                    <td data-label="Province">${user.province_name || 'N/A'}</td>
                                    <td data-label="City/Regency">${user.city_name || 'N/A'}</td>
                                    <td data-label="Account No.">
                                        ${(user.role_name === 'Pengurus Daerah' || user.role_name === 'Pengurus Cabang') ? (user.bank_account_number || 'Not Set') : 'N/A'}
                                    </td>
                                    <td data-label="Logo">
                                        ${user.logo_path_display ? `
                                            <div class="file-actions">
                                               
                                                <a href="download_logo.php?kta_id=${user.kta_application_id}" 
                                                   class="btn btn-download" 
                                                   target="_blank"
                                                   title="Download Logo">
                                                    Download
                                                </a>
                                            </div>
                                        ` : `
                                            <span class="text-muted">Tidak ada logo</span>
                                        `}
                                    </td>
                                    <td data-label="Actions" class="actions">
                                        ${user.role_id != 4 ? `
                                            <button class="btn btn-edit" onclick="openEditUserModal(${user.id})">
                                                <i class="fas fa-key"></i> Reset Password
                                            </button>
                                            <button class="btn btn-danger" onclick="confirmDeleteUser(${user.id}, '${user.username}')">
                                                <i class="fas fa-trash-alt"></i> Delete
                                            </button>
                                        ` : `
                                            <span class="text-muted">No Action</span>
                                        `}
                                    </td>
                                </tr>
                            `;
                        });
                        tableHtml += `
                                    </tbody>
                                </table>
                            </div>
                            <div class="pagination-controls animated fadeIn">
                                <button class="btn btn-primary" onclick="loadUsersTable(${data.current_page - 1})" ${data.current_page <= 1 ? 'disabled' : ''}>
                                    <i class="fas fa-chevron-left"></i> Previous
                                </button>
                                <span class="pagination-info">Page ${data.current_page} of ${data.total_pages}</span>
                                <button class="btn btn-primary" onclick="loadUsersTable(${data.current_page + 1})" ${data.current_page >= data.total_pages ? 'disabled' : ''}>
                                    Next <i class="fas fa-chevron-right"></i>
                                </button>
                            </div>
                        `;
                    }
                    usersTableContainer.innerHTML = tableHtml;
                } else {
                    usersTableContainer.innerHTML = `<div class="alert alert-danger animated fadeIn"><i class="fas fa-exclamation-circle"></i> Failed to load member list: ${data.message}</div>`;
                }
            })
            .catch(error => {
                console.error('Error loading users table:', error);
                usersTableContainer.innerHTML = `<div class="alert alert-danger animated fadeIn"><i class="fas fa-exclamation-circle"></i> Failed to load member list: ${error.message}</div>`;
            });
    }

    function resetUsersFilter() {
        memberRoleFilter.value = '';
        memberSearchInput.value = '';
        currentPageUsers = 1;
        loadUsersTable();
    }

    function loadActivityLog() {
        fetch('pb.php?fetch_activity_log_only=true')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    let logHtml = '';
                    if (data.data.length === 0) {
                        logHtml = '<p class="text-center text-muted no-data-message animated fadeIn">No activity log found.</p>';
                    } else {
                        logHtml = `
                            <div class="table-responsive animated fadeIn">
                                <table class="data-table">
                                    <thead>
                                        <tr>
                                            <th>Time</th>
                                            <th>Type</th>
                                            <th>Description</th>
                                            <th>KTA ID</th>
                                            <th>Old Status</th>
                                            <th>New Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                        `;
                        let animationDelay = 0;
                        data.data.forEach(log => {
                            animationDelay += 0.05;
                            logHtml += `
                                <tr class="animated fadeInUp" style="animation-delay: ${animationDelay}s;">
                                    <td data-label="Time">${log.created_at}</td>
                                    <td data-label="Activity Type">${log.activity_type}</td>
                                    <td data-label="Description">${log.description}</td>
                                    <td data-label="KTA Application ID">${log.application_id ? `${log.application_id} (<span class="text-info">${log.application_club_name || 'N/A'}</span>)` : 'N/A'}</td>
                                    <td data-label="Old Status">${log.old_status ? log.old_status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'N/A'}</td>
                                    <td data-label="New Status"><span class="status-badge status-${log.new_status || 'unknown'}">${log.new_status ? log.new_status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'N/A'}</span></td>
                                </tr>
                            `;
                        });
                        logHtml += `
                                    </tbody>
                                </table>
                            </div>
                        `;
                    }
                    activityLogTableContainer.innerHTML = logHtml;
                } else {
                    activityLogTableContainer.innerHTML = `<div class="alert alert-danger animated fadeIn"><i class="fas fa-exclamation-circle"></i> Failed to load activity log: ${data.message}</div>`;
                }
            })
            .catch(error => {
                console.error('Error loading activity log:', error);
                activityLogTableContainer.innerHTML = `<div class="alert alert-danger animated fadeIn"><i class="fas fa-exclamation-circle"></i> Failed to load activity log: ${error.message}</div>`;
            });
    }

    let currentIssuedKTAPage = 1;
    const issuedKTAItemsPerPage = 5;

    function loadIssuedKTA(page = 1) {
        currentIssuedKTAPage = page;

        const provinceFilter = issuedKTAProvinceFilter.value;
        const cityFilter = issuedKTACityFilter.value;
        const searchQuery = issuedKTASearchInput.value;

        const url = `pb.php?fetch_issued_kta_cards_only=true&page=${currentIssuedKTAPage}&limit=${issuedKTAItemsPerPage}&province_filter=${encodeURIComponent(provinceFilter)}&city_filter=${encodeURIComponent(cityFilter)}&search_query=${encodeURIComponent(searchQuery)}`;

        issuedKtaCardsContainer.innerHTML = '<p class="text-center text-muted no-data-message animated fadeIn">Loading issued KTAs...</p>';

        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    let cardsHtml = '';
                    if (data.data.length === 0) {
                        cardsHtml = '<p class="text-center text-muted no-data-message animated fadeIn">No issued KTAs found matching criteria.</p>';
                    } else {
                        cardsHtml = '<div class="kta-cards-grid animated fadeIn">';
                        let animationDelayCard = 0;
                        data.data.forEach(kta => {
                            animationDelayCard += 0.05;
                            cardsHtml += `
                                <div class="kta-card animated fadeInUp" style="animation-delay: ${animationDelayCard}s;">
                                    <h3>${kta.club_name}</h3>
                                    <p><strong>KTA ID:</strong> ${kta.id}</p>
                                    <p><strong>PIC:</strong> ${kta.leader_name}</p>
                                    <p><strong>Barcode ID:</strong> ${kta.kta_barcode_unique_id}</p>
                                    <p><strong>Province:</strong> ${kta.province_name || 'N/A'}</p>
                                    <p><strong>City/Regency:</strong> ${kta.city_name || 'N/A'}</p>
                                    <p><strong>Issued:</strong> ${new Date(kta.kta_issued_at).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'})}</p>
                                    ${kta.kta_file_url ? `<a href="${kta.kta_file_url}" target="_blank" class="btn btn-view-kta"><i class="fas fa-file-pdf"></i> View KTA</a>` : `<span class="text-muted">KTA File Not Available</span>`}
                                </div>
                            `;
                        });
                        cardsHtml += '</div>';
                        cardsHtml += `
                            <div class="pagination-controls animated fadeIn">
                                <button class="btn btn-primary" onclick="loadIssuedKTA(${data.current_page - 1})" ${data.current_page <= 1 ? 'disabled' : ''}>
                                    <i class="fas fa-chevron-left"></i> Previous
                                </button>
                                <span class="pagination-info">Page ${data.current_page} of ${data.total_pages}</span>
                                <button class="btn btn-primary" onclick="loadIssuedKTA(${data.current_page + 1})" ${data.current_page >= data.total_pages ? 'disabled' : ''}>
                                    Next <i class="fas fa-chevron-right"></i>
                                </button>
                            </div>
                        `;
                    }
                    issuedKtaCardsContainer.innerHTML = cardsHtml;
                } else {
                    issuedKtaCardsContainer.innerHTML = `<div class="alert alert-danger animated fadeIn"><i class="fas fa-exclamation-circle"></i> Failed to load issued KTA list: ${data.message}</div>`;
                }
            })
            .catch(error => {
                console.error('Error loading issued KTA cards:', error);
                issuedKtaCardsContainer.innerHTML = `<div class="alert alert-danger animated fadeIn"><i class="fas fa-exclamation-circle"></i> Failed to load issued KTA list: ${error.message}</div>`;
            });
    }

    function resetIssuedKTAFilter() {
        issuedKTAProvinceFilter.value = '';
        issuedKTACityFilter.value = '';
        issuedKTASearchInput.value = '';
        currentIssuedKTAPage = 1;
        loadIssuedKTA();
    }

    function updateSaldoCards(provinceId, cityId, month, year, ktaStatus) {
        const url = `pb.php?get_saldo_summary=true` +
                                     `&province_filter_id=${encodeURIComponent(provinceId)}` +
                                     `&city_filter_id=${encodeURIComponent(cityId)}` +
                                     `&month_filter=${encodeURIComponent(month)}` +
                                     `&year_filter=${encodeURIComponent(year)}` +
                                     `&kta_status_filter=${encodeURIComponent(ktaStatus)}`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    document.getElementById('total-saldo-masuk-display').textContent = data.saldo_masuk_display;
                    document.getElementById('total-saldo-keluar-display').textContent = data.saldo_keluar_display;
                    document.getElementById('total-saldo-display').textContent = data.total_saldo_display;
                    document.getElementById('total-saldo-display').className = `amount-total ${data.total_saldo >= 0 ? 'positive' : 'negative'}`;

                    estimateToPengdaDisplay.textContent = formatNumberToRupiah(data.to_pay_pengda);
                    estimateToPengcabDisplay.textContent = formatNumberToRupiah(data.to_pay_pengcab);
                    estimateToDeveloperDisplay.textContent = formatNumberToRupiah(data.to_pay_developer);

                    if (data.to_pay_pengda > 0 || data.to_pay_pengcab > 0) {
                        openRecapPaymentModalBtn.disabled = false;
                    } else {
                        openRecapPaymentModalBtn.disabled = true;
                    }

                } else {
                    console.error("Failed to load saldo summary:", data.message);
                }
            })
            .catch(error => console.error("Error fetching saldo summary:", error));
    }

    function loadSaldoDataAndHistory() {
        loadTransactionHistory(1);    
    }
    function resetSaldoFilters() {
        saldoProvinceFilter.value = '';
        saldoCityFilter.innerHTML = '<option value="">All Cities/Regencies</option>';
        saldoCityFilter.disabled = false;
        saldoMonthFilter.value = '';
        saldoYearFilter.value = '';
        saldoKTAStatusFilter.value = '';
        loadSaldoDataAndHistory();
    }
    let currentTransactionHistoryPage = 1;
    const itemsPerPageTransactionHistory = 5;

    function loadTransactionHistory(page = 1) {
        currentTransactionHistoryPage = page;

        const provinceFilterId = saldoProvinceFilter.value;
        const cityFilterId = saldoCityFilter.value;    
        const monthFilter = saldoMonthFilter.value;
        const yearFilter = saldoYearFilter.value;
        const ktaStatusFilter = saldoKTAStatusFilter.value;    

        const url = `pb.php?fetch_transaction_history_only=true&page=${currentTransactionHistoryPage}&limit=${itemsPerPageTransactionHistory}` +
                                     `&province_filter_id=${encodeURIComponent(provinceFilterId)}` +
                                     `&city_filter_id=${encodeURIComponent(cityFilterId)}` +    
                                     `&month_filter=${encodeURIComponent(monthFilter)}` +
                                     `&year_filter=${encodeURIComponent(yearFilter)}` +
                                     `&kta_status_filter=${encodeURIComponent(ktaStatusFilter)}`;    

        transactionHistoryTableContainer.innerHTML = '<p class="text-center text-muted no-data-message animated fadeIn">Loading transaction history...</p>';

        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    let htmlOutput = '';
                    const incomingTransactions = data.data.filter(t => t.transaction_type === 'Masuk');
                    const outgoingTransactions = data.data.filter(t => t.transaction_type === 'Keluar');

                    htmlOutput += '<h3 style="margin-top: 20px;"><i class="fas fa-plus-circle text-success"></i> Incoming Balance History</h3>';
                    if (incomingTransactions.length === 0) {
                        htmlOutput += '<p class="text-center text-muted no-data-message animated fadeIn">No incoming balance history.</p>';
                    } else {
                        htmlOutput += '<div class="table-responsive animated fadeIn"><table class="data-table"><thead><tr><th>Application ID</th><th>From</th><th>Province</th><th>City/Regency</th><th>Amount</th><th>Date</th><th>Description</th><th>KTA Status</th></tr></thead><tbody>';
                        let animationDelayIn = 0;
                        incomingTransactions.forEach(transaction => {
                            animationDelayIn += 0.05;
                            htmlOutput += `<tr class="animated fadeInUp" style="animation-delay: ${animationDelayIn}s;">`;
                            htmlOutput += `<td data-label="Application ID">${transaction.transaction_id}</td>`;
                            htmlOutput += `<td data-label="From">${transaction.related_party_name}</td>`;
                            htmlOutput += `<td data-label="Province">${transaction.province_name || 'N/A'}</td>`;
                            htmlOutput += `<td data-label="City/Regency">${transaction.city_name || 'N/A'}</td>`;
                            htmlOutput += `<td data-label="Amount" class="text-success">${transaction.amount_display}</td>`;
                            htmlOutput += `<td data-label="Transaction Date">${transaction.transaction_date}</td>`;
                            htmlOutput += `<td data-label="Description">${transaction.description}</td>`;
                            htmlOutput += `<td data-label="KTA Status"><span class="status-badge status-${(transaction.kta_status || 'unknown').toLowerCase()}">${(transaction.kta_status || 'N/A').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span></td>`;
                            htmlOutput += `</tr>`;
                        });
                        htmlOutput += '</tbody></table></div>';
                    }

                    htmlOutput += '<h3 style="margin-top: 40px;"><i class="fas fa-minus-circle text-danger"></i> Outgoing Balance History</h3>';
                    if (outgoingTransactions.length === 0) {
                        htmlOutput += '<p class="text-center text-muted no-data-message animated fadeIn">No outgoing balance history.</p>';
                    } else {
                        htmlOutput += '<div class="table-responsive animated fadeIn"><table class="data-table"><thead><tr><th>Recap ID</th><th>To</th><th>Recipient Type</th><th>Province</th><th>City/Regency</th><th>Amount</th><th>Date</th><th>Description</th></tr></thead><tbody>';
                        let animationDelayOut = 0;
                        outgoingTransactions.forEach(transaction => {
                            animationDelayOut += 0.05;
                            htmlOutput += `<tr class="animated fadeInUp" style="animation-delay: ${animationDelayOut}s;">`;
                            htmlOutput += `<td data-label="Recap ID">${transaction.transaction_id}</td>`;
                            htmlOutput += `<td data-label="To">${transaction.related_party_name}</td>`;
                            htmlOutput += `<td data-label="Recipient Type">${(transaction.recipient_type_name || 'N/A').replace(/\b\w/g, c => c.toUpperCase())}</td>`;
                            htmlOutput += `<td data-label="Province">${transaction.province_name || 'N/A'}</td>`;
                            htmlOutput += `<td data-label="City/Regency">${transaction.city_name || 'N/A'}</td>`;
                            htmlOutput += `<td data-label="Amount" class="text-danger">${transaction.amount_display}</td>`;
                            htmlOutput += `<td data-label="Transaction Date">${transaction.transaction_date}</td>`;
                            htmlOutput += `<td data-label="Description">${transaction.description}</td>`;
                            htmlOutput += `</tr>`;
                        });
                        htmlOutput += '</tbody></table></div>';
                    }

                    htmlOutput += `<div class="pagination-controls animated fadeIn">
                        <button class="btn btn-primary" onclick="loadTransactionHistory(${data.current_page - 1})" ${data.current_page <= 1 ? 'disabled' : ''}>
                            <i class="fas fa-chevron-left"></i> Previous
                        </button>
                        <span class="pagination-info">Page ${data.current_page} of ${data.total_pages}</span>
                        <button class="btn btn-primary" onclick="loadTransactionHistory(${data.current_page + 1})" ${data.current_page >= data.total_pages ? 'disabled' : ''}>
                            Next <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>`;

                    transactionHistoryTableContainer.innerHTML = htmlOutput;
                    updateSaldoCards(provinceFilterId, cityFilterId, monthFilter, yearFilter, ktaStatusFilter);
                } else {
                    transactionHistoryTableContainer.innerHTML = `<div class="alert alert-danger animated fadeIn"><i class="fas fa-exclamation-circle"></i> Failed to load transaction history: ${data.message}</div>`;
                }
            })
            .catch(error => {
                console.error('Error loading transaction history table:', error);
                transactionHistoryTableContainer.innerHTML = `<div class="alert alert-danger animated fadeIn"><i class="fas fa-exclamation-circle"></i> Failed to load transaction history: ${error.message}</div>`;
            });
    }

    // --- User Management Functions (Edit & Delete) ---
    function openEditUserModal(userId) {
        openModal(editUserModal, { userId });
    }

    function confirmDeleteUser(userId, username) {
        Swal.fire({
            title: 'Delete Member?',
            text: `Are you sure you want to delete member "${username}" (ID: ${userId})? This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, Delete!',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                deleteUser(userId);
            }
        });
    }

    function deleteUser(userId) {
        const formData = new FormData();
        formData.append('delete_user_data_ajax', '1');
        formData.append('user_id', userId);

        Swal.fire({
            title: 'Deleting member...',
            text: 'Please wait...',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        fetch('pb.php', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            Swal.close();
            if (data.success) {
                Swal.fire('Success!', data.message, 'success');
                loadUsersTable();
                loadActivityLog();
            } else {
                Swal.fire('Failed!', data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error deleting user:', error);
            Swal.close();
            Swal.fire('An Error Occurred!', 'Failed to delete member. Please try again.', 'error');
        });
    }

    function resetUserPassword(userId, newPassword, confirmNewPassword) {
        const formData = new FormData();
        formData.append('reset_user_password_ajax', '1');
        formData.append('user_id', userId);
        formData.append('new_password', newPassword);
        formData.append('confirm_new_password', confirmNewPassword);

        Swal.fire({
            title: 'Resetting User Password...',
            text: 'Please wait...',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        fetch('pb.php', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            Swal.close();
            if (data.success) {
                closeModal('editUserModal');
                Swal.fire('Success!', data.message, 'success');
                editNewPassword.value = '';
                editConfirmNewPassword.value = '';
                loadActivityLog();
            } else {
                Swal.fire('Failed!', data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error resetting user password:', error);
            Swal.close();
            Swal.fire('An Error Occurred!', 'Failed to reset user password. Please try again.', 'error');
        });
    }

    if (resetPasswordBtn) {
        resetPasswordBtn.addEventListener('click', function() {
            const userId = editUserId.value;
            const newPassword = editNewPassword.value.trim();
            const confirmNewPassword = editConfirmNewPassword.value.trim();

            if (newPassword === '' || confirmNewPassword === '') {
                Swal.fire('Error!', 'New password and confirm password fields cannot be empty.', 'error');
                return;
            }
            if (newPassword !== confirmNewPassword) {
                Swal.fire('Error!', 'New password and confirm password do not match.', 'error');
                return;
            }

            resetUserPassword(userId, newPassword, confirmNewPassword);
        });
    }

    // --- Section Display and Initialization ---
    function showSection(sectionId) {
        document.getElementById('kta_applications_section').style.display = 'none';
        document.getElementById('activity_log_section').style.display = 'none';
        document.getElementById('pb_kta_config_section').style.display = 'none';
        document.getElementById('admin_profile_section').style.display = 'none';
        document.getElementById('view_members_section').style.display = 'none';
        document.getElementById('view_issued_kta_section').style.display = 'none';
        document.getElementById('saldo_overview_section').style.display = 'none';
        document.getElementById('kejurnas_section').style.display = 'none';
        document.getElementById('competition_reregistrations_section').style.display = 'none';

        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.style.display = 'block';

            if (sectionId === 'pb_kta_config_section') {
                // Initialize canvas and load existing signature
                setTimeout(() => {
                    if (pbSignatureCanvas) {
                        // Dynamically set canvas size to match its CSS size or a default if not rendered
                        const container = pbSignatureCanvas.parentElement;
                        pbSignatureCanvas.width = container.offsetWidth || 400;
                        pbSignatureCanvas.height = container.offsetHeight || 150;

                        pbCtx = pbSignatureCanvas.getContext('2d');
                        if (pbCtx) {
                            pbCtx.lineWidth = 2;
                            pbCtx.lineCap = 'round';
                            pbCtx.strokeStyle = '#000';
                            pbCtx.clearRect(0, 0, pbSignatureCanvas.width, pbSignatureCanvas.height); // Clear canvas on init
                        }
                        loadExistingPbSignature();
                    }
                }, 50); // Small delay to ensure layout is rendered
            } else if (sectionId === 'view_members_section') {
                loadUsersTable(currentPageUsers);
            } else if (sectionId === 'activity_log_section') {
                loadActivityLog();
            } else if (sectionId === 'view_issued_kta_section') {
                loadIssuedKTA(currentIssuedKTAPage);
            } else if (sectionId === 'saldo_overview_section') {
                loadSaldoDataAndHistory();    
            } else if (sectionId === 'kta_applications_section') {
                updateKtaStatusCounts();    
                loadKtaTable(1, '');
            } else if (sectionId === 'kejurnas_section') {
                // Initialize Kejurnas section
                if (typeof initializeKejurnasSection === 'function') {
                    initializeKejurnasSection();
                }
            } else if (sectionId === 'competition_reregistrations_section') {
                // Load competition re-registrations data
                loadCompetitionReregistrations();
            }
            
            // Remove active class from all sidebar links and add to the current one
            document.querySelectorAll('.sidebar .menu li a').forEach(item => {
                item.classList.remove('active');
            });
            const activeLink = document.querySelector(`.sidebar .menu li a[data-section="${sectionId}"]`);
            if (activeLink) {
                activeLink.classList.add('active');
            }
        }
    }

    function updateKtaStatusCounts() {
        fetch('pb.php?get_kta_status_counts=true')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    document.getElementById('count-approved_pengda').textContent = data.approved_pengda;
                    document.getElementById('count-approved_pb').textContent = data.approved_pb;
                    document.getElementById('count-rejected_pb').textContent = data.rejected_pb;
                    document.getElementById('count-kta_issued').textContent = data.kta_issued;
                    document.getElementById('count-pending_pengda_resubmit').textContent = data.pending_pengda_resubmit;
                    document.getElementById('count-total_applications').textContent = data.total_applications;
                } else {
                    console.error('Failed to load KTA status counts:', data.message);
                }
            })
            .catch(error => {
                console.error('Error fetching KTA status counts:', error);
            });
    }

    // --- PB Signature Canvas Functions ---
    function loadExistingPbSignature() {
        const existingSignatureUrl = currentPbSignaturePreview.src;
        // Check if the source is not empty and is not just the current page URL
        // Also check if the element is not hidden by default in CSS if it has a src
        if (existingSignatureUrl && existingSignatureUrl !== window.location.href + '#') {
            // Attempt to load the image onto the canvas only if there's a valid image path
            const img = new Image();
            img.onload = function() {
                if (pbCtx) {
                    // Clear canvas before drawing new image
                    pbCtx.clearRect(0, 0, pbSignatureCanvas.width, pbSignatureCanvas.height);
                    // Draw image scaled to fit canvas
                    pbCtx.drawImage(img, 0, 0, pbSignatureCanvas.width, pbSignatureCanvas.height);
                    // Hide the img tag and show the canvas
                    pbSignatureCanvas.style.display = 'block';
                    currentPbSignaturePreview.style.display = 'none';
                    pbSignatureDataUrlInput.value = pbSignatureCanvas.toDataURL('image/png'); // Set hidden input with canvas data
                    clearPbSignatureBtn.style.display = 'block'; // Show clear button
                }
            };
            img.onerror = function() {
                console.warn("Could not load existing signature image. Displaying canvas for new signature.");
                pbSignatureCanvas.style.display = 'block';
                currentPbSignaturePreview.style.display = 'none';
                pbSignatureDataUrlInput.value = '';
                clearPbSignatureBtn.style.display = 'none'; // No existing signature to clear
            };
            img.src = existingSignatureUrl;
        } else {
            // No existing signature, ensure canvas is ready for drawing
            pbSignatureCanvas.style.display = 'block';
            currentPbSignaturePreview.style.display = 'none';
            pbSignatureDataUrlInput.value = '';
            clearPbSignatureBtn.style.display = 'none';
            if (pbCtx) {
                pbCtx.clearRect(0, 0, pbSignatureCanvas.width, pbSignatureCanvas.height);
            }
        }
    }


    function drawPbSignature(e) {
        if (!isPbDrawing) return;
        pbSignatureCanvas.style.display = 'block'; // Ensure canvas is visible when drawing
        currentPbSignaturePreview.style.display = 'none'; // Hide preview when drawing
        clearPbSignatureBtn.style.display = 'block'; // Show clear button

        e.preventDefault();    
        const rect = pbSignatureCanvas.getBoundingClientRect();
        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;
        const x = (clientX - rect.left) * (pbSignatureCanvas.width / rect.width);
        const y = (clientY - rect.top) * (pbSignatureCanvas.height / rect.height);

        pbCtx.beginPath();
        pbCtx.moveTo(pbLastX, pbLastY);
        pbCtx.lineTo(x, y);
        pbCtx.stroke();
        [pbLastX, pbLastY] = [x, y];
    }

    function clearPbSignature() {
        if (pbCtx) {
            pbCtx.clearRect(0, 0, pbSignatureCanvas.width, pbSignatureCanvas.height);
        }
        pbSignatureDataUrlInput.value = ''; // Clear data from hidden input
        currentPbSignaturePreview.src = ''; // Clear preview
        currentPbSignaturePreview.style.display = 'none'; // Hide preview
        pbSignatureCanvas.style.display = 'block'; // Show canvas
        clearPbSignatureBtn.style.display = 'none'; // Hide clear button
    }

    function savePbSignatureToInput() {
        if (pbCtx) {
            // Check if canvas is blank
            const imageData = pbCtx.getImageData(0, 0, pbSignatureCanvas.width, pbSignatureCanvas.height);
            let isCanvasBlank = true;
            for (let i = 0; i < imageData.data.length; i += 4) {
                if (imageData.data[i + 3] !== 0) { // Check alpha value
                    isCanvasBlank = false;
                    break;
                }
            }
            if (!isCanvasBlank) {
                pbSignatureDataUrlInput.value = pbSignatureCanvas.toDataURL('image/png');
            } else {
                pbSignatureDataUrlInput.value = ''; // If canvas is empty, clear hidden input too
            }
        }
    }


    function handlePbKtaConfigSubmit(e) {
        e.preventDefault();

        savePbSignatureToInput(); // Save signature from canvas to hidden input
        
        // Re-check data completeness (chairman name AND signature)
        if (!pbKetuaUmumNameInput.value || !pbSignatureDataUrlInput.value) {
            Swal.fire({
                icon: 'error',
                title: 'Validation Error',
                text: 'Chairman Name and Signature must be filled for Automatic KTA configuration.',
                confirmButtonText: 'Close'
            });
            return;
        }

        const formData = new FormData(this);

        Swal.fire({
            title: 'Saving PB KTA Configuration...',
            text: 'Please wait...',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        fetch('pb.php', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (response.status === 204 || response.headers.get("content-length") === "0") {
                console.warn("Received empty response from server.");
                return { success: false, message: "Server returned an empty response." };
            }
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                return response.json();
            } else {
                return response.text().then(text => {
                    console.error('Server returned non-JSON response:', text);
                    throw new Error('Server Error (non-JSON response). Check console for details.');
                });
            }
        })
        .then(data => {
            Swal.close();
            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: data.message,
                    showConfirmButton: false,
                    timer: 2000
                });
                if (data.signature_path && currentPbSignaturePreview) {
                    currentPbSignaturePreview.src = data.signature_path;
                    currentPbSignaturePreview.style.display = 'block';
                    pbSignatureCanvas.style.display = 'none'; // Hide canvas after signature is saved
                    clearPbSignatureBtn.style.display = 'block'; // Show clear button
                } else if (currentPbSignaturePreview) { // If no path, hide preview
                    currentPbSignaturePreview.style.display = 'none';
                    pbSignatureCanvas.style.display = 'block'; // Show canvas
                    clearPbSignatureBtn.style.display = 'none'; // Hide clear button
                }
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Failed!',
                    text: data.message,
                    showConfirmButton: true
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.close();
            Swal.fire({
                icon: 'error',
                title: 'An Error Occurred!',
                text: `An error occurred while saving configuration: ${error.message}`,
                showConfirmButton: true
            });
        });
    }

    function loadCitiesForSaldoFilter(provinceId, selectedCityId = null) {
        saldoCityFilter.innerHTML = '<option value="">All Cities/Regencies</option>';
        saldoCityFilter.disabled = true;

        if (!provinceId) {
            saldoCityFilter.disabled = false;
            return;
        }

        fetch(`pb.php?get_cities_by_province=true&province_id=${provinceId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success && data.cities.length > 0) {
                    data.cities.forEach(city => {
                        const option = document.createElement('option');
                        option.value = city.id;
                        option.textContent = city.name;
                        saldoCityFilter.appendChild(option);
                    });
                    if (selectedCityId) {
                        saldoCityFilter.value = selectedCityId;
                    }
                }
                saldoCityFilter.disabled = false;
            })
            .catch(error => {
                console.error('Error loading cities for saldo filter:', error);
                saldoCityFilter.innerHTML = '<option value="">Failed to load cities</option>';
                saldoCityFilter.disabled = false;
            });
    }

    function loadRecipientsForRecap(recipientType) {
        recapRecipientIdSelect.innerHTML = '<option value="">Loading...</option>';
        recapRecipientIdSelect.disabled = true;
        recapRecipientSelectGroup.style.display = 'block';

        if (!recipientType) {
            recapRecipientIdSelect.innerHTML = '<option value="">Select Entity</option>';
            recapRecipientIdSelect.disabled = true;
            recapRecipientSelectGroup.style.display = 'none';
            openRecapPaymentModalBtn.disabled = true;
            return;
        }

        let roleName = '';
        if (recipientType === 'pengda') {
            roleName = 'Pengurus Daerah';
        } else if (recipientType === 'pengcab') {
            roleName = 'Pengurus Cabang';
        }

        fetch(`pb.php?fetch_users_table_only=true&role_filter=${encodeURIComponent(roleName)}&limit=1000`)    
            .then(response => response.json())
            .then(data => {
                recapRecipientIdSelect.innerHTML = '<option value="">Select Entity</option>';
                if (data.success && data.data.length > 0) {
                    data.data.forEach(user => {
                        const option = document.createElement('option');
                        option.value = user.id;
                        option.textContent = user.club_name || user.username;    
                        recapRecipientIdSelect.appendChild(option);
                    });
                } else {
                    recapRecipientIdSelect.innerHTML = '<option value="">No entities found</option>';
                }
                recapRecipientIdSelect.disabled = false;
                openRecapPaymentModalBtn.disabled = true;    
            })
            .catch(error => {
                console.error('Error loading recipients for recap:', error);
                recapRecipientIdSelect.innerHTML = '<option value="">Failed to load entities</option>';
                recapRecipientIdSelect.disabled = false;
                openRecapPaymentModalBtn.disabled = true;
            });
    }

    function checkRecapButtonStatus() {
        const recipientType = recapRecipientTypeSelect.value;
        const recipientId = recapRecipientIdSelect.value;
        const periodType = recapPeriodTypeSelect.value;
        const month = recapMonthSelect.value;
        const year = recapYearSelect.value;

        if (recipientType && recipientId && periodType && year && (periodType === 'yearly' || month)) {
            fetch(`pb.php?get_saldo_summary=true&recipient_user_id=${recipientId}&recipient_type=${recipientType}&recap_month=${month}&recap_year=${year}&kta_status_filter=kta_issued`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        let amountNeeded = 0;
                        if (recipientType === 'pengda') {
                            amountNeeded = data.to_pay_pengda;
                        } else if (recipientType === 'pengcab') {
                            amountNeeded = data.to_pay_pengcab;
                        }
                        
                        if (amountNeeded > 0) {
                            openRecapPaymentModalBtn.disabled = false;
                        } else {
                            openRecapPaymentModalBtn.disabled = true;
                        }
                    } else {
                        openRecapPaymentModalBtn.disabled = true;
                        console.error("Failed to check recap amount:", data.message);
                    }
                })
                .catch(error => {
                    console.error("Error checking recap amount:", error);
                    openRecapPaymentModalBtn.disabled = true;
                });
        } else {
            openRecapPaymentModalBtn.disabled = true;
        }
    }


    function handleChangePasswordSubmit(e) {
        e.preventDefault();
        const formData = new FormData(this);

        Swal.fire({
            title: 'Changing Password...',
            text: 'Please wait...',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        fetch('pb.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            Swal.close();
            if (data.success) {
                Swal.fire('Success!', data.message, 'success');
                document.getElementById('current_password').value = '';
                document.getElementById('new_password').value = '';
                document.getElementById('confirm_new_password').value = '';
            } else {
                Swal.fire('Failed!', data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.close();
            Swal.fire('An Error Occurred!', 'Failed to change password. Please try again.', 'error');
        });
    }

    // --- Initial Load and Event Listeners (DOMContentLoaded) ---
    document.addEventListener('DOMContentLoaded', function() {
        document.querySelectorAll('.sidebar .menu li a[data-section]').forEach(link => {
            link.addEventListener('click', function(event) {
                event.preventDefault();
                const sectionId = this.getAttribute('data-section');
                showSection(sectionId);
            });
        });

        if (ktaProvinceFilter) {
            ktaProvinceFilter.addEventListener('change', function() {
                loadCitiesForKtaFilter(this.value);
                loadKtaTable(1, currentKtaTableStatusFilter);
            });
        }
        if (ktaCityFilter) {
            ktaCityFilter.addEventListener('change', function() {
                loadKtaTable(1, currentKtaTableStatusFilter);
            });
        }
        if (ktaSearchInput) {
            ktaSearchInput.addEventListener('keyup', (event) => {
                if (event.key === 'Enter' || ktaSearchInput.value.length === 0 || ktaSearchInput.value.length >= 3) {
                    loadKtaTable(1, currentKtaTableStatusFilter);
                }
            });
        }

        document.querySelectorAll('.status-card').forEach(card => {
            card.addEventListener('click', function() {
                const statusFilter = this.dataset.statusFilter;
                document.querySelectorAll('.status-card').forEach(sCard => sCard.classList.remove('active-filter'));
                this.classList.add('active-filter');

                loadKtaTable(1, statusFilter);
                // Reset other KTA filters when clicking a status card
                ktaProvinceFilter.value = '';
                ktaCityFilter.innerHTML = '<option value="">All Cities/Regencies</option>';
                ktaCityFilter.disabled = false;
                ktaSearchInput.value = '';
            });
        });
        const initialActiveCard = document.getElementById('card-all_applications');
        if(initialActiveCard) {
            initialActiveCard.classList.add('active-filter');
        }


        if (saldoProvinceFilter) {
            saldoProvinceFilter.addEventListener('change', function() {
                loadCitiesForSaldoFilter(this.value);
            });
        }
        if (saldoCityFilter) {
            saldoCityFilter.addEventListener('change', loadSaldoDataAndHistory);
        }
        if (saldoMonthFilter) {
            saldoMonthFilter.addEventListener('change', loadSaldoDataAndHistory);
        }
        if (saldoYearFilter) {
            saldoYearFilter.addEventListener('change', loadSaldoDataAndHistory);
        }
        if (saldoKTAStatusFilter) {
            saldoKTAStatusFilter.addEventListener('change', loadSaldoDataAndHistory);
        }


        // Event Listeners for Recap Payment Controls
        if (recapRecipientTypeSelect) {
            recapRecipientTypeSelect.addEventListener('change', function() {
                loadRecipientsForRecap(this.value);
            });
        }
        if (recapRecipientIdSelect) {
            recapRecipientIdSelect.addEventListener('change', checkRecapButtonStatus);
        }
        if (recapPeriodTypeSelect) {
            recapPeriodTypeSelect.addEventListener('change', function() {
                if (this.value === 'yearly') {
                    recapMonthGroup.style.display = 'none';
                    recapMonthSelect.value = '';
                } else {
                    recapMonthGroup.style.display = 'block';
                }
                checkRecapButtonStatus();
            });
        }
        if (recapMonthSelect) {
            recapMonthSelect.addEventListener('change', checkRecapButtonStatus);
        }
        if (recapYearSelect) {
            recapYearSelect.addEventListener('change', checkRecapButtonStatus);
        }

        if (openRecapPaymentModalBtn) {
            openRecapPaymentModalBtn.addEventListener('click', function() {
                const recipientType = recapRecipientTypeSelect.value;
                const recipientId = recapRecipientIdSelect.value;
                const recipientName = recapRecipientIdSelect.options[recapRecipientIdSelect.selectedIndex].textContent;
                const periodType = recapPeriodTypeSelect.value;
                const month = recapMonthSelect.value;
                const year = recapYearSelect.value;

                if (!recipientType || !recipientId || !periodType || !year || (periodType === 'monthly' && !month)) {
                    Swal.fire('Info', 'Please complete all recap payment selections.', 'info');
                    return;
                }

                // Check if the estimated amount is greater than 0 before opening modal
                let amountNeededForModal = 0;
                if (recipientType === 'pengda') {
                    amountNeededForModal = parseFloat(estimateToPengdaDisplay.textContent.replace('Rp ', '').replace(/\./g, '').replace(',', '.'));
                } else if (recipientType === 'pengcab') {
                    amountNeededForModal = parseFloat(estimateToPengcabDisplay.textContent.replace('Rp ', '').replace(/\./g, '').replace(',', '.'));
                }
                
                if (isNaN(amountNeededForModal) || amountNeededForModal <= 0) {
                    Swal.fire('Info', `No payment needs to be recapped for ${recipientName} for this period.`, 'info');
                    return;
                }

                openRecapPaymentModal(recipientId, recipientType, periodType, month, year, recipientName);
            });
        }


        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', function() {
                sidebar.classList.toggle('collapsed');
                mainContent.classList.toggle('expanded');
            });
        }

        // Initially show the KTA applications section
        showSection('kta_applications_section');
        updateKtaStatusCounts(); // Update counts on initial load

        if (recapAmountPaidInput) {
            recapAmountPaidInput.addEventListener('input', () => formatRupiah(recapAmountPaidInput));
        }

        // Event listeners for PB KTA config form
        if (pbKtaConfigForm) {
            pbKtaConfigForm.addEventListener('submit', handlePbKtaConfigSubmit);
            // Initialize canvas when DOM is loaded and config section is not yet displayed
            // This ensures the canvas is ready when the section is shown
            if (pbSignatureCanvas) {
                // Ensure canvas matches its display size
                const container = pbSignatureCanvas.parentElement;
                pbSignatureCanvas.width = container.offsetWidth || 400;
                pbSignatureCanvas.height = container.offsetHeight || 150;
                pbCtx = pbSignatureCanvas.getContext('2d');
                if (pbCtx) {
                    pbCtx.lineWidth = 2;
                    pbCtx.lineCap = 'round';
                    pbCtx.strokeStyle = '#000';
                    pbCtx.clearRect(0, 0, pbSignatureCanvas.width, pbSignatureCanvas.height);
                }

                // Event listeners for drawing signature
                pbSignatureCanvas.addEventListener('mousedown', (e) => {
                    isPbDrawing = true;
                    const rect = pbSignatureCanvas.getBoundingClientRect();
                    pbLastX = (e.clientX - rect.left) * (pbSignatureCanvas.width / rect.width);
                    pbLastY = (e.clientY - rect.top) * (pbSignatureCanvas.height / rect.height);
                    pbCtx.beginPath(); // Start a new path each time mouse down
                    pbCtx.moveTo(pbLastX, pbLastY);
                });
                pbSignatureCanvas.addEventListener('mousemove', drawPbSignature);
                pbSignatureCanvas.addEventListener('mouseup', () => { isPbDrawing = false; savePbSignatureToInput(); });
                pbSignatureCanvas.addEventListener('mouseout', () => { if(isPbDrawing) { isPbDrawing = false; savePbSignatureToInput(); }});

                // For touch (mobile)
                pbSignatureCanvas.addEventListener('touchstart', (e) => {
                    isPbDrawing = true;
                    const rect = pbSignatureCanvas.getBoundingClientRect();
                    const touch = e.touches[0];
                    pbLastX = (touch.clientX - rect.left) * (pbSignatureCanvas.width / rect.width);
                    pbLastY = (touch.clientY - rect.top) * (pbSignatureCanvas.height / rect.height);
                    pbCtx.beginPath();
                    pbCtx.moveTo(pbLastX, pbLastY);
                });
                pbSignatureCanvas.addEventListener('touchmove', drawPbSignature);
                pbSignatureCanvas.addEventListener('touchend', () => { isPbDrawing = false; savePbSignatureToInput(); });
                pbSignatureCanvas.addEventListener('touchcancel', () => { isPbDrawing = false; savePbSignatureToInput(); });

                if (clearPbSignatureBtn) {
                    clearPbSignatureBtn.addEventListener('click', clearPbSignature);
                }
                // Load existing signature on initial load (after canvas is ready)
                loadExistingPbSignature();
            }
        }

        if (changePasswordForm) {
            changePasswordForm.addEventListener('submit', handleChangePasswordSubmit);
        }

        if (memberRoleFilter) {
            memberRoleFilter.addEventListener('change', loadUsersTable);
        }
        if (memberSearchInput) {
            memberSearchInput.addEventListener('keyup', (event) => {
                if (event.key === 'Enter' || memberSearchInput.value.length === 0 || memberSearchInput.value.length >= 3) {
                    loadUsersTable(1);
                }
            });
        }
        
        // NEW: Add event listener for the export rekening button
        if (exportRekeningExcelBtn) {
            exportRekeningExcelBtn.addEventListener('click', function() {
                Swal.fire({
                    title: 'Export Rekening?',
                    text: 'Data nomor rekening Pengurus Cabang dan Pengurus Daerah akan diunduh dalam format Excel (.xlsx).',
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Ya, Unduh!',
                    cancelButtonText: 'Batal'
                }).then((result) => {
                    if (result.isConfirmed) {
                        window.location.href = 'pb.php?export_rekening_to_excel=true';
                    }
                });
            });
        }
        
        if (issuedKTAProvinceFilter) {
            issuedKTAProvinceFilter.addEventListener('change', () => loadIssuedKTA(1));
        }
        if (issuedKTACityFilter) {
            issuedKTACityFilter.addEventListener('change', () => loadIssuedKTA(1));
        }
        if (issuedKTASearchInput) {
            issuedKTASearchInput.addEventListener('keyup', (event) => {
                if (event.key === 'Enter' || issuedKTASearchInput.value.length === 0 || issuedKTASearchInput.value.length >= 3) {
                    loadIssuedKTA(1);
                }
            });
        }

        if (exportSaldoExcelBtn) {
            exportSaldoExcelBtn.addEventListener('click', function() {
                const provinceFilterId = saldoProvinceFilter.value;
                const cityFilterId = saldoCityFilter.value;
                const monthFilter = saldoMonthFilter.value;
                const yearFilter = saldoYearFilter.value;
                const ktaStatusFilter = saldoKTAStatusFilter.value;

                let exportUrl = `pb.php?export_saldo_to_excel=true`;
                if (provinceFilterId) exportUrl += `&province_filter_id=${encodeURIComponent(provinceFilterId)}`;
                if (cityFilterId) exportUrl += `&city_filter_id=${encodeURIComponent(cityFilterId)}`;
                if (monthFilter) exportUrl += `&month_filter=${encodeURIComponent(monthFilter)}`;
                if (yearFilter) exportUrl += `&year_filter=${encodeURIComponent(yearFilter)}`;
                if (ktaStatusFilter) exportUrl += `&kta_status_filter=${encodeURIComponent(ktaStatusFilter)}`;

                if (yearFilter && parseInt(yearFilter) < 2025) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Export Restricted',
                        text: 'Financial reports can only be exported for the year 2025 and onwards.',
                        confirmButtonText: 'OK'
                    });
                    return;
                }

                Swal.fire({
                    title: 'Export Financial Report?',
                    text: 'The financial report will be downloaded in Excel (.xlsx) format based on the active filters.',
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Yes, Download!',
                    cancelButtonText: 'Cancel'
                }).then((result) => {
                    if (result.isConfirmed) {
                        window.location.href = exportUrl;
                    }
                });
            });
        }
    });

    // Handle messages from previous redirect (if any)
    <?php
    $success_message = '';
    $error_message = '';
    // This part should be in your pb.php file, before HTML starts
    // I'm including it here for demonstration purposes, but in a real app,
    // this data would be passed from the server-side logic.
    if (!empty($success_message) || !empty($error_message)): ?>
        Swal.fire({
            icon: '<?php echo !empty($success_message) ? 'success' : 'error'; ?>',
            title: '<?php echo !empty($success_message) ? 'Success' : 'Failed'; ?>',
            text: '<?php echo addslashes(!empty($success_message) ? $success_message : $error_message); ?>',
            showConfirmButton: true,
            timer: <?php echo !empty($success_message) ? 3000 : 0; ?>,
            showClass: { popup: 'animate__animated animate__fadeInDown animate__faster' },
            hideClass: { popup: 'animate__animated animate__fadeOutUp animate__faster' }
        });
        window.history.replaceState(null, null, window.location.pathname);
    <?php endif; ?>

    // Sub-menu functionality
    document.querySelectorAll('.has-submenu > a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const parentLi = this.parentElement;
            const submenu = parentLi.querySelector('.submenu');
            
            // Toggle current submenu
            parentLi.classList.toggle('open');
            
            // Close other submenus
            document.querySelectorAll('.has-submenu').forEach(item => {
                if (item !== parentLi) {
                    item.classList.remove('open');
                }
            });
        });
    });

    // Competition Re-registrations functionality
    // Pagination variables
    let currentPageReregistration = 1;
    let totalPagesReregistration = 1;
    let allReregistrationData = [];
    let filteredReregistrationData = [];

    function loadCompetitionReregistrations() {
        currentPageReregistration = 1;
        filterReregistrations();
    }

    function filterReregistrations() {
        const status = document.getElementById('filterStatus').value || '';
        const category = document.getElementById('filterCategory').value || '';
        const level = document.getElementById('filterLevel').value || '';
        const search = document.getElementById('searchReregistration').value || '';
        const itemsPerPage = document.getElementById('itemsPerPage').value || 10;
        
        const container = document.getElementById('reregistrationTableContainer');
        if (!container) return;

        container.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';

        // Load statistics
        loadReregistrationStats();

        const params = new URLSearchParams({
            'get_competition_reregistrations': '1',
            'status': status,
            'category': category,
            'level': level,
            'search': search,
            'items_per_page': itemsPerPage,
            'page': currentPageReregistration
        });

        fetch('pb.php?' + params.toString())
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    displayCompetitionReregistrationsTable(data.data, data.pagination);
                } else {
                    container.innerHTML = '<div class="alert alert-danger">Error: ' + data.message + '</div>';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                container.innerHTML = '<div class="alert alert-danger">Error loading competition re-registrations data</div>';
            });
    }

    function resetPagination() {
        currentPageReregistration = 1;
    }

    function goToPage(page) {
        if (page < 1 || page > totalPagesReregistration) return;
        currentPageReregistration = page;
        filterReregistrations();
    }

    function loadReregistrationStats() {
        fetch('pb.php?get_reregistration_stats=1')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const stats = data.stats;
                    // Update saldo
                    document.getElementById('totalSaldoReregistration').textContent = 
                        'Rp ' + stats.total_saldo.toLocaleString('id-ID');
                    // Update counts
                    document.getElementById('totalApprovedReregistration').textContent = stats.approved;
                    document.getElementById('totalPendingReregistration').textContent = stats.pending;
                }
            })
            .catch(error => {
                console.error('Error loading stats:', error);
            });
    }

    function downloadAllReregistrations() {
        // Show loading alert
        Swal.fire({
            title: 'Memproses Download...',
            html: 'Mohon tunggu, sedang mengumpulkan data dan logo peserta.<br><br><i class="fas fa-spinner fa-spin fa-3x"></i>',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Use direct window.location for more reliable download
        const downloadUrl = 'download_reregistration_export.php?t=' + new Date().getTime();
        
        // Trigger download via window.location
        window.location.href = downloadUrl;

        // Close loading alert after a delay
        setTimeout(() => {
            Swal.close();
            Swal.fire({
                icon: 'success',
                title: 'Download Dimulai!',
                html: 'File ZIP berisi:<br>• Data CSV peserta daftar ulang<br>• Folder logos dengan semua logo club<br>• Laporan logo yang hilang (jika ada)',
                timer: 5000,
                timerProgressBar: true,
                showConfirmButton: true,
                confirmButtonText: 'OK'
            });
        }, 2000);
    }

    function displayCompetitionReregistrationsTable(data, pagination) {
        const container = document.getElementById('reregistrationTableContainer');
        const paginationContainer = document.getElementById('paginationContainer');
        
        if (data.length === 0) {
            container.innerHTML = '<div class="alert alert-info">Tidak ada data daftar ulang kompetisi.</div>';
            paginationContainer.style.display = 'none';
            return;
        }

        // Update pagination info
        totalPages = pagination.total_pages;
        currentPage = pagination.current_page;
        
        let tableHtml = `
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Club</th>
                            <th>Nama Sekolah</th>
                            <th>Kategori</th>
                            <th>Level</th>
                            <th>Status</th>
                            <th>Tanggal Submit</th>
                            <th>Biaya</th>
                            <th>Dokumen</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        data.forEach(item => {
            const statusBadge = getStatusBadge(item.status);
            const submitDate = new Date(item.submitted_at).toLocaleDateString('id-ID');
            const biaya = item.total_cost ? 'Rp ' + parseInt(item.total_cost).toLocaleString('id-ID') : '-';
            const schoolName = item.school_name || '-';
            
            // Only show action buttons for submitted status
            const actionButtons = item.status === 'submitted' ? `
                <button class="btn btn-sm btn-info" onclick="viewReregistrationDetail(${item.id})" title="Lihat Detail">
                    <i class="fas fa-eye"></i> Detail
                </button>
                <button class="btn btn-sm btn-success" onclick="approveReregistration(${item.id})">
                    <i class="fas fa-check"></i> Setujui
                </button>
                <button class="btn btn-sm btn-danger" onclick="rejectReregistration(${item.id})">
                    <i class="fas fa-times"></i> Tolak
                </button>
            ` : `
                <button class="btn btn-sm btn-info" onclick="viewReregistrationDetail(${item.id})" title="Lihat Detail">
                    <i class="fas fa-eye"></i> Detail
                </button>
            `;
            
            tableHtml += `
                <tr>
                    <td><strong>${item.club_name}</strong></td>
                    <td>${schoolName}</td>
                    <td>${item.category_name || 'N/A'}</td>
                    <td>${item.level || 'N/A'}</td>
                    <td>${statusBadge}</td>
                    <td>${submitDate}</td>
                    <td>${biaya}</td>
                    <td>
                        <div class="document-links" style="display: flex; gap: 5px; flex-wrap: wrap;">
                            ${item.school_permission_letter ? `<a href="../php/uploads/${item.school_permission_letter}" target="_blank" class="btn btn-sm btn-outline-primary" title="Surat Sekolah"><i class="fas fa-file"></i></a>` : ''}
                            ${item.parent_permission_letter ? `<a href="../php/uploads/${item.parent_permission_letter}" target="_blank" class="btn btn-sm btn-outline-primary" title="Surat Ortu"><i class="fas fa-file"></i></a>` : ''}
                            ${item.team_photo ? `<a href="../php/uploads/${item.team_photo}" target="_blank" class="btn btn-sm btn-outline-primary" title="Foto Tim"><i class="fas fa-image"></i></a>` : ''}
                            ${item.payment_proof ? `<a href="../php/uploads/${item.payment_proof}" target="_blank" class="btn btn-sm btn-outline-primary" title="Bukti Pembayaran"><i class="fas fa-receipt"></i></a>` : ''}
                        </div>
                    </td>
                    <td>
                        <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                            ${actionButtons}
                        </div>
                    </td>
                </tr>
            `;
        });

        tableHtml += `
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = tableHtml;
        
        // Show/hide pagination
        if (pagination.total_pages > 1) {
            paginationContainer.style.display = 'block';
            document.getElementById('currentPageNum').textContent = pagination.current_page;
            document.getElementById('totalPagesNum').textContent = pagination.total_pages;
            
            // Update prev/next buttons
            const prevBtn = document.getElementById('prevBtn');
            const nextBtn = document.getElementById('nextBtn');
            
            if (pagination.current_page <= 1) {
                prevBtn.classList.add('disabled');
            } else {
                prevBtn.classList.remove('disabled');
            }
            
            if (pagination.current_page >= pagination.total_pages) {
                nextBtn.classList.add('disabled');
            } else {
                nextBtn.classList.remove('disabled');
            }
        } else {
            paginationContainer.style.display = 'none';
        }

        // Update global pagination variables
        totalPagesReregistration = pagination.total_pages;
        currentPageReregistration = pagination.current_page;
    }

    function getStatusBadge(status) {
        switch(status) {
            case 'submitted':
                return '<span class="badge badge-warning">Menunggu Review</span>';
            case 'approved':
                return '<span class="badge badge-success">Disetujui</span>';
            case 'rejected':
                return '<span class="badge badge-danger">Ditolak</span>';
            case 'incomplete':
                return '<span class="badge badge-secondary">Tidak Lengkap</span>';
            default:
                return '<span class="badge badge-secondary">' + status + '</span>';
        }
    }

    function approveReregistration(id) {
        Swal.fire({
            title: 'Setujui Daftar Ulang?',
            text: 'Apakah Anda yakin ingin menyetujui daftar ulang kompetisi ini?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Ya, Setujui',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) {
                updateReregistrationStatus(id, 'approved');
            }
        });
    }

    function rejectReregistration(id) {
        Swal.fire({
            title: 'Tolak Daftar Ulang?',
            text: 'Apakah Anda yakin ingin menolak daftar ulang kompetisi ini?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Ya, Tolak',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) {
                updateReregistrationStatus(id, 'rejected');
            }
        });
    }

    function updateReregistrationStatus(id, status) {
        fetch('pb.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `update_reregistration_status=1&id=${id}&status=${status}`,
            credentials: 'same-origin'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil!',
                    text: data.message,
                    timer: 3000
                });
                loadCompetitionReregistrations(); // Reload table
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal!',
                    text: data.message
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: 'Terjadi kesalahan saat memperbarui status: ' + error.message
            });
        });
    }

    function viewReregistrationDetail(id) {
        // Show loading
        Swal.fire({
            title: 'Memuat data...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        fetch(`pb.php?get_reregistration_detail=1&id=${id}`, {
            credentials: 'same-origin'
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    showDetailModal(data.data);
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: data.message
                    });
                }
            })
            .catch(error => {
                console.error('Error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Gagal memuat detail: ' + error.message
                });
            });
    }

    function showDetailModal(item) {
        const statusBadge = getStatusBadge(item.status);
        const submitDate = item.submitted_at ? new Date(item.submitted_at).toLocaleString('id-ID') : 'N/A';
        
        let membersHtml = '<h4 style="margin-top: 20px; color: #2c5aa0;"><i class="fas fa-users"></i> Data Anggota</h4>';
        
        // Komandan
        membersHtml += `
            <div style="background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 8px;">
                <h5 style="color: #28a745;"><i class="fas fa-star"></i> Komandan</h5>
                <p><strong>Nama:</strong> ${item.komandan_nama || 'N/A'}</p>
                ${item.komandan_photo ? `<p><strong>Foto:</strong> <a href="uploads/${item.komandan_photo}" target="_blank" class="btn btn-sm btn-primary"><i class="fas fa-image"></i> Lihat Foto</a></p>` : ''}
            </div>
        `;
        
        // Manager
        membersHtml += `
            <div style="background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 8px;">
                <h5 style="color: #17a2b8;"><i class="fas fa-user-tie"></i> Manager</h5>
                <p><strong>Nama:</strong> ${item.manager_nama || 'N/A'}</p>
                ${item.manager_photo ? `<p><strong>Foto:</strong> <a href="uploads/${item.manager_photo}" target="_blank" class="btn btn-sm btn-primary"><i class="fas fa-image"></i> Lihat Foto</a></p>` : ''}
            </div>
        `;
        
        // Pelatih
        membersHtml += `
            <div style="background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 8px;">
                <h5 style="color: #ffc107;"><i class="fas fa-chalkboard-teacher"></i> Pelatih</h5>
                <p><strong>Nama:</strong> ${item.pelatih_nama || 'N/A'}</p>
                ${item.pelatih_photo ? `<p><strong>Foto:</strong> <a href="uploads/${item.pelatih_photo}" target="_blank" class="btn btn-sm btn-primary"><i class="fas fa-image"></i> Lihat Foto</a></p>` : ''}
            </div>
        `;
        
        // Cadangan
        membersHtml += '<h5 style="margin-top: 20px; color: #6f42c1;"><i class="fas fa-user-friends"></i> Cadangan</h5>';
        for (let i = 1; i <= 2; i++) {
            const namaKey = `cadangan_${i}_nama`;
            const photoKey = `cadangan_${i}_photo`;
            if (item[namaKey]) {
                membersHtml += `
                    <div style="background: #fff; padding: 10px; margin: 5px 0; border-left: 3px solid #6f42c1;">
                        <strong>Cadangan ${i}:</strong> ${item[namaKey]}
                        ${item[photoKey] ? ` | <a href="uploads/${item[photoKey]}" target="_blank" class="btn btn-sm btn-outline-primary"><i class="fas fa-image"></i> Foto</a>` : ''}
                    </div>
                `;
            }
        }
        
        // Pasukan
        membersHtml += '<h5 style="margin-top: 20px; color: #dc3545;"><i class="fas fa-users-cog"></i> Pasukan (15 orang)</h5>';
        membersHtml += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 10px;">';
        for (let i = 1; i <= 15; i++) {
            const namaKey = `pasukan_${i}_nama`;
            const photoKey = `pasukan_${i}_photo`;
            if (item[namaKey]) {
                membersHtml += `
                    <div style="background: #fff; padding: 10px; border: 1px solid #dee2e6; border-radius: 5px;">
                        <strong>Pasukan ${i}:</strong> ${item[namaKey]}
                        ${item[photoKey] ? `<br><a href="uploads/${item[photoKey]}" target="_blank" class="btn btn-sm btn-outline-primary mt-1"><i class="fas fa-image"></i> Foto</a>` : ''}
                    </div>
                `;
            }
        }
        membersHtml += '</div>';

        const htmlContent = `
            <div style="text-align: left; max-height: 70vh; overflow-y: auto; padding: 20px;">
                <h3 style="color: #2c5aa0; border-bottom: 2px solid #2c5aa0; padding-bottom: 10px;">
                    <i class="fas fa-info-circle"></i> Detail Daftar Ulang Kompetisi
                </h3>
                
                <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <h4 style="color: #004085; margin-top: 0;"><i class="fas fa-building"></i> Informasi Club</h4>
                    <p><strong>Nama Club:</strong> ${item.club_name}</p>
                    <p><strong>Username:</strong> ${item.username}</p>
                    <p><strong>Jenjang:</strong> ${item.level}</p>
                    <p><strong>Kategori:</strong> ${item.category_name || 'N/A'}</p>
                    <p><strong>Status:</strong> ${statusBadge}</p>
                    <p><strong>Tanggal Submit:</strong> ${submitDate}</p>
                </div>
                
                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <h4 style="color: #856404; margin-top: 0;"><i class="fas fa-school"></i> Informasi Sekolah</h4>
                    <p><strong>Nama Sekolah:</strong> ${item.school_name || 'N/A'}</p>
                    <p><strong>Jenjang:</strong> ${item.school_level || 'N/A'}</p>
                    <p><strong>Telepon:</strong> ${item.phone || 'N/A'}</p>
                </div>
                
                <div style="background: #d4edda; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <h4 style="color: #155724; margin-top: 0;"><i class="fas fa-file-alt"></i> Dokumen</h4>
                    ${item.school_permission_letter ? `<p><a href="uploads/${item.school_permission_letter}" target="_blank" class="btn btn-primary"><i class="fas fa-file-pdf"></i> Surat Izin Sekolah</a></p>` : '<p>Surat Izin Sekolah: Tidak ada</p>'}
                    ${item.parent_permission_letter ? `<p><a href="uploads/${item.parent_permission_letter}" target="_blank" class="btn btn-primary"><i class="fas fa-file-pdf"></i> Surat Izin Orang Tua</a></p>` : '<p>Surat Izin Orang Tua: Tidak ada</p>'}
                    ${item.team_photo ? `<p><a href="uploads/${item.team_photo}" target="_blank" class="btn btn-primary"><i class="fas fa-image"></i> Foto Tim</a></p>` : ''}
                </div>
                
                ${item.attendance_count || item.total_cost ? `
                <div style="background: #d1ecf1; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <h4 style="color: #0c5460; margin-top: 0;"><i class="fas fa-money-bill-wave"></i> Informasi Biaya</h4>
                    <p><strong>Jumlah Kehadiran:</strong> ${item.attendance_count || 'N/A'} orang</p>
                    <p><strong>Total Biaya:</strong> Rp ${item.total_cost ? item.total_cost.toLocaleString('id-ID') : 'N/A'}</p>
                    ${item.payment_proof ? `<p><a href="uploads/${item.payment_proof}" target="_blank" class="btn btn-primary"><i class="fas fa-receipt"></i> Bukti Pembayaran</a></p>` : ''}
                </div>
                ` : ''}
                
                ${membersHtml}
                
                ${item.team_photo ? `
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center; color: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <h4 style="margin-top: 0; color: white;"><i class="fas fa-camera"></i> Foto Tim/Pasukan Lengkap</h4>
                    <p style="margin: 10px 0; opacity: 0.9;">Foto seluruh anggota tim dalam satu frame</p>
                    <a href="uploads/${item.team_photo}" target="_blank" class="btn btn-light btn-lg" style="margin-top: 10px;">
                        <i class="fas fa-image"></i> Lihat Foto Tim Lengkap
                    </a>
                </div>
                ` : ''}
                
                ${item.admin_notes ? `
                <div style="background: #f8d7da; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <h4 style="color: #721c24; margin-top: 0;"><i class="fas fa-comment"></i> Catatan Admin</h4>
                    <p>${item.admin_notes}</p>
                </div>
                ` : ''}
            </div>
        `;

        Swal.fire({
            html: htmlContent,
            width: '90%',
            showCloseButton: true,
            showConfirmButton: false,
            customClass: {
                popup: 'detail-modal-popup'
            }
        });
    }
</script>



</body>
</html>