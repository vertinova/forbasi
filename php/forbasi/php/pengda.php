<?php
session_start();

require_once __DIR__ . '/db_config.php';

// Start output buffering to prevent any unexpected output from breaking JSON response
ob_start();

// Check if user is logged in and is Pengurus Daerah (role_id = 3)
if (!isset($_SESSION['user_id']) || $_SESSION['role_id'] != 3) {
    header("Location: login.php");
    exit();
}

$admin_id = $_SESSION['user_id'];
$success_message = '';
$error_message = '';

// Untuk tujuan logging error PHP di lingkungan pengembangan
ini_set('display_errors', 0); // Di produksi, pastikan ini 0
ini_set('display_startup_errors', 0); // Di produksi, pastikan ini 0
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php_error_log_pengda.txt'); // Log error untuk pengda.php

// Define the base URL of your application.
// Adjust this based on your actual server configuration.
// BASE_URL adalah URL untuk mengakses folder 'uploads' dari browser.
// Deteksi environment lokal vs production
if ($_SERVER['HTTP_HOST'] === 'localhost' || $_SERVER['HTTP_HOST'] === '127.0.0.1' || strpos($_SERVER['HTTP_HOST'], 'laragon') !== false) {
    define('BASE_URL', 'http://localhost/forbasi/forbasi/php/uploads/'); // Local development
    define('BASE_URL_FOR_PDF_INTERNAL', 'http://localhost/forbasi/forbasi/php/');
} else {
    define('BASE_URL', 'https://forbasi.or.id/forbasi/php/uploads/'); // Production
    define('BASE_URL_FOR_PDF_INTERNAL', 'https://forbasi.or.id/forbasi/php/');
}


// Get the province_id and full profile of the currently logged-in Pengurus Daerah admin
$admin_province_id = null;
$admin_province_name = null;
$admin_profile_data = []; // To store full Pengda profile
$admin_bank_account_number = null; // NEW: To store admin's bank account number

// DIUBAH: Mengganti u.full_name menjadi u.username AS full_name dan menghapus registration_fee
$query_admin_profile = "SELECT u.id, u.username, u.password, u.email, u.phone, u.username AS full_name, u.address, u.province_id, u.city_id,
                                u.bank_account_number,
                                p.name AS province_name, c.name AS city_name
                            FROM users u
                            LEFT JOIN provinces p ON u.province_id = p.id
                            LEFT JOIN cities c ON u.city_id = c.id
                            WHERE u.id = ?";
$stmt_admin_profile = $conn->prepare($query_admin_profile);
if ($stmt_admin_profile) {
    $stmt_admin_profile->bind_param("i", $admin_id);
    $stmt_admin_profile->execute();
    $result_admin_profile = $stmt_admin_profile->get_result();
    if ($row_admin_profile = $result_admin_profile->fetch_assoc()) {
        $admin_profile_data = $row_admin_profile;
        $admin_province_id = $row_admin_profile['province_id'];
        $admin_province_name = $row_admin_profile['province_name'];
        $admin_bank_account_number = $row_admin_profile['bank_account_number']; // NEW
    }
    $stmt_admin_profile->close();
} else {
    error_log("Failed to prepare admin profile query: " . $conn->error);
    $error_message = "Error retrieving admin profile information. Please contact support.";
}

// Detect if Pengda is in Java or outside Java region
$is_jawa_pengda = false;
$jawa_provinces = [11, 12, 13, 14, 15, 16]; // IDs for: DKI Jakarta, Jawa Barat, Jawa Tengah, DI Yogyakarta, Jawa Timur, Banten

// Convert to integer to ensure type match
$admin_province_id = (int)$admin_province_id;

if ($admin_province_id && in_array($admin_province_id, $jawa_provinces)) {
    $is_jawa_pengda = true;
}


// Crucial check: If the Pengda admin doesn't have a province set, they can't see any applications.
if (empty($admin_province_id)) {
    $error_message = "Profil Pengurus Daerah Anda belum memiliki informasi Provinsi yang terdaftar. Harap lengkapi profil Anda melalui admin pusat.";
    // Optionally, you might want to prevent fetching data or display a strong message
    // For now, we'll let the empty $kta_applications array handle the 'no data' display.
}

// Upload paths (using relative paths for construction and BASE_URL for display)
$kta_files_subdir = 'kta_files/';
$pengcab_payment_proofs_subdir = 'pengcab_payment_proofs/';
$pengda_payment_proofs_subdir = 'pengda_payment_proofs/';
$pengda_kta_configs_subdir = 'pengda_kta_configs/';
$generated_kta_pengda_subdir = 'generated_kta_pengda/'; // Changed from $generated_kta_subdir for clarity
$generated_kta_pb_subdir = 'generated_kta_pb/'; // NEW: Subdirectory for PB generated KTA files
// NEW: Subdirectories for PB to Pengda/Pengcab payment proofs
$pb_to_pengda_payment_proofs_subdir = 'pb_to_pengda_payment_proofs/'; // Renamed for clarity and to match pb_payments_recap if used later
// $pengcab_payment_proofs_subdir; // Already defined above

// Full physical paths for file system operations
// `__DIR__` adalah path direktori tempat `pengda.php` berada (e.g., `/var/www/html/forbasi/php/`)
// `uploads` folder ada di `forbasi/php/uploads/`
$base_upload_physical_path = __DIR__ . '/uploads/'; // Base directory for all uploads

$kta_files_physical_path = $base_upload_physical_path . $kta_files_subdir;
$pengcab_payment_physical_path = $base_upload_physical_path . $pengcab_payment_proofs_subdir;
$pengda_payment_physical_path = $base_upload_physical_path . $pengda_payment_proofs_subdir; // This might be used if Pengda pays directly
$pengda_kta_configs_physical_path = $base_upload_physical_path . $pengda_kta_configs_subdir;
$generated_kta_pengda_physical_path = $base_upload_physical_path . $generated_kta_pengda_subdir;
$generated_kta_pb_physical_path = $base_upload_physical_path . $generated_kta_pb_subdir; // NEW
$pb_to_pengda_payment_proofs_physical_path = $base_upload_physical_path . $pb_to_pengda_payment_proofs_subdir; // NEW


// Create directories if they don't exist
$directories = [
    $kta_files_physical_path,
    $pengcab_payment_physical_path,
    $pengda_payment_physical_path,
    $pengda_kta_configs_physical_path,
    $generated_kta_pengda_physical_path,
    $generated_kta_pb_physical_path, // NEW
    $pb_to_pengda_payment_proofs_physical_path // NEW
];
foreach ($directories as $dir) {
    if (!is_dir($dir)) {
        if (!mkdir($dir, 0755, true)) { // 0755 atau 0777 saat development
            error_log("Failed to create directory: " . $dir);
            // Consider showing a user-friendly error if this is critical
            // For now, we'll just log and continue.
        }
    }
}

// Activity logging function
if (!function_exists('logActivity')) { // Check to prevent redeclaration if included elsewhere
    function logActivity($conn, $userId, $userRole, $activityType, $description, $applicationId = null, $oldStatus = null, $newStatus = null) {
        $application_id_for_db = (is_numeric($applicationId)) ? (int)$applicationId : null;
        $stmt = $conn->prepare("INSERT INTO activity_logs (user_id, role_name, activity_type, description, application_id, old_status, new_status) VALUES (?, ?, ?, ?, ?, ?, ?)");
        if ($stmt) {
            // Ensure oldStatus and newStatus are strings or null to avoid deprecation warning
            $oldStatusStr = $oldStatus !== null ? (string)$oldStatus : null;
            $newStatusStr = $newStatus !== null ? (string)$newStatus : null;

            $stmt->bind_param("isssiss",
                $userId,
                $userRole,
                $activityType,
                $description,
                $application_id_for_db,
                $oldStatusStr,
                $newStatusStr
            );
            if (!$stmt->execute()) {
                error_log("Failed to execute activity log insert: " . $stmt->error);
            }
            $stmt->close();
        } else {
            error_log("Failed to prepare activity log insert: " . $conn->error);
        }
    }
}

// --- START: KTA Configuration Logic for Pengda ---
$ketua_umum_name = '';
$signature_image_path = '';
$account_number = $admin_bank_account_number; // <<< BARU, ambil dari tabel users
// HAPUS: $kta_cost = $admin_profile_data['registration_fee'] ?? null;
$kta_config_exists = false; // This refers to pengda_kta_configs table for signature and ketua name

// Function to check if KTA config is complete
function isKTAConfigComplete($conn, $admin_id) {
    // MODIFIKASI: Hanya memeriksa ketua_umum_name dan signature_image_path di pengda_kta_configs
    $query = "SELECT ketua_umum_name, signature_image_path FROM pengda_kta_configs WHERE user_id = ?";
    $stmt = $conn->prepare($query);
    if ($stmt) {
        $stmt->bind_param("i", $admin_id);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($row = $result->fetch_assoc()) {
            // Check if all fields are non-empty
            if (!empty($row['ketua_umum_name']) && !empty($row['signature_image_path'])) {
                return true;
            }
        }
        $stmt->close();
    }
    return false;
}

// Fetch existing KTA configuration for the logged-in Pengda
// MODIFIKASI: Hanya ambil dari pengda_kta_configs yang relevan
$query_config = "SELECT ketua_umum_name, signature_image_path FROM pengda_kta_configs WHERE user_id = ?";
$stmt_config = $conn->prepare($query_config);
if ($stmt_config) {
    $stmt_config->bind_param("i", $admin_id);
    $stmt_config->execute();
    $result_config = $stmt_config->get_result();
    if ($row_config = $result_config->fetch_assoc()) {
        $ketua_umum_name = htmlspecialchars($row_config['ketua_umum_name']);
        $signature_image_path = $row_config['signature_image_path'];
        $kta_config_exists = true; // Still true if this record exists
    }
    $stmt_config->close();
} else {
    error_log("Failed to prepare config query: " . $conn->error);
}

// Handle AJAX request for saving KTA configuration
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['save_kta_config_ajax'])) {
    ob_clean(); // Clear any previous output before echoing JSON
    header('Content-Type: application/json');
    $response = ['success' => false, 'message' => ''];

    if (!isset($conn) || $conn->connect_error) {
        $response['message'] = "Database connection error.";
        echo json_encode($response);
        exit();
    }

    $new_ketua_umum_name = trim(htmlspecialchars($_POST['ketua_umum_name'] ?? '', ENT_QUOTES, 'UTF-8'));
    $signature_data_url = $_POST['signature_data_url'] ?? ''; // Base64 data from canvas
    // NEW: Ambil nomor rekening dari form. Ini akan disimpan di tabel users
    $new_account_number = trim(htmlspecialchars($_POST['account_number'] ?? '', ENT_QUOTES, 'UTF-8'));
    // HAPUS: $new_kta_cost = filter_var($_POST['kta_cost'] ?? '', FILTER_VALIDATE_FLOAT, FILTER_FLAG_ALLOW_FRACTION);

    // Basic validation for new fields (account number)
    if (empty($new_ketua_umum_name)) {
        $response['message'] = "Nama Ketua Umum wajib diisi.";
        echo json_encode($response);
        exit();
    }
    if (empty($new_account_number)) {
        $response['message'] = "Nomor Rekening wajib diisi.";
        echo json_encode($response);
        exit();
    }
    // HAPUS: Validasi ini dihapus agar tidak perlu input biaya
    // if ($new_kta_cost === false || $new_kta_cost < 0) { // Allow 0 cost
    //   $response['message'] = "Biaya KTA tidak valid.";
    //   echo json_encode($response);
    //   exit();
    // }


    $conn->begin_transaction();

    try {
        $current_signature_path = '';
        // Get current paths before update to clean up old files
        if ($kta_config_exists) {
            $query_current_paths = "SELECT signature_image_path FROM pengda_kta_configs WHERE user_id = ?";
            $stmt_current_paths = $conn->prepare($query_current_paths);
            if ($stmt_current_paths) {
                $stmt_current_paths->bind_param("i", $admin_id);
                $stmt_current_paths->execute();
                $result_current_paths = $stmt_current_paths->get_result();
                if ($row_paths = $result_current_paths->fetch_assoc()) {
                    $current_signature_path = $row_paths['signature_image_path'];
                }
                $stmt_current_paths->close();
            }
        }
        
        // Handle signature image upload/update
        $new_signature_filename = $current_signature_path; // Keep old if not updated
        if (!empty($signature_data_url)) {
            $data = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $signature_data_url));
            if ($data === false) {
                throw new Exception("Data tanda tangan tidak valid.");
            }
            $new_signature_filename = 'pengda_signature_' . $admin_id . '_' . uniqid() . '.png';
            $signature_target_path = $pengda_kta_configs_physical_path . $new_signature_filename;

            if (file_put_contents($signature_target_path, $data) === false) {
                throw new Exception("Gagal menyimpan gambar tanda tangan. Pastikan direktori '{$pengda_kta_configs_physical_path}' dapat ditulisi.");
            }
            if ($current_signature_path && $current_signature_path != $new_signature_filename && file_exists($pengda_kta_configs_physical_path . $current_signature_path)) {
                @unlink($pengda_kta_configs_physical_path . $current_signature_path);
            }
        } else {
            // If signature data is empty and there was a previous signature, it means it was cleared
            // If new_ketua_umum_name is empty, allow signature to be empty. Otherwise, require it.
            if (empty($new_ketua_umum_name)) { // If name is empty, signature can be empty
                if ($current_signature_path && file_exists($pengda_kta_configs_physical_path . $current_signature_path)) {
                    @unlink($pengda_kta_configs_physical_path . $current_signature_path);
                }
                $new_signature_filename = null; // Set to NULL in DB
            } else if (empty($current_signature_path)) { // If name is not empty, but no signature exists or was provided
                    throw new Exception("Tanda tangan ketua umum wajib diisi.");
            }
        }

        // HAPUS: Logika penanganan upload file stempel dihapus
        $new_stamp_filename = null; // Set to null as stamp is no longer uploaded/required

        // MODIFIKASI: Update pengda_kta_configs for ketua_umum_name and signature
        if ($kta_config_exists) {
            $update_query_config = "UPDATE pengda_kta_configs SET ketua_umum_name = ?, signature_image_path = ?, updated_at = NOW() WHERE user_id = ?";
            $stmt_config_update = $conn->prepare($update_query_config);
            if (!$stmt_config_update) {
                throw new Exception("Gagal mempersiapkan pernyataan update konfigurasi KTA: " . $conn->error);
            }
            $stmt_config_update->bind_param("ssi", $new_ketua_umum_name, $new_signature_filename, $admin_id);
            if (!$stmt_config_update->execute()) {
                throw new Exception("Gagal menyimpan konfigurasi KTA (Pengurus Daerah): " . $stmt_config_update->error);
            }
            $stmt_config_update->close();
        } else {
            $insert_query_config = "INSERT INTO pengda_kta_configs (user_id, ketua_umum_name, signature_image_path) VALUES (?, ?, ?)";
            $stmt_config_insert = $conn->prepare($insert_query_config);
            if (!$stmt_config_insert) {
                throw new Exception("Gagal mempersiapkan pernyataan insert konfigurasi KTA: " . $conn->error);
            }
            $stmt_config_insert->bind_param("iss", $admin_id, $new_ketua_umum_name, $new_signature_filename);
            if (!$stmt_config_insert->execute()) {
                throw new Exception("Gagal menyimpan konfigurasi KTA (Pengurus Daerah): " . $stmt_config_insert->error);
            }
            $stmt_config_insert->close();
        }

        // NEW: Update users table for bank_account_number. registration_fee dihapus
        $update_user_query = "UPDATE users SET bank_account_number = ?, updated_at = NOW() WHERE id = ?";
        $stmt_user_update = $conn->prepare($update_user_query);
        if (!$stmt_user_update) {
            throw new Exception("Gagal mempersiapkan pernyataan update user: " . $conn->error);
        }
        $stmt_user_update->bind_param("si", $new_account_number, $admin_id);
        if (!$stmt_user_update->execute()) {
            throw new Exception("Gagal menyimpan nomor rekening ke tabel users: " . $stmt_user_update->error);
        }
        $stmt_user_update->close();

        logActivity($conn, $admin_id, 'Pengurus Daerah', 'KTA Configuration', 'Pengurus Daerah memperbarui konfigurasi KTA otomatis (termasuk rekening).');

        $conn->commit();
        $response['success'] = true;
        $response['message'] = "Konfigurasi KTA berhasil disimpan!";
        $response['signature_path'] = $new_signature_filename ? BASE_URL . $pengda_kta_configs_subdir . $new_signature_filename : '';
        $response['account_number'] = $new_account_number;
        // HAPUS: $response['kta_cost'] = $new_kta_cost;

    } catch (Exception $e) {
        $conn->rollback();
        $response['message'] = "Terjadi kesalahan: " . $e->getMessage();
        error_log("KTA Config Save Error (Pengda): " . $e->getMessage() . " for admin ID: " . $admin_id);
        // Clean up partially uploaded files in case of error
        if (!empty($new_signature_filename) && file_exists($pengda_kta_configs_physical_path . $new_signature_filename) && $new_signature_filename != $current_signature_path) {
            @unlink($pengda_kta_configs_physical_path . $current_signature_path);
        }
    }

    echo json_encode($response);
    exit();
}

