<?php
// generate_kta_pdf.php

// 1. Pengaturan Penanganan Error Awal
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php_error_log.txt'); // Pastikan ini bisa ditulisi oleh PHP
ini_set('memory_limit', '256M');
set_time_limit(300);

// 2. Memuat Library yang Dibutuhkan
require('fpdf186/fpdf.php');
require_once 'db_config.php'; // Pastikan db_config.php ada dan berfungsi
require_once __DIR__ . '/../vendor/autoload.php';

use chillerlan\QRCode\QRCode;
use chillerlan\QRCode\QROptions;

// 3. Inisialisasi Respons JSON
$response = ['success' => false, 'message' => ''];

// 4. Periksa Koneksi Database
if (!isset($conn) || $conn->connect_error) {
    $response['message'] = "Database connection error: " . $conn->connect_error;
    error_log("Database connection error in generate_kta_pdf.php: " . $conn->connect_error);
    header('Content-Type: application/json');
    echo json_encode($response);
    exit();
}

// 5. Validasi Metode Permintaan (Request Method)
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    $response['message'] = "Invalid request method. This script only accepts POST requests.";
    error_log("Invalid request method to generate_kta_pdf.php. Must be POST. Received: " . $_SERVER['REQUEST_METHOD']);
    header('Content-Type: application/json');
    echo json_encode($response);
    exit();
}

// 6. Ambil dan Validasi Parameter POST
$application_id = filter_var($_POST['application_id'] ?? '', FILTER_VALIDATE_INT);
$admin_id = filter_var($_POST['admin_id'] ?? '', FILTER_VALIDATE_INT);
$role_caller = $_POST['role_caller'] ?? '';
$unique_barcode_id = $_POST['unique_barcode_id'] ?? '';

$is_barcode_required = ($role_caller === 'pb');
if ($application_id === false || $application_id <= 0 || $admin_id === false || $admin_id <= 0 || !in_array($role_caller, ['pengcab', 'pengda', 'pb']) || ($is_barcode_required && empty($unique_barcode_id))) {
    $error_msg = "Invalid parameters received by generate_kta_pdf.php:";
    $error_msg .= " App ID: {$application_id}, Admin ID: {$admin_id}, Role: {$role_caller}.";
    if ($is_barcode_required) {
        $error_msg .= " Barcode: " . (empty($unique_barcode_id) ? "MISSING" : $unique_barcode_id) . ".";
    }
    $response['message'] = $error_msg;
    error_log($error_msg);
    header('Content-Type: application/json');
    echo json_encode($response);
    exit();
}

// 7. Inisialisasi Variabel Path File
$barcode_filepath = null;
$barcode_filename = null;
$barcode_image_dir = null;
$kta_pdf_full_url = null;

