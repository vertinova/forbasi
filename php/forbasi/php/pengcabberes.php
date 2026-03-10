<?php
session_start();

require_once 'db_config.php'; // Pastikan file ini berisi koneksi database yang benar

// Cek apakah user sudah login dan role-nya adalah Pengurus Cabang (role_id = 2)
if (!isset($_SESSION['user_id']) || $_SESSION['role_id'] != 2) {
    header("Location: login.php"); // Arahkan ke halaman login jika tidak valid
    exit();
}

$admin_id = $_SESSION['user_id'];
$success_message = '';
$error_message = '';

// --- START: PATH CORRECTION ---
// Define the base URL of your application.
// Adjust this based on your actual server configuration.
// Example: http://localhost/forbasi/php/
// Pastikan BASE_URL berakhir dengan slash
define('BASE_URL', 'http://localhost/forbasi/php/');

// Define the relative paths to your upload directories from the BASE_URL.
$upload_dir_relative = 'uploads/';
$kta_files_subdir = 'kta_files/';
$pengcab_payment_proofs_subdir = 'pengcab_payment_proofs/';
// NEW: Subdirectory for Pengcab KTA configs (signatures, stamps)
$pengcab_kta_configs_subdir = 'pengcab_kta_configs/';
// NEW: Subdirectory for generated KTA files
$generated_kta_subdir = 'generated_kta/';

// Construct the full server path for file operations (mkdir, move_uploaded_file)
$server_root = $_SERVER['DOCUMENT_ROOT']; // Gets the document root (e.g., C:/xampp/htdocs)
// IMPORTANT: Adjust $php_forbasi_path to match your project structure.
// If your 'php' folder is directly under 'htdocs', it would be '/forbasi/php/'.
// If 'forbasi' is directly under 'htdocs' and 'php' is inside 'forbasi', it would be '/forbasi/php/'.
// Example: If your URL is http://localhost/forbasi/php/pengcab.php
// Then your server root is typically C:/xampp/htdocs/
// And the path to your 'php' folder relative to htdocs is /forbasi/php/
$php_forbasi_path = '/forbasi/php/'; // The sub-path from document root to your 'php' directory

// Corrected base paths for file system operations (absolute paths on server)
$base_upload_server_path = $server_root . $php_forbasi_path . $upload_dir_relative . $kta_files_subdir;
$pengcab_payment_upload_server_path = $server_root . $php_forbasi_path . $upload_dir_relative . $pengcab_payment_proofs_subdir;
$pengcab_kta_configs_server_path = $server_root . $php_forbasi_path . $upload_dir_relative . $pengcab_kta_configs_subdir;
$generated_kta_server_path = $server_root . $php_forbasi_path . $upload_dir_relative . $generated_kta_subdir;


// Pastikan direktori upload ada
$directories_to_check = [
    $base_upload_server_path,
    $pengcab_payment_upload_server_path,
    $pengcab_kta_configs_server_path,
    $generated_kta_server_path
];

foreach ($directories_to_check as $dir) {
    if (!is_dir($dir)) {
        if (!mkdir($dir, 0777, true)) {
            error_log("Failed to create directory: " . $dir);
            // Consider throwing an error here if directory creation is critical for page load
            // For now, just log and continue, but functionality might be impaired.
        }
    }
}
// --- END: PATH CORRECTION ---


// 1. Ambil data provinsi dan kota/kabupaten dari akun admin_pengcab yang sedang login
$admin_province_id = null;
$admin_city_id = null;
$admin_province_name = null;
$admin_city_name = null;

$query_admin_location = "SELECT u.province_id, u.city_id, p.name AS province_name, c.name AS city_name 
                             FROM users u 
                             LEFT JOIN provinces p ON u.province_id = p.id 
                             LEFT JOIN cities c ON u.city_id = c.id 
                             WHERE u.id = ?";
$stmt_admin_location = $conn->prepare($query_admin_location);
if ($stmt_admin_location) {
    $stmt_admin_location->bind_param("i", $admin_id);
    $stmt_admin_location->execute();
    $result_admin_location = $stmt_admin_location->get_result();
    if ($row_admin_location = $result_admin_location->fetch_assoc()) {
        $admin_province_id = $row_admin_location['province_id'];
        $admin_city_id = $row_admin_location['city_id'];
        $admin_province_name = $row_admin_location['province_name'];
        $admin_city_name = $row_admin_location['city_name'];
    }
    $stmt_admin_location->close();
} else {
    error_log("Failed to prepare admin location query: " . $conn->error);
    die("Error retrieving admin location. Please contact support.");
}

// Periksa apakah admin memiliki province_id dan city_id yang terdaftar
if (empty($admin_province_id) || empty($admin_city_id)) {
    $error_message = "Profil Pengurus Cabang Anda belum memiliki informasi Provinsi atau Kabupaten/Kota. Harap lengkapi profil Anda melalui admin pusat.";
}

// Function untuk mencatat aktivitas
function logActivity($conn, $userId, $activityType, $description, $applicationId = null, $oldStatus = null, $newStatus = null) {
    $insert_log_query = "INSERT INTO activity_log (user_id, activity_type, description, application_id, old_status, new_status) VALUES (?, ?, ?, ?, ?, ?)";
    $stmt_log = $conn->prepare($insert_log_query);
    if ($stmt_log) {
        $stmt_log->bind_param("isssis", $userId, $activityType, $description, $applicationId, $oldStatus, $newStatus);
        $stmt_log->execute();
        $stmt_log->close();
    } else {
        error_log("Failed to prepare activity log statement: " . $conn->error);
    }
}

// --- START: KTA Configuration Logic ---
$ketua_umum_name = '';
$signature_image_path = '';
$stamp_image_path = '';
$kta_config_exists = false;

// Fetch existing KTA configuration for the logged-in pengcab
$query_config = "SELECT ketua_umum_name, signature_image_path, stamp_image_path FROM pengcab_kta_configs WHERE user_id = ?";
$stmt_config = $conn->prepare($query_config);
if ($stmt_config) {
    $stmt_config->bind_param("i", $admin_id);
    $stmt_config->execute();
    $result_config = $stmt_config->get_result();
    if ($row_config = $result_config->fetch_assoc()) {
        $ketua_umum_name = htmlspecialchars($row_config['ketua_umum_name']);
        $signature_image_path = $row_config['signature_image_path'];
        $stamp_image_path = $row_config['stamp_image_path'];
        $kta_config_exists = true;
    }
    $stmt_config->close();
} else {
    error_log("Failed to prepare config query: " . $conn->error);
}

// Handle AJAX request for saving KTA configuration
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['save_kta_config_ajax'])) {
    header('Content-Type: application/json');
    $response = ['success' => false, 'message' => ''];

    if (!isset($conn) || $conn->connect_error) {
        $response['message'] = "Database connection error.";
        echo json_encode($response);
        exit();
    }

    $new_ketua_umum_name = filter_var($_POST['ketua_umum_name'] ?? '', FILTER_SANITIZE_STRING);
    $signature_data_url = $_POST['signature_data_url'] ?? ''; // Base64 data from canvas

    $conn->begin_transaction();

    try {
        $current_signature_path = '';
        $current_stamp_path = '';

        // Get current paths before update to clean up old files
        if ($kta_config_exists) {
            $query_current_paths = "SELECT signature_image_path, stamp_image_path FROM pengcab_kta_configs WHERE user_id = ?";
            $stmt_current_paths = $conn->prepare($query_current_paths);
            if ($stmt_current_paths) {
                $stmt_current_paths->bind_param("i", $admin_id);
                $stmt_current_paths->execute();
                $result_current_paths = $stmt_current_paths->get_result();
                if ($row_paths = $result_current_paths->fetch_assoc()) {
                    $current_signature_path = $row_paths['signature_image_path'];
                    $current_stamp_path = $row_paths['stamp_image_path'];
                }
                $stmt_current_paths->close();
            }
        }
        
        $new_signature_filename = $current_signature_path; // Keep old if not updated
        if (!empty($signature_data_url)) {
            // Remove "data:image/png;base64," prefix
            $data = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $signature_data_url));
            $new_signature_filename = 'signature_' . $admin_id . '_' . uniqid() . '.png';
            $signature_target_path = $pengcab_kta_configs_server_path . $new_signature_filename;

            if (file_put_contents($signature_target_path, $data) === false) {
                throw new Exception("Gagal menyimpan gambar tanda tangan.");
            }
            // Delete old signature file if it exists and is different from new one
            if ($current_signature_path && $current_signature_path != $new_signature_filename && file_exists($pengcab_kta_configs_server_path . $current_signature_path)) {
                unlink($pengcab_kta_configs_server_path . $current_signature_path);
            }
        }

        $new_stamp_filename = $current_stamp_path; // Keep old if not updated
        if (isset($_FILES['stamp_file']) && $_FILES['stamp_file']['error'] === UPLOAD_ERR_OK) {
            $file_tmp_name = $_FILES['stamp_file']['tmp_name'];
            $file_ext = pathinfo($_FILES['stamp_file']['name'], PATHINFO_EXTENSION);
            $allowed_ext = ['jpg', 'jpeg', 'png'];
            if (!in_array(strtolower($file_ext), $allowed_ext)) {
                throw new Exception("Format file stempel tidak diizinkan. Hanya JPG, JPEG, PNG yang diperbolehkan.");
            }
            $new_stamp_filename = 'stamp_' . $admin_id . '_' . uniqid() . '.' . $file_ext;
            $stamp_target_path = $pengcab_kta_configs_server_path . $new_stamp_filename;

            if (!move_uploaded_file($file_tmp_name, $stamp_target_path)) {
                throw new Exception("Gagal mengunggah file stempel. Pastikan ukuran file tidak melebihi batas server.");
            }
            // Delete old stamp file if it exists and is different from new one
            if ($current_stamp_path && $current_stamp_path != $new_stamp_filename && file_exists($pengcab_kta_configs_server_path . $current_stamp_path)) {
                unlink($pengcab_kta_configs_server_path . $current_stamp_path);
            }
        }

        if ($kta_config_exists) {
            $update_query = "UPDATE pengcab_kta_configs SET ketua_umum_name = ?, signature_image_path = ?, stamp_image_path = ?, updated_at = NOW() WHERE user_id = ?";
            $stmt = $conn->prepare($update_query);
            if (!$stmt) {
                throw new Exception("Gagal mempersiapkan pernyataan update konfigurasi: " . $conn->error);
            }
            $stmt->bind_param("sssi", $new_ketua_umum_name, $new_signature_filename, $new_stamp_filename, $admin_id);
        } else {
            $insert_query = "INSERT INTO pengcab_kta_configs (user_id, ketua_umum_name, signature_image_path, stamp_image_path) VALUES (?, ?, ?, ?)";
            $stmt = $conn->prepare($insert_query);
            if (!$stmt) {
                throw new Exception("Gagal mempersiapkan pernyataan insert konfigurasi: " . $conn->error);
            }
            $stmt->bind_param("isss", $admin_id, $new_ketua_umum_name, $new_signature_filename, $new_stamp_filename);
        }

        if (!$stmt->execute()) {
            throw new Exception("Gagal menyimpan konfigurasi KTA: " . $stmt->error);
        }
        $stmt->close();

        logActivity($conn, $admin_id, 'KTA Configuration', 'Pengurus Cabang memperbarui konfigurasi KTA otomatis.');

        $conn->commit();
        $response['success'] = true;
        $response['message'] = "Konfigurasi KTA berhasil disimpan!";
        // Send back the new file paths if updated, so client can display preview
        $response['signature_path'] = $new_signature_filename ? BASE_URL . $upload_dir_relative . $pengcab_kta_configs_subdir . $new_signature_filename : '';
        $response['stamp_path'] = $new_stamp_filename ? BASE_URL . $upload_dir_relative . $pengcab_kta_configs_subdir . $new_stamp_filename : '';


    } catch (Exception $e) {
        $conn->rollback();
        $response['message'] = "Terjadi kesalahan: " . $e->getMessage();
        error_log("KTA Config Save Error: " . $e->getMessage() . " for admin ID: " . $admin_id);
        // Clean up newly uploaded files on error if they were moved
        if (!empty($new_signature_filename) && file_exists($pengcab_kta_configs_server_path . $new_signature_filename) && $new_signature_filename != $current_signature_path) {
            unlink($pengcab_kta_configs_server_path . $new_signature_filename);
        }
        if (!empty($new_stamp_filename) && file_exists($pengcab_kta_configs_server_path . $new_stamp_filename) && $new_stamp_filename != $current_stamp_path) {
            unlink($pengcab_kta_configs_server_path . $current_stamp_path);
        }
    }

    echo json_encode($response);
    exit();
}
// --- END: KTA Configuration Logic ---