// Handle AJAX request for KTA status update and re-submission
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['update_kta_status_ajax'])) {
    ob_clean(); // Clear any previous output before echoing JSON
    header('Content-Type: application/json');
    $response = ['success' => false, 'message' => ''];
    $uploaded_payment_proof_filename = ''; // Store only filename for DB

    $application_id = filter_var($_POST['application_id'] ?? '', FILTER_VALIDATE_INT);
    $new_status_action = trim($_POST['new_status'] ?? ''); // Changed to trim, htmlspecialchars will be applied before DB
    $notes = trim(htmlspecialchars($_POST['notes'] ?? '', ENT_QUOTES, 'UTF-8'));

    // Validasi input
    if ($application_id === false || $application_id <= 0) {
        $response['message'] = "ID aplikasi tidak valid.";
        echo json_encode($response);
        exit();
    }
    // Updated allowed statuses for Pengda
    // IMPORTANT: 'rejected' for Pengda now means "rejected by Pengda, return to Pengcab"
    // 'pending_pengda_resubmit' is for when Pengda needs to resubmit to PB after PB rejected.
    // ADDED 'rejected_pengda' to the allowed statuses for clarity
    if (!in_array($new_status_action, ['approved_pengda', 'rejected', 'pending_pengda_resubmit'])) {
        $response['message'] = "Aksi status baru tidak valid.";
        echo json_encode($response);
        exit();
    }
    if (!isset($admin_id) || $admin_id === false || $admin_id <= 0) {
        $response['message'] = "ID admin tidak ditemukan. Silakan login kembali.";
        echo json_encode($response);
        exit();
    }

    // Get current status AND province_id, city_id from kta_applications
    $current_status_query = "SELECT status, province_id, city_id FROM kta_applications WHERE id = ?";
    $stmt_current_status = $conn->prepare($current_status_query);

    if ($stmt_current_status === false) {
        $response['message'] = "Error preparing current status query: " . $conn->error;
        error_log("Error preparing current status query: " . $conn->error);
        echo json_encode($response);
        exit();
    }

    $stmt_current_status->bind_param("i", $application_id);
    $stmt_current_status->execute();
    $current_status_result = $stmt_current_status->get_result();
    $app_data = $current_status_result->fetch_assoc();
    $old_app_status = $app_data['status'] ?? null; // Renamed to old_app_status for clarity
    $app_province_id = $app_data['province_id'] ?? null; // Get province_id of the application
    $app_city_id = $app_data['city_id'] ?? null; // Get city_id of the application
    $stmt_current_status->close();

    // Authorization check based on admin's province_id
    if ($app_province_id != $admin_province_id) {
        $response['message'] = "Anda tidak memiliki izin untuk memverifikasi pengajuan KTA dari provinsi ini.";
        echo json_encode($response);
        exit();
    }

    // *** NEW VALIDATION: Prevent approval if KTA configuration is not complete ***
    if ($new_status_action == 'approved_pengda' || $new_status_action == 'pending_pengda_resubmit') { // Added pending_pengda_resubmit here
        // Also ensure the admin has a bank account number set in the users table
        // HAPUS: Pemeriksaan $admin_profile_data['registration_fee'] === null
        if (!isKTAConfigComplete($conn, $admin_id) || empty($admin_profile_data['bank_account_number'])) {
            $response['success'] = false;
            $response['message'] = "Konfigurasi KTA Otomatis (Nama Ketua Umum, Tanda Tangan, dan Nomor Rekening) Anda belum lengkap. Harap lengkapi di bagian 'Konfigurasi KTA Otomatis' sebelum menyetujui pengajuan.";
            echo json_encode($response);
            exit();
        }
    }
    // *** END NEW VALIDATION ***

    // Validate status transition
    // Pengda can approve if status is 'approved_pengcab' or 'rejected_pengda' (if changing mind)
    // Pengda can reject (to pengcab) if status is 'approved_pengcab' or 'rejected_pb'
    // Pengda can resubmit (to PB) if status is 'rejected_pb'
    $allowed_statuses_for_action = ['approved_pengcab', 'rejected_pb', 'rejected_pengda', 'pending_pengda_resubmit']; // Added pending_pengda_resubmit for re-approval flexibility

    if (in_array($old_app_status, $allowed_statuses_for_action)) {
        
        $conn->begin_transaction(); // Start transaction

        try {
            $actual_new_db_status = $new_status_action; // Initialize with the action name
            $update_fields = [];
            $param_values = [];
            $param_types = "";

            // Always set status as the first parameter
            $update_fields[] = "status = ?";
            $param_values[] = $actual_new_db_status;
            $param_types .= "s";

            // Handle file upload if approving
            if ($new_status_action == 'approved_pengda') {
                // HAPUS: Logika upload bukti pembayaran ke PB dihapus
                $uploaded_payment_proof_filename = NULL; // Set to NULL because it's no longer uploaded

                $update_fields[] = "approved_by_pengda_id = ?";
                $param_values[] = $admin_id;
                $param_types .= "i";
                $update_fields[] = "approved_at_pengda = NOW()"; // Set timestamp
                $update_fields[] = "notes_pengda = ?";
                $param_values[] = $notes;
                $param_types .= "s";
                $update_fields[] = "pengda_payment_proof_path = ?"; // Set this to NULL
                $param_values[] = $uploaded_payment_proof_filename;
                $param_types .= "s";
                // When approved, clear previous rejection notes from PB (if any) or Pengda itself
                $update_fields[] = "notes_pb = NULL";
                $update_fields[] = "rejection_reason = NULL"; // Clear general rejection reason
                $update_fields[] = "generated_kta_file_path_pb = NULL"; // Clear PB KTA path
                $update_fields[] = "kta_issued_at = NULL"; // Clear issue date
                $update_fields[] = "approved_at_pb = NULL"; // Clear PB approval date
                $update_fields[] = "rejected_by_pengda_id = NULL"; // Also clear rejected by Pengda info
                $update_fields[] = "rejected_at_pengda = NULL";


            } elseif ($new_status_action == 'rejected') { // This means Pengda rejects back to Pengcab
                $actual_new_db_status = 'rejected_pengda'; // The actual status for the database
                // param_values[0] is already set to 'rejected' from above, need to change it
                $param_values[0] = $actual_new_db_status;
                
                $update_fields[] = "rejected_by_pengda_id = ?";
                $param_values[] = $admin_id;
                $param_types .= "i";
                $update_fields[] = "rejected_at_pengda = NOW()"; // Set timestamp
                $update_fields[] = "notes_pengda = ?";
                $param_values[] = $notes;
                $param_types .= "s";
                $update_fields[] = "rejection_reason = ?"; // Use general rejection_reason for notes back to Pengcab
                $param_values[] = $notes;
                $param_types .= "s";
                
                // Clear payment proof path if rejected by Pengda
                $update_fields[] = "pengda_payment_proof_path = NULL";
                $update_fields[] = "generated_kta_file_path_pengda = NULL"; // Clear Pengda KTA path
                
                // Also clear any PB-related fields if Pengda rejects (as it's going back to Pengcab)
                $update_fields[] = "approved_by_pb_id = NULL";
                $update_fields[] = "approved_at_pb = NULL";
                $update_fields[] = "notes_pb = NULL";
                $update_fields[] = "generated_kta_file_path_pb = NULL";
                $update_fields[] = "kta_issued_at = NULL";
                
            } elseif ($new_status_action == 'pending_pengda_resubmit') { // Pengda resubmitting to PB after PB rejection
                // Perubahan utama di sini: Ubah status menjadi 'approved_pengda'
                $actual_new_db_status = 'approved_pengda'; // SET STATUS TO APPROVED_PENGDA
                $param_values[0] = $actual_new_db_status;

                // When re-submitting a rejected application (by PB), treat it as a new approval from Pengda
                $update_fields[] = "approved_by_pengda_id = ?";
                $param_values[] = $admin_id;
                $param_types .= "i";
                $update_fields[] = "approved_at_pengda = NOW()"; // Set timestamp
                $update_fields[] = "notes_pengda = ?"; // New notes for resubmission (potentially showing the PB rejection reason)
                $param_values[] = $notes;
                $param_types .= "s";
                $update_fields[] = "pengda_payment_proof_path = NULL"; // Clear payment proof if any (new payment will be submitted to PB later)
                $update_fields[] = "generated_kta_file_path_pengda = NULL"; // Clear Pengda KTA path
                $update_fields[] = "rejected_by_pengda_id = NULL"; // Clear previous rejection info by Pengda
                $update_fields[] = "rejected_at_pengda = NULL";
                $update_fields[] = "approved_by_pb_id = NULL"; // Also clear PB related fields (it's being resubmitted)
                $update_fields[] = "approved_at_pb = NULL";
                $update_fields[] = "notes_pb = NULL"; // Clear PB rejection notes for new submission
                $update_fields[] = "generated_kta_file_path_pb = NULL";
                $update_fields[] = "kta_issued_at = NULL";
                $update_fields[] = "rejection_reason = NULL"; // Clear general rejection reason as it's being resubmitted
                
                // Add a note indicating re-submission from PB rejection
                $update_fields[] = "last_resubmitted_at = NOW()"; // Track last resubmission
            }

            $update_query = "UPDATE kta_applications SET " . implode(', ', $update_fields) . " WHERE id = ?";
            $param_values[] = $application_id;
            $param_types .= "i";

            $stmt = $conn->prepare($update_query);

            if ($stmt === false) {
                throw new Exception("Error preparing update statement: " . $conn->error);
            }
            
            // Using call_user_func_array to bind parameters dynamically
            // Ensure array_unshift is used correctly for bind_param arguments
            // Make sure the first argument of bind_param is always the type string
            array_unshift($param_values, $param_types);
            call_user_func_array([$stmt, 'bind_param'], $param_values);

            if (!$stmt->execute()) {
                throw new Exception("Gagal memperbarui status: " . $stmt->error);
            }
            $stmt->close();

            // Insert status history
            $insert_history_query = "INSERT INTO kta_application_history (application_id, status, notes) VALUES (?, ?, ?)";
            $stmt_history = $conn->prepare($insert_history_query);
            if ($stmt_history) {
                $history_status_desc = '';
                // Use the *actual* new status that was set in the DB ($actual_new_db_status) for history
                
                if ($actual_new_db_status == 'approved_pengda') $history_status_desc = 'Disetujui oleh Pengda';
                elseif ($actual_new_db_status == 'rejected_pengda') $history_status_desc = 'Ditolak oleh Pengda (Dikembalikan ke Pengcab)';
                // Perbaikan: Jika status aktual adalah 'approved_pengda' karena pengajuan ulang dari PB, catat sebagai 'Diajukan Kembali oleh Pengda (setelah ditolak PB)'
                // Ini akan menjaga kejelasan di log aktivitas meskipun status DB-nya 'approved_pengda'
                if ($new_status_action == 'pending_pengda_resubmit' && $actual_new_db_status == 'approved_pengda') {
                    $history_status_desc = 'Diajukan Kembali oleh Pengda (setelah ditolak PB) - Status Diubah menjadi Disetujui Pengda';
                }
                
                $history_notes = $history_status_desc . ". Catatan: " . $notes;
                $stmt_history->bind_param("iss", $application_id, $actual_new_db_status, $history_notes);
                if (!$stmt_history->execute()) {
                    error_log("Failed to execute history insert: " . $stmt_history->error);
                }
                $stmt_history->close();
            } else {
                error_log("Failed to prepare history insert: " . $conn->error);
            }

            $conn->commit(); // Commit transaction here

            $response['success'] = true;
            $response['message'] = "Status pengajuan KTA berhasil diperbarui.";

            // SEKARANG, SETELAH TRANSAKSI DATABASE UTAMA DI-COMMIT, BARU PANGGIL SCRIPT PEMBUAT PDF
            if ($actual_new_db_status == 'approved_pengda') { // Panggil ini jika status akhir adalah approved_pengda
                // Check if Pengda KTA config exists and is complete
                $ketua_umum_name_check = '';
                $signature_image_path_check = '';
                $account_number_check = $admin_bank_account_number; // NEW: Get from admin's profile (users table)
                // HAPUS: Pemeriksaan $kta_cost !== null
                $query_pengda_config_check = "SELECT ketua_umum_name, signature_image_path FROM pengda_kta_configs WHERE user_id = ?";
                $stmt_pengda_config_check = $conn->prepare($query_pengda_config_check);
                if ($stmt_pengda_config_check) {
                    $stmt_pengda_config_check->bind_param("i", $admin_id);
                    $stmt_pengda_config_check->execute();
                    $result_pengda_config_check = $stmt_pengda_config_check->get_result();
                    if ($row_pengda_config_check = $result_pengda_config_check->fetch_assoc()) {
                        $ketua_umum_name_check = $row_pengda_config_check['ketua_umum_name'];
                        $signature_image_path_check = $row_pengda_config_check['signature_image_path'];
                    }
                    $stmt_pengda_config_check->close();
                }

                // HAPUS: Pemeriksaan $admin_profile_data['registration_fee'] === null
                if (empty($ketua_umum_name_check) || empty($signature_image_path_check) || empty($account_number_check)) {
                    // This case should ideally be caught by the earlier isKTAConfigComplete check,
                    // but keeping this as a safeguard if logic changes.
                    $response['success'] = false;
                    $response['message'] .= " Peringatan: Konfigurasi KTA Pengurus Daerah (Nama Ketua Umum, Tanda Tangan, dan Nomor Rekening) Anda belum lengkap. KTA tidak dapat dihasilkan secara otomatis. Harap lengkapi di bagian 'Konfigurasi KTA Otomatis'.";
                    // Do not attempt to generate PDF if config is incomplete
                } else {
                    $pdf_gen_data = [
                        'application_id' => $application_id,
                        'admin_id' => $admin_id, // Pass admin_id to get KTA config (signature, stamp, ketua umum name)
                        'role_caller' => 'pengda' // <--- Memberitahu script bahwa ini dipanggil oleh Pengda
                    ];

                    $ch = curl_init(BASE_URL_FOR_PDF_INTERNAL . 'generate_kta_pdf.php');
                    curl_setopt($ch, CURLOPT_POST, 1);
                    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($pdf_gen_data));
                    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                    curl_setopt($ch, CURLOPT_HEADER, false);
                    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
                    curl_setopt($ch, CURLOPT_TIMEOUT, 120); // Longer timeout for PDF generation

                    $pdf_gen_response = curl_exec($ch);
                    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                    $curl_error = curl_error($ch);
                    curl_close($ch);

                    if ($pdf_gen_response === false || $http_code != 200) {
                        $error_msg = "Gagal memanggil generate_kta_pdf.php. HTTP Status: {$http_code}. Error: {$curl_error}. Response: " . substr($pdf_gen_response, 0, 200) . "...";
                        error_log("Pengda PDF Generation Curl Error: " . $error_msg);
                        $response['success'] = false; // Set success to false to indicate PDF issue
                        $response['message'] .= " Namun, terjadi kesalahan saat menghasilkan KTA PDF: " . $error_msg;
                    } else {
                        $pdf_gen_result = json_decode($pdf_gen_response, true);
                        if (!$pdf_gen_result || !$pdf_gen_result['success']) {
                            $error_msg = $pdf_gen_result['message'] ?? 'Respons tidak valid dari script generasi PDF atau proses PDF gagal.';
                            error_log("Pengda PDF Generation Script Error: " . $error_msg . " Full Response: " . $pdf_gen_response);
                            $response['success'] = false;
                            $response['message'] .= " Namun, terjadi kesalahan saat menghasilkan KTA PDF: " . $error_msg;
                        } else {
                            // Update the kta_applications table with the generated PDF path
                            // generated_kta_file_path_pengda should store relative path from uploads/
                            $kta_file_path_for_db = str_replace(BASE_URL, '', $pdf_gen_result['kta_url']);
                            $update_pdf_path_query = "UPDATE kta_applications SET generated_kta_file_path_pengda = ? WHERE id = ?";
                            $stmt_update_pdf_path = $conn->prepare($update_pdf_path_query);
                            if ($stmt_update_pdf_path) {
                                $stmt_update_pdf_path->bind_param("si", $kta_file_path_for_db, $application_id);
                                if ($stmt_update_pdf_path->execute()) {
                                    $response['kta_generated_url'] = $pdf_gen_result['kta_url'];
                                    logActivity($conn, $admin_id, 'Pengurus Daerah', 'Generated Pengda KTA', "KTA Pengda berhasil di-generate untuk pengajuan ID {$application_id}. Path: " . $kta_file_path_for_db, $application_id, $actual_new_db_status, $actual_new_db_status);
                                } else {
                                    $response['success'] = false;
                                    $response['message'] .= " Namun, gagal menyimpan path KTA PDF yang dihasilkan ke database: " . $stmt_update_pdf_path->error;
                                    error_log("Failed to update KTA PDF path in DB (Pengda): " . $stmt_update_pdf_path->error);
                                    // Optionally delete the generated PDF file if DB update fails
                                    @unlink($generated_kta_pengda_physical_path . basename($kta_file_path_for_db));
                                }
                                $stmt_update_pdf_path->close();
                            } else {
                                $response['success'] = false;
                                $response['message'] .= " Namun, error saat mempersiapkan pernyataan update path KTA PDF: " . $conn->error;
                                error_log("Error preparing update KTA PDF path statement (Pengda): " . $conn->error);
                            }
                        }
                    }
                }
            }
            // If Pengda rejects an application rejected by PB, the redirection to Pengcab should happen from PB admin.
            // If Pengda rejects an application from Pengcab, the Pengcab admin simply sees the updated status.
            // No redirection from Pengda to Pengcab needed here in `pengda.php`.
            // The `rejected_pengda` status will make the application appear in the Pengcab's queue.
            
            // Log activity after successful status update
            // Use the status that was *actually* saved to DB for logging
            $activity_description = "Memperbarui status pengajuan KTA ID {$application_id} dari '{$old_app_status}' menjadi '{$actual_new_db_status}'. Catatan: {$notes}";
            logActivity($conn, $admin_id, 'Pengurus Daerah', 'Update KTA Application Status', $activity_description, $application_id, $old_app_status, $actual_new_db_status);

        } catch (Exception $e) {
            $conn->rollback(); // Rollback on error
            $response['message'] = "Terjadi kesalahan: " . $e->getMessage();
            error_log("KTA Status Update Error (Pengda): " . $e->getMessage() . " on application ID: " . $application_id);
            // If update fails, delete uploaded file to prevent orphans
            // HAPUS: Penanganan penghapusan file bukti pembayaran karena upload dihapus
        }
    } else {
        $response['message'] = "Transisi status tidak valid. Pengajuan saat ini dalam status '" . ucfirst(str_replace('_', ' ', (string)$old_app_status)) . "'."; // Cast to string
    }
    echo json_encode($response);
    exit();
}