try {
    // 8. Ambil Data Aplikasi KTA dari Database
    $query_app = "SELECT ka.*, u.username AS user_full_name, u.email AS user_email, u.phone AS user_phone,
                                     ka.logo_path, -- Kolom untuk menyimpan nama file logo user/club
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
        throw new Exception("KTA application not found for ID: {$application_id}.");
    }

    // 9. Definisikan Jalur Dasar dan Subdirektori
    define('BASE_URL_FOR_PDF', 'https://forbasi.or.id/forbasi/php/');
    $upload_dir_relative = 'uploads/'; // Ini adalah folder yang berisi kta_files/, pengcab_kta_configs/, dll.
    $server_root = $_SERVER['DOCUMENT_ROOT'];
    // Ubah ini sesuai struktur folder proyek Anda. Jika 'php' adalah folder di root domain, ini sudah benar.
    // Jika 'php' ada di dalam 'forbasi', maka seharusnya '/forbasi/php/'
    $php_forbasi_path = '/forbasi/php/'; 

    // 10. Inisialisasi Variabel Konfigurasi Berdasarkan Role
    $ketua_umum_name = '';
    $signature_image_path = '';
    $stamp_image_path = ''; // Tetap dideklarasikan, tapi akan null/kosong untuk Pengcab
    $generated_kta_subdir = '';
    $db_update_column = '';
    
    
    $ketua_umum_name_pengcab_for_pdf = '___________________________';
    $signature_image_path_pengcab_for_pdf = null;
    $stamp_image_path_pengcab_for_pdf = null; // Akan tetap null untuk pengcab, atau diset jika ada data lama
    $ketua_umum_name_pengda_for_pdf = '___________________________';
    $signature_image_path_pengda_for_pdf = null;
    $stamp_image_path_pengda_for_pdf = null;

    // 11. Logika Pengambilan Konfigurasi Berdasarkan Role_Caller
    $query_config = ""; // Inisialisasi kosong
    $current_role_config_subdir_db_path = ''; // Path untuk mengambil gambar dari DB
    
    if ($role_caller === 'pengcab') {
        // HANYA MENGAMBIL signature_image_path, stamp_image_path dihapus dari SELECT
        $query_config = "SELECT ketua_umum_name, signature_image_path FROM pengcab_kta_configs WHERE user_id = ?";
        $generated_kta_subdir = 'generated_kta/';
        $db_update_column = 'generated_kta_file_path';
        $current_role_config_subdir_db_path = 'pengcab_kta_configs/';

    } elseif ($role_caller === 'pengda') {
        $query_config = "SELECT ketua_umum_name, signature_image_path, stamp_image_path FROM pengda_kta_configs WHERE user_id = ?";
        $generated_kta_subdir = 'generated_kta_pengda/';
        $db_update_column = 'generated_kta_file_path_pengda';
        $current_role_config_subdir_db_path = 'pengda_kta_configs/';
    
        // Ambil data konfigurasi Pengcab jika ada
        if (!empty($app_data['approved_by_pengcab_id'])) {
            // HANYA MENGAMBIL signature_image_path untuk Pengcab, stamp_image_path dihapus
            $query_config_pengcab = "SELECT ketua_umum_name, signature_image_path FROM pengcab_kta_configs WHERE user_id = ?";
            $stmt_config_pengcab = $conn->prepare($query_config_pengcab);
            if ($stmt_config_pengcab) {
                $stmt_config_pengcab->bind_param("i", $app_data['approved_by_pengcab_id']);
                $stmt_config_pengcab->execute();
                $result_config_pengcab = $stmt_config_pengcab->get_result();
                if ($config_data_pengcab = $result_config_pengcab->fetch_assoc()) {
                    $ketua_umum_name_pengcab_for_pdf = $config_data_pengcab['ketua_umum_name'];
                    // Path lengkap untuk signature Pengcab
                    $signature_image_path_pengcab_for_pdf = realpath($server_root . $php_forbasi_path . $upload_dir_relative . 'pengcab_kta_configs/' . $config_data_pengcab['signature_image_path']);
                    // Stamp untuk Pengcab tidak lagi digunakan, set null atau kosong
                    $stamp_image_path_pengcab_for_pdf = null; 
                }
                $stmt_config_pengcab->close();
            } else {
                error_log("ERROR: Failed to prepare Pengcab config query for Pengda role: " . $conn->error);
            }
        }

    } elseif ($role_caller === 'pb') {
        $query_config = "SELECT ketua_umum_name, signature_image_path, stamp_image_path FROM pb_kta_configs WHERE user_id = ?";
        $generated_kta_subdir = 'generated_kta_pb/';
        $db_update_column = 'generated_kta_file_path_pb';
        $current_role_config_subdir_db_path = 'pb_kta_configs/';

        // Ambil data konfigurasi Pengcab jika ada
        if (!empty($app_data['approved_by_pengcab_id'])) {
            // HANYA MENGAMBIL signature_image_path untuk Pengcab, stamp_image_path dihapus
            $query_config_pengcab = "SELECT ketua_umum_name, signature_image_path FROM pengcab_kta_configs WHERE user_id = ?";
            $stmt_config_pengcab = $conn->prepare($query_config_pengcab);
            if ($stmt_config_pengcab) {
                $stmt_config_pengcab->bind_param("i", $app_data['approved_by_pengcab_id']);
                $stmt_config_pengcab->execute();
                $result_config_pengcab = $stmt_config_pengcab->get_result();
                if ($config_data_pengcab = $result_config_pengcab->fetch_assoc()) {
                    $ketua_umum_name_pengcab_for_pdf = $config_data_pengcab['ketua_umum_name'];
                    $signature_image_path_pengcab_for_pdf = realpath($server_root . $php_forbasi_path . $upload_dir_relative . 'pengcab_kta_configs/' . $config_data_pengcab['signature_image_path']);
                    // Stamp untuk Pengcab tidak lagi digunakan, set null atau kosong
                    $stamp_image_path_pengcab_for_pdf = null; 
                }
                $stmt_config_pengcab->close();
            } else {
                error_log("ERROR: Failed to prepare Pengcab config query for PB role: " . $conn->error);
            }
        }
    
        // Ambil data konfigurasi Pengda jika ada
        if (!empty($app_data['approved_by_pengda_id'])) {
            $query_config_pengda = "SELECT ketua_umum_name, signature_image_path, stamp_image_path FROM pengda_kta_configs WHERE user_id = ?";
            $stmt_config_pengda = $conn->prepare($query_config_pengda);
            if ($stmt_config_pengda) {
                $stmt_config_pengda->bind_param("i", $app_data['approved_by_pengda_id']);
                $stmt_config_pengda->execute();
                $result_config_pengda = $stmt_config_pengda->get_result();
                if ($config_data_pengda = $result_config_pengda->fetch_assoc()) {
                    $ketua_umum_name_pengda_for_pdf = $config_data_pengda['ketua_umum_name'];
                    $signature_image_path_pengda_for_pdf = realpath($server_root . $php_forbasi_path . $upload_dir_relative . 'pengda_kta_configs/' . $config_data_pengda['signature_image_path']);
                    $stamp_image_path_pengda_for_pdf = realpath($server_root . $php_forbasi_path . $upload_dir_relative . 'pengda_kta_configs/' . $config_data_pengda['stamp_image_path']);
                }
                $stmt_config_pengda->close();
            } else {
                error_log("ERROR: Failed to prepare Pengda config query for PB role: " . $conn->error);
            }
        }
    } else {
        throw new Exception("Invalid role caller provided.");
    }

    $stmt_config = $conn->prepare($query_config);
    if (!$stmt_config) {
        throw new Exception("Failed to prepare config query for {$role_caller}: " . $conn->error);
    }
    $stmt_config->bind_param("i", $admin_id);
    $stmt_config->execute();
    $result_config = $stmt_config->get_result();
    $config_data = $result_config->fetch_assoc();
    $stmt_config->close();

    // Modifikasi Validasi Konfigurasi: stamp_image_path tidak lagi wajib untuk Pengcab
    if (!$config_data || empty($config_data['ketua_umum_name']) || empty($config_data['signature_image_path'])) {
        // Jika role_caller adalah 'pengcab', hanya periksa ketua_umum_name dan signature_image_path
        if ($role_caller === 'pengcab' && (empty($config_data['ketua_umum_name']) || empty($config_data['signature_image_path']))) {
            throw new Exception("KTA configuration for " . ucfirst($role_caller) . " ID {$admin_id} is incomplete (Nama Ketua Umum atau Tanda Tangan tidak lengkap).");
        } 
        // Untuk role lain (Pengda, PB), stamp_image_path masih wajib
        elseif ($role_caller !== 'pengcab' && (empty($config_data['ketua_umum_name']) || empty($config_data['signature_image_path']) || empty($config_data['stamp_image_path']))) {
              throw new Exception("KTA configuration for " . ucfirst($role_caller) . " ID {$admin_id} is incomplete (Nama Ketua Umum, Tanda Tangan, atau Stempel tidak lengkap).");
        }
        // Jika config_data tidak ada sama sekali
        elseif (!$config_data) {
              throw new Exception("KTA configuration for " . ucfirst($role_caller) . " ID {$admin_id} not found.");
        }
    }

    $ketua_umum_name = $config_data['ketua_umum_name'];
    // Path lengkap untuk signature utama (berdasarkan role_caller)
    $signature_full_path_file = realpath($server_root . $php_forbasi_path . $upload_dir_relative . $current_role_config_subdir_db_path . $config_data['signature_image_path']);
    // Untuk stamp, hanya set jika ada dan bukan Pengcab yang jadi caller utamanya, atau jika datanya ada dari DB
    $stamp_full_path_file = ($role_caller === 'pengcab') ? null : realpath($server_root . $php_forbasi_path . $upload_dir_relative . $current_role_config_subdir_db_path . ($config_data['stamp_image_path'] ?? ''));
    if (!empty($stamp_full_path_file) && !file_exists($stamp_full_path_file)) {
        error_log("WARNING: Stamp file for {$role_caller} was expected but not found at: " . ($server_root . $php_forbasi_path . $upload_dir_relative . $current_role_config_subdir_db_path . ($config_data['stamp_image_path'] ?? '')));
        $stamp_full_path_file = null; // Set to null if file not found
    }

    // 12. Tentukan Jalur Penuh untuk File Gambar
    $kta_background_template_path = realpath($server_root . $php_forbasi_path . '../assets/kta_template_bg.png');
    if (!file_exists($kta_background_template_path)) {
        error_log("ERROR: KTA Background template not found at: " . ($server_root . $php_forbasi_path . '../assets/kta_template_bg.png'));
        // Fallback or throw exception if critical asset is missing
        throw new Exception("KTA Background template missing.");
    }
    
    // Path untuk logo user/club
    $user_logo_full_path = null;
    if (!empty($app_data['logo_path'])) {
        // Asumsi $app_data['logo_path'] sudah seperti 'kta_files/nama_file.png'
        $user_logo_full_path = realpath($server_root . $php_forbasi_path . $upload_dir_relative . $app_data['logo_path']);
        
        // --- DEBUGGING LOGO USER ---
        error_log("DEBUG: Attempting to load user logo from: " . ($server_root . $php_forbasi_path . $upload_dir_relative . $app_data['logo_path']));
        if (!file_exists($user_logo_full_path)) {
            error_log("WARNING: User logo file does not exist at: " . $user_logo_full_path);
            $user_logo_full_path = null; // Set to null if file not found
        } else {
            error_log("DEBUG: User logo file found at: " . $user_logo_full_path);
        }
        // --- END DEBUGGING LOGO USER ---
    }


    // Debugging untuk tanda tangan dan stempel utama
    if (!$signature_full_path_file) {
        error_log("WARNING: Signature file for {$role_caller} not found at: " . ($server_root . $php_forbasi_path . $upload_dir_relative . $current_role_config_subdir_db_path . ($config_data['signature_image_path'] ?? '')));
    }
    // Debugging untuk stamp hanya jika tidak null (misal, untuk Pengda/PB)
    if ($stamp_full_path_file && !file_exists($stamp_full_path_file)) {
        error_log("WARNING: Stamp file for {$role_caller} not found at: " . ($server_root . $php_forbasi_path . $upload_dir_relative . $current_data_role_config_subdir_db_path . ($config_data['stamp_image_path'] ?? '')));
    }


    $generated_kta_dir = $server_root . $php_forbasi_path . $upload_dir_relative . $generated_kta_subdir;

    if (!is_dir($generated_kta_dir)) {
        if (!mkdir($generated_kta_dir, 0777, true)) {
            throw new Exception("Failed to create KTA directory: " . $generated_kta_dir);
        }
    }
    if (!is_writable($generated_kta_dir)) {
        throw new Exception("KTA directory is not writable: " . $generated_kta_dir);
    }

    // 13. Buat Nama File PDF dan URL
    $safe_club_name = preg_replace('/[^a-zA-Z0-9_ -]/', '', $app_data['club_name'] ?? 'unknown_club');
    $safe_club_name = str_replace(' ', '_', $safe_club_name);
    
    $output_prefix = '';
    if ($role_caller === 'pengcab') $output_prefix = 'KTA_Pengcab_';
    elseif ($role_caller === 'pengda') $output_prefix = 'KTA_Pengda_';
    elseif ($role_caller === 'pb') $output_prefix = 'KTA_PB_';
    
    $output_filename = $output_prefix . $safe_club_name . '_' . $application_id . '.pdf';
    $output_filepath = $generated_kta_dir . $output_filename;
    
    $relative_kta_path_for_url = $upload_dir_relative . $generated_kta_subdir . $output_filename;
    $kta_pdf_full_url = BASE_URL_FOR_PDF . $relative_kta_path_for_url;

    // 14. Logika Pembuatan QR Code (Hanya untuk Role PB)
    if ($role_caller === 'pb' && !empty($unique_barcode_id)) {
        $barcode_image_subdir = 'qrcodes/';
        $barcode_image_dir = $server_root . $php_forbasi_path . $upload_dir_relative . $barcode_image_subdir;
        if (!is_dir($barcode_image_dir)) {
            if (!mkdir($barcode_image_dir, 0777, true)) throw new Exception("Failed to create QR directory.");
        }
        if (!is_writable($barcode_image_dir)) throw new Exception("QR directory not writable.");
        
        $options = new QROptions(['eccLevel' => QRCode::ECC_L, 'outputType' => QRCode::OUTPUT_IMAGE_PNG, 'imageBase64' => false, 'scale' => 10, 'bgColor' => [255, 255, 255], 'imageTransparent' => false]);
        $qrcode_generator = new QRCode($options);
        // Ubah ini agar QR code mengarah ke halaman detail KTA Anda
        $qr_data = $qrcode_generator->render(BASE_URL_FOR_PDF . 'view_kta_details.php?barcode_id=' . $unique_barcode_id);
        $barcode_filename = 'qrcode_' . $unique_barcode_id . '.png';
        $barcode_filepath = $barcode_image_dir . $barcode_filename;
        if (file_put_contents($barcode_filepath, $qr_data) === false) {
            throw new Exception("Failed to save QR code image.");
        }
    }

    // 15. Definisi Kelas KTA_PDF
    class KTA_PDF extends FPDF {
        protected $kta_background_template_path;
        protected $logo_path; // Ini akan menerima full path logo user
        protected $signature_path; // Ini adalah signature dari role caller saat ini
        protected $stamp_path; // Ini adalah stamp dari role caller saat ini
        protected $ketua_umum_name; // Nama ketua dari role caller saat ini
        protected $kta_title_main;
        protected $kta_title_sub;
        protected $app_data;
        protected $role_caller;
        protected $barcode_filepath;
        protected $unique_barcode_id;
        protected $signature_pengcab_path_for_pdf;
        protected $stamp_pengcab_path_for_pdf; // Tetap ada untuk Pengda/PB
        protected $ketua_umum_name_pengcab_for_pdf;
        protected $signature_pengda_path_for_pdf;
        protected $stamp_pengda_path_for_pdf;
        protected $ketua_umum_name_pengda_for_pdf;

        function __construct($kta_background, $logo_user, $signature, $stamp, $ketua_umum, $kta_main_title, $kta_sub_title, $app_data, $role_caller, $barcode_file, $barcode_id, $sig_pengcab = null, $stamp_pengcab = null, $ketua_pengcab = null, $sig_pengda = null, $stamp_pengda = null, $ketua_pengda = null) {
            parent::__construct('P', 'mm', 'A4');
            $this->kta_background_template_path = $kta_background;
            $this->logo_path = $logo_user; // Menerima full path logo user
            $this->signature_path = $signature;
            $this->stamp_path = $stamp; // Stamp path from the current caller (can be null for Pengcab)
            $this->ketua_umum_name = $ketua_umum;
            $this->kta_title_main = $kta_main_title;
            $this->kta_title_sub = $kta_sub_title;
            $this->app_data = $app_data;
            $this->role_caller = $role_caller;
            $this->barcode_filepath = $barcode_file;
            $this->unique_barcode_id = $barcode_id;
            $this->signature_pengcab_path_for_pdf = $sig_pengcab;
            $this->stamp_pengcab_path_for_pdf = $stamp_pengcab;
            $this->ketua_umum_name_pengcab_for_pdf = $ketua_pengcab;
            $this->signature_pengda_path_for_pdf = $sig_pengda;
            $this->stamp_pengda_path_for_pdf = $stamp_pengda;
            $this->ketua_umum_name_pengda_for_pdf = $ketua_pengda;
            $this->SetMargins(0, 0, 0);
            $this->SetAutoPageBreak(false);
        }

        function Header() {}
        function Footer() {}

        function GenerateKTA() {
            $data = $this->app_data;
            $this->AddPage();
            
            if (file_exists($this->kta_background_template_path)) {
                $this->Image($this->kta_background_template_path, 0, 0, $this->GetPageWidth(), $this->GetPageHeight());
            }

            // Inisialisasi posisi Y awal untuk informasi anggota
            $current_y_start_info = 0; 
            
            // Judul KTA
            $kta_title_y = 70;
            $this->SetFont('Arial', 'B', 24);
            $this->SetTextColor(0, 0, 0);
            $this->SetXY(0, $kta_title_y);
            $this->Cell($this->GetPageWidth(), 12, $this->kta_title_main, 0, 1, 'C');
            $kta_title_y += 12;
            $this->SetFont('Arial', 'B', 16);
            $this->SetXY(0, $kta_title_y);
            $this->Cell($this->GetPageWidth(), 8, $this->kta_title_sub, 0, 1, 'C');
            
            // 1. Turunkan tabel informasi anggota sekitar 10vh
            $vh_to_mm = $this->GetPageHeight() / 170; // 1vh dalam mm
            $offset_8vh = 8 * $vh_to_mm; // 10vh dalam mm
            $this->SetY($this->GetY() + $offset_8vh); // Menambahkan jarak setelah judul/sub-judul dan offset 10vh
            $current_y_start_info = $this->GetY();
            
            // --- Informasi Anggota ---
            $info_start_x = 55;
            $label_width = 45;
            $value_start_x = $info_start_x + $label_width + 5;
            $line_height_info = 8;
            
            // Dapatkan posisi Y saat ini untuk memulai baris informasi berikutnya
            $current_y_start_info = $this->GetY();
        
            // Cetak NAMA CLUB tanpa label, di tengah
            $this->SetFont('Arial', 'B', 14); // Font besar dan tebal
            $this->SetXY(0, $current_y_start_info); // Mulai dari sisi kiri, di posisi Y saat ini
            $this->Cell(0, 10, mb_strtoupper($data['club_name'] ?? '-', 'UTF-8'), 0, 1, 'C');
            
            // Tambahkan sedikit spasi vertikal setelah nama klub
            $this->Ln(5);

            // Perbarui posisi Y untuk baris berikutnya (NAMA SEKOLAH)
            $current_y_start_info = $this->GetY();

            // Tambahkan baris untuk NAMA SEKOLAH
            $this->SetXY($info_start_x, $current_y_start_info);
            $this->SetFont('Arial', '', 11); // Set font ke normal untuk label
            $this->Cell($label_width, $line_height_info, 'NAMA SEKOLAH', 0, 0, 'L');
            $this->SetX($value_start_x);
            $this->Cell(0, $line_height_info, ': ' . mb_strtoupper($data['school_name'] ?? '-', 'UTF-8'), 0, 1, 'L');
            
            // Perbarui posisi Y setelah mencetak baris ini
            $current_y_start_info = $this->GetY();

            // Untuk ALAMAT, gunakan MultiCell karena bisa panjang
            $this->SetXY($info_start_x, $current_y_start_info); 
            $this->Cell($label_width, $line_height_info, 'ALAMAT', 0, 0, 'L');
            $this->SetX($value_start_x);
            $this->MultiCell($this->GetPageWidth() - $value_start_x - 30, $line_height_info, ': ' . mb_strtoupper($data['club_address'] ?? '-', 'UTF-8'), 0, 'L');

            // Pastikan posisi Y setelah MultiCell benar untuk baris berikutnya
            $current_y = $this->GetY();
            $this->SetXY($info_start_x, $current_y); 
            $this->Cell($label_width, $line_height_info, 'SEBAGAI ANGGOTA', 0, 0, 'L');
            $this->SetX($value_start_x);
            $this->Cell(0, $line_height_info, ': BIASA', 0, 1, 'L');

            $this->SetX($info_start_x);
            $this->Cell($label_width, $line_height_info, 'SEJAK TANGGAL', 0, 0, 'L');
            $approved_date_column = '';
            if ($this->role_caller === 'pengcab') $approved_date_column = 'approved_at_pengcab';
            elseif ($this->role_caller === 'pengda') $approved_date_column = 'approved_at_pengda';
            elseif ($this->role_caller === 'pb') $approved_date_column = 'approved_at_pb';
            $approved_date_str = $data[$approved_date_column] ?? date('Y-m-d');
            $sejak_tanggal = date('d', strtotime($approved_date_str)) . ' ' . 
                                 $this->getIndonesianMonth(date('n', strtotime($approved_date_str))) . ' ' . 
                                 date('Y', strtotime($approved_date_str));
            $this->SetX($value_start_x);
            $this->Cell(0, $line_height_info, ': ' . mb_strtoupper($sejak_tanggal, 'UTF-8'), 0, 1, 'L');

            $this->SetX($info_start_x);
            $this->SetFont('Arial', 'B', 11);
            $this->Cell($label_width, $line_height_info, 'NOMOR ANGGOTA', 0, 0, 'L');
            $tahun_persetujuan = date('Y', strtotime($approved_date_str));
            $city_name_for_abbr = $data['city_name'] ?? 'N/A';
            $city_abbr = $this->getCityAbbreviation($city_name_for_abbr);
            $padded_app_id = str_pad($data['id'] ?? '0', 3, '0', STR_PAD_LEFT);
            $member_number = "0{$padded_app_id}/FORBASI/{$city_abbr}/{$tahun_persetujuan}";
            $this->SetX($value_start_x);
            $this->Cell(0, $line_height_info, ': ' . $member_number, 0, 1, 'L');
            
            // Logika QR Code dipindahkan ke bawah dan diubah posisinya
            if ($this->role_caller === 'pb' && !empty($this->barcode_filepath)) {
                $qr_code_size = 30;
                // Posisikan QR code di sudut kiri bawah KTA
                $qr_code_x = 15; // 15mm dari kiri
                $qr_code_y = $this->GetPageHeight() - $qr_code_size - 30; // 30mm dari bawah

                if (file_exists($this->barcode_filepath)) {
                    try {
                        $this->Image($this->barcode_filepath, $qr_code_x, $qr_code_y, $qr_code_size, $qr_code_size);
                        $this->SetFont('Arial', '', 7);
                        $this->SetXY($qr_code_x, $qr_code_y + $qr_code_size + 1);
                        $this->Cell($qr_code_size, 3, $this->unique_barcode_id, 0, 0, 'C');
                    } catch (Exception $e) {
                        error_log("ERROR: Failed to add QR code image: " . $e->getMessage());
                    }
                } else {
                    error_log("WARNING: QR code image not found: " . $this->barcode_filepath);
                }
            }

            // --- Area Tanda Tangan ---
            $sig_block_start_y = 175; // Nilai ini disesuaikan agar blok tanda tangan naik
            $col_width = 80;
            $line_height_sig_text = 5;
            
            // >>>>> PERBAIKAN UTAMA DI SINI <<<<<
            // Definisikan ukuran tanda tangan dan stempel secara global untuk semua role.
            // Anda bisa mengubah nilai-nilai ini untuk mengontrol ukuran.
            // Untuk memperbesar, naikkan nilai-nilai ini.
            $sig_image_width = 45; // Lebar maksimum tanda tangan (dalam mm)
            $sig_image_height = 27; // Tinggi maksimum tanda tangan (dalam mm)
            $stamp_image_width = 52.5; // Lebar maksimum stempel (dalam mm)
            $stamp_image_height = 30; // Tinggi maksimum stempel (dalam mm)
            // >>>>> END PERBAIKAN UTAMA <<<<<
            
            $spacing_after_sig_image = 2;

            // Hitung nilai offset vertikal (untuk -3vh)
            $offset_min_3vh = -3 * $vh_to_mm; // Sekitar -9mm

            // Tambahkan ini untuk menggeser tanda tangan ke bawah
$offset_plus_3vh = 4 * $vh_to_mm; // Sekitar 9mm

            if ($this->role_caller === 'pengcab') {
                $center_col_x = ($this->GetPageWidth() / 2) - ($col_width / 2);
                $this->SetFont('Arial', '', 10);
                $this->SetXY($center_col_x, $sig_block_start_y); // Tidak ada tanggal
                
                $this->SetX($center_col_x);
                $this->Cell($col_width, $line_height_sig_text, 'PENGURUS CABANG', 0, 1, 'C'); 
                $this->SetX($center_col_x);
                $this->Cell($col_width, $line_height_sig_text, 'FORUM BARIS INDONESIA', 0, 1, 'C');
                $this->SetX($center_col_x);       
                $this->Cell($col_width, $line_height_sig_text, mb_strtoupper($data['city_name'] ?? '', 'UTF-8'), 0, 1, 'C'); // Nama kota/kabupaten

                $sig_y_pos = $this->GetY();
                if (file_exists($this->signature_path) && !empty($this->signature_path)) {
                    list($sig_w_px, $sig_h_px) = @getimagesize($this->signature_path);
                    if($sig_w_px > 0) {
                        $ratio_sig = $sig_h_px / $sig_w_px;
                        $final_sig_w = $sig_image_width;
                        $final_sig_h = $sig_image_width * $ratio_sig;

                        if ($final_sig_h > $sig_image_height) {
                            $final_sig_h = $sig_image_height;
                            $final_sig_w = $sig_image_height / $ratio_sig;
                        }
                        $this->Image($this->signature_path, $center_col_x + ($col_width - $final_sig_w) / 2, $sig_y_pos, $final_sig_w, $final_sig_h);
                    }
                }
                
                $this->SetFont('Arial', 'U', 11);
                $current_y_after_sig = $sig_y_pos + $sig_image_height + $spacing_after_sig_image;
                $this->SetXY($center_col_x, $current_y_after_sig);
                $this->Cell($col_width, $line_height_sig_text, mb_strtoupper($this->ketua_umum_name, 'UTF-8'), 0, 1, 'C');
                $this->SetFont('Arial', '', 10);
                $this->SetX($center_col_x);
                $this->Cell($col_width, $line_height_sig_text, 'Ketua', 0, 1, 'C');

            } elseif ($this->role_caller === 'pengda') {
                // KOLOM KIRI: Pengurus Daerah
                $left_col_x = 25; 
                $this->SetFont('Arial', '', 10);
                
                $this->SetXY($left_col_x, $sig_block_start_y + $offset_min_3vh); // Naikkan posisi blok
                $this->SetX($left_col_x);
                $this->Cell($col_width, $line_height_sig_text, 'PENGURUS DAERAH', 0, 1, 'C'); 
                $this->SetX($left_col_x);
                $this->Cell($col_width, $line_height_sig_text, 'FORUM BARIS INDONESIA', 0, 1, 'C');
                $this->SetX($left_col_x);
                $this->Cell($col_width, $line_height_sig_text, mb_strtoupper($data['province_name'] ?? '', 'UTF-8'), 0, 1, 'C'); // Nama provinsi

                
                $sig_pengda_y_pos = $this->GetY();
                if (file_exists($this->signature_path) && !empty($this->signature_path)) {
                    list($sig_w_px, $sig_h_px) = @getimagesize($this->signature_path);
                    if($sig_w_px > 0) {
                        $ratio_sig = $sig_h_px / $sig_w_px;
                        $final_sig_w = $sig_image_width;
                        $final_sig_h = $sig_image_width * $ratio_sig;

                        if ($final_sig_h > $sig_image_height) {
                            $final_sig_h = $sig_image_height;
                            $final_sig_w = $sig_image_height / $ratio_sig;
                        }
                        $this->Image($this->signature_path, $left_col_x + ($col_width - $final_sig_w) / 2, $sig_pengda_y_pos, $final_sig_w, $final_sig_h);
                    }
                }
                if (file_exists($this->stamp_path) && !empty($this->stamp_path)) {
                    list($stamp_w_px, $stamp_h_px) = @getimagesize($this->stamp_path);
                    if($stamp_w_px > 0) {
                        $ratio_stamp = $stamp_h_px / $stamp_w_px;
                        $final_stamp_h = min($stamp_image_width * $ratio_stamp, $stamp_image_height);
                        $final_stamp_w = $final_stamp_h / $ratio_stamp;
                        $this->Image($this->stamp_path, $left_col_x + ($col_width - $final_stamp_w) / 2 - 10, $sig_pengda_y_pos - 5, $final_stamp_w, $final_stamp_h);
                    }
                }

                $this->SetFont('Arial', 'U', 11);
                $current_y_after_pengda_sig = $sig_pengda_y_pos + $sig_image_height + $spacing_after_sig_image;
                $this->SetXY($left_col_x, $current_y_after_pengda_sig);
                $this->Cell($col_width, $line_height_sig_text, mb_strtoupper($this->ketua_umum_name, 'UTF-8'), 0, 1, 'C');
                $this->SetFont('Arial', '', 10);
                $this->SetX($left_col_x);
                $this->Cell($col_width, $line_height_sig_text, 'Ketua', 0, 1, 'C');

                // KOLOM KANAN: Pengurus Cabang
                $right_col_x = $this->GetPageWidth() - $col_width - 25; 
                $this->SetFont('Arial', '', 10);

                $this->SetXY($right_col_x, $sig_block_start_y + $offset_min_3vh); // Naikkan posisi blok
                $this->SetX($right_col_x);
                $this->Cell($col_width, $line_height_sig_text, 'PENGURUS CABANG', 0, 1, 'C'); 
                $this->SetX($right_col_x);
                $this->Cell($col_width, $line_height_sig_text, 'FORUM BARIS INDONESIA', 0, 1, 'C');
                $this->SetX($right_col_x);
                $this->Cell($col_width, $line_height_sig_text, mb_strtoupper($data['city_name'] ?? '', 'UTF-8'), 0, 1, 'C'); // Nama kota/kabupaten

                
                $sig_pengcab_y_pos = $this->GetY();
                if ($this->signature_pengcab_path_for_pdf && file_exists($this->signature_pengcab_path_for_pdf)) {
                    list($sig_w_px, $sig_h_px) = @getimagesize($this->signature_pengcab_path_for_pdf);
                    if($sig_w_px > 0) {
                        $ratio_sig = $sig_h_px / $sig_w_px;
                        $final_sig_h = min($sig_image_width * $ratio_sig, $sig_image_height); 
                        $final_sig_w = $final_sig_h / $ratio_sig;
                        $this->Image($this->signature_pengcab_path_for_pdf, $right_col_x + ($col_width - $final_sig_w) / 2, $sig_pengcab_y_pos, $final_sig_w, $final_sig_h);
                    }
                }
                
                if ($this->stamp_pengcab_path_for_pdf && file_exists($this->stamp_pengcab_path_for_pdf)) {
                    list($stamp_w_px, $stamp_h_px) = @getimagesize($this->stamp_pengcab_path_for_pdf);
                    if($stamp_w_px > 0) {
                        $ratio_stamp = $stamp_h_px / $stamp_w_px;
                        $final_stamp_h = min($stamp_image_width * $ratio_stamp, $stamp_image_height);
                        $final_stamp_w = $final_stamp_h / $ratio_stamp;
                        $this->Image($this->stamp_pengcab_path_for_pdf, $right_col_x + ($col_width - $final_stamp_w) / 2 - 10, $sig_pengcab_y_pos - 5, $final_stamp_w, $final_stamp_h);
                    }
                }
                
                $this->SetFont('Arial', 'U', 11);
                $current_y_after_pengcab = $sig_pengcab_y_pos + $sig_image_height + $spacing_after_sig_image;
                $this->SetXY($right_col_x, $current_y_after_pengcab);
                $this->Cell($col_width, $line_height_sig_text, mb_strtoupper($this->ketua_umum_name_pengcab_for_pdf, 'UTF-8'), 0, 1, 'C');
                $this->SetFont('Arial', '', 10);
                $this->SetX($right_col_x);
                $this->Cell($col_width, $line_height_sig_text, 'Ketua', 0, 1, 'C');

            } elseif ($this->role_caller === 'pb') {
                // Kolom KIRI: Pengurus Daerah
                $left_col_x = 25; 
                $this->SetFont('Arial', '', 10);
                
                $this->SetXY($left_col_x, $sig_block_start_y + $offset_min_3vh); // Naikkan posisi blok
                $this->SetX($left_col_x);
                $this->Cell($col_width, $line_height_sig_text, 'PENGURUS DAERAH', 0, 1, 'C'); // Baris pertama
                $this->SetX($left_col_x);
                $this->Cell($col_width, $line_height_sig_text, 'FORUM BARIS INDONESIA', 0, 1, 'C');
                $this->SetX($left_col_x);
                $this->Cell($col_width, $line_height_sig_text, mb_strtoupper($data['province_name'] ?? '', 'UTF-8'), 0, 1, 'C'); // Nama provinsi

                
                $sig_pengda_y_pos = $this->GetY();
                if ($this->signature_pengda_path_for_pdf && file_exists($this->signature_pengda_path_for_pdf)) {
                    list($sig_w_px, $sig_h_px) = @getimagesize($this->signature_pengda_path_for_pdf);
                    if($sig_w_px > 0) {
                        $ratio_sig = $sig_h_px / $sig_w_px;
                        $final_sig_h = min($sig_image_width * $ratio_sig, $sig_image_height);
                        $final_sig_w = $final_sig_h / $ratio_sig;
                        $this->Image($this->signature_pengda_path_for_pdf, $left_col_x + ($col_width - $final_sig_w) / 2, $sig_pengda_y_pos, $final_sig_w, $final_sig_h);
                    }
                }
                if (file_exists($this->stamp_pengda_path_for_pdf) && !empty($this->stamp_pengda_path_for_pdf)) {
                    list($stamp_w_px, $stamp_h_px) = @getimagesize($this->stamp_pengda_path_for_pdf);
                    if($stamp_w_px > 0) {
                        $ratio_stamp = $stamp_h_px / $stamp_w_px;
                        $final_stamp_h = min($stamp_image_width * $ratio_stamp, $stamp_image_height);
                        $final_stamp_w = $final_stamp_h / $ratio_stamp;
                        $this->Image($this->stamp_pengda_path_for_pdf, $left_col_x + ($col_width - $final_stamp_w) / 2 - 10, $sig_pengda_y_pos - 5, $final_stamp_w, $final_stamp_h);
                    }
                }

                $this->SetFont('Arial', 'U', 11);
                $current_y_after_pengda = $sig_pengda_y_pos + $sig_image_height + $spacing_after_sig_image;
                $this->SetXY($left_col_x, $current_y_after_pengda);
                $this->Cell($col_width, $line_height_sig_text, mb_strtoupper($this->ketua_umum_name_pengda_for_pdf, 'UTF-8'), 0, 1, 'C');
                $this->SetFont('Arial', '', 10);
                $this->SetX($left_col_x);
                $this->Cell($col_width, $line_height_sig_text, 'Ketua', 0, 1, 'C');


                // Kolom KANAN: Pengurus Cabang
                $right_col_x = $this->GetPageWidth() - $col_width - 25; 
                $this->SetFont('Arial', '', 10);
                
                $this->SetXY($right_col_x, $sig_block_start_y + $offset_min_3vh); // Naikkan posisi blok
                $this->SetX($right_col_x);
                $this->Cell($col_width, $line_height_sig_text, 'PENGURUS CABANG', 0, 1, 'C'); 
                $this->SetX($right_col_x);
                $this->Cell($col_width, $line_height_sig_text, 'FORUM BARIS INDONESIA', 0, 1, 'C');
                $this->SetX($right_col_x);
                $this->Cell($col_width, $line_height_sig_text, mb_strtoupper($data['city_name'] ?? '', 'UTF-8'), 0, 1, 'C'); // Nama kota/kabupaten

                
                $sig_pengcab_y_pos = $this->GetY();
                if ($this->signature_pengcab_path_for_pdf && file_exists($this->signature_pengcab_path_for_pdf)) {
                    list($sig_w_px, $sig_h_px) = @getimagesize($this->signature_pengcab_path_for_pdf);
                    if($sig_w_px > 0) {
                        $ratio_sig = $sig_h_px / $sig_w_px;
                        $final_sig_h = min($sig_image_width * $ratio_sig, $sig_image_height); 
                        $final_sig_w = $final_sig_h / $ratio_sig;
                        $this->Image($this->signature_pengcab_path_for_pdf, $right_col_x + ($col_width - $final_sig_w) / 2, $sig_pengcab_y_pos, $final_sig_w, $final_sig_h);
                    }
                }
                
                if ($this->stamp_pengcab_path_for_pdf && file_exists($this->stamp_pengcab_path_for_pdf)) {
                    list($stamp_w_px, $stamp_h_px) = @getimagesize($this->stamp_pengcab_path_for_pdf);
                    if($stamp_w_px > 0) {
                        $ratio_stamp = $stamp_h_px / $stamp_w_px;
                        $final_stamp_h = min($stamp_image_width * $ratio_stamp, $stamp_image_height);
                        $final_stamp_w = $final_stamp_h / $ratio_stamp;
                        $this->Image($this->stamp_pengcab_path_for_pdf, $right_col_x + ($col_width - $final_stamp_w) / 2 - 10, $sig_pengcab_y_pos - 5, $final_stamp_w, $final_stamp_h);
                    }
                }
                
                $this->SetFont('Arial', 'U', 11);
                $current_y_after_pengcab = $sig_pengcab_y_pos + $sig_image_height + $spacing_after_sig_image;
                $this->SetXY($right_col_x, $current_y_after_pengcab);
                $this->Cell($col_width, $line_height_sig_text, mb_strtoupper($this->ketua_umum_name_pengcab_for_pdf, 'UTF-8'), 0, 1, 'C');
                $this->SetFont('Arial', '', 10);
                $this->SetX($right_col_x);
                $this->Cell($col_width, $line_height_sig_text, 'Ketua', 0, 1, 'C');

                // Kolom KANAN BAWAH: Pengurus Besar
                $pb_y_text_start = $this->GetPageHeight() - 65; // Sesuaikan nilai ini sesuai kebutuhan, 70mm dari bawah halaman
                // 2. Geser sedikit ke kiri kolom tanda tangan Pengurus Besar sekitar 3vh
                $offset_3vh = 3 * $vh_to_mm; // 3vh dalam mm
                $margin_right_pb_shifted = 15 + $offset_3vh; // Margin awal 15mm + offset 3vh
                $pb_x_start = $this->GetPageWidth() - $col_width - $margin_right_pb_shifted; // Diperbarui untuk digeser ke kiri

                // Tambahkan tanggal approve PB
                $pb_approved_date_str = $data['approved_at_pb'] ?? date('Y-m-d H:i:s');
                $tanggal_approve_pb = 'Jakarta, ' . date('d', strtotime($pb_approved_date_str)) . ' ' . $this->getIndonesianMonth(date('n', strtotime($pb_approved_date_str))) . ' ' . date('Y', strtotime($pb_approved_date_str));
                $this->SetFont('Arial', '', 10);
                $this->SetXY($pb_x_start, $pb_y_text_start - 6);
                $this->Cell($col_width, $line_height_sig_text, $tanggal_approve_pb, 0, 1, 'C');

                $this->SetFont('Arial', '', 10);
                $this->SetXY($pb_x_start, $pb_y_text_start);
                $this->SetX($pb_x_start);
                $this->Cell($col_width, $line_height_sig_text, 'PENGURUS BESAR', 0, 1, 'C');
                $this->SetX($pb_x_start);
                $this->Cell($col_width, $line_height_sig_text, 'FORUM BARIS INDONESIA', 0, 1, 'C');

                $sig_pb_y_pos = $this->GetY();
                if (file_exists($this->signature_path) && !empty($this->signature_path)) {
                    list($sig_w_px, $sig_h_px) = @getimagesize($this->signature_path);
                    if($sig_w_px > 0) {
                        $ratio_sig = $sig_h_px / $sig_w_px;
                        $final_sig_h = min($sig_image_width * $ratio_sig, $sig_image_height);
                        $final_sig_w = $final_sig_h / $ratio_sig;
                        $this->Image($this->signature_path, $pb_x_start + ($col_width - $final_sig_w) / 2, $sig_pb_y_pos, $final_sig_w, $final_sig_h);
                    }
                }
                if (file_exists($this->stamp_path) && !empty($this->stamp_path)) {
                    list($stamp_w_px, $stamp_h_px) = @getimagesize($this->stamp_path);
                    if($stamp_w_px > 0) {
                        $ratio_stamp = $stamp_h_px / $stamp_w_px;
                        $final_stamp_h = min($stamp_image_width * $ratio_stamp, $stamp_image_height);
                        $final_stamp_w = $final_stamp_h / $ratio_stamp;
                        $this->Image($this->stamp_path, $pb_x_start + ($col_width - $final_stamp_w) / 2 - 10, $sig_pb_y_pos - 5, $final_stamp_w, $final_stamp_h);
                    }
                }

                $this->SetFont('Arial', 'U', 11);
                $current_y_after_pb_sig = $sig_pb_y_pos + $sig_image_height + $spacing_after_sig_image;
                $this->SetXY($pb_x_start, $current_y_after_pb_sig);
                $this->Cell($col_width, $line_height_sig_text, mb_strtoupper($this->ketua_umum_name, 'UTF-8'), 0, 1, 'C');
                $this->SetFont('Arial', '', 10);
                $this->SetX($pb_x_start);
                $this->Cell($col_width, $line_height_sig_text, 'Ketua Umum', 0, 1, 'C');

                // Menampilkan Logo User di sebelah kanan QR code (jika role adalah PB)
                if (!empty($this->logo_path) && file_exists($this->logo_path)) {
                    $logo_user_size = 30; // Sesuaikan ukuran logo user, bisa sama dengan QR code
                    $qr_code_size = 30;    // Ukuran QR code, ambil dari definisi Anda atau samakan
                    
                    // Posisi QR code yang sudah ada di bagian GenerateKTA():
                    $qr_code_x_actual = 15; // Ambil nilai x QR code yang sudah ada
                    $qr_code_y_actual = $this->GetPageHeight() - $qr_code_size - 30; // Ambil nilai y QR code yang sudah ada

                    // Hitung posisi X untuk logo user agar berada di kanan QR code
                    $margin_between_qr_logo = 5; 
                    $logo_user_x = $qr_code_x_actual + $qr_code_size + $margin_between_qr_logo;

                    // Posisikan logo user agar sejajar secara vertikal (tengah-tengah) dengan QR code
                    $logo_user_y = $qr_code_y_actual + (($qr_code_size - $logo_user_size) / 2); 
                    
                    try {
                        // Cek apakah logo masih di dalam batas halaman
                        if ($logo_user_x + $logo_user_size > $this->GetPageWidth() - 10 || $logo_user_y + $logo_user_size > $this->GetPageHeight() - 10) {
                            error_log("WARNING: Calculated logo position is too close to page edge or outside.");
                            // Anda bisa menyesuaikan ulang atau melewatkan jika posisinya tidak ideal
                        }

                        $this->Image($this->logo_path, $logo_user_x, $logo_user_y, $logo_user_size, $logo_user_size);
                        error_log("DEBUG: User logo successfully placed next to QR code at X: {$logo_user_x}, Y: {$logo_user_y}.");
                    } catch (Exception $e) {
                        error_log("ERROR: Failed to add user logo image (next to QR code): " . $e->getMessage());
                    }
                } else {
                    error_log("WARNING: User logo file not found or path empty when attempting to display (next to QR code): " . ($this->logo_path ?? 'empty path'));
                }
            } // end if ($this->role_caller === 'pb')
            
            // Tambahkan masa berlaku di paling bawah untuk KTA PB
            if ($this->role_caller === 'pb') {
                // Tentukan tahun berlaku berdasarkan tanggal approve PB
                $pb_approve_date = $data['approved_at_pb'] ?? date('Y-m-d');
                $tahun_berlaku = date('Y', strtotime($pb_approve_date));
                
                $this->SetY($this->GetPageHeight() - 15);
                $this->SetFont('Arial', 'I', 9);
                $this->SetTextColor(100, 100, 100);
                $this->Cell(0, 10, 'KTA ini berlaku sampai dengan 31 Desember ' . $tahun_berlaku, 0, 0, 'C');
            }
        }

        private function getIndonesianMonth($monthNum) {
            $months = [
                1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
                5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
                9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
            ];
            return $months[$monthNum] ?? '';
        }

        private function getCityAbbreviation($cityName) {
              $customAbbreviations = [
                // DKI Jakarta
                'JAKARTA PUSAT' => 'JKTP',
                'JAKARTA SELATAN' => 'JKTS',
                'JAKARTA BARAT' => 'JKTB',
                'JAKARTA UTARA' => 'JKTU',
                'JAKARTA TIMUR' => 'JKTT',
                'KEPULAUAN SERIBU' => 'KPS', 

                // Jawa Barat
                'BOGOR' => 'BGR',
                'BANDUNG' => 'BDG',
                'BANDUNG BARAT' => 'BDB',
                'DEPOK' => 'DPK',
                'BEKASI' => 'BKS',
                'CIREBON' => 'CBN',
                'SUKABUMI' => 'SKB',
                'TASIKMALAYA' => 'TSK',
                'GARUT' => 'GRT',
                'CIAMIS' => 'CMS',
                'KUNINGAN' => 'KNG',
                'INDRAMAYU' => 'IDM',
                'SUMEDANG' => 'SMD',
                'MAJALENGKA' => 'MJL',
                'SUBANG' => 'SBG',
                'PURWAKARTA' => 'PWK',
                'KARAWANG' => 'KRW',
                'CIMAHI' => 'CMH',
                'BANJAR' => 'BJR',

                // Banten
                'TANGERANG' => 'TGR',
                'TANGERANG SELATAN' => 'TGSL',
                'SERANG' => 'SRG',
                'CILEGON' => 'CGL',
                'LEBAK' => 'LBK',
                'PANDEGLANG' => 'PDG',

                // DI Yogyakarta
                'YOGYAKARTA' => 'YK',
                'BANTUL' => 'BTL',
                'SLEMAN' => 'SLM',
                'GUNUNGKIDUL' => 'GNK',
                'KULON PROGO' => 'KLP',

                // Jawa Tengah
                'SEMARANG' => 'SMG',
                'SURAKARTA' => 'SKT', // Solo
                'SALATIGA' => 'SLT',
                'MAGELANG' => 'MGL',
                'CILACAP' => 'CLP',
                'PURBALINGGA' => 'PBL',
                'BANJARNEGARA' => 'BNJ',
                'KEBUMEN' => 'KBM',
                'PURWOREJO' => 'PWR',
                'WONOSOBO' => 'WSB',
                'TEMANGGUNG' => 'TMG',
                'KENDAL' => 'KDL',
                'DEMAK' => 'DMK',
                'GROBOGAN' => 'GRB',
                'BLORA' => 'BLR',
                'REMBANG' => 'RBG',
                'PATI' => 'PTI',
                'KUDUS' => 'KDS',
                'JEPARA' => 'JPR',
                'PEKALONGAN' => 'PKL',
                'BATANG' => 'BTG',
                'TEGAL' => 'TGL',
                'BREBES' => 'BRB',
                'KLATEN' => 'KLT',
                'BOYOLALI' => 'BYL',
                'SRAGEN' => 'SGN',
                'KARANGANYAR' => 'KRY',
                'WONOGIRI' => 'WNG',
                'SUKOHARJO' => 'SKH',

                // Jawa Timur
                'SURABAYA' => 'SBY',
                'MALANG' => 'MLG',
                'BATU' => 'BTU',
                'KEDIRI' => 'KDR',
                'BLITAR' => 'BLT',
                'MADIUN' => 'MDN',
                'NGANJUK' => 'NJU',
                'MAGETAN' => 'MGT',
                'PONOROGO' => 'PNO',
                'TRENGGALEK' => 'TRG',
                'TULUNGAGUNG' => 'TLG',
                'LUMAJANG' => 'LMJ',
                'JEMBER' => 'JMB',
                'BANYUWANGI' => 'BYW',
                'PROBOLINGGO' => 'PBL',
                'PASURUAN' => 'PSR',
                'SIDOARJO' => 'SDA',
                'MOJOKERTO' => 'MJK',
                'JOMBANG' => 'JBG',
                'LAMONGAN' => 'LMG',
                'TUBAN' => 'TBN',
                'BOJONEGORO' => 'BJN',
                'GRESIK' => 'GRS',
                'BANGKALAN' => 'BKL',
                'SAMPANG' => 'SPG',
                'PAMEKASAN' => 'PMK',
                'SUMENEP' => 'SMP',
                'BONDOWOSO' => 'BND',
                'SITUBONDO' => 'STB',
                'PACITAN' => 'PCT',

                // Bali
                'DENPASAR' => 'DPS',
                'BADUNG' => 'BDNG', // Dibuat unik untuk membedakan dengan Bandung
                'BANGLI' => 'BGL',
                'BULELENG' => 'BLL',
                'GIANYAR' => 'GYR',
                'JEMBRANA' => 'JMBR',
                'KARANGASEM' => 'KGM',
                'KLUNGKUNG' => 'KLK',
                'TABANAN' => 'TBNN',

                // Sumatra Utara
                'MEDAN' => 'MDN',
                'DELI SERDANG' => 'DLS',
                'LANGKAT' => 'LKT',
                'SERDANG BEDAGAI' => 'SDB',
                'ASAHAN' => 'ASH',
                'KARO' => 'KRO',
                'PEMATANG SIANTAR' => 'PSR',
                'SIBBOLGA' => 'SBL',
                'TANJUNG BALAI' => 'TJB',
                'BINJAI' => 'BNJ',
                'TEBING TINGGI' => 'TTG',
                'PADANGSIDIMPUAN' => 'PSP',
                'NIAS' => 'NIAS',
                'LABUHANBATU' => 'LBH',

                // Sumatra Selatan
                'PALEMBANG' => 'PLB',
                'BANYUASIN' => 'BYS',
                'OGAN KOMERING ILIR' => 'OKI',
                'OGAN KOMERING ULU' => 'OKU',
                'LAHAT' => 'LHT',
                'MUSI BANYUASIN' => 'MBS',
                'MUSI RAWAS' => 'MSR',
                'MUARA ENIM' => 'MRE',
                'PRABUMULIH' => 'PBLH',
                'LUBUKLINGGAU' => 'LLG',
                'PAGAR ALAM' => 'PGL',

                // Sulawesi Selatan
                'MAKASSAR' => 'MKS',
                'GOWA' => 'GWA',
                'MAROS' => 'MRS',
                'BONE' => 'BNE',
                'WAJO' => 'WJO',
                'LUWU' => 'LWU',
                'PAREPARE' => 'PRP',
                'PALOPO' => 'PLP',

                // Aceh
                'BANDA ACEH' => 'BCA',
                'LHOKSEUMAWE' => 'LSMW',
                'LANGSA' => 'LGS',
                'SABANG' => 'SBNG',
                'ACEH BESAR' => 'ACBSR',
                'ACEH UTARA' => 'ACU',
                'ACEH TIMUR' => 'ACT',
                'ACEH TENGAH' => 'ACN',
                'PIDIE' => 'PID',
                'BIREUEN' => 'BRN',

                // Riau
                'PEKANBARU' => 'PKBR',
                'DUMAI' => 'DMI',
                'INDRAGIRI HULU' => 'INH',
                'INDRAGIRI HILIR' => 'INHR', // Dibuat unik
                'BENGKALIS' => 'BKL',
                'SIAK' => 'SKK',

                // Jambi
                'JAMBI' => 'JMB',
                'MUARO JAMBI' => 'MRJ',
                'KERINCI' => 'KRN',

                // Lampung
                'BANDAR LAMPUNG' => 'BDL',
                'METRO' => 'MTR',
                'LAMPUNG SELATAN' => 'LPS',
                'LAMPUNG TENGAH' => 'LPT',

                // Kalimantan Timur
                'SAMARINDA' => 'SMD',
                'BALIKPAPAN' => 'BPN',
                'KUTAI KARTANEGARA' => 'KKG',
                'BONTANG' => 'BTG',

                // Kalimantan Selatan
                'BANJARMASIN' => 'BJM',
                'BANJARBARU' => 'BJB',
                'BANJAR' => 'BJR',

                // Nusa Tenggara Barat
                'MATARAM' => 'MTRM',
                'LOMBOK BARAT' => 'LKB',
                'LOMBOK TENGAH' => 'LKT',
                'LOMBOK TIMUR' => 'LKT', // Sama dengan Lombok Tengah, perlu dipertimbangkan keunikan
                'SUMBAWA' => 'SMW',

                // Nusa Tenggara Timur
                'KUPANG' => 'KPG',
                'FLORES TIMUR' => 'FLT',
                'ALOR' => 'ALR',

                // Papua
                'JAYAPURA' => 'JYP',
                'MERAUKE' => 'MRK',
                'TIMIKA' => 'TMC',
                'SORONG' => 'SRG',
                'NABIRE' => 'NBR',

                // Lain-lain (umum)
                'PADANG' => 'PDG',
                'MANADO' => 'MND',
                'PONTIANAK' => 'PTK',
                'PALANGKARAYA' => 'PKY',
                'TARAKAN' => 'TRK',
                'TERNATE' => 'TTE',
                'AMBON' => 'AMB',
                'GORONTALO' => 'GRL',
                'PALU' => 'PLU',
                'KENDARI' => 'KDI',
                'MALANG' => 'MLG',
                'CILEGON' => 'CGL',
                'BATAM' => 'BTM',
                'PANGKALPINANG' => 'PKP',
                'TANJUNG PINANG' => 'TPP',
                'TERNATE' => 'TTE',
                'SOFIFI' => 'SFF',
                'MAMUJU' => 'MJJ',
                'KENDARI' => 'KDI',
                'KUPANG' => 'KPG',
                'AMBON' => 'AMB',
                'MANOKWARI' => 'MKW',
                'JAYAPURA' => 'JYP',
                'MERAUKE' => 'MRK',
                'SORONG' => 'SRG',
                'TIMIKA' => 'TMC',
                'FAKFAK' => 'FKF',
                'BINTUNI' => 'BTN',
                'WASIOR' => 'WSR',
                'SERAM BAGIAN BARAT' => 'SBB',
                'SERAM BAGIAN TIMUR' => 'SBT',
                'KEPULAUAN ARU' => 'KPA',
                'BURU' => 'BRU',
                'KEPULAUAN TANIMBAR' => 'KPT',
                'MALUKU TENGGARA' => 'MLT',
                'MALUKU TENGAH' => 'MLH',
                'MALUKU BARAT DAYA' => 'MBD',
                'MALUKU TENGGARA BARAT' => 'MTB',
                'TUAL' => 'TUL',
                'DOMPU' => 'DMP',
                'BIMA' => 'BMA',
                'SUMBA BARAT' => 'SMB',
                'SUMBA TIMUR' => 'SMT',
                'SUMBA TENGAH' => 'SMH',
                'SUMBA BARAT DAYA' => 'SBD',
                'NGADA' => 'NGD',
                'ENDE' => 'END',
                'SIKKA' => 'SKK',
                'NAGEKEO' => 'NGK',
                'MANGGARAI' => 'MGR',
                'MANGGARAI BARAT' => 'MGB',
                'MANGGARAI TIMUR' => 'MGT',
                'ROTE NDAO' => 'RND',
                'SABU RAIJUA' => 'SRJ',
                'TIMOR TENGAH SELATAN' => 'TTS',
                'TIMOR TENGAH UTARA' => 'TTU',
                'BELU' => 'BLU',
                'MALAKA' => 'MLK',
                'LOMBOK UTARA' => 'LKU',
                'KOTABARU' => 'KTB',
                'TANAH LAUT' => 'TNL',
                'TAPIN' => 'TPN',
                'HULU SUNGAI SELATAN' => 'HSS',
                'HULU SUNGAI TENGAH' => 'HST',
                'HULU SUNGAI UTARA' => 'HSU',
                'TABALONG' => 'TBL',
                'TANAH BUMBU' => 'TBU',
                'BALANGAN' => 'BLG',
                'BARITO KUALA' => 'BRK',
                'KUTAI BARAT' => 'KBB',
                'KUTAI TIMUR' => 'KTM',
                'BERAU' => 'BRA',
                'PASER' => 'PSR',
                'PENAJAM PASER UTARA' => 'PPU',
                'MAHAKAM ULU' => 'MHL',
                'NUNUKAN' => 'NNK',
                'MALINAU' => 'MLN',
                'BULUNGAN' => 'BLG',
                'TANA TIDUNG' => 'TTD',
                'KAYONG UTARA' => 'KYU',
                'KUBU RAYA' => 'KBR',
                'LANDAK' => 'LND',
                'KETAPANG' => 'KTP',
                'SANGGAU' => 'SGU',
                'SINTANG' => 'STG',
                'KAPUAS HULU' => 'KPH',
                'BENGKAYANG' => 'BKY',
                'SAMBAS' => 'SMB',
                'MEMPAWAH' => 'MPW',
                'SEKADAU' => 'SKD',
                'MELAWAI' => 'MLW',
                'SINGKAWANG' => 'SKW',
                'BARITO SELATAN' => 'BRS',
                'BARITO TIMUR' => 'BRT',
                'BARITO UTARA' => 'BRU',
                'KATINGAN' => 'KTN',
                'KOTAWARINGIN BARAT' => 'KOB',
                'KOTAWARINGIN TIMUR' => 'KOT',
                'LAMANDAU' => 'LMD',
                'MURUNG RAYA' => 'MRR',
                'PULANG PISAU' => 'PLP',
                'SUKAMARA' => 'SKM',
                'SERUYAN' => 'SRY',
                'BELITUNG' => 'BLT',
                'BELITUNG TIMUR' => 'BLTT',
                'BANGKA' => 'BKA',
                'BANGKA BARAT' => 'BKB',
                'BANGKA SELATAN' => 'BKS',
                'BANGKA TENGAH' => 'BKT',
                'BENGKULU' => 'BKL',
                'BENGKULU UTARA' => 'BKU',
                'BENGKULU TENGAH' => 'BKTG',
                'BENGKULU SELATAN' => 'BKS',
                'KEPAHIANG' => 'KPH',
                'MUKOMUKO' => 'MKM',
                'REJANG LEBONG' => 'RLB',
                'SELUMA' => 'SLM',
                'LEBONG' => 'LBNG',
                'PESISIR BARAT' => 'PSB',
                'MESUJI' => 'MSJ',
                'LAMPUNG BARAT' => 'LPB',
                'LAMPUNG TIMUR' => 'LPTM',
                'LAMPUNG UTARA' => 'LPU',
                'PESAWARAN' => 'PSW',
                'PRINGSEWU' => 'PRW',
                'TANGGAMUS' => 'TGM',
                'WAY KANAN' => 'WYK',
                'LINGGA' => 'LNG',
                'NATUNA' => 'NTN',
                'KEPULAUAN ANAMBAS' => 'KPA',
                'BINTAN' => 'BTN',
                'KARIMUN' => 'KRM',
                'PELALAWAN' => 'PLW',
                'ROKAN HULU' => 'RKH',
                'ROKAN HILIR' => 'RKL',
                'KUANTAN SINGINGI' => 'KTS',
                'KEPULAUAN MERANTI' => 'KPM',
                'TEBO' => 'TBO',
                'BUNGO' => 'BGO',
                'TANJUNG JABUNG BARAT' => 'TJB',
                'TANJUNG JABUNG TIMUR' => 'TJT',
                'SAROLANGUN' => 'SRL',
                'MERANGIN' => 'MRG',
                'SUNGAI PENUH' => 'SPNH',
                'PADANG PARIAMAN' => 'PDP',
                'PESISIR SELATAN' => 'PSS',
                'PASAMAN' => 'PSM',
                'PASAMAN BARAT' => 'PSB',
                'AGAM' => 'AGM',
                'TANAH DATAR' => 'TND',
                'LIMA PULUH KOTA' => 'LPK',
                'PADANG PANJANG' => 'PDPG',
                'BUKITTINGGI' => 'BKTG',
                'SAWAHLUNTO' => 'SWL',
                'SOLOK' => 'SLK',
                'SOLOK SELATAN' => 'SLS',
                'SIJUNJUNG' => 'SJJ',
                'DHARMASRAYA' => 'DHR',
                'KEPULAUAN MENTAWAI' => 'KPMT',
                'PAYAKUMBUH' => 'PYK',
                'PADANG SIDEMPUAN' => 'PSP',
                'PADANG LAWAS' => 'PDL',
                'PADANG LAWAS UTARA' => 'PLU',
                'MANDAILING NATAL' => 'MNDL',
                'DAIRI' => 'DRI',
                'HUMBANG HASUNDUTAN' => 'HSD',
                'SAMOSIR' => 'SMS',
                'TOBA' => 'TBA',
                'PAKPAK BHARAT' => 'PKB',
                'LABUHANBATU SELATAN' => 'LBS',
                'LABUHANBATU UTARA' => 'LBU',
                'GUNUNGSITOLI' => 'GNS',
                'NIAS UTARA' => 'NSU',
                'NIAS SELATAN' => 'NSS',
                'NIAS BARAT' => 'NSB',
                'SIMALUNGUN' => 'SMGN',
                'TAPANULI UTARA' => 'TPU',
                'TAPANULI TENGAH' => 'TPT',
                'TAPANULI SELATAN' => 'TPS',
                'TOBA SAMOSIR' => 'TOS',
                'BATU BARA' => 'BBR',
                'ACEH JAYA' => 'ACJ',
                'ACEH TAMIANG' => 'ACTM',
                'GAYO LUES' => 'GLL',
                'ACEH TENGGARA' => 'ACTG',
                'ACEH SINGKIL' => 'ASL',
                'ACEH BARAT' => 'ACB',
                'ACEH BARAT DAYA' => 'ABD',
                'ACEH SELATAN' => 'ACS',
                'SUBULUSSALAM' => 'SBLS',
                'LHOKSUKON' => 'LKSK', // Ibu Kota Aceh Utara
                'TAPAKTUAN' => 'TPK', // Ibu Kota Aceh Selatan
                'MEULABOH' => 'MLB', // Ibu Kota Aceh Barat
                'KUTACANE' => 'KTC', // Ibu Kota Aceh Tenggara
                'SINABANG' => 'SNB', // Ibu Kota Simeulue
                'SIMEULUE' => 'SML',
                'NAGAN RAYA' => 'NGR',
                'BENER MERIAH' => 'BNM',
                'PIDIE JAYA' => 'PDJ',
                'JANTHO' => 'JNT', // Ibu Kota Aceh Besar
                'SIGLI' => 'SGL', // Ibu Kota Pidie
                'BLANGKEJEREN' => 'BLK', // Ibu Kota Gayo Lues
                'KARANG BARU' => 'KNGN', // Ibu Kota Aceh Tamiang
                'TAKENGON' => 'TKG', // Ibu Kota Aceh Tengah
                'IDI RAYEUK' => 'IDR', // Ibu Kota Aceh Timur
                'SINGKIL' => 'SKL', // Ibu Kota Aceh Singkil
                'SAMPIT' => 'SMP', // Ibu Kota Kotawaringin Timur
                'PEMATANG REBA' => 'PMR', // Ibu Kota Indragiri Hulu
            ];

            $originalCityName = strtoupper($cityName);
            $processedCityName = $originalCityName;
            $prefix = '';
            if (strpos($processedCityName, 'KABUPATEN ') === 0) {
                $prefix = 'KAB';
                $processedCityName = substr($processedCityName, strlen('KABUPATEN '));
            } elseif (strpos($processedCityName, 'KOTA ') === 0) {
                $prefix = 'KOT';
                $processedCityName = substr($processedCityName, strlen('KOTA '));
            }
            if (isset($customAbbreviations[$processedCityName])) {
                return $prefix . $customAbbreviations[$processedCityName];
            }
            if (isset($customAbbreviations[$originalCityName])) {
                return $customAbbreviations[$originalCityName];
            }
            $parts = explode(' ', $processedCityName);
            $abbr = '';
            foreach ($parts as $part) {
                if (strlen($part) > 0) {
                    $abbr .= substr($part, 0, 1);
                }
            }
            if (empty($abbr)) {
                return $prefix . substr(str_replace(' ', '', $originalCityName), 0, 3);
            }
            return $prefix . substr($abbr, 0, 5);
        }
    }

    // 16. Inisialisasi dan Generate PDF
    $pdf = new KTA_PDF(
        $kta_background_template_path,
        $user_logo_full_path, // Path logo user, akan null jika file tidak ditemukan
        $signature_full_path_file,
        $stamp_full_path_file, // Ini akan null untuk Pengcab
        $ketua_umum_name,
        $kta_title_main,
        $kta_title_sub,
        $app_data,
        $role_caller,
        $barcode_filepath,
        $unique_barcode_id,
        $signature_image_path_pengcab_for_pdf, // Ini sudah jadi fullpath dari bagian 11
        $stamp_image_path_pengcab_for_pdf,       // Ini akan null untuk Pengcab
        $ketua_umum_name_pengcab_for_pdf,
        $signature_image_path_pengda_for_pdf,    // Ini sudah jadi fullpath dari bagian 11
        $stamp_image_path_pengda_for_pdf,        // Ini sudah jadi fullpath dari bagian 11
        $ketua_umum_name_pengda_for_pdf
    );
    $pdf->GenerateKTA();

    // 17. Simpan PDF ke Server
    $pdf->Output($output_filepath, 'F');

    // 18. Hapus Gambar QR Code
    if ($role_caller === 'pb' && isset($barcode_filepath) && file_exists($barcode_filepath)) {
        @unlink($barcode_filepath);
    }

    // 19. Siapkan Respons Sukses
    $response['success'] = true;
    $response['message'] = "KTA PDF generated successfully by " . ucfirst($role_caller) . ".";
    $response['kta_url'] = $kta_pdf_full_url;

} catch (Exception $e) {
    // 20. Tangani Exception
    $response['message'] = "Error generating KTA PDF: " . $e->getMessage();
    error_log("PDF Generation Exception (Role: {$role_caller}): " . $e->getMessage());
    if (isset($output_filepath) && file_exists($output_filepath)) {
        @unlink($output_filepath);
    }
    if ($role_caller === 'pb' && isset($barcode_filepath) && file_exists($barcode_filepath)) {
        @unlink($barcode_filepath);
    }
} finally {
    // Pastikan koneksi database ditutup
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}

// 21. Kirim Respons JSON
header('Content-Type: application/json');
echo json_encode($response);

?>