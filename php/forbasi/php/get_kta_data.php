<?php
// get_kta_data.php

// CRITICAL: Prevent ANY output before headers
@ini_set('display_errors', '0');
@ini_set('display_startup_errors', '0');
error_reporting(E_ALL);
@ini_set('log_errors', '1');
@ini_set('error_log', __DIR__ . '/php_error_log_kta_api.txt');
@ini_set('memory_limit', '256M');
@ini_set('max_execution_time', '30');

// Start output buffering FIRST
ob_start();

// Custom error handler
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    error_log("PHP Error [$errno]: $errstr in $errfile on line $errline");
    return true;
});

// Set headers IMMEDIATELY
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');
header('Cache-Control: no-cache, must-revalidate');

// Response function
function sendResponse($response) {
    ob_end_clean();
    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit();
}

$response = ['success' => false, 'message' => '', 'data' => null];

$response = ['success' => false, 'message' => '', 'data' => null];

// Load database config
try {
    require_once 'db_config.php';
} catch (Exception $e) {
    error_log("Failed to load db_config: " . $e->getMessage());
    $response['message'] = "Server configuration error.";
    sendResponse($response);
}

if (!isset($conn) || $conn->connect_error) {
    $response['message'] = "Database connection error.";
    error_log("Database connection error in get_kta_data.php: " . ($conn->connect_error ?? 'Unknown'));
    sendResponse($response);
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    $response['message'] = "Invalid request method.";
    sendResponse($response);
}

// Ambil unique_barcode_id dari parameter GET
$unique_barcode_id_from_url = isset($_GET['barcode_id']) ? trim($_GET['barcode_id']) : '';

if (empty($unique_barcode_id_from_url)) {
    $response['message'] = "Barcode ID is required.";
    sendResponse($response);
}

try {
    // Cari application_id berdasarkan kta_barcode_unique_id
    // UBAH: dari unique_barcode_id menjadi kta_barcode_unique_id
    $query_kta_id = "SELECT id, approved_at_pb FROM kta_applications WHERE kta_barcode_unique_id = ?";
    $stmt_kta_id = $conn->prepare($query_kta_id);
    if (!$stmt_kta_id) {
        throw new Exception("Failed to prepare KTA ID query: " . $conn->error);
    }
    // UBAH: Menggunakan $unique_barcode_id_from_url
    $stmt_kta_id->bind_param("s", $unique_barcode_id_from_url);
    $stmt_kta_id->execute();
    $result_kta_id = $stmt_kta_id->get_result();
    $kta_id_data = $result_kta_id->fetch_assoc();
    $stmt_kta_id->close();

    if (!$kta_id_data) {
        throw new Exception("KTA not found for barcode ID: {$unique_barcode_id_from_url}.");
    }

    $application_id = $kta_id_data['id'];
    $approved_at_pb = $kta_id_data['approved_at_pb'];

    // Ambil data lengkap KTA dari database
    $query_app = "SELECT ka.*, u.username AS user_full_name, u.email AS user_email, u.phone AS user_phone,
                          ka.logo_path,
                          p.name AS province_name, c.name AS city_name
                   FROM kta_applications ka
                   JOIN users u ON ka.user_id = u.id
                   LEFT JOIN provinces p ON ka.province_id = p.id
                   LEFT JOIN cities c ON ka.city_id = c.id
                   WHERE ka.id = ?";
    $stmt_app = $conn->prepare($query_app);
    if (!$stmt_app) {
        throw new Exception("Failed to prepare application query: " . $conn->error);
    }
    $stmt_app->bind_param("i", $application_id);
    $stmt_app->execute();
    $result_app = $stmt_app->get_result();
    $app_data = $result_app->fetch_assoc();
    $stmt_app->close();

    if (!$app_data) {
        throw new Exception("KTA application data not found for ID: {$application_id}.");
    }

    // Format tanggal
    $tanggal_keluar_pb = date('d', strtotime($approved_at_pb)) . ' ' .
                         getIndonesianMonth(date('n', strtotime($approved_at_pb))) . ' ' .
                         date('Y', strtotime($approved_at_pb));

    $app_data['note_pb_release_date'] = "KTA ini telah dikeluarkan oleh pengurus besar pada tanggal {$tanggal_keluar_pb}.";

    // Tambahkan URL logo jika ada
    if (!empty($app_data['logo_path'])) {
        // UBAH: Sesuaikan path ini dengan BASE_URL_FOR_PDF Anda
        $app_data['full_logo_url'] = 'https://forbasi.or.id/forbasi/php/uploads/' . $app_data['logo_path'];
    } else {
        $app_data['full_logo_url'] = null;
    }

    // Remove sensitive data before sending response
    unset($app_data['user_email']);
    unset($app_data['user_phone']);
    
    $response['success'] = true;
    $response['message'] = "KTA data retrieved successfully.";
    $response['data'] = $app_data;

} catch (Exception $e) {
    $response['message'] = "Error: " . $e->getMessage();
    error_log("KTA Data Retrieval Exception: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
} finally {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}

sendResponse($response);

function getIndonesianMonth($monthNum) {
    $months = [
        1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
        5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
        9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
    ];
    return $months[$monthNum] ?? '';
}
?>