// Handle AJAX request for KTA application approval/rejection
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['update_kta_status_ajax'])) {
    header('Content-Type: application/json'); // Set header for JSON response
    $response = ['success' => false, 'message' => '']; // Default response

    if (!isset($conn) || $conn->connect_error) {
        $response['message'] = "Database connection error.";
        echo json_encode($response);
        exit();
    }

    $application_id = filter_var($_POST['application_id'] ?? '', FILTER_VALIDATE_INT);
    $new_status = filter_var($_POST['new_status'] ?? '', FILTER_SANITIZE_STRING);
    $notes = filter_var($_POST['notes'] ?? '', FILTER_SANITIZE_STRING);
    $uploaded_payment_proof_filename = '';

    if ($application_id === false || $application_id <= 0) {
        $response['message'] = "ID aplikasi tidak valid.";
        echo json_encode($response);
        exit();
    }
    if (!in_array($new_status, ['approved_pengcab', 'rejected'])) {
        $response['message'] = "Status baru tidak valid.";
        echo json_encode($response);
        exit();
    }
    if (!isset($admin_id)) {
        $response['message'] = "ID admin tidak ditemukan. Silakan login kembali.";
        echo json_encode($response);
        exit();
    }

    $current_app_status = null;
    $current_status_query = "SELECT status, province_id, city_id FROM kta_applications WHERE id = ?";
    if ($stmt_current_status = $conn->prepare($current_status_query)) {
        $stmt_current_status->bind_param("i", $application_id);
        $stmt_current_status->execute();
        $current_status_result = $stmt_current_status->get_result();
        $app_data = $current_status_result->fetch_assoc();
        $current_app_status = $app_data['status'] ?? null;
        $app_province_id = $app_data['province_id'] ?? null;
        $app_city_id = $app_data['city_id'] ?? null;
        $stmt_current_status->close();
    } else {
        $response['message'] = "Error mempersiapkan query status saat ini: " . $conn->error;
        echo json_encode($response);
        exit();
    }

    if ($app_province_id != $admin_province_id || $app_city_id != $admin_city_id) {
        $response['message'] = "Anda tidak memiliki izin untuk memverifikasi pengajuan KTA dari wilayah ini.";
        echo json_encode($response);
        exit();
    }

    if ($current_app_status != 'pending' || !in_array($new_status, ['approved_pengcab', 'rejected'])) {
        $response['message'] = "Transisi status tidak valid. Aplikasi tidak dalam status 'pending' atau status baru tidak diizinkan.";
        echo json_encode($response);
        exit();
    }

    $conn->begin_transaction();

    try {
        if ($new_status == 'approved_pengcab') {
            if (!isset($_FILES['pengcab_payment_proof']) || $_FILES['pengcab_payment_proof']['error'] !== UPLOAD_ERR_OK) {
                throw new Exception("Untuk menyetujui, Anda wajib mengunggah bukti pembayaran kepada Pengda. Error: " . ($_FILES['pengcab_payment_proof']['error'] ?? 'No file uploaded'));
            }

            // Use the correct server path for file uploads
            if (!is_dir($pengcab_payment_upload_server_path) && !mkdir($pengcab_payment_upload_server_path, 0777, true)) {
                throw new Exception("Direktori upload tidak dapat dibuat atau tidak ada.");
            }
            if (!is_writable($pengcab_payment_upload_server_path)) {
                throw new Exception("Direktori upload tidak dapat ditulisi.");
            }

            $file_tmp_name = $_FILES['pengcab_payment_proof']['tmp_name'];
            $file_ext = pathinfo($_FILES['pengcab_payment_proof']['name'], PATHINFO_EXTENSION);
            $allowed_ext = ['jpg', 'jpeg', 'png', 'pdf'];
            if (!in_array(strtolower($file_ext), $allowed_ext)) {
                throw new Exception("Format file tidak diizinkan. Hanya JPG, JPEG, PNG, dan PDF yang diperbolehkan.");
            }

            $file_name = uniqid('pengcab_payment_') . '.' . $file_ext;
            $target_path = $pengcab_payment_upload_server_path . $file_name; // Use server path for moving

            if (!move_uploaded_file($file_tmp_name, $target_path)) {
                throw new Exception("Gagal mengunggah bukti pembayaran Pengcab. Pastikan ukuran file tidak melebihi batas server.");
            }
            $uploaded_payment_proof_filename = $file_name;

            $update_query = "UPDATE kta_applications SET 
                                 status = ?, 
                                 approved_by_pengcab_id = ?, 
                                 approved_at_pengcab = NOW(), 
                                 notes_pengcab = ?, 
                                 pengcab_payment_proof_path = ? 
                                 WHERE id = ?";
            $params = "sisss";
            $param_values = [$new_status, $admin_id, $notes, $uploaded_payment_proof_filename, $application_id];
        } else { // status is 'rejected'
            $update_query = "UPDATE kta_applications SET 
                                 status = ?, 
                                 approved_by_pengcab_id = ?, 
                                 approved_at_pengcab = NOW(), 
                                 notes_pengcab = ? 
                                 WHERE id = ?";
            $params = "sisi";
            $param_values = [$new_status, $admin_id, $notes, $application_id];
        }

        if ($stmt = $conn->prepare($update_query)) {
            // Fix for call_user_func_array with bind_param - it expects references
            $bind_params = array_merge([$params], $param_values);
            $tmp = []; // Temporary array for references
            foreach($bind_params as $key => $value) $tmp[$key] = &$bind_params[$key];
            call_user_func_array([$stmt, 'bind_param'], $tmp);

            if (!$stmt->execute()) {
                throw new Exception("Gagal memperbarui status KTA: " . $stmt->error);
            }
            $stmt->close();

            $insert_history_query = "INSERT INTO kta_application_history (application_id, status, notes) VALUES (?, ?, ?)";
            if ($stmt_history = $conn->prepare($insert_history_query)) {
                $stmt_history->bind_param("iss", $application_id, $new_status, $notes);
                if (!$stmt_history->execute()) {
                    throw new Exception("Gagal mencatat riwayat aplikasi KTA: " . $stmt_history->error);
                }
                $stmt_history->close();
            } else {
                throw new Exception("Gagal mempersiapkan statement riwayat: " . $conn->error);
            }
            
            $conn->commit(); // <<< TRANSAKSI DI-COMMIT DI SINI
            $response['success'] = true;
            $response['message'] = "Status pengajuan KTA berhasil diperbarui.";

            // SEKARANG, SETELAH TRANSAKSI DATABASE UTAMA DI-COMMIT, BARU PANGGIL SCRIPT PEMBUAT PDF
            if ($new_status == 'approved_pengcab') {
                $pdf_gen_data = [
                    'application_id' => $application_id,
                    'admin_id' => $admin_id // Pass admin_id to get KTA config (signature, stamp, ketua umum name)
                ];

                // Use cURL to call the PDF generation script internally
                $ch = curl_init(BASE_URL . 'generate_kta_pdf.php'); // Ensure BASE_URL is correctly set
                curl_setopt($ch, CURLOPT_POST, 1);
                curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($pdf_gen_data));
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); // Get response as string
                curl_setopt($ch, CURLOPT_HEADER, false); // Don't include header in response
                curl_setopt($ch, CURLOPT_HTTPHEADER, array('Accept: application/json')); // Request JSON response
                curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10); // Timeout koneksi 10 detik
                curl_setopt($ch, CURLOPT_TIMEOUT, 60); // Timeout eksekusi 60 detik (sesuaikan jika proses PDF lama)


                $pdf_gen_response = curl_exec($ch);
                $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                $curl_error = curl_error($ch);
                curl_close($ch);

                if ($pdf_gen_response === false || $http_code != 200) {
                    $error_msg = "Gagal memanggil generate_kta_pdf.php. HTTP Status: {$http_code}. Error: {$curl_error}. Response: " . substr($pdf_gen_response, 0, 200) . "..."; // Potong respons jika terlalu panjang
                    error_log("PDF Generation Curl Error: " . $error_msg);
                    // Ini adalah kesalahan yang terjadi SETELAH update status berhasil.
                    // Anda bisa memilih untuk tidak melakukan rollback pada status aplikasi KTA yang sudah terupdate,
                    // hanya memberikan pesan kesalahan di frontend.
                    $response['success'] = false; // Set success ke false agar frontend tahu ada masalah di PDF
                    $response['message'] .= " Namun, terjadi kesalahan saat menghasilkan KTA PDF: " . $error_msg;
                } else {
                    $pdf_gen_result = json_decode($pdf_gen_response, true);
                    if (!$pdf_gen_result || !$pdf_gen_result['success']) {
                        $error_msg = $pdf_gen_result['message'] ?? 'Respons tidak valid dari script generasi PDF atau proses PDF gagal.';
                        error_log("PDF Generation Script Error: " . $error_msg . " Full Response: " . $pdf_gen_response);
                        $response['success'] = false;
                        $response['message'] .= " Namun, terjadi kesalahan saat menghasilkan KTA PDF: " . $error_msg;
                    } else {
                        // Jika PDF berhasil digenerate, tambahkan URL-nya ke respons
                        $response['kta_generated_url'] = $pdf_gen_result['kta_url'];
                    }
                }
            }

            if (function_exists('logActivity')) { 
                    logActivity($conn, $admin_id, 'Update KTA Application Status', 
                                    "Memperbarui status pengajuan KTA ID {$application_id} dari '{$current_app_status}' menjadi '{$new_status}'. Catatan: {$notes}", 
                                    $application_id, $current_app_status, $new_status); 
            } else { 
                error_log("Fungsi logActivity tidak didefinisikan."); 
            } 

        } else {
            throw new Exception("Error mempersiapkan pernyataan update: " . $conn->error);
        }

    } catch (Exception $e) {
        $conn->rollback(); // Rollback jika ada kesalahan sebelum commit
        $response['message'] = "Terjadi kesalahan: " . $e->getMessage();
        error_log("KTA Status Update Error: " . $e->getMessage() . " on application ID: " . $application_id);
        // If an error occurred during approval, remove the uploaded payment proof if it was moved
        if ($new_status == 'approved_pengcab' && !empty($target_path) && file_exists($target_path)) {
            unlink($target_path);
        }
    }

    echo json_encode($response);
    exit();
}