// Handle AJAX request for changing password
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['change_password_ajax'])) {
    ob_clean();
    header('Content-Type: application/json');
    $response = ['success' => false, 'message' => ''];

    $old_password = $_POST['old_password'] ?? '';
    $new_password = $_POST['new_password'] ?? '';
    $confirm_new_password = $_POST['confirm_new_password'] ?? '';

    if (empty($old_password) || empty($new_password) || empty($confirm_new_password)) {
        $response['message'] = "Semua field password harus diisi.";
        echo json_encode($response);
        exit();
    }

    if (strlen($new_password) < 6) {
        $response['message'] = "Password baru minimal 6 karakter.";
        echo json_encode($response);
        exit();
    }

    $conn->begin_transaction();
    try {
        // Fetch current hashed password
        $query_current_password = "SELECT password FROM users WHERE id = ?";
        $stmt_current_password = $conn->prepare($query_current_password);
        if (!$stmt_current_password) {
            throw new Exception("Gagal mempersiapkan query password: " . $conn->error);
        }
        $stmt_current_password->bind_param("i", $admin_id);
        $stmt_current_password->execute();
        $result_current_password = $stmt_current_password->get_result();
        $user_data = $result_current_password->fetch_assoc();
        $stmt_current_password->close();

        if (!$user_data || !password_verify($old_password, $user_data['password'])) {
            throw new Exception("Password lama salah.");
        }

        // Hash the new password
        $hashed_new_password = password_hash($new_password, PASSWORD_DEFAULT);

        // Update password in the database
        $update_password_query = "UPDATE users SET password = ? WHERE id = ?";
        $stmt_update_password = $conn->prepare($update_password_query);
        if (!$stmt_update_password) {
            throw new Exception("Gagal mempersiapkan update password: " . $conn->error);
        }
        $stmt_update_password->bind_param("si", $hashed_new_password, $admin_id);
        if (!$stmt_update_password->execute()) {
            throw new Exception("Gagal memperbarui password: " . $stmt_update_password->error);
        }
        $stmt_update_password->close();

        logActivity($conn, $admin_id, 'Pengurus Daerah', 'Change Password', 'Pengurus Daerah berhasil mengubah password.');
        
        $conn->commit();
        $response['success'] = true;
        $response['message'] = "Password berhasil diubah!";

    } catch (Exception $e) {
        $conn->rollback();
        $response['message'] = "Terjadi kesalahan: " . $e->getMessage();
        error_log("Change Password Error (Pengda): " . $e->getMessage() . " for admin ID: " . $admin_id);
    }

    echo json_encode($response);
    exit();
}


// Clear output buffer after all AJAX requests have been handled
ob_end_flush();


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

// For Members List
$members_current_page = isset($_GET['members_page']) ? (int)$_GET['members_page'] : 1;
$members_offset = ($members_current_page - 1) * $records_per_page;
$members_search_query = isset($_GET['members_search']) ? '%' . $_GET['members_search'] . '%' : '%';
$members_role_filter = isset($_GET['members_role_filter']) ? (int)$_GET['members_role_filter'] : 0;
$members_city_filter = isset($_GET['members_city_filter']) ? (int)$_GET['members_city_filter'] : 0;
$members_kta_status_filter = $_GET['members_kta_status_filter'] ?? 'all'; // NEW: KTA status filter for members


// NEW: For Balance Transactions
$balance_current_page = isset($_GET['balance_page']) ? (int)$_GET['balance_page'] : 1;
$balance_offset = ($balance_current_page - 1) * $records_per_page;
$balance_search_query = isset($_GET['balance_search']) ? '%' . $_GET['balance_search'] . '%' : '%';


// Fetch KTA applications for Pengda
// MODIFIED: Added 'rejected_pengda' status to be fetched by Pengda AND 'rejected' (from PB)
function fetchKTAApplications($conn, $kta_files_subdir, $pengcab_payment_proofs_subdir, $pengda_payment_proofs_subdir, $generated_kta_pengda_subdir, $generated_kta_pb_subdir, $admin_province_id, $limit, $offset, $search_term) { // NEW: Add $generated_kta_pb_subdir
    $kta_applications = [];
    $total_records = 0;

    // Count total records for pagination
    // MODIFIED: Include 'approved_pengda' and 'approved_pb' for the "lihat KTA" feature
    $count_query = "SELECT COUNT(*) AS total
                    FROM kta_applications ka
                    JOIN users u ON ka.user_id = u.id
                    WHERE ka.province_id = ?
                    AND ka.status IN ('approved_pengcab', 'rejected_pb', 'rejected_pengda', 'pending_pengda_resubmit', 'approved_pengda', 'approved_pb')
                    AND (ka.club_name LIKE ? OR ka.leader_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)";
    $stmt_count = $conn->prepare($count_query);
    if ($stmt_count) {
        $stmt_count->bind_param("issss", $admin_province_id, $search_term, $search_term, $search_term, $search_term);
        $stmt_count->execute();
        $count_result = $stmt_count->get_result();
        $total_records = $count_result->fetch_assoc()['total'];
        $stmt_count->close();
    } else {
        error_log("Failed to prepare KTA count query: " . $conn->error);
        return ['error' => "Gagal menghitung total pengajuan KTA: " . $conn->error, 'total_records' => 0, 'data' => []];
    }

    $query_kta = "SELECT ka.*, u.club_name AS user_club_name, u.email AS user_email, u.phone AS user_phone,
                                p.name AS province_name_kta, c.name AS city_name_kta
                            FROM kta_applications ka
                            JOIN users u ON ka.user_id = u.id
                            LEFT JOIN provinces p ON ka.province_id = p.id
                            LEFT JOIN cities c ON ka.city_id = c.id
                            WHERE ka.province_id = ?
                            AND ka.status IN ('approved_pengcab', 'rejected_pb', 'rejected_pengda', 'pending_pengda_resubmit', 'approved_pengda', 'approved_pb')
                            AND (ka.club_name LIKE ? OR ka.leader_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)
                            ORDER BY
                                CASE
                                    WHEN ka.status = 'rejected_pb' THEN 1 -- Show rejected by PB first (needs re-submission consideration)
                                    WHEN ka.status = 'rejected_pengda' THEN 2 -- Show rejected by Pengda next (needs re-submission consideration)
                                    WHEN ka.status = 'approved_pengcab' THEN 3
                                    WHEN ka.status = 'pending_pengda_resubmit' THEN 4
                                    WHEN ka.status = 'approved_pengda' THEN 5
                                    WHEN ka.status = 'approved_pb' THEN 6
                                    ELSE 7
                                END,
                                ka.created_at DESC
                            LIMIT ? OFFSET ?";

    $stmt_kta = $conn->prepare($query_kta);
    if ($stmt_kta) {
        $stmt_kta->bind_param("issssii", $admin_province_id, $search_term, $search_term, $search_term, $search_term, $limit, $offset);
        $stmt_kta->execute();
        $result_kta = $stmt_kta->get_result();

        if ($result_kta) {
            while ($row = $result_kta->fetch_assoc()) {
                // Prepare display paths, setting to empty string if NULL or empty
                // Ensure paths are correctly constructed relative to BASE_URL (which is uploads/ folder)
                // If a path from DB already contains the subdir, avoid duplicating it.
                $row['logo_path_display'] = $row['logo_path'] ? BASE_URL . $kta_files_subdir . basename($row['logo_path']) : '';
                $row['ad_file_path_display'] = $row['ad_file_path'] ? BASE_URL . $kta_files_subdir . basename($row['ad_file_path']) : '';
                $row['art_file_path_display'] = $row['art_file_path'] ? BASE_URL . $kta_files_subdir . basename($row['art_file_path']) : '';
                $row['sk_file_path_display'] = $row['sk_file_path'] ? BASE_URL . $kta_files_subdir . basename($row['sk_file_path']) : '';
                $row['payment_proof_path_display'] = $row['payment_proof_path'] ? BASE_URL . $kta_files_subdir . basename($row['payment_proof_path']) : '';
                
                $row['pengcab_payment_proof_path_display'] = $row['pengcab_payment_proof_path'] ?
                    BASE_URL . $pengcab_payment_proofs_subdir . basename($row['pengcab_payment_proof_path']) : '';

                $row['pengda_payment_proof_path_display'] = $row['pengda_payment_proof_path'] ?
                    BASE_URL . $pengda_payment_proofs_subdir . basename($row['pengda_payment_proof_path']) : '';

                // Path to KTA generated by Pengcab
                $row['generated_kta_file_path_pengcab_display'] = $row['generated_kta_file_path'] ? // This field is actually 'generated_kta_file_path' in DB
                    BASE_URL . 'generated_kta/' . basename($row['generated_kta_file_path']) : '';

                // NEW: Path to KTA generated by Pengda (for PB approval)
                // This path should start with 'generated_kta_pengda/'
                $row['generated_kta_file_path_pengda_display'] = $row['generated_kta_file_path_pengda'] ?
                    BASE_URL . $generated_kta_pengda_subdir . basename($row['generated_kta_file_path_pengda']) : '';

                // NEW: Path to KTA generated by PB (for display only, Pengda doesn't manage)
                // This path should start with 'generated_kta_pb/'
                $row['generated_kta_file_path_pb_display'] = $row['generated_kta_file_path_pb'] ?
                    BASE_URL . $generated_kta_pb_subdir . basename($row['generated_kta_file_path_pb']) : '';
                        
                // Add province and city names from JOIN
                $row['province'] = $row['province_name_kta'];
                $row['regency'] = $row['city_name_kta'];
                $row['city_id_application'] = $row['city_id']; // Tambahkan ini agar city_id bisa diakses di frontend

                $kta_applications[] = $row;
            }
        } else {
            return ['error' => "Failed to retrieve KTA application data: " . $stmt_kta->error, 'total_records' => 0, 'data' => []];
        }
        $stmt_kta->close(); // Close the statement after use
    } else {
        return ['error' => "Failed to prepare KTA application query: " . $conn->error, 'total_records' => 0, 'data' => []];
    }
    return ['data' => $kta_applications, 'total_records' => $total_records];
}