// Pagination and Search Parameters
$records_per_page = 5;

// For KTA Applications 
$kta_current_page = isset($_GET['kta_page']) ? (int)$_GET['kta_page'] : 1; 
$kta_offset = ($kta_current_page - 1) * $records_per_page; 
$kta_search_query = isset($_GET['kta_search']) ? '%' . $_GET['kta_search'] . '%' : '%'; 

// For Activity Log 
$log_current_page = isset($_GET['log_page']) ? (int)$_GET['log_page'] : 1; 
$log_offset = ($log_current_page - 1) * $records_per_page; 
$log_search_query = isset($_GET['log_search']) ? '%' . $_GET['log_search'] . '%' : '%'; 


// Fetch KTA applications for Pengcab (only applications with status 'pending' and matching admin's region)
function fetchKTAApplications($conn, $admin_province_id, $admin_city_id, $limit, $offset, $search_term) {
    $kta_applications = [];
    $total_records = 0;

    // Count total records for pagination
    $count_query = "SELECT COUNT(*) AS total
                    FROM kta_applications ka
                    JOIN users u ON ka.user_id = u.id
                    WHERE ka.status = 'pending'
                    AND ka.province_id = ? AND ka.city_id = ?
                    AND (ka.club_name LIKE ? OR ka.leader_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)";
    $stmt_count = $conn->prepare($count_query);
    if ($stmt_count) {
        $stmt_count->bind_param("iissss", $admin_province_id, $admin_city_id, $search_term, $search_term, $search_term, $search_term);
        $stmt_count->execute();
        $count_result = $stmt_count->get_result();
        $total_records = $count_result->fetch_assoc()['total'];
        $stmt_count->close();
    } else {
        error_log("Failed to prepare KTA count query: " . $conn->error);
        return ['error' => "Gagal menghitung total pengajuan KTA: " . $conn->error, 'total_records' => 0, 'data' => []];
    }

    // MODIFIED: Fetch also generated_kta_file_path
    // CORRECTED: Removed duplicate 'JOIN' keyword and changed u.full_name to u.username
    $query_kta = "SELECT ka.*, u.username AS user_full_name, u.email AS user_email, u.phone AS user_phone, 
                                p.name AS province_name_kta, c.name AS city_name_kta 
                            FROM kta_applications ka 
                            JOIN users u ON ka.user_id = u.id 
                            LEFT JOIN provinces p ON ka.province_id = p.id 
                            LEFT JOIN cities c ON ka.city_id = c.id 
                            WHERE ka.status = 'pending' AND ka.province_id = ? AND ka.city_id = ? 
                            AND (ka.club_name LIKE ? OR ka.leader_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?) 
                            ORDER BY ka.created_at DESC 
                            LIMIT ? OFFSET ?"; 

    $stmt_kta = $conn->prepare($query_kta);
    if ($stmt_kta) {
        $stmt_kta->bind_param("iissssii", $admin_province_id, $admin_city_id, $search_term, $search_term, $search_term, $search_term, $limit, $offset);
        $stmt_kta->execute();
        $result_kta = $stmt_kta->get_result();

        if ($result_kta) {
            while ($row = $result_kta->fetch_assoc()) {
                // Ensure BASE_URL is defined when accessed from a function.
                // It's already defined globally, so direct access is fine.
                $row['logo_path_display'] = $row['logo_path'] ? BASE_URL . 'uploads/kta_files/' . basename($row['logo_path']) : '';
                $row['ad_file_path_display'] = $row['ad_file_path'] ? BASE_URL . 'uploads/kta_files/' . basename($row['ad_file_path']) : '';
                $row['art_file_path_display'] = $row['art_file_path'] ? BASE_URL . 'uploads/kta_files/' . basename($row['art_file_path']) : '';
                $row['sk_file_path_display'] = $row['sk_file_path'] ? BASE_URL . 'uploads/kta_files/' . basename($row['sk_file_path']) : '';
                $row['payment_proof_path_display'] = $row['payment_proof_path'] ? BASE_URL . 'uploads/kta_files/' . basename($row['payment_proof_path']) : '';
                $row['pengcab_payment_proof_path_display'] = $row['pengcab_payment_proof_path'] ? BASE_URL . 'uploads/pengcab_payment_proofs/' . basename($row['pengcab_payment_proof_path']) : '';
                // NEW: Path untuk KTA yang sudah dihasilkan
                $row['generated_kta_file_path_display'] = $row['generated_kta_file_path'] ? BASE_URL . 'uploads/generated_kta/' . basename($row['generated_kta_file_path']) : '';
                
                $kta_applications[] = $row;
            }
        } else {
            return ['error' => "Gagal mengambil data pengajuan KTA: " . $stmt_kta->error, 'total_records' => 0, 'data' => []];
        }
        $stmt_kta->close();
    } else {
        return ['error' => "Gagal mempersiapkan query pengajuan KTA: " . $conn->error, 'total_records' => 0, 'data' => []];
    }
    return ['data' => $kta_applications, 'total_records' => $total_records];
}

// Fetch Activity Log for Pengcab
function fetchActivityLog($conn, $admin_id, $limit, $offset, $search_term) {
    $activity_log = [];
    $total_records = 0;

    // Count total records for pagination
    $count_query = "SELECT COUNT(*) AS total
                    FROM activity_log al
                    LEFT JOIN kta_applications ka ON al.application_id = ka.id
                    WHERE al.user_id = ?
                    AND (al.activity_type LIKE ? OR al.description LIKE ? OR ka.club_name LIKE ?)";
    $stmt_count = $conn->prepare($count_query);
    if ($stmt_count) {
        $stmt_count->bind_param("isss", $admin_id, $search_term, $search_term, $search_term);
        $stmt_count->execute();
        $count_result = $stmt_count->get_result();
        $total_records = $count_result->fetch_assoc()['total'];
        $stmt_count->close();
    } else {
        error_log("Failed to prepare activity log count query: " . $conn->error);
        return ['error' => "Gagal menghitung total riwayat aktivitas: " . $conn->error, 'total_records' => 0, 'data' => []];
    }

    $query_log = "SELECT al.*, ka.club_name AS application_club_name
                    FROM activity_log al
                    LEFT JOIN kta_applications ka ON al.application_id = ka.id
                    WHERE al.user_id = ?
                    AND (al.activity_type LIKE ? OR al.description LIKE ? OR ka.club_name LIKE ?)
                    ORDER BY al.created_at DESC
                    LIMIT ? OFFSET ?";
    $stmt_log = $conn->prepare($query_log);
    if ($stmt_log) {
        $stmt_log->bind_param("isssii", $admin_id, $search_term, $search_term, $search_term, $limit, $offset);
        $stmt_log->execute();
        $result_log = $stmt_log->get_result();
        while ($row = $result_log->fetch_assoc()) {
            $activity_log[] = $row;
        }
        $stmt_log->close();
    } else {
        error_log("Failed to prepare activity log fetch statement: " . $conn->error);
        return ['error' => "Gagal mengambil riwayat aktivitas: " . $conn->error, 'total_records' => 0, 'data' => []];
    }
    return ['data' => $activity_log, 'total_records' => $total_records];
}

// Helper function to render pagination links
function renderPagination($total_records, $records_per_page, $current_page, $param_prefix, $search_param_name, $current_search_value) {
    $total_pages = ceil($total_records / $records_per_page);
    $output = '';

    if ($total_pages > 1) {
        $output .= '<div class="pagination">';
        if ($current_page > 1) {
            $output .= '<a href="?'.$param_prefix.'_page=' . ($current_page - 1) . '&'.$search_param_name.'=' . urlencode(trim($current_search_value, '%')) . '" class="page-link prev"><i class="fas fa-chevron-left"></i> Sebelumnya</a>';
        }

        $start_page = max(1, $current_page - 2);
        $end_page = min($total_pages, $current_page + 2);

        if ($start_page > 1) {
            $output .= '<a href="?'.$param_prefix.'_page=1&'.$search_param_name.'=' . urlencode(trim($current_search_value, '%')) . '" class="page-link">1</a>';
            if ($start_page > 2) {
                $output .= '<span class="page-dots">...</span>';
            }
        }

        for ($i = $start_page; $i <= $end_page; $i++) {
            $active_class = ($i == $current_page) ? 'active' : '';
            $output .= '<a href="?'.$param_prefix.'_page=' . $i . '&'.$search_param_name.'=' . urlencode(trim($current_search_value, '%')) . '" class="page-link ' . $active_class . '">' . $i . '</a>';
        }

        if ($end_page < $total_pages) {
            if ($end_page < $total_pages - 1) {
                $output .= '<span class="page-dots">...</span>';
            }
            $output .= '<a href="?'.$param_prefix.'_page=' . $total_pages . '&'.$search_param_name.'=' . urlencode(trim($current_search_value, '%')) . '" class="page-link">' . $total_pages . '</a>';
        }

        if ($current_page < $total_pages) {
            $output .= '<a href="?'.$param_prefix.'_page=' . ($current_page + 1) . '&'.$search_param_name.'=' . urlencode(trim($current_search_value, '%')) . '" class="page-link next">Selanjutnya <i class="fas fa-chevron-right"></i></a>';
        }
        $output .= '</div>';
    }
    return $output;
}


// Initial load of applications and log 
$kta_result = fetchKTAApplications($conn, $admin_province_id, $admin_city_id, $records_per_page, $kta_offset, $kta_search_query); 
$kta_applications = $kta_result['data']; 
$kta_total_records = $kta_result['total_records']; 

$activity_log_result = fetchActivityLog($conn, $admin_id, $records_per_page, $log_offset, $log_search_query); 
$activity_log_data = $activity_log_result['data']; 
$activity_log_total_records = $activity_log_result['total_records']; 


// If the request is an AJAX request to load table (after successful update or pagination/search) 
if (isset($_GET['fetch_table_only']) && $_GET['fetch_table_only'] == 'true') { 
    header('Content-Type: text/html'); 
    if (isset($kta_result['error'])) { 
        echo '<div class="alert alert-danger animated fadeIn"><i class="fas fa-exclamation-circle"></i> ' . $kta_result['error'] . '</div>'; 
    } else { 
        ?> 
        <div class="search-pagination-container"> 
            <input type="text" id="kta-search-input" class="form-control search-input" placeholder="Cari pengajuan KTA..." value="<?php echo htmlspecialchars(trim($kta_search_query, '%')); ?>"> 
            <?php echo renderPagination($kta_total_records, $records_per_page, $kta_current_page, 'kta', 'kta_search', $kta_search_query); ?> 
        </div> 
        <?php if (empty($kta_applications)): ?> 
            <p class="text-center text-muted no-data-message animated fadeIn">Tidak ada pengajuan KTA yang menunggu verifikasi Anda di wilayah **<?php echo htmlspecialchars($admin_city_name); ?>, <?php echo htmlspecialchars($admin_province_name); ?>**.</p> 
        <?php else: ?> 
            <div class="table-responsive animated fadeIn"> 
                <table class="data-table"> 
                    <thead> 
                        <tr> 
                            <th>ID</th> 
                            <th>Nama Club</th> 
                            <th>Penanggung Jawab</th> 
                            <th>Email</th> 
                            <th>Telepon</th> 
                            <th>Provinsi</th> 
                            <th>Kabupaten</th> 
                            <th>Alamat</th> 
                            <th>Logo</th> 
                            <th>AD</th> 
                            <th>ART</th> 
                            <th>SK</th> 
                            <th>Bukti Bayar User</th> 
                            <th>Bukti Bayar Pengcab</th> 
                            <th>KTA Otomatis</th> <th>Status</th> 
                            <th>Aksi</th> 
                        </tr> 
                    </thead> 
                    <tbody> 
                        <?php 
                        $animation_delay = 0; 
                        foreach ($kta_applications as $app): 
                            $animation_delay += 0.05; 
                        ?> 
                            <tr class="animated fadeInUp" style="animation-delay: <?php echo $animation_delay; ?>s;"> 
                                <td data-label="ID"><?php echo htmlspecialchars($app['id']); ?></td> 
                                <td data-label="Nama Club"><?php echo htmlspecialchars($app['club_name']); ?></td> 
                                <td data-label="Penanggung Jawab"><?php echo htmlspecialchars($app['leader_name']); ?></td> 
                                <td data-label="Email"><?php echo htmlspecialchars($app['user_email']); ?></td> 
                                <td data-label="Telepon"><?php echo htmlspecialchars($app['user_phone']); ?></td> 
                                <td data-label="Provinsi"><?php echo htmlspecialchars($app['province']); ?></td> 
                                <td data-label="Kabupaten"><?php echo htmlspecialchars($app['regency']); ?></td> 
                                <td data-label="Alamat Club"><?php echo htmlspecialchars($app['club_address']); ?></td> 
                                <td data-label="Logo"> 
                                    <?php echo $app['logo_path_display'] ? '<a href="' . htmlspecialchars($app['logo_path_display']) . '" target="_blank" class="file-link"><i class="fas fa-image"></i> Lihat</a>' : '<span class="text-muted">Tidak Diupload</span>'; ?> 
                                </td> 
                                <td data-label="AD"> 
                                    <?php echo $app['ad_file_path_display'] ? '<a href="' . htmlspecialchars($app['ad_file_path_display']) . '" target="_blank" class="file-link"><i class="fas fa-file-pdf"></i> Lihat</a>' : '<span class="text-muted">Tidak Diupload</span>'; ?> 
                                </td> 
                                <td data-label="ART"> 
                                    <?php echo $app['art_file_path_display'] ? '<a href="' . htmlspecialchars($app['art_file_path_display']) . '" target="_blank" class="file-link"><i class="fas fa-file-pdf"></i> Lihat</a>' : '<span class="text-muted">Tidak Diupload</span>'; ?> 
                                </td> 
                                <td data-label="SK"> 
                                    <?php echo $app['sk_file_path_display'] ? '<a href="' . htmlspecialchars($app['sk_file_path_display']) . '" target="_blank" class="file-link"><i class="fas fa-file-pdf"></i> Lihat</a>' : '<span class="text-muted">Tidak Diupload</span>'; ?> 
                                </td> 
                                <td data-label="Bukti Bayar User"> 
                                    <?php echo $app['payment_proof_path_display'] ? '<a href="' . htmlspecialchars($app['payment_proof_path_display']) . '" target="_blank" class="file-link"><i class="fas fa-receipt"></i> Lihat</a>' : '<span class="text-muted">Tidak Diupload</span>'; ?> 
                                </td> 
                                <td data-label="Bukti Bayar Pengcab"> 
                                    <?php echo $app['pengcab_payment_proof_path_display'] ? '<a href="' . htmlspecialchars($app['pengcab_payment_proof_path_display']) . '" target="_blank" class="file-link"><i class="fas fa-file-invoice-dollar"></i> Lihat</a>' : '<span class="text-muted">Belum diupload</span>'; ?> 
                                </td> 
                                <td data-label="KTA Otomatis"> <?php if ($app['generated_kta_file_path_display']): ?> 
                                            <a href="<?php echo htmlspecialchars($app['generated_kta_file_path_display']); ?>" target="_blank" class="file-link"><i class="fas fa-id-card"></i> Lihat KTA</a> 
                                        <?php else: ?> 
                                            <span class="text-muted">Belum Dihasilkan</span> 
                                        <?php endif; ?> 
                                </td> 
                                <td data-label="Status"><span class="status-badge status-<?php echo strtolower($app['status']); ?>"><?php echo htmlspecialchars(ucfirst(str_replace('_', ' ', $app['status']))); ?></span></td> 
                                <td data-label="Aksi" class="actions"> 
                                    <button class="btn btn-approve" onclick="openModal(<?php echo $app['id']; ?>, 'approved_pengcab')" <?php echo $app['status'] !== 'pending' ? 'disabled' : ''; ?>><i class="fas fa-check"></i> Setujui</button> 
                                    <button class="btn btn-reject" onclick="openModal(<?php echo $app['id']; ?>, 'rejected')" <?php echo $app['status'] !== 'pending' ? 'disabled' : ''; ?>><i class="fas fa-times"></i> Tolak</button> 
                                </td> 
                            </tr> 
                        <?php endforeach; ?> 
                    </tbody> 
                </table> 
            </div> 
        <?php endif; ?> 
        <?php 
    } 
    exit(); 
} 

// If the request is an AJAX request to load activity log 
if (isset($_GET['fetch_activity_log_only']) && $_GET['fetch_activity_log_only'] == 'true') { 
    header('Content-Type: text/html'); 
    if (isset($activity_log_result['error'])) { 
        echo '<div class="alert alert-danger animated fadeIn"><i class="fas fa-exclamation-circle"></i> ' . $activity_log_result['error'] . '</div>'; 
    } else { 
        ?> 
        <div class="search-pagination-container"> 
            <input type="text" id="log-search-input" class="form-control search-input" placeholder="Cari riwayat aktivitas..." value="<?php echo htmlspecialchars(trim($log_search_query, '%')); ?>"> 
            <?php echo renderPagination($activity_log_total_records, $records_per_page, $log_current_page, 'log', 'log_search', $log_search_query); ?> 
        </div> 
        <?php if (empty($activity_log_data)): ?> 
            <p class="text-center text-muted no-data-message animated fadeIn">Tidak ada riwayat aktivitas.</p> 
        <?php else: ?> 
            <div class="table-responsive animated fadeIn"> 
                <table class="data-table"> 
                    <thead> 
                        <tr> 
                            <th>Waktu</th> 
                            <th>Tipe Aktivitas</th> 
                            <th>Deskripsi</th> 
                            <th>ID KTA</th> 
                            <th>Status Lama</th> 
                            <th>Status Baru</th> 
                        </tr> 
                    </thead> 
                    <tbody> 
                        <?php 
                        $animation_delay = 0; 
                        foreach ($activity_log_data as $log): 
                            $animation_delay += 0.05; 
                        ?> 
                            <tr class="animated fadeInUp" style="animation-delay: <?php echo $animation_delay; ?>s;"> 
                                <td data-label="Waktu"><?php echo htmlspecialchars($log['created_at']); ?></td> 
                                <td data-label="Tipe Aktivitas"><?php echo htmlspecialchars($log['activity_type']); ?></td> 
                                <td data-label="Deskripsi"><?php echo htmlspecialchars($log['description']); ?></td> 
                                <td data-label="ID Pengajuan KTA"><?php echo $log['application_id'] ? htmlspecialchars($log['application_id']) . ' (<span class="text-info">' . htmlspecialchars($log['application_club_name']) . '</span>)' : 'N/A'; ?></td> 
                                <td data-label="Status Lama"><?php echo htmlspecialchars($log['old_status'] ? ucfirst(str_replace('_', ' ', $log['old_status'])) : 'N/A'); ?></td> 
                                <td data-label="Status Baru"><span class="status-badge status-<?php echo strtolower($log['new_status']); ?>"><?php echo htmlspecialchars($log['new_status'] ? ucfirst(str_replace('_', ' ', $log['new_status'])) : 'N/A'); ?></span></td> 
                            </tr> 
                        <?php endforeach; ?> 
                    </tbody> 
                </table> 
            </div> 
        <?php endif; ?> 
        <?php 
    } 
    exit(); 
} 
?>