// Fetch Activity Log (No changes here)
function fetchActivityLog($conn, $admin_id, $limit, $offset, $search_term) {
    $activity_log = [];
    $total_records = 0;

    // Count total records for pagination
    $count_query = "SELECT COUNT(*) AS total
                    FROM activity_logs al
                    LEFT JOIN kta_applications ka ON al.application_id = ka.id
                    WHERE al.user_id = ? AND al.role_name = 'Pengurus Daerah'
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
                    FROM activity_logs al
                    LEFT JOIN kta_applications ka ON al.application_id = ka.id
                    WHERE al.user_id = ? AND al.role_name = 'Pengurus Daerah'
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

/**
 * NEW FUNCTION: fetchPengdaMembers
 * Fetches members (Pengcab and regular users) within the Pengda's province,
 * with dynamic filters for role, city, and KTA status.
 *
 * @param mysqli $conn The database connection.
 * @param int $admin_province_id The province ID of the logged-in Pengda admin.
 * @param int $limit The number of records to fetch per page.
 * @param int $offset The offset for pagination.
 * @param string $search_term Search term for username, email, phone, or club name.
 * @param int $role_id_filter Optional role ID to filter by (0 for all roles).
 * @param int $city_id_filter Optional city ID to filter by (0 for all cities).
 * @param string $kta_status_filter Optional KTA status to filter by ('all', 'issued', 'not_issued', 'not_applied').
 * @return array An associative array containing 'data' (array of members) and 'total_records'.
 */
function fetchPengdaMembers($conn, $admin_province_id, $limit, $offset, $search_term, $role_id_filter = 0, $city_id_filter = 0, $kta_status_filter = 'all') {
    $members = [];
    $total_records = 0;

    // Initial WHERE clauses and parameters
    $where_clauses = [
        "u.province_id = ?",
        "u.role_id IN (1, 2)" // Filter for Anggota (1) and Pengcab (2)
    ];
    $params = [$admin_province_id];
    $types = "i";

    // Add search filter
    if (trim($search_term, '%')) {
        $where_clauses[] = "(u.username LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR u.club_name LIKE ?)";
        array_push($params, $search_term, $search_term, $search_term, $search_term);
        $types .= "ssss";
    }

    // Add role filter
    if (!empty($role_id_filter)) {
        $where_clauses[] = "u.role_id = ?";
        $params[] = $role_id_filter;
        $types .= "i";
    }

    // Add city filter
    if (!empty($city_id_filter)) {
        $where_clauses[] = "u.city_id = ?";
        $params[] = $city_id_filter;
        $types .= "i";
    }

    // Dynamic join for KTA status filtering.
    // We use a LEFT JOIN to a subquery that gets the LATEST KTA status for each user.
    // This allows us to filter on the KTA status effectively.
    $kta_status_join_and_select = "
        LEFT JOIN (
            SELECT ka.user_id, ka.id as kta_application_id, ka.status, ka.created_at, ka.logo_path
            FROM kta_applications ka
            INNER JOIN (
                SELECT user_id, MAX(created_at) AS max_created_at
                FROM kta_applications
                GROUP BY user_id
            ) AS latest_ka ON ka.user_id = latest_ka.user_id AND ka.created_at = latest_ka.max_created_at
        ) AS latest_kta ON u.id = latest_kta.user_id
    ";

    // Add KTA status filter
    if ($kta_status_filter != 'all') {
        switch ($kta_status_filter) {
            case 'kta_issued':
                $where_clauses[] = "latest_kta.status = 'kta_issued'";
                break;
            case 'not_issued':
                $where_clauses[] = "(latest_kta.status IS NULL OR latest_kta.status != 'kta_issued')";
                break;
            case 'not_applied':
                $where_clauses[] = "latest_kta.status IS NULL";
                break;
            // Add other specific statuses if needed for filtering
            default:
                // If a specific status is passed (e.g., 'pending'), filter by it
                $where_clauses[] = "latest_kta.status = ?";
                $params[] = $kta_status_filter;
                $types .= "s";
                break;
        }
    }

    $where_sql = "WHERE " . implode(" AND ", $where_clauses);

    // Count total records for pagination
    $count_query = "SELECT COUNT(DISTINCT u.id) AS total
                    FROM users u
                    LEFT JOIN roles r ON u.role_id = r.id
                    LEFT JOIN provinces p ON u.province_id = p.id
                    LEFT JOIN cities c ON u.city_id = c.id
                    " . $kta_status_join_and_select . "
                    " . $where_sql;
    
    $stmt_count = $conn->prepare($count_query);
    if ($stmt_count) {
        // Use references for bind_param with call_user_func_array
        $bind_params_count = [];
        $bind_params_count[] = $types; // First parameter for bind_param is the type string
        foreach ($params as $key => $value) {
            $bind_params_count[] = &$params[$key];
        }
        call_user_func_array([$stmt_count, 'bind_param'], $bind_params_count);

        $stmt_count->execute();
        $count_result = $stmt_count->get_result();
        $total_records = $count_result->fetch_assoc()['total'];
        $stmt_count->close();
    } else {
        error_log("Failed to prepare members count query: " . $conn->error);
        return ['error' => "Gagal menghitung total anggota: " . $conn->error, 'total_records' => 0, 'data' => []];
    }

    // Fetch members data with limit and offset
    $query_members = "SELECT u.id, u.username, u.email, u.phone, u.username AS full_name, u.address, u.club_name,
                                r.role_name, p.name AS province_name, c.name AS city_name,
                                latest_kta.kta_application_id, latest_kta.logo_path,
                                COALESCE(
                                    CASE
                                        WHEN latest_kta.status = 'kta_issued' THEN 'Diterbitkan PB'
                                        WHEN latest_kta.status = 'approved_pb' THEN 'Disetujui PB'
                                        WHEN latest_kta.status = 'approved_pengda' THEN 'Disetujui Pengda'
                                        WHEN latest_kta.status = 'approved_pengcab' THEN 'Disetujui Pengcab'
                                        WHEN latest_kta.status = 'pending' THEN 'Menunggu Verifikasi Pengcab'
                                        WHEN latest_kta.status = 'rejected_pengcab' THEN 'Ditolak Pengcab'
                                        WHEN latest_kta.status = 'rejected_pengda' THEN 'Ditolak Pengda'
                                        WHEN latest_kta.status = 'rejected_pb' THEN 'Ditolak PB'
                                        WHEN latest_kta.status = 'pending_pengda_resubmit' THEN 'Menunggu Verifikasi PB (Diajukan Kembali)'
                                        ELSE 'Belum Mengajukan'
                                    END
                                , 'Belum Mengajukan') AS kta_status
                            FROM users u
                            LEFT JOIN roles r ON u.role_id = r.id
                            LEFT JOIN provinces p ON u.province_id = p.id
                            LEFT JOIN cities c ON u.city_id = c.id
                            " . $kta_status_join_and_select . "
                            " . $where_sql . "
                            ORDER BY u.role_id ASC, u.created_at DESC
                            LIMIT ? OFFSET ?";
    
    $params_with_limit = $params;
    $types_with_limit = $types . "ii";
    array_push($params_with_limit, $limit, $offset);

    $stmt_members = $conn->prepare($query_members);
    if ($stmt_members) {
        // Use references for bind_param with call_user_func_array
        $bind_params_members = [];
        foreach ($params_with_limit as $key => $value) {
            $bind_params_members[] = &$params_with_limit[$key];
        }
        array_unshift($bind_params_members, $types_with_limit);
        call_user_func_array([$stmt_members, 'bind_param'], $bind_params_members);

        $stmt_members->execute();
        $result_members = $stmt_members->get_result();
        while ($row = $result_members->fetch_assoc()) {
            // Add logo path display
            $row['logo_path_display'] = $row['logo_path'] ? 'https://forbasi.or.id/forbasi/php/uploads/' . $row['logo_path'] : '';
            $members[] = $row;
        }
        $stmt_members->close();
    } else {
        error_log("Failed to prepare members fetch statement: " . $conn->error);
        return ['error' => "Gagal mengambil daftar anggota: " . $conn->error, 'total_records' => 0, 'data' => []];
    }
    return ['data' => $members, 'total_records' => $total_records];
}
// NEW FUNCTION: Fetch Cities in a specific province
function fetchCitiesInProvince($conn, $province_id) {
    $cities = [];
    $query = "SELECT id, name FROM cities WHERE province_id = ? ORDER BY name ASC";
    $stmt = $conn->prepare($query);
    if ($stmt) {
        $stmt->bind_param("i", $province_id);
        $stmt->execute();
        $result = $stmt->get_result();
        while ($row = $result->fetch_assoc()) {
            $cities[] = $row;
        }
        $stmt->close();
    }
    return $cities;
}
// Helper function to render pagination links (No changes here)
function renderPagination($total_records, $records_per_page, $current_page, $param_prefix, $search_param_name, $current_search_value, $additional_params = []) {
    $total_pages = ceil($total_records / $records_per_page);
    $output = '';

    if ($total_pages > 1) {
        $output .= '<div class="pagination">';
        
        $base_url_params = '';
        if ($search_param_name) {
            $base_url_params .= '&'.$search_param_name.'=' . urlencode(trim($current_search_value, '%'));
        }
        foreach ($additional_params as $key => $value) {
            $base_url_params .= '&' . urlencode($key) . '=' . urlencode($value);
        }

        if ($current_page > 1) {
            $output .= '<a href="?'.$param_prefix.'_page=' . ($current_page - 1) . $base_url_params . '" class="page-link prev"><i class="fas fa-chevron-left"></i> Sebelumnya</a>';
        }

        $start_page = max(1, $current_page - 2);
        $end_page = min($total_pages, $current_page + 2);

        if ($start_page > 1) {
            $output .= '<a href="?'.$param_prefix.'_page=1' . $base_url_params . '" class="page-link">1</a>';
            if ($start_page > 2) {
                $output .= '<span class="page-dots">...</span>';
            }
        }

        for ($i = $start_page; $i <= $end_page; $i++) {
            $active_class = ($i == $current_page) ? 'active' : '';
            $output .= '<a href="?'.$param_prefix.'_page=' . $i . $base_url_params . '" class="page-link ' . $active_class . '">' . $i . '</a>';
        }

        if ($end_page < $total_pages) {
            if ($end_page < $total_pages - 1) {
                $output .= '<span class="page-dots">...</span>';
            }
            $output .= '<a href="?'.$param_prefix.'_page=' . $total_pages . $base_url_params . '" class="page-link">' . $total_pages . '</a>';
        }

        if ($current_page < $total_pages) {
            $output .= '<a href="?'.$param_prefix.'_page=' . ($current_page + 1) . $base_url_params . '" class="page-link next">Selanjutnya <i class="fas fa-chevron-right"></i></a>';
        }
        $output .= '</div>';
    }
    return $output;
}

// NEW FUNCTION: Fetch Balance Summary for Pengda (Modified to use pb_payments_recap)
function fetchBalanceSummary($conn, $admin_id) { // Change to accept admin_id
    $total_balance = 0;
    // Sum of amount for transactions where recipient_type is 'pengda' and recipient_id matches admin_id
    $query = "SELECT SUM(amount) AS total_incoming_balance
                FROM pb_payments_recap
                WHERE recipient_type = 'pengda' AND recipient_id = ?";
    $stmt = $conn->prepare($query);
    if ($stmt) {
        $stmt->bind_param("i", $admin_id); // Bind admin_id
        $stmt->execute();
        $result = $stmt->get_result();
        if ($row = $result->fetch_assoc()) {
            $total_balance = $row['total_incoming_balance'] ?? 0;
        }
        $stmt->close();
    } else {
        error_log("Failed to prepare balance summary query: " . $conn->error);
    }
    return $total_balance;
}

// NEW FUNCTION: Fetch Incoming Balance Transactions from PB (Modified to use pb_payments_recap)
function fetchIncomingBalanceTransactions($conn, $pb_to_pengda_payment_proofs_subdir, $admin_id, $limit, $offset, $search_term) { // Change to accept admin_id
    $transactions = [];
    $total_records = 0;

    // Count total records for pagination
    $count_query = "SELECT COUNT(*) AS total
                    FROM pb_payments_recap
                    WHERE recipient_type = 'pengda' AND recipient_id = ?
                    AND (notes LIKE ? OR amount LIKE ?)"; // Adjust search fields as needed
    $stmt_count = $conn->prepare($count_query);
    if ($stmt_count) {
        $stmt_count->bind_param("iss", $admin_id, $search_term, $search_term); // Bind admin_id
        $stmt_count->execute();
        $count_result = $stmt_count->get_result();
        $total_records = $count_result->fetch_assoc()['total'];
        $stmt_count->close();
    } else {
        error_log("Failed to prepare incoming balance transactions count query: " . $conn->error);
        return ['error' => "Gagal menghitung total transaksi saldo: " . $conn->error, 'total_records' => 0, 'data' => []];
    }

    $query_transactions = "SELECT id, recap_date, amount, notes, payment_proof_path, paid_at
                            FROM pb_payments_recap
                            WHERE recipient_type = 'pengda' AND recipient_id = ?
                            AND (notes LIKE ? OR amount LIKE ?)
                            ORDER BY paid_at DESC
                            LIMIT ? OFFSET ?";
    $stmt_transactions = $conn->prepare($query_transactions);
    if ($stmt_transactions) {
        $stmt_transactions->bind_param("issii", $admin_id, $search_term, $search_term, $limit, $offset); // Bind admin_id
        $stmt_transactions->execute();
        $result_transactions = $stmt_transactions->get_result();
        while ($row = $result_transactions->fetch_assoc()) {
            // Adjust the display path based on the actual column name for proof
            $row['payment_proof_path_display'] = $row['payment_proof_path'] ?
                BASE_URL . $pb_to_pengda_payment_proofs_subdir . basename($row['payment_proof_path']) : '';
            $transactions[] = $row;
        }
        $stmt_transactions->close();
    } else {
        error_log("Failed to prepare incoming balance transactions fetch statement: " . $conn->error);
        return ['error' => "Gagal mengambil riwayat transaksi saldo: " . $conn->error, 'total_records' => 0, 'data' => []];
    }
    return ['data' => $transactions, 'total_records' => $total_records];
}


// Initial data load
$kta_result = fetchKTAApplications($conn, $kta_files_subdir, $pengcab_payment_proofs_subdir, $pengda_payment_proofs_subdir, $generated_kta_pengda_subdir, $generated_kta_pb_subdir, $admin_province_id, $records_per_page, $kta_offset, $kta_search_query); // NEW: Add $generated_kta_pb_subdir
$kta_applications = $kta_result['data'];
$kta_total_records = $kta_result['total_records'];

$activity_log_result = fetchActivityLog($conn, $admin_id, $records_per_page, $log_offset, $log_search_query);
$activity_log_data = $activity_log_result['data'];
$activity_log_total_records = $activity_log_result['total_records'];

// NEW: Fetch cities for the filter dropdown based on the admin's province
$cities_in_province = fetchCitiesInProvince($conn, $admin_province_id);

// NEW: Initial data load for members (with kta_status_filter)
$members_result = fetchPengdaMembers($conn, $admin_province_id, $records_per_page, $members_offset, $members_search_query, $members_role_filter, $members_city_filter, $members_kta_status_filter);
$pengda_members_data = $members_result['data'];
$pengda_members_total_records = $members_result['total_records'];

// NEW: Initial data load for balance summary and transactions
$total_balance_pengda = fetchBalanceSummary($conn, $admin_id); // Pass admin_id instead of admin_province_id
$incoming_transactions_result = fetchIncomingBalanceTransactions($conn, $pb_to_pengda_payment_proofs_subdir, $admin_id, $records_per_page, $balance_offset, $balance_search_query); // Pass admin_id and correct subdir
$incoming_transactions_data = $incoming_transactions_result['data'];
$incoming_transactions_total_records = $incoming_transactions_result['total_records'];


// Handle AJAX table requests
if (isset($_GET['fetch_table_only']) && $_GET['fetch_table_only'] == 'true') {
    ob_clean(); // Clear output buffer before sending HTML
    header('Content-Type: text/html');
    
    // Check KTA config completeness for enabling/disabling approve button
    // HAPUS: Pemeriksaan $kta_cost !== null
    $is_kta_config_ready = isKTAConfigComplete($conn, $admin_id) && !empty($admin_bank_account_number);

    if (isset($kta_result['error'])) {
        echo '<div class="alert alert-danger animated fadeIn"><i class="fas fa-exclamation-circle"></i> ' . $kta_result['error'] . '</div>';
    } else {
        ?>
        <div class="search-pagination-container">
            <input type="text" id="kta-search-input" class="form-control search-input" placeholder="Cari pengajuan KTA..." value="<?php echo htmlspecialchars(trim($kta_search_query, '%')); ?>">
            <?php echo renderPagination($kta_total_records, $records_per_page, $kta_current_page, 'kta', 'kta_search', $kta_search_query); ?>
        </div>
        <?php if (empty($kta_applications)): ?>
            <p class="text-center text-muted no-data-message animated fadeIn">Tidak ada pengajuan KTA yang menunggu verifikasi Anda di provinsi **<?php echo htmlspecialchars($admin_province_name); ?>**.</p>
        <?php else: ?>
            <?php if (!$is_kta_config_ready): ?>
                <div class="alert alert-danger animated fadeIn" role="alert">
                    <i class="fas fa-exclamation-triangle"></i> **Peringatan**: Konfigurasi KTA Otomatis (Nama Ketua Umum, Tanda Tangan, dan Nomor Rekening) Anda belum lengkap. Anda tidak dapat **Menyetujui** pengajuan KTA sebelum melengkapi konfigurasi tersebut di bagian "Konfigurasi KTA Otomatis".
                </div>
            <?php endif; ?>
            <div class="table-responsive animated fadeIn">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Club</th>
                            <th>PJ</th>
                            <th>Email</th>
                            <th>Telepon</th>
                            <th>Provinsi</th>
                            <th>Kabupaten</th>
                            <th>Alamat</th>
                            <th>Logo</th>
                            <th>AD</th>
                            <th>ART</th>
                            <th>SK</th>
                            <th>Bayar User</th>
                            
                            <th>KTA PB</th> <th>Status</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php
                        $animation_delay = 0;
                        foreach ($kta_applications as $app):
                            $animation_delay += 0.05; // Increment delay for staggered animation
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
                                
                                
                                <td data-label="KTA PB"> <?php echo $app['generated_kta_file_path_pb_display'] ? '<a href="' . htmlspecialchars($app['generated_kta_file_path_pb_display']) . '" target="_blank" class="file-link"><i class="fas fa-id-card"></i> Lihat KTA</a>' : '<span class="text-muted">Belum Dibuat</span>'; ?>
                                </td>
                                
                                <td data-label="Status"><span class="status-badge status-<?php echo strtolower($app['status']); ?>"><?php echo htmlspecialchars(ucfirst(str_replace('_', ' ', $app['status']))); ?></span></td>
                                <td data-label="Aksi" class="actions">
                                    <?php if ($app['status'] == 'approved_pengcab'): ?>
                                        <button class="btn btn-approve" onclick="openStatusModal(<?php echo $app['id']; ?>, 'approved_pengda')" <?php echo $is_kta_config_ready ? '' : 'disabled title="Lengkapi Konfigurasi KTA Otomatis dahulu."'; ?>><i class="fas fa-check"></i> Setujui</button>
                                        <button class="btn btn-reject" onclick="openStatusModal(<?php echo $app['id']; ?>, 'rejected')"><i class="fas fa-times"></i> Tolak</button>
                                    <?php elseif ($app['status'] == 'rejected_pb'): // If rejected by PB ?>
                                        <button class="btn btn-info" onclick="openStatusModal(<?php echo $app['id']; ?>, 'pending_pengda_resubmit', '<?php echo htmlspecialchars($app['notes_pb'] ?? ''); ?>')" <?php echo $is_kta_config_ready ? '' : 'disabled title="Lengkapi Konfigurasi KTA Otomatis dahulu."'; ?>><i class="fas fa-redo"></i> Ajukan Kembali (Disetujui)</button>
                                        <button class="btn btn-reject" onclick="openStatusModal(<?php echo $app['id']; ?>, 'rejected', '<?php echo htmlspecialchars($app['notes_pb'] ?? ''); ?>')"><i class="fas fa-times"></i>Kembalikan Ke Pengcab</button>
                                    <?php elseif ($app['status'] == 'rejected_pengda'): // If already rejected by Pengda ?>
                                        <span class="text-muted">Telah Ditolak Pengda</span>
                                        <button class="btn btn-info" onclick="openStatusModal(<?php echo $app['id']; ?>, 'approved_pengda', '<?php echo htmlspecialchars($app['notes_pengda'] ?? ''); ?>')" <?php echo $is_kta_config_ready ? '' : 'disabled title="Lengkapi Konfigurasi KTA Otomatis dahulu."'; ?>>Ubah Menjadi Disetujui</button>
                                    <?php elseif ($app['status'] == 'pending_pengda_resubmit'): ?>
                                        <span class="text-muted">Menunggu Verifikasi PB</span>
                                        <?php elseif ($app['status'] == 'approved_pb' && $app['generated_kta_file_path_pb_display']): ?> <a href="<?php echo htmlspecialchars($app['generated_kta_file_path_pb_display']); ?>" target="_blank" class="btn btn-success"><i class="fas fa-download"></i> Unduh KTA PB</a>
                                    <?php else: ?>
                                        <span class="text-muted">Tidak ada aksi</span>
                                    <?php endif; ?>
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

if (isset($_GET['fetch_activity_log_only']) && $_GET['fetch_activity_log_only'] == 'true') {
    ob_clean(); // Clear output buffer before sending HTML
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
                            <th>Tipe</th>
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
                                <td data-label="Status Lama"><?php echo htmlspecialchars($log['old_status'] ? ucfirst(str_replace('_', ' ', (string)$log['old_status'])) : 'N/A'); ?></td>
                                <td data-label="Status Baru"><span class="status-badge status-<?php echo strtolower((string)$log['new_status']); ?>"><?php echo htmlspecialchars($log['new_status'] ? ucfirst(str_replace('_', ' ', (string)$log['new_status'])) : 'N/A'); ?></span></td>
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

// NEW: Handle AJAX table request for members
if (isset($_GET['fetch_members_only']) && $_GET['fetch_members_only'] == 'true') {
    ob_clean(); // Clear output buffer before sending HTML
    header('Content-Type: text/html');

    $filter_role = isset($_GET['members_role_filter']) ? (int)$_GET['members_role_filter'] : 0;
    $filter_city = isset($_GET['members_city_filter']) ? (int)$_GET['members_city_filter'] : 0;
    $kta_status_filter = $_GET['members_kta_status_filter'] ?? 'all'; // Get new KTA status filter

    // Re-fetch members data based on AJAX parameters
    $members_result = fetchPengdaMembers($conn, $admin_province_id, $records_per_page, $members_offset, $members_search_query, $filter_role, $filter_city, $kta_status_filter);
    $pengda_members_data = $members_result['data'];
    $pengda_members_total_records = $members_result['total_records'];

    if (isset($members_result['error'])) {
        echo '<div class="alert alert-danger animated fadeIn"><i class="fas fa-exclamation-circle"></i> ' . $members_result['error'] . '</div>';
    } else {
        ?>
        <div class="search-pagination-container">
            <div class="filter-controls">
                <input type="text" id="members-search-input" class="form-control search-input" placeholder="Cari anggota..." value="<?php echo htmlspecialchars(trim($members_search_query, '%')); ?>">
                <select id="members-role-filter" class="form-control filter-select">
                    <option value="0">Semua Peran</option>
                    <option value="2" <?php echo $filter_role == 2 ? 'selected' : ''; ?>>Admin Pengcab</option>
                    <option value="1" <?php echo $filter_role == 1 ? 'selected' : ''; ?>>Anggota Biasa</option>
                </select>
                <select id="members-city-filter" class="form-control filter-select">
                    <option value="0">Semua Kabupaten/Kota</option>
                    <?php
                    // Re-fetch cities here to ensure they are available for AJAX response
                    $cities_for_filter = fetchCitiesInProvince($conn, $admin_province_id);
                    foreach ($cities_for_filter as $city): ?>
                        <option value="<?php echo htmlspecialchars($city['id']); ?>" <?php echo $filter_city == $city['id'] ? 'selected' : ''; ?>>
                            <?php echo htmlspecialchars($city['name']); ?>
                        </option>
                    <?php endforeach; ?>
                </select>
                <select id="members-kta-status-filter" class="form-control filter-select">
                    <option value="all" <?php echo ($kta_status_filter == 'all') ? 'selected' : ''; ?>>Semua Status KTA</option>
                    <option value="kta_issued" <?php echo ($kta_status_filter == 'kta_issued') ? 'selected' : ''; ?>>KTA Diterbitkan PB</option>
                    <option value="not_issued" <?php echo ($kta_status_filter == 'not_issued') ? 'selected' : ''; ?>>KTA Belum Diterbitkan PB</option>
                    <option value="not_applied" <?php echo ($kta_status_filter == 'not_applied') ? 'selected' : ''; ?>>Belum Mengajukan KTA</option>
                    <option value="pending" <?php echo ($kta_status_filter == 'pending') ? 'selected' : ''; ?>>Menunggu Verifikasi Pengcab</option>
                    <option value="approved_pengcab" <?php echo ($kta_status_filter == 'approved_pengcab') ? 'selected' : ''; ?>>Disetujui Pengcab</option>
                    <option value="approved_pengda" <?php echo ($kta_status_filter == 'approved_pengda') ? 'selected' : ''; ?>>Disetujui Pengda</option>
                    <option value="approved_pb" <?php echo ($kta_status_filter == 'approved_pb') ? 'selected' : ''; ?>>Disetujui PB</option>
                    <option value="rejected_pengcab" <?php echo ($kta_status_filter == 'rejected_pengcab') ? 'selected' : ''; ?>>Ditolak Pengcab</option>
                    <option value="rejected_pengda" <?php echo ($kta_status_filter == 'rejected_pengda') ? 'selected' : ''; ?>>Ditolak Pengda</option>
                    <option value="rejected_pb" <?php echo ($kta_status_filter == 'rejected_pb') ? 'selected' : ''; ?>>Ditolak PB</option>
                    <option value="pending_pengda_resubmit" <?php echo ($kta_status_filter == 'pending_pengda_resubmit') ? 'selected' : ''; ?>>Menunggu Verifikasi PB (Diajukan Kembali)</option>
                </select>
            </div>
            <div class="export-button-container">
                <a href="export_members_to_excel.php" class="btn btn-primary"><i class="fas fa-file-excel"></i> Ekspor ke Excel</a>
            </div>
            <?php
                $additional_params = [
                    'members_role_filter' => $filter_role,
                    'members_city_filter' => $filter_city,
                    'members_kta_status_filter' => $kta_status_filter // Pass new filter param
                ];
                echo renderPagination($pengda_members_total_records, $records_per_page, $members_current_page, 'members', 'members_search', $members_search_query, $additional_params);
            ?>
        </div>
        <?php if (empty($pengda_members_data)): ?>
            <p class="text-center text-muted no-data-message animated fadeIn">Tidak ada anggota (Pengcab atau Pengguna) yang terdaftar di provinsi **<?php echo htmlspecialchars($admin_province_name); ?>** dengan kriteria ini.</p>
        <?php else: ?>
            <div class="table-responsive animated fadeIn">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Username</th>
                            <th>Nama Lengkap</th>
                            <th>Email</th>
                            <th>Telepon</th>
                            <th>Peran</th>
                            <th>Club</th>
                            <th>Provinsi</th>
                            <th>Kabupaten/Kota</th>
                            <th>Status KTA</th>
                            <th>Logo</th>
                            <th>Alamat</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php
                        $animation_delay = 0;
                        foreach ($pengda_members_data as $member):
                            $animation_delay += 0.05;
                        ?>
                            <tr class="animated fadeInUp" style="animation-delay: <?php echo $animation_delay; ?>s;">
                                <td data-label="ID"><?php echo htmlspecialchars($member['id']); ?></td>
                                <td data-label="Username"><?php echo htmlspecialchars($member['username']); ?></td>
                                <td data-label="Nama Lengkap"><?php echo htmlspecialchars($member['full_name']); ?></td>
                                <td data-label="Email"><?php echo htmlspecialchars($member['email']); ?></td>
                                <td data-label="Telepon"><?php echo htmlspecialchars($member['phone']); ?></td>
                                <td data-label="Peran"><span class="status-badge status-<?php echo strtolower(str_replace(' ', '-', (string)$member['role_name'])); ?>"><?php echo htmlspecialchars($member['role_name']); ?></span></td>
                                <td data-label="Club"><?php echo htmlspecialchars($member['club_name'] ?? 'N/A'); ?></td>
                                <td data-label="Provinsi"><?php echo htmlspecialchars($member['province_name']); ?></td>
                                <td data-label="Kabupaten/Kota"><?php echo htmlspecialchars($member['city_name']); ?></td>
                                <td data-label="Status KTA">
                                    <span class="status-badge status-<?php echo strtolower(str_replace(' ', '-', $member['kta_status'])); ?>">
                                        <?php echo htmlspecialchars($member['kta_status']); ?>
                                    </span>
                                </td>
                                <td data-label="Logo">
                                    <?php if (!empty($member['logo_path_display']) && !empty($member['kta_application_id'])): ?>
                                        <div class="file-actions">
                                            <a href="<?php echo htmlspecialchars($member['logo_path_display']); ?>" 
                                               class="btn btn-view" 
                                               target="_blank"
                                               title="Lihat Logo">
                                                Lihat
                                            </a>
                                            <a href="download_logo.php?kta_id=<?php echo $member['kta_application_id']; ?>" 
                                               class="btn btn-download" 
                                               target="_blank"
                                               title="Download Logo">
                                                Download
                                            </a>
                                        </div>
                                    <?php else: ?>
                                        <span class="text-muted">Tidak ada logo</span>
                                    <?php endif; ?>
                                </td>
                                <td data-label="Alamat"><?php echo htmlspecialchars($member['address']); ?></td>
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

// NEW: Handle AJAX table request for balance transactions
if (isset($_GET['fetch_balance_transactions_only']) && $_GET['fetch_balance_transactions_only'] == 'true') {
    ob_clean(); // Clear output buffer before sending HTML
    header('Content-Type: text/html');

    if (isset($incoming_transactions_result['error'])) {
        echo '<div class="alert alert-danger animated fadeIn"><i class="fas fa-exclamation-circle"></i> ' . $incoming_transactions_result['error'] . '</div>';
    } else {
        ?>
        <div class="search-pagination-container">
            <input type="text" id="balance-search-input" class="form-control search-input" placeholder="Cari transaksi..." value="<?php echo htmlspecialchars(trim($balance_search_query, '%')); ?>">
            <?php echo renderPagination($incoming_transactions_total_records, $records_per_page, $balance_current_page, 'balance', 'balance_search', $balance_search_query); ?>
        </div>
        <?php if (empty($incoming_transactions_data)): ?>
            <p class="text-center text-muted no-data-message animated fadeIn">Tidak ada riwayat transaksi saldo masuk dari Pengurus Besar.</p>
        <?php else: ?>
            <div class="table-responsive animated fadeIn">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID Transaksi</th>
                            <th>Tanggal Rekap</th>
                            <th>Jumlah Saldo Masuk</th>
                            <th>Catatan</th>
                            <th>Bukti Transfer dari PB</th>
                            <th>Waktu Pembayaran</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php
                        $animation_delay = 0;
                        foreach ($incoming_transactions_data as $transaction):
                            $animation_delay += 0.05;
                        ?>
                            <tr class="animated fadeInUp" style="animation-delay: <?php echo $animation_delay; ?>s;">
                                <td data-label="ID Transaksi"><?php echo htmlspecialchars($transaction['id']); ?></td>
                                <td data-label="Tanggal Rekap"><?php echo htmlspecialchars($transaction['recap_date']); ?></td>
                                <td data-label="Jumlah Saldo Masuk">Rp <?php echo number_format($transaction['amount'], 2, ',', '.'); ?></td>
                                <td data-label="Catatan"><?php echo htmlspecialchars($transaction['notes'] ?? 'N/A'); ?></td>
                                <td data-label="Bukti Transfer">
                                    <?php echo $transaction['payment_proof_path_display'] ? '<a href="' . htmlspecialchars($transaction['payment_proof_path_display']) . '" target="_blank" class="file-link"><i class="fas fa-file-invoice-dollar"></i> Lihat</a>' : '<span class="text-muted">Tidak Diupload</span>'; ?>
                                </td>
                                <td data-label="Waktu Pembayaran"><?php echo htmlspecialchars($transaction['paid_at']); ?></td>
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
    <link rel="shortcut icon" href="../assets/LOGO-FORBASI.png" type="image/x-icon" />

    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FORBASI - Dashboard Pengurus Daerah</title>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css">
    <link rel="stylesheet" href="../css/pengda.css">
</head>
<body>
    <aside class="sidebar" id="sidebar">
        <div class="logo">
            <img src="../assets/LOGO-FORBASI.png" alt="FORBASI Logo">
            <span>FORBASI Admin</span>
            <?php if ($admin_province_name): ?>    
                <span class="admin-location"><?php echo htmlspecialchars($admin_province_name); ?></span>
            <?php endif; ?>
        </div>
        <?php if (!empty($error_message)): // Display error message about profile if it exists ?>
            <p class="alert alert-warning animated fadeIn" style="margin: 10px 15px; font-size: 0.85em;"><i class="fas fa-exclamation-triangle"></i> <?php echo $error_message; ?></p>
        <?php endif; ?>
        <ul class="menu">
            <li><a href="#kta_applications_section" class="active" data-section="kta_applications_section"><i class="fas fa-file-invoice"></i> <span>Pengajuan KTA</span></a></li>
            <li><a href="#kta_config_section" data-section="kta_config_section"><i class="fas fa-cogs"></i> <span>Konfigurasi KTA Otomatis</span></a></li>
            <li><a href="#kejurnas_section" data-section="kejurnas_section"><i class="fas fa-trophy"></i> <span>Pendaftaran Kompetisi</span></a></li>
            <li><a href="#members_section" data-section="members_section"><i class="fas fa-users"></i> <span>Anggota Pengda</span></a></li>
            <li><a href="#balance_section" data-section="balance_section"><i class="fas fa-wallet"></i> <span>Ringkasan Saldo</span></a></li> <li><a href="#profile_section" data-section="profile_section"><i class="fas fa-user"></i> <span>Profil Saya</span></a></li>
            <li><a href="#change_password_section" data-section="change_password_section"><i class="fas fa-lock"></i> <span>Ubah Password</span></a></li>
            <li><a href="#activity_log_section" data-section="activity_log_section"><i class="fas fa-clipboard-list"></i> <span>Riwayat Aktivitas</span></a></li>
            <li><a href="logout.php"><i class="fas fa-sign-out-alt"></i> <span>Logout</span></a></li>
        </ul>
    </aside>

    <main class="main-content" id="main-content">
        <header class="header">
            <button class="toggle-btn" id="sidebar-toggle" aria-label="Toggle Sidebar"><i class="fas fa-bars"></i></button>

            <div>
                <h1>Selamat Datang, Pengurus Daerah</h1>
                <?php if ($admin_province_name ): ?>
                    <p>Wilayah Anda:  <?php echo htmlspecialchars($admin_province_name); ?></p>
                <?php else: ?>
                    <p class="alert alert-warning animated fadeIn"><i class="fas fa-exclamation-triangle"></i> <?php echo $error_message; ?></p>
                <?php endif; ?>
            </div>
        </header>

        <section class="container animated fadeIn" id="kta_applications_section">
            <h2>Pengajuan KTA</h2>
            <?php
            // Display message for rejected applications from PB
            if (isset($_GET['rejected_kta_id']) && isset($_GET['reject_reason']) && isset($_GET['province_id']) && $_GET['province_id'] == $admin_province_id):
                $rejected_kta_id = htmlspecialchars($_GET['rejected_kta_id']);
                $reject_reason = htmlspecialchars($_GET['reject_reason']);
                ?>
                <div class="alert alert-warning animated fadeInDown" role="alert">
                    <i class="fas fa-info-circle"></i> Pengajuan KTA ID **<?php echo $rejected_kta_id; ?>** telah **DITOLAK** oleh Pengurus Besar.
                    Alasan: **<?php echo $reject_reason; ?>**.
                    Silakan periksa detailnya dan ajukan kembali jika diperlukan.
                </div>
                <?php
                // Clear URL parameters to prevent re-display on refresh
                echo '<script>
                    window.history.replaceState(null, null, window.location.pathname);
                    // Optionally, you might want to immediately scroll to the table or highlight the rejected entry
                    // This is more complex and usually handled by an AJAX refresh that re-sorts/highlights
                    // For now, simply clearing the URL
                </script>';
            endif;
            ?>
            <div id="kta-applications-table-container">
                <?php
                // This section will be replaced by AJAX, so its initial content should match fetch_table_only
                // Check KTA config completeness for initial render as well
                // HAPUS: Pemeriksaan $kta_cost !== null
                $is_kta_config_ready = isKTAConfigComplete($conn, $admin_id) && !empty($admin_bank_account_number);
                ?>
                <?php if (isset($kta_result['error'])): ?>
                    <div class="alert alert-danger animated fadeIn"><i class="fas fa-exclamation-circle"></i> <?php echo $kta_result['error']; ?></div>
                <?php else: ?>
                    <div class="search-pagination-container">
                        <input type="text" id="kta-search-input" class="form-control search-input" placeholder="Cari pengajuan KTA..." value="<?php echo htmlspecialchars(trim($kta_search_query, '%')); ?>">
                        <?php echo renderPagination($kta_total_records, $records_per_page, $kta_current_page, 'kta', 'kta_search', $kta_search_query); ?>
                    </div>
                    <?php if (empty($kta_applications)): ?>
                        <p class="text-center text-muted no-data-message animated fadeIn">Tidak ada pengajuan KTA yang menunggu verifikasi Anda di provinsi **<?php echo htmlspecialchars($admin_province_name); ?>**.</p>
                    <?php else: ?>
                        <?php if (!$is_kta_config_ready): ?>
                            <div class="alert alert-danger animated fadeIn" role="alert">
                                <i class="fas fa-exclamation-triangle"></i> **Peringatan**: Konfigurasi KTA Otomatis (Nama Ketua Umum, Tanda Tangan, dan Nomor Rekening) Anda belum lengkap. Anda tidak dapat **Menyetujui** pengajuan KTA sebelum melengkapi konfigurasi tersebut di bagian "Konfigurasi KTA Otomatis".
                            </div>
                        <?php endif; ?>
                        <div class="table-responsive animated fadeIn">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Club</th>
                                        <th>PJ</th>
                                        <th>Email</th>
                                        <th>Telepon</th>
                                        <th>Provinsi</th>
                                        <th>Kabupaten</th>
                                        <th>Alamat</th>
                                        <th>Logo</th>
                                        <th>AD</th>
                                        <th>ART</th>
                                        <th>SK</th>
                                        <th>Bayar User</th>
                                        
                                        <th>KTA PB</th> <th>Status</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php
                                    $animation_delay = 0;
                                    foreach ($kta_applications as $app):
                                        $animation_delay += 0.05; // Increment delay for staggered animation
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
                                            <td data-label="Bayar User">
                                                <?php echo $app['payment_proof_path_display'] ? '<a href="' . htmlspecialchars($app['payment_proof_path_display']) . '" target="_blank" class="file-link"><i class="fas fa-receipt"></i> Lihat</a>' : '<span class="text-muted">Tidak Diupload</span>'; ?>
                                            </td>
                                            
                                            
                                            <td data-label="KTA PB"> <?php echo $app['generated_kta_file_path_pb_display'] ? '<a href="' . htmlspecialchars($app['generated_kta_file_path_pb_display']) . '" target="_blank" class="file-link"><i class="fas fa-id-card"></i> Lihat KTA</a>' : '<span class="text-muted">Belum Dibuat</span>'; ?>
                                            </td>
                                            
                                            <td data-label="Status"><span class="status-badge status-<?php echo strtolower($app['status']); ?>"><?php echo htmlspecialchars(ucfirst(str_replace('_', ' ', $app['status']))); ?></span></td>
                                            <td data-label="Aksi" class="actions">
                                                <?php if ($app['status'] == 'approved_pengcab'): ?>
                                                    <button class="btn btn-approve" onclick="openStatusModal(<?php echo $app['id']; ?>, 'approved_pengda')" <?php echo $is_kta_config_ready ? '' : 'disabled title="Lengkapi Konfigurasi KTA Otomatis dahulu."'; ?>><i class="fas fa-check"></i> Setujui</button>
                                                    <button class="btn btn-reject" onclick="openStatusModal(<?php echo $app['id']; ?>, 'rejected')"><i class="fas fa-times"></i> Tolak</button>
                                                <?php elseif ($app['status'] == 'rejected_pb'): // If rejected by PB ?>
                                                    <button class="btn btn-info" onclick="openStatusModal(<?php echo $app['id']; ?>, 'pending_pengda_resubmit', '<?php echo htmlspecialchars($app['notes_pb'] ?? ''); ?>')" <?php echo $is_kta_config_ready ? '' : 'disabled title="Lengkapi Konfigurasi KTA Otomatis dahulu."'; ?>><i class="fas fa-redo"></i> Ajukan Kembali (Disetujui)</button>
                                                    <button class="btn btn-reject" onclick="openStatusModal(<?php echo $app['id']; ?>, 'rejected', '<?php echo htmlspecialchars($app['notes_pb'] ?? ''); ?>')"><i class="fas fa-times"></i>Kembalikan Ke Pengcab</button>
                                                <?php elseif ($app['status'] == 'rejected_pengda'): // If already rejected by Pengda ?>
                                                    <span class="text-muted">Telah Ditolak Pengda</span>
                                                    <button class="btn btn-info" onclick="openStatusModal(<?php echo $app['id']; ?>, 'approved_pengda', '<?php echo htmlspecialchars($app['notes_pengda'] ?? ''); ?>')" <?php echo $is_kta_config_ready ? '' : 'disabled title="Lengkapi Konfigurasi KTA Otomatis dahulu."'; ?>>Ubah Menjadi Disetujui</button>
                                                <?php elseif ($app['status'] == 'pending_pengda_resubmit'): ?>
                                                    <span class="text-muted">Menunggu Verifikasi PB</span>
                                                    <?php elseif ($app['status'] == 'approved_pb' && $app['generated_kta_file_path_pb_display']): ?> <a href="<?php echo htmlspecialchars($app['generated_kta_file_path_pb_display']); ?>" target="_blank" class="btn btn-success"><i class="fas fa-download"></i> Unduh KTA PB</a>
                                                <?php else: ?>
                                                    <span class="text-muted">Tidak ada aksi</span>
                                                <?php endif; ?>
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
            <h2>Konfigurasi KTA Otomatis Pengurus Daerah</h2>
            <form id="ktaConfigForm" enctype="multipart/form-data">
                <input type="hidden" name="save_kta_config_ajax" value="1">
                <div class="alert alert-info" role="alert">
                    <i class="fas fa-info-circle"></i> Harap isi informasi di bawah untuk mengotomatiskan pembuatan KTA. Nama Ketua Umum, tanda tangan, akan ditempelkan pada KTA yang diajukan ke Pengurus Besar. Nomor Rekening juga harus diisi karena akan digunakan untuk keperluan transaksi.
                </div>

                <div class="form-group">
                    <label for="ketua_umum_name">Nama Ketua Umum Pengurus Daerah:</label>
                    <input type="text" id="ketua_umum_name" name="ketua_umum_name" class="form-control" value="<?php echo $ketua_umum_name; ?>" placeholder="Masukkan Nama Ketua Umum Pengurus Daerah" required>
                </div>

                <div class="form-group">
                    <label>Tanda Tangan Ketua Umum Pengurus Daerah:</label>
                    <div style="border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden;">
                        <canvas id="signatureCanvas" width="400" height="150" will-read-frequently="true" style="background-color: #fcfcfc; display: block;"></canvas>
                    </div>
                    <div class="signature-buttons">
                        <button type="button" class="btn btn-danger" id="clearSignatureBtn"><i class="fas fa-eraser"></i> Bersihkan Tanda Tangan</button>
                        <button type="button" class="btn btn-info" id="saveSignatureBtn"><i class="fas fa-save"></i> Simpan Tanda Tangan ke Canvas</button>
                    </div>
                    <input type="hidden" id="signature_data_url" name="signature_data_url">
                    <p class="text-muted" style="margin-top: 10px; <?php echo empty($signature_image_path) ? 'display:none;' : ''; ?>" id="currentSignatureLabel">Tanda tangan yang tersimpan saat ini:</p>
                    <img id="currentSignaturePreview"
                        src="<?php echo $signature_image_path ? BASE_URL . $pengda_kta_configs_subdir . $signature_image_path : ''; ?>"
                        alt="Tanda Tangan Saat Ini"
                        style="max-width: 200px; max-height: 80px; border: 1px solid #ddd; border-radius: 5px; background-color: #f0f0f0; padding: 5px; margin-top: 5px; <?php echo empty($signature_image_path) ? 'display:none;' : ''; ?>">
                </div>

                <div class="form-group">
                
                    <div class="form-group">
                    <label for="account_number">Nomor Rekening Pengda:</label>
                    <input type="text" id="account_number" name="account_number" class="form-control" value="<?php echo htmlspecialchars($admin_bank_account_number ?? ''); ?>" placeholder="Cth: 1234567890 Bank ABC a.n. Pengda X" required>
                    <small class="form-text text-muted">Nomor rekening ini akan terlihat oleh PB.</small>
                </div>
                </div>

                <button type="submit" class="btn btn-approve"><i class="fas fa-check-circle"></i> Simpan Konfigurasi</button>
            </form>
        </section>

        <section class="container animated fadeIn" id="profile_section" style="display:none;">
            <h2>Profil Pengurus Daerah</h2>
            <?php if (!empty($admin_profile_data)): ?>
                <div class="profile-details">
                    <div class="detail-item">
                        <strong>Username:</strong> <span><?php echo htmlspecialchars($admin_profile_data['username']); ?></span>
                    </div>
                    <div class="detail-item">
                        <strong>Nama Lengkap:</strong> <span><?php echo htmlspecialchars($admin_profile_data['full_name'] ?? 'N/A'); ?></span>
                    </div>
                    <div class="detail-item">
                        <strong>Email:</strong> <span><?php echo htmlspecialchars($admin_profile_data['email']); ?></span>
                    </div>
                    <div class="detail-item">
                        <strong>Telepon:</strong> <span><?php echo htmlspecialchars($admin_profile_data['phone'] ?? 'N/A'); ?></span>
                    </div>
                    <div class="detail-item">
                        <strong>Provinsi:</strong> <span><?php echo htmlspecialchars($admin_profile_data['province_name'] ?? 'N/A'); ?></span>
                    </div>
                    <div class="detail-item">
                        <strong>Kabupaten/Kota:</strong> <span><?php echo htmlspecialchars($admin_profile_data['city_name'] ?? 'N/A'); ?></span>
                    </div>
                    <div class="detail-item">
                        <strong>Alamat:</strong> <span><?php echo htmlspecialchars($admin_profile_data['address'] ?? 'N/A'); ?></span>
                    </div>
                    <div class="detail-item">
                        <strong>Nomor Rekening:</strong> <span><?php echo htmlspecialchars($admin_profile_data['bank_account_number'] ?? 'N/A'); ?></span>
                    </div>
                </div>
                <div class="alert alert-info mt-4" role="alert">
                    <i class="fas fa-info-circle"></i> Perubahan informasi profil (selain password dan nomor rekening) hanya dapat dilakukan oleh **Admin Pusat**. Nomor rekening dapat diubah di bagian "Konfigurasi KTA Otomatis".
                </div>
            <?php else: ?>
                <p class="text-center text-muted no-data-message animated fadeIn">Data profil tidak ditemukan.</p>
            <?php endif; ?>
        </section>

        <section class="container animated fadeIn" id="change_password_section" style="display:none;">
            <h2>Ubah Password</h2>
            <form id="changePasswordForm">
                <div class="form-group">
                    <label for="old_password">Password Lama:</label>
                    <input type="password" id="old_password" name="old_password" class="form-control" required autocomplete="current-password">
                </div>
                <div class="form-group">
                    <label for="new_password">Password Baru:</label>
                    <input type="password" id="new_password" name="new_password" class="form-control" required autocomplete="new-password">
                    <small class="form-text text-muted">Minimal 6 karakter.</small>
                </div>
                <div class="form-group">
                    <label for="confirm_new_password">Konfirmasi Password Baru:</label>
                    <input type="password" id="confirm_new_password" name="confirm_new_password" class="form-control" required autocomplete="new-password">
                </div>
                <button type="submit" class="btn btn-approve"><i class="fas fa-lock"></i> Ubah Password</button>
            </form>
        </section>

        <section class="container animated fadeIn" id="members_section" style="display:none;">
            <h2>Anggota Pengda (Pengcab & Pengguna)</h2>
            <div class="export-button-container">
                <a href="export_members_to_excel.php" class="btn btn-primary"><i class="fas fa-file-excel"></i> Ekspor ke Excel</a>
            </div>
            <div id="members-table-container">
                <?php if (isset($members_result['error'])): ?>
                    <div class="alert alert-danger animated fadeIn"><i class="fas fa-exclamation-circle"></i> ' . $members_result['error'] . '</div>';
                <?php else: ?>
                    <div class="search-pagination-container">
                        <div class="filter-controls">
                            <input type="text" id="members-search-input" class="form-control search-input" placeholder="Cari anggota..." value="<?php echo htmlspecialchars(trim($members_search_query, '%')); ?>">
                            <select id="members-role-filter" class="form-control filter-select">
                                <option value="0">Semua Peran</option>
                                <option value="2" <?php echo $filter_role == 2 ? 'selected' : ''; ?>>Admin Pengcab</option>
                                <option value="1" <?php echo $filter_role == 1 ? 'selected' : ''; ?>>Anggota Biasa</option>
                            </select>
                            <select id="members-city-filter" class="form-control filter-select">
                                <option value="0">Semua Kabupaten/Kota</option>
                                <?php
                                // Re-fetch cities here to ensure they are available for AJAX response
                                $cities_for_filter = fetchCitiesInProvince($conn, $admin_province_id);
                                foreach ($cities_for_filter as $city): ?>
                                    <option value="<?php echo htmlspecialchars($city['id']); ?>" <?php echo $filter_city == $city['id'] ? 'selected' : ''; ?>>
                                        <?php echo htmlspecialchars($city['name']); ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                            <select id="members-kta-status-filter" class="form-control filter-select">
                                <option value="all" <?php echo ($kta_status_filter == 'all') ? 'selected' : ''; ?>>Semua Status KTA</option>
                                <option value="kta_issued" <?php echo ($kta_status_filter == 'kta_issued') ? 'selected' : ''; ?>>KTA Diterbitkan PB</option>
                                <option value="not_issued" <?php echo ($kta_status_filter == 'not_issued') ? 'selected' : ''; ?>>KTA Belum Diterbitkan PB</option>
                                <option value="not_applied" <?php echo ($kta_status_filter == 'not_applied') ? 'selected' : ''; ?>>Belum Mengajukan KTA</option>
                                <option value="pending" <?php echo ($kta_status_filter == 'pending') ? 'selected' : ''; ?>>Menunggu Verifikasi Pengcab</option>
                                <option value="approved_pengcab" <?php echo ($kta_status_filter == 'approved_pengcab') ? 'selected' : ''; ?>>Disetujui Pengcab</option>
                                <option value="approved_pengda" <?php echo ($kta_status_filter == 'approved_pengda') ? 'selected' : ''; ?>>Disetujui Pengda</option>
                                <option value="approved_pb" <?php echo ($kta_status_filter == 'approved_pb') ? 'selected' : ''; ?>>Disetujui PB</option>
                                <option value="rejected_pengcab" <?php echo ($kta_status_filter == 'rejected_pengcab') ? 'selected' : ''; ?>>Ditolak Pengcab</option>
                                <option value="rejected_pengda" <?php echo ($kta_status_filter == 'rejected_pengda') ? 'selected' : ''; ?>>Ditolak Pengda</option>
                                <option value="rejected_pb" <?php echo ($kta_status_filter == 'rejected_pb') ? 'selected' : ''; ?>>Ditolak PB</option>
                                <option value="pending_pengda_resubmit" <?php echo ($kta_status_filter == 'pending_pengda_resubmit') ? 'selected' : ''; ?>>Menunggu Verifikasi PB (Diajukan Kembali)</option>
                            </select>
                        </div>
                        <?php
                            $additional_params = [
                                'members_role_filter' => $filter_role,
                                'members_city_filter' => $filter_city,
                                'members_kta_status_filter' => $kta_status_filter // Pass new filter param
                            ];
                            echo renderPagination($pengda_members_total_records, $records_per_page, $members_current_page, 'members', 'members_search', $members_search_query, $additional_params);
                        ?>
                    </div>
                    <?php if (empty($pengda_members_data)): ?>
                        <p class="text-center text-muted no-data-message animated fadeIn">Tidak ada anggota (Pengcab atau Pengguna) yang terdaftar di provinsi **<?php echo htmlspecialchars($admin_province_name); ?>** dengan kriteria ini.</p>
                    <?php else: ?>
                        <div class="table-responsive animated fadeIn">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Username</th>
                                        <th>Nama Lengkap</th>
                                        <th>Email</th>
                                        <th>Telepon</th>
                                        <th>Peran</th>
                                        <th>Club</th>
                                        <th>Provinsi</th>
                                        <th>Kabupaten/Kota</th>
                                        <th>Status KTA</th>
                                        <th>Logo</th>
                                        <th>Alamat</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php
                                    $animation_delay = 0;
                                    foreach ($pengda_members_data as $member):
                                        $animation_delay += 0.05;
                                    ?>
                                        <tr class="animated fadeInUp" style="animation-delay: <?php echo $animation_delay; ?>s;">
                                            <td data-label="ID"><?php echo htmlspecialchars($member['id']); ?></td>
                                            <td data-label="Username"><?php echo htmlspecialchars($member['username']); ?></td>
                                            <td data-label="Nama Lengkap"><?php echo htmlspecialchars($member['full_name']); ?></td>
                                            <td data-label="Email"><?php echo htmlspecialchars($member['email']); ?></td>
                                            <td data-label="Telepon"><?php echo htmlspecialchars($member['phone']); ?></td>
                                            <td data-label="Peran"><span class="status-badge status-<?php echo strtolower(str_replace(' ', '-', (string)$member['role_name'])); ?>"><?php echo htmlspecialchars($member['role_name']); ?></span></td>
                                            <td data-label="Club"><?php echo htmlspecialchars($member['club_name'] ?? 'N/A'); ?></td>
                                            <td data-label="Provinsi"><?php echo htmlspecialchars($member['province_name']); ?></td>
                                            <td data-label="Kabupaten/Kota"><?php echo htmlspecialchars($member['city_name']); ?></td>
                                            <td data-label="Status KTA">
                                                <span class="status-badge status-<?php echo strtolower(str_replace(' ', '-', $member['kta_status'])); ?>">
                                                    <?php echo htmlspecialchars($member['kta_status']); ?>
                                                </span>
                                            </td>
                                            <td data-label="Logo">
                                                <?php if (!empty($member['logo_path_display']) && !empty($member['kta_application_id'])): ?>
                                                    <div class="file-actions">
                                                        <a href="<?php echo htmlspecialchars($member['logo_path_display']); ?>" 
                                                           class="btn btn-view" 
                                                           target="_blank"
                                                           title="Lihat Logo">
                                                            Lihat
                                                        </a>
                                                        <a href="download_logo.php?kta_id=<?php echo $member['kta_application_id']; ?>" 
                                                           class="btn btn-download" 
                                                           target="_blank"
                                                           title="Download Logo">
                                                            Download
                                                        </a>
                                                    </div>
                                                <?php else: ?>
                                                    <span class="text-muted">Tidak ada logo</span>
                                                <?php endif; ?>
                                            </td>
                                            <td data-label="Alamat"><?php echo htmlspecialchars($member['address']); ?></td>
                                        </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        </div>
                    <?php endif; ?>
                <?php endif; ?>
            </div>
        </section>

        <section class="container animated fadeIn" id="balance_section" style="display:none;">
            <h2>Ringkasan Saldo dan Riwayat Transaksi Masuk dari PB</h2>

            <div class="balance-summary-card">
                <h3>Total Saldo Masuk dari Pengurus Besar:</h3>
                <p class="total-balance">Rp <?php echo number_format($total_balance_pengda, 2, ',', '.'); ?></p>
                <p class="text-muted">Ini adalah akumulasi dana yang ditransfer oleh Pengurus Besar kepada Pengurus Daerah.</p>
            </div>

            <h3>Riwayat Transaksi Saldo Masuk</h3>
            <div id="balance-transactions-table-container">
                <?php if (isset($incoming_transactions_result['error'])): ?>
                    <div class="alert alert-danger animated fadeIn"><i class="fas fa-exclamation-circle"></i> <?php echo $incoming_transactions_result['error']; ?></div>
                <?php else: ?>
                    <div class="search-pagination-container">
                        <input type="text" id="balance-search-input" class="form-control search-input" placeholder="Cari transaksi..." value="<?php echo htmlspecialchars(trim($balance_search_query, '%')); ?>">
                        <?php echo renderPagination($incoming_transactions_total_records, $records_per_page, $balance_current_page, 'balance', 'balance_search', $balance_search_query); ?>
                    </div>
                    <?php if (empty($incoming_transactions_data)): ?>
                        <p class="text-center text-muted no-data-message animated fadeIn">Tidak ada riwayat transaksi saldo masuk dari Pengurus Besar.</p>
                    <?php else: ?>
                        <div class="table-responsive animated fadeIn">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>ID Transaksi</th>
                                        <th>Tanggal Rekap</th>
                                        <th>Jumlah Saldo Masuk</th>
                                        <th>Catatan</th>
                                        <th>Bukti Transfer dari PB</th>
                                        <th>Waktu Pembayaran</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php
                                    $animation_delay = 0;
                                    foreach ($incoming_transactions_data as $transaction):
                                        $animation_delay += 0.05;
                                    ?>
                                        <tr class="animated fadeInUp" style="animation-delay: <?php echo $animation_delay; ?>s;">
                                            <td data-label="ID Transaksi"><?php echo htmlspecialchars($transaction['id']); ?></td>
                                            <td data-label="Tanggal Rekap"><?php echo htmlspecialchars($transaction['recap_date']); ?></td>
                                            <td data-label="Jumlah Saldo Masuk">Rp <?php echo number_format($transaction['amount'], 2, ',', '.'); ?></td>
                                            <td data-label="Catatan"><?php echo htmlspecialchars($transaction['notes'] ?? 'N/A'); ?></td>
                                            <td data-label="Bukti Transfer">
                                                <?php echo $transaction['payment_proof_path_display'] ? '<a href="' . htmlspecialchars($transaction['payment_proof_path_display']) . '" target="_blank" class="file-link"><i class="fas fa-file-invoice-dollar"></i> Lihat</a>' : '<span class="text-muted">Tidak Diupload</span>'; ?>
                                            </td>
                                            <td data-label="Waktu Pembayaran"><?php echo htmlspecialchars($transaction['paid_at']); ?></td>
                                        </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        </div>
                    <?php endif; ?>
                <?php endif; ?>
            </div>
        </section>

        <!-- Kejurnas Section -->
        <section class="container animated fadeIn" id="kejurnas_section" style="display:none;">
            <h2><i class="fas fa-trophy"></i> Pendaftaran Kejurnas FORBASI</h2>
            <p class="section-description">Daftarkan club dari wilayah Anda untuk mengikuti Kejurnas (Kejuaraan Nasional) FORBASI</p>
            
            <!-- Quota Information Notes -->
            <?php
            $region_class = $is_jawa_pengda ? 'alert-success' : 'alert-info';
            $region_icon = $is_jawa_pengda ? 'fa-island-tropical' : 'fa-globe-asia';
            $region_name = $is_jawa_pengda ? 'Pulau Jawa' : 'Luar Pulau Jawa';
            ?>
            <div class="alert <?php echo $region_class; ?> animated fadeIn kejurnas-quota-info" style="margin-bottom: 20px; border-left: 4px solid <?php echo $is_jawa_pengda ? '#4caf50' : '#2196f3'; ?>; padding: 15px; overflow: hidden;">
                <!-- Header Section -->
                <div style="margin-bottom: 15px;">
                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        <i class="fas <?php echo $region_icon; ?>" style="font-size: 1.2em;"></i>
                        <strong style="font-size: 1em;">Wilayah Anda: <?php echo htmlspecialchars($admin_province_name); ?></strong>
                    </div>
                    <div style="margin-top: 8px; padding: 8px 12px; background: rgba(255,255,255,0.25); border-radius: 5px; display: inline-block;">
                        <strong style="font-size: 0.95em;">Kategori: <?php echo $region_name; ?></strong>
                    </div>
                </div>
                
                <!-- Divider -->
                <div style="border-top: 1px solid rgba(255,255,255,0.3); margin: 15px 0;"></div>
                
                <!-- Registration Information - UNLIMITED -->
                <div>
                    <div style="margin-bottom: 10px;">
                        <i class="fas fa-infinity"></i>
                        <strong style="font-size: 1em;">Informasi Pendaftaran (Unlimited):</strong>
                    </div>
                    
                    <div style="margin: 10px 0; font-size: 0.9em;">
                        <p style="margin: 5px 0 10px 0;"><strong>Sebagai Pengda wilayah <?php echo $is_jawa_pengda ? 'Jawa' : 'Luar Jawa'; ?></strong>, Anda dapat mengirimkan club tanpa batasan!</p>
                        
                        <!-- Unlimited Badge -->
                        <div style="padding: 15px; background: rgba(255,255,255,0.3); border-radius: 8px; text-align: center; margin: 15px 0;">
                            <div style="font-size: 2.5em; margin-bottom: 8px;">🎉</div>
                            <div style="font-size: 1.3em; font-weight: bold; color: #fff; text-shadow: 0 2px 4px rgba(0,0,0,0.3); margin-bottom: 5px;">
                                ♾️ UNLIMITED REGISTRATION
                            </div>
                            <div style="font-size: 0.95em; color: rgba(255,255,255,0.95);">
                                Tidak ada batasan jumlah club yang dapat didaftarkan!
                            </div>
                        </div>
                        
                        <!-- Category Cards - Responsive -->
                        <div style="display: flex; flex-direction: column; gap: 8px; margin: 10px 0;">
                            <div style="padding: 10px 12px; background: rgba(255,255,255,0.2); border-radius: 5px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 5px;">
                                <span><strong>🎖️ Baris Berbaris</strong></span>
                                <span style="background: rgba(76,175,80,0.4); padding: 3px 12px; border-radius: 3px; font-weight: bold; color: #fff;">∞ Unlimited</span>
                            </div>
                            <div style="padding: 10px 12px; background: rgba(255,255,255,0.2); border-radius: 5px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 5px;">
                                <span><strong>🎯 Rukibra</strong></span>
                                <span style="background: rgba(76,175,80,0.4); padding: 3px 12px; border-radius: 3px; font-weight: bold; color: #fff;">∞ Unlimited</span>
                            </div>
                            <div style="padding: 10px 12px; background: rgba(255,255,255,0.2); border-radius: 5px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 5px;">
                                <span><strong>🎵 Varfor Musik</strong></span>
                                <span style="background: rgba(76,175,80,0.4); padding: 3px 12px; border-radius: 3px; font-weight: bold; color: #fff;">∞ Unlimited</span>
                            </div>
                        </div>
                        
                        <!-- Important Note -->
                        <div style="margin-top: 12px; padding: 10px 12px; background: rgba(255,255,255,0.25); border-radius: 5px; font-size: 0.85em; line-height: 1.5;">
                            <strong>ℹ️ Catatan Penting:</strong><br>
                            • Tidak ada batasan jumlah pendaftaran per kategori<br>
                            • Satu club dapat didaftarkan ke beberapa kategori sekaligus<br>
                            • Setiap club hanya bisa didaftar satu kali per kategori
                        </div>
                    </div>
                </div>
            </div>
            
            <style>
            @media (max-width: 768px) {
                .kejurnas-quota-info {
                    padding: 12px !important;
                    font-size: 14px;
                }
                .kejurnas-quota-info strong {
                    font-size: 0.95em !important;
                }
            }
            @media (max-width: 480px) {
                .kejurnas-quota-info {
                    padding: 10px !important;
                    font-size: 13px;
                }
            }
            </style>
            
            <!-- Registration Form -->
            <div class="card animated fadeInUp" style="margin-bottom: 20px;">
                <h3><i class="fas fa-plus-circle"></i> Daftar Peserta Baru</h3>
                <form id="kejurnas-form" class="form-grid">
                    <input type="hidden" id="kejurnas-event-id" name="event_id" value="1">
                    <input type="hidden" id="selected-kta-id" name="kta_id" value="">
                    
                    <div class="form-group">
                        <label for="kejurnas-category">Kategori Lomba <span class="required">*</span></label>
                        <select id="kejurnas-category" name="category_name" class="form-control" required>
                            <option value="">-- Pilih Kategori --</option>
                            <option value="rukibra">Rukibra</option>
                            <option value="varfor_musik">Varfor Musik</option>
                            <option value="baris_berbaris">Baris Berbaris</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="kejurnas-level">Tingkat <span class="required">*</span></label>
                        <select id="kejurnas-level" name="level" class="form-control" required>
                            <option value="">-- Pilih Tingkat --</option>
                        </select>
                        <small class="form-text text-muted">Pilih kategori terlebih dahulu</small>
                    </div>
                    
                    <div class="form-group" style="grid-column: 1 / -1;">
                        <label for="kejurnas-club-search">Cari Club di Wilayah Anda <span class="required">*</span></label>
                        <div style="position: relative;">
                            <input type="text" id="kejurnas-club-search" class="form-control" placeholder="Ketik nama club..." autocomplete="off" required>
                            <div id="club-search-results" style="display: none; position: absolute; z-index: 1000; background: white; border: 1px solid #ddd; border-radius: 4px; max-height: 300px; overflow-y: auto; width: 100%; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"></div>
                        </div>
                        <small class="form-text text-muted">Pilih club yang sudah memiliki KTA approved</small>
                    </div>
                    
                    <!-- Selected Club Info (will be populated automatically) -->
                    <div id="selected-club-info" style="display: none; grid-column: 1 / -1; margin-top: 10px; padding: 15px; background: #f8f9fa; border-radius: 8px; border: 1px solid #dee2e6;">
                        <h4 style="margin-top: 0; margin-bottom: 15px; color: #28a745;"><i class="fas fa-check-circle"></i> Club Terpilih</h4>
                        <div style="display: grid; grid-template-columns: 120px 1fr; gap: 15px; align-items: start;">
                            <div>
                                <img id="selected-club-logo" src="" alt="Logo Club" style="width: 100px; height: 100px; object-fit: contain; border: 2px solid #dee2e6; border-radius: 8px; padding: 5px; background: white;">
                            </div>
                            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                                <div>
                                    <strong>Nama Club:</strong>
                                    <p id="selected-club-name" style="margin: 5px 0;"></p>
                                </div>
                                <div>
                                    <strong>Alamat:</strong>
                                    <p id="selected-club-address" style="margin: 5px 0;"></p>
                                </div>
                                <div>
                                    <strong>Pelatih:</strong>
                                    <p id="selected-club-coach" style="margin: 5px 0;"></p>
                                </div>
                                <div>
                                    <strong>Manager:</strong>
                                    <p id="selected-club-manager" style="margin: 5px 0;"></p>
                                </div>
                                <div>
                                    <strong>Total Anggota:</strong>
                                    <p id="selected-club-members" style="margin: 5px 0;"></p>
                                </div>
                                <div>
                                    <strong>Kontak:</strong>
                                    <p id="selected-club-phone" style="margin: 5px 0;"></p>
                                </div>
                            </div>
                        </div>
                        <button type="button" id="clear-club-selection" class="btn btn-secondary btn-sm" style="margin-top: 10px;">
                            <i class="fas fa-times"></i> Ganti Club
                        </button>
                    </div>
                    
                    <div class="form-group" style="grid-column: 1 / -1;">
                        <label for="kejurnas-notes">Catatan Tambahan</label>
                        <textarea id="kejurnas-notes" name="notes" class="form-control" rows="3" placeholder="Catatan tambahan (opsional)"></textarea>
                    </div>
                    
                    <div class="form-group" style="grid-column: 1 / -1;">
                        <div id="kejurnas-quota-info" class="alert alert-info" style="display:none;">
                            <i class="fas fa-info-circle"></i> <span id="quota-message"></span>
                        </div>
                    </div>
                    
                    <div class="form-group" style="grid-column: 1 / -1;">
                        <button type="submit" class="btn btn-primary"><i class="fas fa-paper-plane"></i> Daftarkan Peserta</button>
                        <button type="reset" class="btn btn-secondary"><i class="fas fa-redo"></i> Reset Form</button>
                    </div>
                </form>
            </div>
            
            <!-- My Registrations -->
            <div class="card animated fadeInUp">
                <h3><i class="fas fa-list-alt"></i> Pendaftaran Saya</h3>
                <div id="kejurnas-registrations-container">
                    <p class="text-center text-muted">Memuat data pendaftaran...</p>
                </div>
            </div>
        </section>


        <section class="container animated fadeIn" id="activity_log_section" style="display:none;">
            <h2>Riwayat Aktivitas Pengurus Daerah</h2>
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
                                        <th>Tipe</th>
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
                                            <td data-label="Status Lama"><?php echo htmlspecialchars($log['old_status'] ? ucfirst(str_replace('_', ' ', (string)$log['old_status'])) : 'N/A'); ?></td>
                                            <td data-label="Status Baru"><span class="status-badge status-<?php echo strtolower((string)$log['new_status']); ?>"><?php echo htmlspecialchars($log['new_status'] ? ucfirst(str_replace('_', ' ', (string)$log['new_status'])) : 'N/A'); ?></span></td>
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
                <input type="hidden" name="update_kta_status_ajax" value="1">
                <input type="hidden" id="modal-application-id" name="application_id">
                <div class="form-group">
                    <label for="modal-new-status-display">Status Baru:</label>
                    <input type="text" id="modal-new-status-display" class="form-control" readonly>
                    <input type="hidden" id="modal-new-status" name="new_status">
                </div>
                <div class="form-group" id="pengda-payment-proof-group" style="display: none;">
                    <label for="pengda_payment_proof">Upload Bukti Pembayaran ke PB <small>(JPG, JPEG, PNG, PDF)</small>:</label>
                    <input type="file" id="pengda_payment_proof" name="pengda_payment_proof" accept="image/*,.pdf" class="form-control">
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
    <script src="../js/kejurnas.js"></script>
    <script>
        // Move these functions outside of DOMContentLoaded so they are globally accessible
        function openStatusModal(appId, status_action, initialNotes = '') { // Added initialNotes parameter
            // Pindahkan deklarasi elemen modal ke dalam fungsi ini
            // Ini memastikan elemen selalu ditemukan setiap kali modal dibuka,
            // meskipun DOM mungkin berubah karena update AJAX.
            const statusModal = document.getElementById("statusModal");
            const modalApplicationId = document.getElementById("modal-application-id");
            const modalNewStatusDisplay = document.getElementById("modal-new-status-display");
            const modalNewStatus = document.getElementById("modal-new-status");
            const modalNotes = document.getElementById("modal-notes");
            const pengdaPaymentProofGroup = document.getElementById("pengda-payment-proof-group");
            const pengdaPaymentProofInput = document.getElementById("pengda_payment_proof");

            // Pastikan semua elemen ditemukan sebelum mencoba mengatur properti 'value'
            if (!statusModal || !modalApplicationId || !modalNewStatusDisplay || !modalNewStatus || !modalNotes || !pengdaPaymentProofGroup || !pengdaPaymentProofInput) {
                console.error("One or more modal elements not found in the DOM.");
                Swal.fire({
                    icon: 'error',
                    title: 'Kesalahan Sistem',
                    text: 'Elemen modal tidak ditemukan. Harap segarkan halaman dan coba lagi.',
                    confirmButtonText: 'Tutup'
                });
                return; // Hentikan eksekusi jika elemen tidak ditemukan
            }

            statusModal.classList.add('is-visible'); // Add class to trigger transition
            statusModal.style.display = "flex";
            modalApplicationId.value = appId;
            
            // Handle the new status name based on the intended action
            if (status_action === 'rejected') {
                modalNewStatus.value = 'rejected'; // This will be handled by PHP to become 'rejected_pengda'
                modalNewStatusDisplay.value = 'Tolak (Kembalikan ke Pengcab)';
            } else if (status_action === 'approved_pengda') {
                modalNewStatus.value = 'approved_pengda';
                modalNewStatusDisplay.value = 'Setujui oleh Pengda';
            } else if (status_action === 'pending_pengda_resubmit') {
                modalNewStatus.value = 'pending_pengda_resubmit'; // Keep this status action for front-end logic clarity
                modalNewStatusDisplay.value = 'Ajukan Kembali ke PB (Disetujui)'; // Tampilan di modal
            }
            
            modalNotes.value = initialNotes; // Set initial notes
            pengdaPaymentProofInput.value = ''; // Clear file input value

            // MODIFIKASI: Sembunyikan bagian upload bukti pembayaran ke PB
            pengdaPaymentProofGroup.style.display = 'none';
            pengdaPaymentProofInput.removeAttribute('required');
        }

        function closeModal() {
            const statusModal = document.getElementById("statusModal");
            statusModal.classList.remove('is-visible'); // Remove class to trigger transition
            setTimeout(() => {
                statusModal.style.display = "none";
            }, 300); // Should match CSS transition duration
        }

        // Global variable declarations for elements
        // Variabel-variabel ini hanya akan menyimpan referensi setelah DOMContentLoaded
        // tetapi untuk elemen modal, kita sudah memindahkannya ke dalam openStatusModal
        // sehingga ini aman.
        let ktaTableContainer;
        let activityLogTableContainer;
        let membersTableContainer;
        let balanceTableContainer;
        let sidebar;
        let mainContent;
        let sidebarToggle;

        let ktaSearchInput;
        let logSearchInput;
        let membersSearchInput;
        let membersRoleFilter;
        let membersCityFilter;
        let membersKtaStatusFilter;
        let balanceSearchInput;


        let currentKtaPage = <?php echo $kta_current_page; ?>;
        let currentKtaSearch = '<?php echo htmlspecialchars(trim($kta_search_query, '%')); ?>';
        let currentLogPage = <?php echo $log_current_page; ?>;
        let currentLogSearch = '<?php echo htmlspecialchars(trim($log_search_query, '%')); ?>';
        let currentMembersPage = <?php echo $members_current_page; ?>; // NEW
        let currentMembersSearch = '<?php echo htmlspecialchars(trim($members_search_query, '%')); ?>'; // NEW
        let currentMembersRoleFilter = <?php echo $members_role_filter; ?>; // NEW
        let currentMembersCityFilter = <?php echo $members_city_filter; ?>; // NEW
        let currentMembersKtaStatusFilter = '<?php echo htmlspecialchars($members_kta_status_filter); ?>'; // NEW
        let currentBalancePage = <?php echo $balance_current_page; ?>; // NEW
        let currentBalanceSearch = '<?php echo htmlspecialchars(trim($balance_search_query, '%')); ?>'; // NEW


        // Define loadExistingSignature function globally
        function loadExistingSignature() {
            const signatureCanvas = document.getElementById('signatureCanvas');
            const currentSignaturePreview = document.getElementById('currentSignaturePreview');
            const currentSignatureLabel = document.getElementById('currentSignatureLabel');
            const signatureDataUrlInput = document.getElementById('signature_data_url');

            // Check if canvas and context are available before proceeding
            if (!signatureCanvas) {
                console.warn("Signature canvas not found. Cannot load existing signature.");
                return;
            }
            const ctx = signatureCanvas.getContext('2d');
            if (!ctx) {
                console.warn("Canvas context not available. Cannot load existing signature.");
                return;
            }

            const existingSignaturePath = '<?php echo $signature_image_path ? BASE_URL . $pengda_kta_configs_subdir . $signature_image_path : ''; ?>';

            // Clear old preview image from DOM to prevent stacking on reload
            if (currentSignaturePreview) {
                currentSignaturePreview.src = ''; // Clear src so no old image is shown
                currentSignaturePreview.style.display = 'none';
            }
            if (currentSignatureLabel) {
                currentSignatureLabel.style.display = 'none';
            }
            ctx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height); // Always clear canvas

            if (existingSignaturePath) {
                const img = new Image();
                img.crossOrigin = "Anonymous"; // Crucial for loading images from different origins (even if same domain, some configs might block)
                img.onload = function() {
                    if (signatureCanvas.width > 0 && signatureCanvas.height > 0) {
                        ctx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
                        // Calculate scale to fit image while maintaining aspect ratio
                        const scale = Math.min(signatureCanvas.width / img.width, signatureCanvas.height / img.height);
                        const scaledWidth = img.width * scale;
                        const scaledHeight = img.height * scale;

                        // Calculate offset to center the image
                        const offsetX = (signatureCanvas.width - scaledWidth) / 2;
                        const offsetY = (signatureCanvas.height - scaledHeight) / 2;

                        ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
                        signatureDataUrlInput.value = signatureCanvas.toDataURL('image/png');

                        if(currentSignaturePreview) currentSignaturePreview.src = existingSignaturePath;
                        if(currentSignaturePreview) currentSignaturePreview.style.display = 'block';
                        if(currentSignatureLabel) currentSignatureLabel.style.display = 'block';
                    }
                };
                img.onerror = function() {
                    console.error("Failed to load existing signature image or image is missing from server path.");
                    if(currentSignaturePreview) currentSignaturePreview.style.display = 'none';
                    if(currentSignatureLabel) currentSignatureLabel.style.display = 'none';
                    signatureDataUrlInput.value = ''; // Clear the hidden input if image is missing
                };
                img.src = existingSignaturePath;
            } else {
                signatureDataUrlInput.value = '';
            }
        }


        function loadKtaTable(page = 1, search = '') {
            currentKtaPage = page;
            currentKtaSearch = search;
            fetch(`pengda.php?fetch_table_only=true&kta_page=${page}&kta_search=${encodeURIComponent(search)}`)
                .then(response => response.text())
                .then(html => {
                    ktaTableContainer.innerHTML = html;
                    // Re-attach event listeners for pagination links and search input as they are re-rendered
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
            fetch(`pengda.php?fetch_activity_log_only=true&log_page=${page}&log_search=${encodeURIComponent(search)}`)
                .then(response => response.text())
                .then(html => {
                    activityLogTableContainer.innerHTML = html;
                    // Re-attach event listeners for pagination links and search input
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

        // NEW FUNCTION: Load Members Table with filters
        function loadMembersTable(page = 1, search = '', roleFilter = 0, cityFilter = 0, ktaStatusFilter = 'all') {
            currentMembersPage = page;
            currentMembersSearch = search;
            currentMembersRoleFilter = roleFilter;
            currentMembersCityFilter = cityFilter;
            currentMembersKtaStatusFilter = ktaStatusFilter;

            let url = `pengda.php?fetch_members_only=true&members_page=${page}&members_search=${encodeURIComponent(search)}`;
            if (roleFilter > 0) {
                url += `&members_role_filter=${roleFilter}`;
            }
            if (cityFilter > 0) {
                url += `&members_city_filter=${cityFilter}`;
            }
            // Add new KTA status filter to URL
            if (ktaStatusFilter !== 'all') {
                url += `&members_kta_status_filter=${encodeURIComponent(ktaStatusFilter)}`;
            }

            fetch(url)
                .then(response => response.text())
                .then(html => {
                    membersTableContainer.innerHTML = html;
                    // Re-attach event listeners for pagination links, search, and filters
                    membersTableContainer.querySelectorAll('.pagination .page-link').forEach(link => {
                        link.addEventListener('click', function(e) {
                            e.preventDefault();
                            const url = new URL(this.href);
                            const pageParam = url.searchParams.get('members_page');
                            const searchParam = url.searchParams.get('members_search');
                            const roleParam = url.searchParams.get('members_role_filter');
                            const cityParam = url.searchParams.get('members_city_filter');
                            const ktaStatusParam = url.searchParams.get('members_kta_status_filter'); // Get new filter param
                            loadMembersTable(parseInt(pageParam), searchParam, parseInt(roleParam || 0), parseInt(cityParam || 0), ktaStatusParam || 'all');
                        });
                    });

                    const newMembersSearchInput = document.getElementById('members-search-input');
                    if (newMembersSearchInput) {
                        newMembersSearchInput.addEventListener('keyup', function(e) {
                            if (e.key === 'Enter' || this.value.length === 0 || this.value.length >= 3) {
                                loadMembersTable(1, this.value, currentMembersRoleFilter, currentMembersCityFilter, currentMembersKtaStatusFilter);
                            }
                        });
                    }

                    const newMembersRoleFilter = document.getElementById('members-role-filter');
                    if (newMembersRoleFilter) {
                        newMembersRoleFilter.addEventListener('change', function() {
                            loadMembersTable(1, currentMembersSearch, parseInt(this.value), currentMembersCityFilter, currentMembersKtaStatusFilter);
                        });
                    }

                    const newMembersCityFilter = document.getElementById('members-city-filter');
                    if (newMembersCityFilter) {
                        newMembersCityFilter.addEventListener('change', function() {
                            loadMembersTable(1, currentMembersSearch, currentMembersRoleFilter, parseInt(this.value), currentMembersKtaStatusFilter);
                        });
                    }

                    const newMembersKtaStatusFilter = document.getElementById('members-kta-status-filter'); // NEW: KTA status filter
                    if (newMembersKtaStatusFilter) {
                        newMembersKtaStatusFilter.addEventListener('change', function() {
                            loadMembersTable(1, currentMembersSearch, currentMembersRoleFilter, currentMembersCityFilter, this.value);
                        });
                    }

                })
                .catch(error => {
                    console.error('Error loading members table:', error);
                    membersTableContainer.innerHTML = '<div class="alert alert-danger animated fadeIn"><i class="fas fa-exclamation-circle"></i> Gagal memuat daftar anggota.</div>';
                });
        }

        // NEW FUNCTION: Load Balance Transactions Table
        function loadBalanceTransactionsTable(page = 1, search = '') {
            currentBalancePage = page;
            currentBalanceSearch = search;
            fetch(`pengda.php?fetch_balance_transactions_only=true&balance_page=${page}&balance_search=${encodeURIComponent(search)}`)
                .then(response => response.text())
                .then(html => {
                    balanceTableContainer.innerHTML = html;
                    // Re-attach event listeners for pagination links and search input
                    balanceTableContainer.querySelectorAll('.pagination .page-link').forEach(link => {
                        link.addEventListener('click', function(e) {
                            e.preventDefault();
                            const url = new URL(this.href);
                            const pageParam = url.searchParams.get('balance_page');
                            const searchParam = url.searchParams.get('balance_search');
                            loadBalanceTransactionsTable(parseInt(pageParam), searchParam);
                        });
                    });
                    const newBalanceSearchInput = document.getElementById('balance-search-input');
                    if (newBalanceSearchInput) {
                        newBalanceSearchInput.addEventListener('keyup', function(e) {
                            if (e.key === 'Enter' || this.value.length === 0 || this.value.length >= 3) {
                                loadBalanceTransactionsTable(1, this.value);
                            }
                        });
                    }
                })
                .catch(error => {
                    console.error('Error loading balance transactions table:', error);
                    balanceTableContainer.innerHTML = '<div class="alert alert-danger animated fadeIn"><i class="fas fa-exclamation-circle"></i> Gagal memuat riwayat transaksi saldo.</div>';
                });
        }


        function showSection(sectionId) {
            document.getElementById('kta_applications_section').style.display = 'none';
            document.getElementById('activity_log_section').style.display = 'none';
            document.getElementById('kta_config_section').style.display = 'none';
            document.getElementById('profile_section').style.display = 'none'; // NEW
            document.getElementById('change_password_section').style.display = 'none'; // NEW
            document.getElementById('members_section').style.display = 'none'; // NEW
            document.getElementById('balance_section').style.display = 'none'; // NEW
            document.getElementById('kejurnas_section').style.display = 'none'; // KEJURNAS


            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.style.display = 'block';

                if (sectionId === 'kta_config_section') {
                    // Give a small delay for the browser to calculate layout after display:block
                    setTimeout(() => {
                        // Set the INTERNAL width and height of the canvas to match the rendered CSS width/height
                        const signatureCanvas = document.getElementById('signatureCanvas');
                        const ctx = signatureCanvas ? signatureCanvas.getContext('2d') : null;
                        if (signatureCanvas && ctx) {
                            signatureCanvas.width = signatureCanvas.clientWidth;
                            signatureCanvas.height = signatureCanvas.clientHeight;
                            
                            // Apply drawing styles again
                            ctx.lineWidth = 2;
                            ctx.lineCap = 'round';
                            ctx.strokeStyle = '#000';
                            
                            // Reload existing signature if any
                            loadExistingSignature();
                        } else {
                            console.warn("Signature canvas or context not found when trying to show config section.");
                        }
                    }, 50); // Small delay (e.g., 50ms)
                } else if (sectionId === 'members_section') { // NEW: Reload members table when section is shown
                    loadMembersTable(currentMembersPage, currentMembersSearch, currentMembersRoleFilter, currentMembersCityFilter, currentMembersKtaStatusFilter);
                } else if (sectionId === 'balance_section') { // NEW: Reload balance table when section is shown
                    loadBalanceTransactionsTable(currentBalancePage, currentBalanceSearch);
                } else if (sectionId === 'kejurnas_section') { // KEJURNAS: Load Kejurnas data
                    if (typeof loadKejurnasSection === 'function') {
                        loadKejurnasSection();
                    }
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
    // Assign elements to global variables used outside openStatusModal
    ktaTableContainer = document.getElementById("kta-applications-table-container");
    activityLogTableContainer = document.getElementById("activity-log-table-container");
    membersTableContainer = document.getElementById("members-table-container");
    balanceTableContainer = document.getElementById("balance-transactions-table-container");
    sidebar = document.getElementById('sidebar');
    mainContent = document.getElementById('main-content');
    sidebarToggle = document.getElementById('sidebar-toggle');

    // These elements might not exist initially if fetch_table_only is used,
    // so ensure they are selected *after* the initial load or re-rendering.
    ktaSearchInput = document.getElementById('kta-search-input');
    logSearchInput = document.getElementById('log-search-input');
    membersSearchInput = document.getElementById('members-search-input');
    membersRoleFilter = document.getElementById('members-role-filter');
    membersCityFilter = document.getElementById('members-city-filter');
    membersKtaStatusFilter = document.getElementById('members-kta-status-filter');
    balanceSearchInput = document.getElementById('balance-search-input');


    console.log('[PENGDA] Initializing sidebar menu...');
    const sidebarLinks = document.querySelectorAll('.sidebar .menu li a[data-section]');
    console.log('[PENGDA] Found', sidebarLinks.length, 'sidebar links');
    
    sidebarLinks.forEach((link, index) => {
        const sectionId = link.getAttribute('data-section');
        console.log(`[PENGDA] Adding click listener to link ${index + 1}:`, sectionId);
        
        link.addEventListener('click', function(event) {
            event.preventDefault();
            console.log('[PENGDA] Sidebar link clicked:', sectionId);
            try {
                showSection(sectionId);
            } catch (error) {
                console.error('[PENGDA] Error showing section:', error);
                alert('Error: ' + error.message);
            }
        });
    });

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('expanded');
        });
    } else {
        console.warn('[PENGDA] Sidebar toggle button not found');
    }

    const initialSection = window.location.hash.substring(1) || 'kta_applications_section';
    showSection(initialSection);

    const urlParams = new URLSearchParams(window.location.search);
    const initialKtaPage = parseInt(urlParams.get('kta_page')) || 1;
    const initialKtaSearch = urlParams.get('kta_search') || '';
    const initialLogPage = parseInt(urlParams.get('log_page')) || 1;
    const initialLogSearch = urlParams.get('log_search') || '';
    const initialMembersPage = parseInt(urlParams.get('members_page')) || 1;
    const initialMembersSearch = urlParams.get('members_search') || '';
    const initialMembersRoleFilter = parseInt(urlParams.get('members_role_filter')) || 0;
    const initialMembersCityFilter = parseInt(urlParams.get('members_city_filter')) || 0;
    const initialMembersKtaStatusFilter = urlParams.get('members_kta_status_filter') || 'all';
    const initialBalancePage = parseInt(urlParams.get('balance_page')) || 1;
    const initialBalanceSearch = urlParams.get('balance_search') || '';


    loadKtaTable(initialKtaPage, initialKtaSearch);
    loadActivityLog(initialLogPage, initialLogSearch);
    loadMembersTable(initialMembersPage, initialMembersSearch, initialMembersRoleFilter, initialMembersCityFilter, initialMembersKtaStatusFilter);
    loadBalanceTransactionsTable(initialBalancePage, initialBalanceSearch);

    // Event listener for the modal form submission
    const updateStatusForm = document.getElementById("updateStatusForm"); // Pastikan ini juga diambil di sini
    if(updateStatusForm) { // Tambahkan pengecekan null di sini juga
        updateStatusForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const formData = new FormData(this);
            formData.append('update_kta_status_ajax', '1');
            formData.append('admin_id', <?php echo $admin_id; ?>); // Pass admin_id to server

            Swal.fire({
                title: 'Memproses...',
                text: 'Harap tunggu...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            fetch('pengda.php', {
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
                    Swal.fire({
                        icon: 'success',
                        title: 'Berhasil!',
                        html: successText,
                        showConfirmButton: true,
                        confirmButtonText: 'Oke',
                    }).then(() => {
                        loadKtaTable(currentKtaPage, currentKtaSearch);
                        loadActivityLog(currentLogPage, currentLogSearch);
                    });
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
    }


    // NEW: Event listener for change password form submission
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const formData = new FormData(this);
            formData.append('change_password_ajax', '1');

            Swal.fire({
                title: 'Mengubah Password...',
                text: 'Harap tunggu...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            fetch('pengda.php', {
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
                    }).then(() => {
                        // Clear form fields after successful update
                        changePasswordForm.reset();
                        // Optional: reload activity log if password change is logged
                        loadActivityLog(currentLogPage, currentLogSearch);
                    });
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
                let errorMessage = 'Terjadi kesalahan saat mengubah password. Silakan coba lagi.';
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
    }


    // Canvas and KTA config related scripts
    const signatureCanvas = document.getElementById('signatureCanvas');
    const clearSignatureBtn = document.getElementById('clearSignatureBtn');
    const saveSignatureBtn = document.getElementById('saveSignatureBtn');
    const signatureDataUrlInput = document.getElementById('signature_data_url');
    const ktaConfigForm = document.getElementById('ktaConfigForm');
    const ketuaUmumNameInput = document.getElementById('ketua_umum_name');

    // Initialize ctx only if signatureCanvas exists
    let ctx = null;
    if (signatureCanvas) {
        ctx = signatureCanvas.getContext('2d');
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#000';
    } else {
        console.warn("Signature canvas element not found.");
    }

    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    function draw(e) {
        if (!isDrawing) return;
        if (!ctx) { // Check if context is initialized
            console.error("Canvas context not initialized.");
            return;
        }

        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        const rect = signatureCanvas.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : null);
        const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : null);

        if (clientX === null || clientY === null) return; // Exit if coordinates are missing

        lastX = clientX - rect.left;
        lastY = clientY - rect.top;
        ctx.lineTo(lastX, lastY);
        ctx.stroke();
    }

    if (signatureCanvas) { // Only add listeners if canvas exists
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
    }


    clearSignatureBtn.addEventListener('click', () => {
        if (signatureCanvas && ctx) { // Ensure canvas and context exist
            ctx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
            signatureDataUrlInput.value = '';
            const currentSignaturePreview = document.getElementById('currentSignaturePreview');
            const currentSignatureLabel = document.getElementById('currentSignatureLabel');
            if(currentSignaturePreview) currentSignaturePreview.style.display = 'none';
            if(currentSignatureLabel) currentSignatureLabel.style.display = 'none';
            Swal.fire('Berhasil!', 'Tanda tangan telah dibersihkan dari kanvas.', 'success');
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
        if (!signatureCanvas || !ctx || signatureCanvas.width === 0 || signatureCanvas.height === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Kanvas Tidak Siap',
                text: 'Kanvas tanda tangan belum dimuat dengan benar. Tidak dapat menyimpan tanda tangan.',
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
            Swal.fire('Berhasil!', 'Tanda tangan telah siap untuk disimpan ke database.', 'success');
        }
    });

    ktaConfigForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // If signature data URL is empty but canvas has drawing, capture it
        const signatureCanvas = document.getElementById('signatureCanvas');
        const ctx = signatureCanvas ? signatureCanvas.getContext('2d') : null;
        const signatureDataUrlInput = document.getElementById('signature_data_url');

        if (signatureCanvas && ctx) {
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
            } else if (isCanvasBlank && signatureDataUrlInput.value) {
                    signatureDataUrlInput.value = '';
            }
        } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Kesalahan Validasi',
                        text: 'Kanvas tanda tangan belum dimuat dengan benar. Harap muat ulang halaman atau pindah ke bagian lain lalu kembali ke Konfigurasi KTA Otomatis.',
                        confirmButtonText: 'Tutup'
                    });
            return;
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

        fetch('pengda.php', {
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

                // Update account number field (if it exists)
                if (document.getElementById('account_number')) {
                    document.getElementById('account_number').value = data.account_number || '';
                }
                // HAPUS: Update kta_cost field
                // if (document.getElementById('kta_cost')) {
                //   document.getElementById('kta_cost').value = data.kta_cost || '';
                // }
                // --- End of NEW Code ---

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

                // Refresh KTA applications table to update button disabled state
                loadKtaTable(currentKtaPage, currentKtaSearch);

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

    // Initial handling of messages from previous redirects (if any)
    <?php if (!empty($success_message) || !empty($error_message) || (isset($_GET['rejected_kta_id']) && isset($_GET['reject_reason']))): ?>
        Swal.fire({
            icon: '<?php echo !empty($success_message) ? 'success' : ((isset($_GET['rejected_kta_id']) && isset($_GET['reject_reason'])) ? 'info' : 'error'); ?>', // Change to info for rejected message
            title: '<?php
                if (!empty($success_message)) {
                    echo addslashes($success_message);
                } elseif (!empty($error_message)) {
                    echo addslashes($error_message);
                } elseif (isset($_GET['rejected_kta_id']) && isset($_GET['reject_reason'])) {
                    echo "Pengajuan KTA ID " . htmlspecialchars($_GET['rejected_kta_id']) . " telah DITOLAK oleh Pengurus Besar. Alasan: " . htmlspecialchars($_GET['reject_reason']) . ".";
                }
            ?>',
            timer: <?php echo (!empty($success_message) && !isset($_GET['rejected_kta_id'])) ? 3000 : 0; ?>, // Keep message open if it's a rejection from PB
            showClass: { popup: 'animate__animated animate__fadeInDown animate__faster' },
            hideClass: { popup: 'animate__animated animate__fadeOutUp animate__faster' }
        });
        window.history.replaceState(null, null, window.location.pathname);
    <?php endif; ?>

    window.addEventListener('resize', function() {
        // Only run resize logic if KTA config section is active
        if (document.getElementById('kta_config_section').style.display === 'block') {
            const signatureCanvas = document.getElementById('signatureCanvas');
            const ctx = signatureCanvas ? signatureCanvas.getContext('2d') : null;

            if (window.innerWidth >= 768) {
                // Reset canvas size when on desktop and active
                if (signatureCanvas && ctx) {
                    signatureCanvas.width = signatureCanvas.clientWidth;
                    signatureCanvas.height = signatureCanvas.clientHeight;

                    // Apply drawing styles again
                    ctx.lineWidth = 2;
                    ctx.lineCap = 'round';
                    ctx.strokeStyle = '#000';

                    // Re-draw existing signature on resized canvas
                    loadExistingSignature();
                }
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
                // On mobile, let CSS handle sizing, canvas may not need manual resize
                // unless there are display issues. For now, prioritize general functionality.
                sidebar.classList.remove('collapsed');
                mainContent.classList.remove('expanded');
            }
        }
    });
});
    </script>
</body>
</html>