<!DOCTYPE html> 
<html lang="id"> 
<head> 
    <meta charset="UTF-8"> 
    <meta name="viewport" content="width=device-width, initial-scale=1.0"> 
    <title>FORBASI - Dashboard Pengurus Cabang</title> 
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet"> 
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"> 
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css"> 
    <link rel="stylesheet" href="../css/pengcab.css"> 

</head> 
<body> 
    <aside class="sidebar" id="sidebar"> 
    <div class="logo"> 
        <img src="../assets/LOGO-FORBASI.png" alt="FORBASI Logo"> 
        <span>FORBASI Admin</span> 
        <?php if ($admin_city_name): ?>    
            <span class="admin-location"><?php echo htmlspecialchars($admin_city_name); ?></span> 
        <?php endif; ?> 
    </div> 
    <?php if (!$admin_city_name && $error_message): // Display warning if no city name and there's an error message ?> 
        <p class="alert alert-warning animated fadeIn" style="margin: 10px 15px; font-size: 0.85em;"><i class="fas fa-exclamation-triangle"></i> <?php echo $error_message; ?></p> 
    <?php endif; ?> 
    <ul class="menu"> 
        <li><a href="#kta_applications_section" class="active" data-section="kta_applications_section"><i class="fas fa-file-invoice"></i> <span>Pengajuan KTA</span></a></li> 
        <li><a href="#kta_config_section" data-section="kta_config_section"><i class="fas fa-cogs"></i> <span>Konfigurasi KTA Otomatis</span></a></li> 
        <li><a href="#activity_log_section" data-section="activity_log_section"><i class="fas fa-clipboard-list"></i> <span>Riwayat Aktivitas</span></a></li> 
        <li><a href="logout.php"><i class="fas fa-sign-out-alt"></i> <span>Logout</span></a></li> 
    </ul> 
</aside> 

    <main class="main-content" id="main-content"> 
        <header class="header"> 
            <button class="toggle-btn" id="sidebar-toggle" aria-label="Toggle Sidebar"><i class="fas fa-bars"></i></button> 

            <div> 

                <h1>Selamat Datang, Pengurus Cabang</h1> 
                <?php if ($admin_province_name && $admin_city_name): ?> 
                    <p>Wilayah Anda: <?php echo htmlspecialchars($admin_city_name); ?>, <?php echo htmlspecialchars($admin_province_name); ?></p> 
                <?php else: ?> 
                    <p class="alert alert-warning animated fadeIn"><i class="fas fa-exclamation-triangle"></i> <?php echo $error_message; ?></p> 
                <?php endif; ?> 
            </div> 
        </header> 

        <section class="container animated fadeIn" id="kta_applications_section"> 
            <h2>Pengajuan KTA</h2> 
            <div id="kta-applications-table-container"> 
                <?php if (isset($kta_result['error'])): ?> 
                    <div class="alert alert-danger animated fadeIn"><i class="fas fa-exclamation-circle"></i> <?php echo $kta_result['error']; ?></div> 
                <?php else: ?> 
                    <div class="search-pagination-container"> 
                        <input type="text" id="kta-search-input" class="form-control search-input" placeholder="Cari pengajuan KTA..." value="<?php echo htmlspecialchars(trim($kta_search_query, '%')); ?>"> 
                        <?php echo renderPagination($kta_total_records, $records_per_page, $kta_current_page, 'kta', 'kta_search', $kta_search_query); ?> 
                    </div> 
                    <?php if (empty($kta_applications)): ?> 
                        <p class="text-center text-muted no-data-message animated fadeIn">Tidak ada pengajuan KTA yang menunggu verifikasi Anda di wilayah **<?php echo htmlspecialchars($admin_city_name); ?>, <?php echo htmlspecialchars($admin_province_name); ?>**.</p> 
                    <?php else: ?> 
                        <div class="table-responsive animated fadeIn"> 
                            <table class="data-table"> 
                                <thead> 
                                    <tr> 
                                        <th>ID</th> 
                                        <th>Nama Club</th> 
                                        <th>Penanggung Jawab</th> 
                                        <th>Email</th> 
                                        <th>Telepon</th> 
                                        <th>Provinsi</th> 
                                        <th>Kabupaten</th> 
                                        <th>Alamat</th> 
                                        <th>Logo</th> 
                                        <th>AD</th> 
                                        <th>ART</th> 
                                        <th>SK</th> 
                                        <th>Bukti Bayar User</th> 
                                        <th>Bukti Bayar Pengcab</th> 
                                        <th>KTA Otomatis</th> <th>Status</th> 
                                        <th>Aksi</th> 
                                    </tr> 
                                </thead> 
                                <tbody> 
                                    <?php 
                                    $animation_delay = 0; 
                                    foreach ($kta_applications as $app): 
                                        $animation_delay += 0.05; 
                                    ?> 
                                        <tr class="animated fadeInUp" style="animation-delay: <?php echo $animation_delay; ?>s;"> 
                                            <td data-label="ID"><?php echo htmlspecialchars($app['id']); ?></td> 
                                            <td data-label="Nama Club"><?php echo htmlspecialchars($app['club_name']); ?></td> 
                                            <td data-label="Penanggung Jawab"><?php echo htmlspecialchars($app['leader_name']); ?></td> 
                                            <td data-label="Email"><?php echo htmlspecialchars($app['user_email']); ?></td> 
                                            <td data-label="Telepon"><?php echo htmlspecialchars($app['user_phone']); ?></td> 
                                            <td data-label="Provinsi"><?php echo htmlspecialchars($app['province']); ?></td> 
                                            <td data-label="Kabupaten"><?php echo htmlspecialchars($app['regency']); ?></td> 
                                            <td data-label="Alamat Club"><?php echo htmlspecialchars($app['club_address']); ?></td> 
                                            <td data-label="Logo"> 
                                                <?php echo $app['logo_path_display'] ? '<a href="' . htmlspecialchars($app['logo_path_display']) . '" target="_blank" class="file-link"><i class="fas fa-image"></i> Lihat</a>' : '<span class="text-muted">Tidak Diupload</span>'; ?> 
                                            </td> 
                                            <td data-label="AD"> 
                                                <?php echo $app['ad_file_path_display'] ? '<a href="' . htmlspecialchars($app['ad_file_path_display']) . '" target="_blank" class="file-link"><i class="fas fa-file-pdf"></i> Lihat</a>' : '<span class="text-muted">Tidak Diupload</span>'; ?> 
                                            </td> 
                                            <td data-label="ART"> 
                                                <?php echo $app['art_file_path_display'] ? '<a href="' . htmlspecialchars($app['art_file_path_display']) . '" target="_blank" class="file-link"><i class="fas fa-file-pdf"></i> Lihat</a>' : '<span class="text-muted">Tidak Diupload</span>'; ?> 
                                            </td> 
                                            <td data-label="SK"> 
                                                <?php echo $app['sk_file_path_display'] ? '<a href="' . htmlspecialchars($app['sk_file_path_display']) . '" target="_blank" class="file-link"><i class="fas fa-file-pdf"></i> Lihat</a>' : '<span class="text-muted">Tidak Diupload</span>'; ?> 
                                            </td> 
                                            <td data-label="Bukti Bayar User"> 
                                                <?php echo $app['payment_proof_path_display'] ? '<a href="' . htmlspecialchars($app['payment_proof_path_display']) . '" target="_blank" class="file-link"><i class="fas fa-receipt"></i> Lihat</a>' : '<span class="text-muted">Tidak Diupload</span>'; ?> 
                                            </td> 
                                            <td data-label="Bukti Bayar Pengcab"> 
                                                <?php echo $app['pengcab_payment_proof_path_display'] ? '<a href="' . htmlspecialchars($app['pengcab_payment_proof_path_display']) . '" target="_blank" class="file-link"><i class="fas fa-file-invoice-dollar"></i> Lihat</a>' : '<span class="text-muted">Belum diupload</span>'; ?> 
                                            </td> 
                                            <td data-label="KTA Otomatis"> <?php if ($app['generated_kta_file_path_display']): ?> 
                                                        <a href="<?php echo htmlspecialchars($app['generated_kta_file_path_display']); ?>" target="_blank" class="file-link"><i class="fas fa-id-card"></i> Lihat KTA</a> 
                                                    <?php else: ?> 
                                                        <span class="text-muted">Belum Dihasilkan</span> 
                                                    <?php endif; ?> 
                                            </td> 
                                            <td data-label="Status"><span class="status-badge status-<?php echo strtolower($app['status']); ?>"><?php echo htmlspecialchars(ucfirst(str_replace('_', ' ', $app['status']))); ?></span></td> 
                                            <td data-label="Aksi" class="actions"> 
                                                <button class="btn btn-approve" onclick="openModal(<?php echo $app['id']; ?>, 'approved_pengcab')" <?php echo $app['status'] !== 'pending' ? 'disabled' : ''; ?>><i class="fas fa-check"></i> Setujui</button> 
                                                <button class="btn btn-reject" onclick="openModal(<?php echo $app['id']; ?>, 'rejected')" <?php echo $app['status'] !== 'pending' ? 'disabled' : ''; ?>><i class="fas fa-times"></i> Tolak</button> 
                                            </td> 
                                        </tr> 
                                    <?php endforeach; ?> 
                                </tbody> 
                            </table> 
                        </div> 
                    <?php endif; ?> 
                <?php endif; ?> 
            </div> 
        </section> 

        <section class="container animated fadeIn" id="kta_config_section" style="display:none;"> 
            <h2>Konfigurasi KTA Otomatis</h2> 
            <form id="ktaConfigForm" enctype="multipart/form-data"> 
                <div class="alert alert-info" role="alert"> 
                    <i class="fas fa-info-circle"></i> Harap isi informasi di bawah untuk mengotomatiskan pembuatan KTA. Nama Ketua Umum, tanda tangan, dan stempel akan ditempelkan pada *draft* KTA yang disiapkan. 
                </div> 

                <div class="form-group"> 
                    <label for="ketua_umum_name">Nama Ketua Umum:</label> 
                    <input type="text" id="ketua_umum_name" name="ketua_umum_name" class="form-control" value="<?php echo $ketua_umum_name; ?>" placeholder="Masukkan Nama Ketua Umum" required> 
                </div> 

                <div class="form-group"> 
                    <label>Tanda Tangan:</label> 
                    <div style="border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden;"> 
                        <canvas id="signatureCanvas" width="400" height="150" will-read-frequently="true" style="background-color: #fcfcfc; display: block;"></canvas> 
                    </div> 
                    <div class="signature-buttons"> 
                        <button type="button" class="btn btn-danger" id="clearSignatureBtn"><i class="fas fa-eraser"></i> Bersihkan Tanda Tangan</button> 
                        <button type="button" class="btn btn-info" id="saveSignatureBtn"><i class="fas fa-save"></i> Simpan Tanda Tangan</button> 
                    </div> 
                    <input type="hidden" id="signature_data_url" name="signature_data_url"> 
                    <p class="text-muted" style="margin-top: 10px; <?php echo empty($signature_image_path) ? 'display:none;' : ''; ?>" id="currentSignatureLabel">Tanda tangan yang tersimpan saat ini:</p> 
                    <img id="currentSignaturePreview" 
                        src="<?php echo $signature_image_path ? BASE_URL . $upload_dir_relative . $pengcab_kta_configs_subdir . $signature_image_path : ''; ?>" 
                        alt="Tanda Tangan Saat Ini" 
                        style="max-width: 200px; max-height: 80px; border: 1px solid #ddd; border-radius: 5px; background-color: #f0f0f0; padding: 5px; margin-top: 5px; <?php echo empty($signature_image_path) ? 'display:none;' : ''; ?>"> 
                </div> 

                <div class="form-group"> 
                    <label for="stamp_file">Upload Stempel Pengcab <small>(JPG, JPEG, PNG, maks 1MB)</small>:</label> 
                    <input type="file" id="stamp_file" name="stamp_file" accept="image/jpeg,image/png" class="form-control"> 
                    <div class="stamp-preview" id="stampPreview"> 
                        <?php if ($stamp_image_path): ?> 
                            <img src="<?php echo BASE_URL . $upload_dir_relative . $pengcab_kta_configs_subdir . $stamp_image_path; ?>" alt="Stempel Saat Ini"> 
                        <?php else: ?> 
                            <span class="text-muted">Tidak ada stempel yang diunggah.</span> 
                        <?php endif; ?> 
                    </div> 
                </div> 

                <button type="submit" class="btn btn-approve"><i class="fas fa-check-circle"></i> Simpan Konfigurasi</button> 
            </form> 
        </section> 
        <section class="container animated fadeIn" id="activity_log_section" style="display:none;"> 
            <h2>Riwayat Aktivitas Pengurus Cabang</h2> 
            <div id="activity-log-table-container"> 
                <?php if (isset($activity_log_result['error'])): ?> 
                    <div class="alert alert-danger animated fadeIn"><i class="fas fa-exclamation-circle"></i> <?php echo $activity_log_result['error']; ?></div> 
                <?php else: ?> 
                    <div class="search-pagination-container"> 
                        <input type="text" id="log-search-input" class="form-control search-input" placeholder="Cari riwayat aktivitas..." value="<?php echo htmlspecialchars(trim($log_search_query, '%')); ?>"> 
                        <?php echo renderPagination($activity_log_total_records, $records_per_page, $log_current_page, 'log', 'log_search', $log_search_query); ?> 
                    </div> 
                    <?php if (empty($activity_log_data)): ?> 
                        <p class="text-center text-muted no-data-message animated fadeIn">Tidak ada riwayat aktivitas.</p> 
                    <?php else: ?> 
                        <div class="table-responsive animated fadeIn"> 
                            <table class="data-table"> 
                                <thead> 
                                    <tr> 
                                        <th>Waktu</th> 
                                        <th>Tipe Aktivitas</th> 
                                        <th>Deskripsi</th> 
                                        <th>ID KTA</th> 
                                        <th>Status Lama</th> 
                                        <th>Status Baru</th> 
                                    </tr> 
                                </thead> 
                                <tbody> 
                                    <?php 
                                    $animation_delay = 0; 
                                    foreach ($activity_log_data as $log): 
                                        $animation_delay += 0.05; 
                                    ?> 
                                        <tr class="animated fadeInUp" style="animation-delay: <?php echo $animation_delay; ?>s;"> 
                                            <td data-label="Waktu"><?php echo htmlspecialchars($log['created_at']); ?></td> 
                                            <td data-label="Tipe Aktivitas"><?php echo htmlspecialchars($log['activity_type']); ?></td> 
                                            <td data-label="Deskripsi"><?php echo htmlspecialchars($log['description']); ?></td> 
                                            <td data-label="ID Pengajuan KTA"><?php echo $log['application_id'] ? htmlspecialchars($log['application_id']) . ' (<span class="text-info">' . htmlspecialchars($log['application_club_name']) . '</span>)' : 'N/A'; ?></td> 
                                            <td data-label="Status Lama"><?php echo htmlspecialchars($log['old_status'] ? ucfirst(str_replace('_', ' ', $log['old_status'])) : 'N/A'); ?></td> 
                                            <td data-label="Status Baru"><span class="status-badge status-<?php echo strtolower($log['new_status']); ?>"><?php echo htmlspecialchars($log['new_status'] ? ucfirst(str_replace('_', ' ', $log['new_status'])) : 'N/A'); ?></span></td> 
                                        </tr> 
                                    <?php endforeach; ?> 
                                </tbody> 
                            </table> 
                        </div> 
                    <?php endif; ?> 
                <?php endif; ?> 
            </div> 
        </section> 
    </main> 

    <div id="statusModal" class="modal"> 
        <div class="modal-content"> 
            <span class="close-button" onclick="closeModal()">&times;</span> 
            <h2>Perbarui Status Pengajuan KTA</h2> 
            <form id="updateStatusForm" enctype="multipart/form-data"> 
                <input type="hidden" id="modal-application-id" name="application_id"> 
                <div class="form-group"> 
                    <label for="modal-new-status-display">Status Baru:</label> 
                    <input type="text" id="modal-new-status-display" class="form-control" readonly> 
                    <input type="hidden" id="modal-new-status" name="new_status"> 
                </div> 
                <div class="form-group" id="pengcab-payment-proof-group" style="display: none;"> 
                    <label for="pengcab_payment_proof">Upload Bukti Pembayaran ke Pengda <small>(JPG, JPEG, PNG, PDF)</small>:</label> 
                    <input type="file" id="pengcab_payment_proof" name="pengcab_payment_proof" accept="image/*,.pdf" class="form-control"> 
                </div> 
                <div class="form-group"> 
                    <label for="modal-notes">Catatan (Opsional):</label> 
                    <textarea id="modal-notes" name="notes" class="form-control" rows="3" placeholder="Tambahkan catatan di sini..."></textarea> 
                </div> 
                <button type="submit" class="btn btn-approve">Simpan</button> 
            </form> 
        </div> 
    </div> 

    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script> 
    <script> 
        const modal = document.getElementById("statusModal"); 
        const modalApplicationId = document.getElementById("modal-application-id"); 
        const modalNewStatusDisplay = document.getElementById("modal-new-status-display"); 
        const modalNewStatus = document.getElementById("modal-new-status"); 
        const modalNotes = document.getElementById("modal-notes"); 
        const updateStatusForm = document.getElementById("updateStatusForm"); 
        const ktaTableContainer = document.getElementById("kta-applications-table-container"); 
        const activityLogTableContainer = document.getElementById("activity-log-table-container"); 
        const pengcabPaymentProofGroup = document.getElementById("pengcab-payment-proof-group"); 
        const pengcabPaymentProofInput = document.getElementById("pengcab_payment_proof"); 
        const sidebar = document.getElementById('sidebar'); 
        const mainContent = document.getElementById('main-content'); 
        const sidebarToggle = document.getElementById('sidebar-toggle'); 

        const ktaSearchInput = document.getElementById('kta-search-input'); 
        const logSearchInput = document.getElementById('log-search-input'); 

        let currentKtaPage = <?php echo $kta_current_page; ?>; 
        let currentKtaSearch = '<?php echo htmlspecialchars(trim($kta_search_query, '%')); ?>'; 
        let currentLogPage = <?php echo $log_current_page; ?>; 
        let currentLogSearch = '<?php echo htmlspecialchars(trim($log_search_query, '%')); ?>'; 

        function openModal(appId, status) { 
            modal.classList.add('is-visible'); 
            modal.style.display = "flex"; 
            modalApplicationId.value = appId; 
            modalNewStatus.value = status; 
            modalNewStatusDisplay.value = status === 'approved_pengcab' ? 'Setujui oleh Pengcab' : 'Tolak'; 
            modalNotes.value = ''; 
            pengcabPaymentProofInput.value = ''; // Clear file input value 

            if (status === 'approved_pengcab') { 
                pengcabPaymentProofGroup.style.display = 'block'; 
                pengcabPaymentProofInput.setAttribute('required', 'required'); 
            } else { 
                pengcabPaymentProofGroup.style.display = 'none'; 
                pengcabPaymentProofInput.removeAttribute('required'); 
            } 
        } 

        function closeModal() { 
            modal.classList.remove('is-visible'); 
            setTimeout(() => { 
                modal.style.display = "none"; 
            }, 300); 
        } 

        window.onclick = function(event) { 
            if (event.target === modal) { 
                closeModal(); 
            } 
        }; 

        updateStatusForm.addEventListener('submit', function(e) { 
            e.preventDefault(); 

            const formData = new FormData(this); 
            formData.append('update_kta_status_ajax', '1'); 
            // Tambahkan admin_id ke FormData agar bisa diakses di generate_kta_pdf.php 
            formData.append('admin_id', <?php echo $admin_id; ?>); 


            Swal.fire({ 
                title: 'Memproses...', 
                text: 'Harap tunggu...', 
                allowOutsideClick: false, 
                didOpen: () => { 
                    Swal.showLoading(); 
                } 
            }); 

            fetch('pengcab.php', { 
                method: 'POST', 
                body: formData 
            }) 
            .then(response => { 
                const contentType = response.headers.get("content-type"); 
                if (contentType && contentType.indexOf("application/json") !== -1) { 
                    return response.json(); 
                } else { 
                    return response.text().then(text => { throw new Error('Server response not JSON: ' + text) }); 
                } 
            }) 
            .then(data => { 
                closeModal(); 
                Swal.close(); 

                if (data.success) { 
                    let successText = data.message; 
                    if (data.kta_generated_url) { // Cek jika URL KTA ada di respons 
                        successText += `<br><br><a href="${data.kta_generated_url}" target="_blank" style="background-color: var(--primary-color); color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 10px;"><i class="fas fa-file-pdf"></i> Lihat KTA yang Dihasilkan</a>`; 
                    } else if (!data.success) { // Jika status data.success FALSE tapi ada message
                         successText += `<br><br><span style="color: red;">Peringatan: ${data.message}. KTA mungkin belum tergenerate.</span>`;
                    }
                    Swal.fire({ 
                        icon: 'success', 
                        title: 'Berhasil!', 
                        html: successText, // Gunakan html agar link bisa dirender 
                        showConfirmButton: true, // Biarkan user klik ok untuk melihat link 
                        confirmButtonText: 'Oke', 
                        // timer: 2000 // Hapus timer agar user bisa klik link 
                    }); 
                    loadKtaTable(currentKtaPage, currentKtaSearch); 
                    loadActivityLog(currentLogPage, currentLogSearch); 
                } else { 
                    Swal.fire({ 
                        icon: 'error', 
                        title: 'Gagal!', 
                        text: data.message, 
                        showConfirmButton: true, 
                        confirmButtonText: 'Tutup' 
                    }); 
                } 
            }) 
            .catch(error => { 
                console.error('Error:', error); 
                closeModal(); 
                Swal.close(); 
                let errorMessage = 'Terjadi kesalahan saat memproses permintaan. Silakan coba lagi.'; 
                if (error instanceof Error) { 
                    errorMessage = `Terjadi kesalahan: ${error.message}`; 
                } 
                Swal.fire({ 
                    icon: 'error', 
                    title: 'Terjadi Kesalahan!', 
                    text: errorMessage, 
                    showConfirmButton: true, 
                    confirmButtonText: 'Tutup' 
                }); 
            }); 
        }); 

        function loadKtaTable(page = 1, search = '') { 
            currentKtaPage = page; 
            currentKtaSearch = search; 
            fetch(`pengcab.php?fetch_table_only=true&kta_page=${page}&kta_search=${encodeURIComponent(search)}`) 
                .then(response => response.text()) 
                .then(html => { 
                    ktaTableContainer.innerHTML = html; 
                    ktaTableContainer.querySelectorAll('.pagination .page-link').forEach(link => { 
                        link.addEventListener('click', function(e) { 
                            e.preventDefault(); 
                            const url = new URL(this.href); 
                            const pageParam = url.searchParams.get('kta_page'); 
                            const searchParam = url.searchParams.get('kta_search'); 
                            loadKtaTable(parseInt(pageParam), searchParam); 
                        }); 
                    }); 
                    const newKtaSearchInput = document.getElementById('kta-search-input'); 
                    if (newKtaSearchInput) { 
                        newKtaSearchInput.addEventListener('keyup', function(e) { 
                            if (e.key === 'Enter' || this.value.length === 0 || this.value.length >= 3) { 
                                loadKtaTable(1, this.value); 
                            } 
                        }); 
                    } 
                }) 
                .catch(error => { 
                    console.error('Error loading KTA table:', error); 
                    ktaTableContainer.innerHTML = '<div class="alert alert-danger animated fadeIn"><i class="fas fa-exclamation-circle"></i> Gagal memuat daftar pengajuan KTA.</div>'; 
                }); 
        } 

        function loadActivityLog(page = 1, search = '') { 
            currentLogPage = page; 
            currentLogSearch = search; 
            fetch(`pengcab.php?fetch_activity_log_only=true&log_page=${page}&log_search=${encodeURIComponent(search)}`) 
                .then(response => response.text()) 
                .then(html => { 
                    activityLogTableContainer.innerHTML = html; 
                    activityLogTableContainer.querySelectorAll('.pagination .page-link').forEach(link => { 
                        link.addEventListener('click', function(e) { 
                            e.preventDefault(); 
                            const url = new URL(this.href); 
                            const pageParam = url.searchParams.get('log_page'); 
                            const searchParam = url.searchParams.get('log_search'); 
                            loadActivityLog(parseInt(pageParam), searchParam); 
                        }); 
                    }); 
                    const newLogSearchInput = document.getElementById('log-search-input'); 
                    if (newLogSearchInput) { 
                        newLogSearchInput.addEventListener('keyup', function(e) { 
                            if (e.key === 'Enter' || this.value.length === 0 || this.value.length >= 3) { 
                                loadActivityLog(1, this.value); 
                            } 
                        }); 
                    } 
                }) 
                .catch(error => { 
                    console.error('Error loading activity log:', error); 
                    activityLogTableContainer.innerHTML = '<div class="alert alert-danger animated fadeIn"><i class="fas fa-exclamation-circle"></i> Gagal memuat riwayat aktivitas.</div>'; 
                }); 
        } 

        function showSection(sectionId) { 
            document.getElementById('kta_applications_section').style.display = 'none'; 
            document.getElementById('activity_log_section').style.display = 'none'; 
            document.getElementById('kta_config_section').style.display = 'none'; 

            const targetSection = document.getElementById(sectionId); 
            if (targetSection) { 
                targetSection.style.display = 'block'; 

                if (sectionId === 'kta_config_section') { 
                    // Beri sedikit jeda agar browser bisa menghitung layout setelah display:block 
                    setTimeout(() => { 
                        // Setel lebar dan tinggi INTERNAL kanvas agar sesuai dengan lebar/tinggi yang dirender oleh CSS 
                        signatureCanvas.width = signatureCanvas.clientWidth; 
                        signatureCanvas.height = signatureCanvas.clientHeight; 
                        
                        // Terapkan kembali gaya menggambar 
                        ctx.lineWidth = 2; 
                        ctx.lineCap = 'round'; 
                        ctx.strokeStyle = '#000'; 
                        
                        // Muat ulang tanda tangan yang sudah ada jika ada 
                        loadExistingSignature(); 
                    }, 50); // Jeda kecil (misal 50ms) 
                } 
            } 

            document.querySelectorAll('.sidebar .menu li a').forEach(item => { 
                item.classList.remove('active'); 
            }); 

            const activeLink = document.querySelector(`.sidebar .menu li a[data-section="${sectionId}"]`); 
            if (activeLink) { 
                activeLink.classList.add('active'); 
            } 
            if (targetSection) { 
                targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' }); 
            } 
        } 

        document.addEventListener('DOMContentLoaded', function() { 
            document.querySelectorAll('.sidebar .menu li a[data-section]').forEach(link => { 
                link.addEventListener('click', function(event) { 
                    event.preventDefault(); 
                    const sectionId = this.getAttribute('data-section'); 
                    showSection(sectionId); 
                }); 
            }); 

            if (sidebarToggle) { 
                sidebarToggle.addEventListener('click', function() { 
                    sidebar.classList.toggle('collapsed'); 
                    mainContent.classList.toggle('expanded'); 
                }); 
            } 

            const initialSection = window.location.hash.substring(1) || 'kta_applications_section'; 
            showSection(initialSection); 

            const urlParams = new URLSearchParams(window.location.search); 
            const initialKtaPage = parseInt(urlParams.get('kta_page')) || 1; 
            const initialKtaSearch = urlParams.get('kta_search') || ''; 
            const initialLogPage = parseInt(urlParams.get('log_page')) || 1; 
            const initialLogSearch = urlParams.get('log_search') || ''; 

            loadKtaTable(initialKtaPage, initialKtaSearch); 
            loadActivityLog(initialLogPage, initialLogSearch); 

            if (ktaSearchInput) { 
                ktaSearchInput.addEventListener('keyup', function(e) { 
                    if (e.key === 'Enter' || this.value.length === 0 || this.value.length >= 3) { 
                        loadKtaTable(1, this.value); 
                    } 
                }); 
            } 
            if (logSearchInput) { 
                logSearchInput.addEventListener('keyup', function(e) { 
                    if (e.key === 'Enter' || this.value.length === 0 || this.value.length >= 3) { 
                        loadActivityLog(1, this.value); 
                    } 
                }); 
            } 

            // Initial sidebar/main content state based on screen size 
            if (window.innerWidth < 768) { 
                sidebar.classList.remove('collapsed'); 
                mainContent.classList.remove('expanded'); 
            } else { 
                if (sidebar.classList.contains('collapsed')) { 
                    mainContent.classList.add('expanded'); 
                } else { 
                    mainContent.classList.remove('expanded'); 
                } 
            } 
        }); 

        window.addEventListener('resize', function() { 
            // Hanya jalankan resize logic jika section KTA config sedang aktif 
            if (document.getElementById('kta_config_section').style.display === 'block') { 
                if (window.innerWidth >= 768) { 
                    // Setel ulang ukuran kanvas saat di desktop dan aktif 
                    signatureCanvas.width = signatureCanvas.clientWidth; 
                    signatureCanvas.height = signatureCanvas.clientHeight; 
                    ctx.lineWidth = 2; 
                    ctx.lineCap = 'round'; 
                    ctx.strokeStyle = '#000'; 
                    loadExistingSignature(); // Re-draw existing signature on resized canvas 
                    if (sidebar.classList.contains('collapsed')) { 
                        mainContent.classList.add('expanded'); 
                    } else { 
                        mainContent.classList.remove('expanded'); 
                    } 
                    if (!sidebar.classList.contains('collapsed') && sidebar.style.width === '100%') { 
                        sidebar.style.width = ''; 
                        mainContent.style.marginLeft = ''; 
                    } 
                } else { // Mobile 
                    // Pada mobile, biarkan css yang menangani ukuran dan kanvas mungkin tidak perlu di-resize secara manual 
                    // Kecuali jika ada masalah tampilan, tetapi untuk saat ini, utamakan fungsionalitas umum 
                    sidebar.classList.remove('collapsed'); 
                    mainContent.classList.remove('expanded'); 
                } 
            } 
        }); 

        const signatureCanvas = document.getElementById('signatureCanvas'); 
        const clearSignatureBtn = document.getElementById('clearSignatureBtn'); 
        const saveSignatureBtn = document.getElementById('saveSignatureBtn'); 
        const signatureDataUrlInput = document.getElementById('signature_data_url'); 
        const stampFileInput = document.getElementById('stamp_file'); 
        const stampPreview = document.getElementById('stampPreview'); 
        const ktaConfigForm = document.getElementById('ktaConfigForm'); 
        const ketuaUmumNameInput = document.getElementById('ketua_umum_name'); 

        const ctx = signatureCanvas.getContext('2d'); 
        let isDrawing = false; 
        let lastX = 0; 
        let lastY = 0; 

        function loadExistingSignature() { 
            const existingSignaturePath = '<?php echo $signature_image_path ? BASE_URL . $upload_dir_relative . $pengcab_kta_configs_subdir . $signature_image_path : ''; ?>'; 
            const currentSignaturePreview = document.getElementById('currentSignaturePreview'); 
            const currentSignatureLabel = document.getElementById('currentSignatureLabel'); 

            // Hapus gambar preview yang lama dari DOM agar tidak menumpuk saat reload 
            if (currentSignaturePreview) { 
                currentSignaturePreview.src = ''; // Hapus src agar tidak ada gambar lama 
                currentSignaturePreview.style.display = 'none'; 
            } 
            if (currentSignatureLabel) { 
                currentSignatureLabel.style.display = 'none'; 
            } 
            ctx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height); // Selalu bersihkan kanvas 

            if (existingSignaturePath) { 
                const img = new Image(); 
                img.crossOrigin = "Anonymous"; // Crucial for loading images from different origins (even if same domain, some configs might block) 
                img.onload = function() { 
                    if (signatureCanvas.width > 0 && signatureCanvas.height > 0) { 
                        ctx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height); 
                        const aspectRatio = img.width / img.height; 
                        const newHeight = signatureCanvas.height; 
                        const newWidth = newHeight * aspectRatio; 
                        const offsetX = (signatureCanvas.width - newWidth) / 2; 
                        ctx.drawImage(img, offsetX, 0, newWidth, newHeight); 
                        signatureDataUrlInput.value = signatureCanvas.toDataURL('image/png'); 

                        if(currentSignaturePreview) currentSignaturePreview.src = existingSignaturePath; 
                        if(currentSignaturePreview) currentSignaturePreview.style.display = 'block'; 
                        if(currentSignatureLabel) currentSignatureLabel.style.display = 'block'; 
                    } 
                }; 
                img.onerror = function() { 
                    console.error("Failed to load existing signature image."); 
                    if(currentSignaturePreview) currentSignaturePreview.style.display = 'none'; 
                    if(currentSignatureLabel) currentSignatureLabel.style.display = 'none'; 
                }; 
                img.src = existingSignaturePath; 
            } else { 
                signatureDataUrlInput.value = ''; 
            } 
        } 
        
        function draw(e) { 
            if (!isDrawing) return; 
            ctx.beginPath(); 
            ctx.moveTo(lastX, lastY); 
            const rect = signatureCanvas.getBoundingClientRect(); 
            const clientX = e.clientX || e.touches[0].clientX; 
            const clientY = e.clientY || e.touches[0].clientY; 
            lastX = clientX - rect.left; 
            lastY = clientY - rect.top; 
            ctx.lineTo(lastX, lastY); 
            ctx.stroke(); 
        } 

        signatureCanvas.addEventListener('mousedown', (e) => { 
            isDrawing = true; 
            const rect = signatureCanvas.getBoundingClientRect(); 
            lastX = e.clientX - rect.left; 
            lastY = e.clientY - rect.top; 
        }); 

        signatureCanvas.addEventListener('mousemove', draw); 
        signatureCanvas.addEventListener('mouseup', () => isDrawing = false); 
        signatureCanvas.addEventListener('mouseout', () => isDrawing = false); 

        signatureCanvas.addEventListener('touchstart', (e) => { 
            e.preventDefault(); // Prevent scrolling on touch devices 
            isDrawing = true; 
            const rect = signatureCanvas.getBoundingClientRect(); 
            lastX = e.touches[0].clientX - rect.left; 
            lastY = e.touches[0].clientY - rect.top; 
        }); 
        signatureCanvas.addEventListener('touchmove', draw); 
        signatureCanvas.addEventListener('touchend', () => isDrawing = false); 

        clearSignatureBtn.addEventListener('click', () => { 
            if (signatureCanvas.width > 0 && signatureCanvas.height > 0) { 
                ctx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height); 
                signatureDataUrlInput.value = ''; 
                const currentSignaturePreview = document.getElementById('currentSignaturePreview'); 
                const currentSignatureLabel = document.getElementById('currentSignatureLabel'); 
                if(currentSignaturePreview) currentSignaturePreview.style.display = 'none'; 
                if(currentSignatureLabel) currentSignatureLabel.style.display = 'none'; 
                Swal.fire('Berhasil!', 'Tanda tangan telah dibersihkan.', 'success'); 
            } else { 
                Swal.fire({ 
                    icon: 'warning', 
                    title: 'Kanvas Tidak Siap', 
                    text: 'Kanvas tanda tangan belum dimuat dengan benar. Coba muat ulang halaman atau pindah ke bagian lain lalu kembali.', 
                    confirmButtonText: 'Oke' 
                }); 
            } 
        }); 

        saveSignatureBtn.addEventListener('click', () => { 
            if (signatureCanvas.width === 0 || signatureCanvas.height === 0) { 
                Swal.fire({ 
                    icon: 'warning', 
                    title: 'Kanvas Tidak Siap', 
                    text: 'Kanvas tanda tangan belum dimuat dengan benar. Tidak dapat menyimpan tanda tangan kosong.', 
                    confirmButtonText: 'Oke' 
                }); 
                return; 
            } 

            const imageData = ctx.getImageData(0, 0, signatureCanvas.width, signatureCanvas.height); 
            let isCanvasBlank = true; 
            for (let i = 0; i < imageData.data.length; i += 4) { 
                if (imageData.data[i + 3] !== 0) { 
                    isCanvasBlank = false; 
                    break; 
                } 
            } 

            if (isCanvasBlank) { 
                signatureDataUrlInput.value = ''; 
                Swal.fire({ 
                    icon: 'warning', 
                    title: 'Tanda Tangan Kosong', 
                    text: 'Kanvas tanda tangan masih kosong. Tidak ada tanda tangan yang akan disimpan.', 
                    confirmButtonText: 'Oke' 
                }); 
            } else { 
                const dataURL = signatureCanvas.toDataURL('image/png'); 
                signatureDataUrlInput.value = dataURL; 
                Swal.fire('Berhasil!', 'Tanda tangan telah siap untuk disimpan.', 'success'); 
            } 
        }); 

        stampFileInput.addEventListener('change', function() { 
            const file = this.files[0]; 
            if (file) { 
                const reader = new FileReader(); 
                reader.onload = function(e) { 
                    stampPreview.innerHTML = `<img src="${e.target.result}" alt="Pratinjau Stempel">`; 
                }; 
                reader.readAsDataURL(file); 
            } else { 
                stampPreview.innerHTML = '<span class="text-muted">Tidak ada stempel yang diunggah.</span>'; 
            } 
        }); 

        ktaConfigForm.addEventListener('submit', function(e) { 
            e.preventDefault(); 

            if (signatureCanvas.width === 0 || signatureCanvas.height === 0) { 
                Swal.fire({ 
                    icon: 'error', 
                    title: 'Kesalahan Validasi', 
                    text: 'Kanvas tanda tangan belum dimuat dengan benar. Harap muat ulang halaman atau pindah ke bagian lain lalu kembali ke Konfigurasi KTA Otomatis.', 
                    confirmButtonText: 'Tutup' 
                }); 
                return; 
            } 

            const imageData = ctx.getImageData(0, 0, signatureCanvas.width, signatureCanvas.height); 
            let isCanvasBlank = true; 
            for (let i = 0; i < imageData.data.length; i += 4) { 
                if (imageData.data[i + 3] !== 0) { 
                    isCanvasBlank = false; 
                    break; 
                } 
            } 
            if (!isCanvasBlank && !signatureDataUrlInput.value) { 
                signatureDataUrlInput.value = signatureCanvas.toDataURL('image/png'); 
            } 

            const formData = new FormData(this); 
            formData.append('save_kta_config_ajax', '1'); 

            Swal.fire({ 
                title: 'Menyimpan Konfigurasi...', 
                text: 'Harap tunggu...', 
                allowOutsideClick: false, 
                didOpen: () => { 
                    Swal.showLoading(); 
                } 
            }); 

            fetch('pengcab.php', { 
                method: 'POST', 
                body: formData 
            }) 
            .then(response => { 
                const contentType = response.headers.get("content-type"); 
                if (contentType && contentType.indexOf("application/json") !== -1) { 
                    return response.json(); 
                } else { 
                    return response.text().then(text => { throw new Error('Server response not JSON: ' + text) }); 
                } 
            }) 
            .then(data => { 
                Swal.close(); 
                if (data.success) { 
                    Swal.fire({ 
                        icon: 'success', 
                        title: 'Berhasil!', 
                        text: data.message, 
                        showConfirmButton: false, 
                        timer: 2000 
                    }); 
                    const currentSignaturePreview = document.getElementById('currentSignaturePreview'); 
                    const currentSignatureLabel = document.getElementById('currentSignatureLabel'); 

                    if (data.signature_path) { 
                        if(currentSignaturePreview) { 
                            currentSignaturePreview.src = data.signature_path; 
                            currentSignaturePreview.style.display = 'block'; 
                        } 
                        if(currentSignatureLabel) { 
                            currentSignatureLabel.style.display = 'block'; 
                        } 
                    } else { 
                        if(currentSignaturePreview) currentSignaturePreview.style.display = 'none'; 
                        if(currentSignatureLabel) currentSignatureLabel.style.display = 'none'; 
                    } 

                    if (data.stamp_path) { 
                        stampPreview.innerHTML = `<img src="${data.stamp_path}" alt="Pratinjau Stempel">`; 
                    } else { 
                        stampPreview.innerHTML = '<span class="text-muted">Tidak ada stempel yang diunggah.</span>'; 
                    } 
                } else { 
                    Swal.fire({ 
                        icon: 'error', 
                        title: 'Gagal!', 
                        text: data.message, 
                        showConfirmButton: true, 
                        confirmButtonText: 'Tutup' 
                    }); 
                } 
            }) 
            .catch(error => { 
                console.error('Error:', error); 
                Swal.close(); 
                Swal.fire({ 
                    icon: 'error', 
                    title: 'Terjadi Kesalahan!', 
                    text: `Terjadi kesalahan saat menyimpan konfigurasi: ${error.message}`, 
                    showConfirmButton: true, 
                    confirmButtonText: 'Tutup' 
                }); 
            }); 
        }); 
    </script> 
</body> 
</html>