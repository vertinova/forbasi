<?php
// generate_kta_pdf.php

// Pastikan error tidak ditampilkan langsung ke output HTTP,
// tetapi tetap dicatat ke log (error_log atau php_error_log.txt)
ini_set('display_errors', 0);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php_error_log.txt'); // Catat error ke file di folder ini

// Tingkatkan batas memori dan waktu eksekusi jika perlu, terutama untuk gambar besar atau operasi kompleks
ini_set('memory_limit', '256M');
set_time_limit(300); // 5 menit

require('fpdf186/fpdf.php'); // Path ke file fpdf.php
require_once 'db_config.php'; // Pastikan file ini berisi koneksi database yang benar

// Initial response array (for JSON output in case of script failure)
$response = ['success' => false, 'message' => ''];

if (!isset($conn) || $conn->connect_error) {
    $response['message'] = "Database connection error: " . $conn->connect_error;
    error_log("Database connection error in generate_kta_pdf.php: " . $conn->connect_error);
    header('Content-Type: application/json'); // Ensure JSON header for error output
    echo json_encode($response);
    exit();
}

// Hanya izinkan akses POST dari internal server
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    $response['message'] = "Invalid request method.";
    error_log("Invalid request method to generate_kta_pdf.php. Must be POST.");
    header('Content-Type: application/json'); // Ensure JSON header for error output
    echo json_encode($response);
    exit();
}

$application_id = filter_var($_POST['application_id'] ?? '', FILTER_VALIDATE_INT);
$admin_id = filter_var($_POST['admin_id'] ?? '', FILTER_VALIDATE_INT);
$role_caller = filter_var($_POST['role_caller'] ?? '', FILTER_SANITIZE_STRING); // Tambahan: Peran yang memanggil script ini

if ($application_id === false || $application_id <= 0 || $admin_id === false || $admin_id <= 0 || !in_array($role_caller, ['pengcab', 'pengda'])) {
    $response['message'] = "Invalid application ID, admin ID, or role caller. Provided: App ID: {$application_id}, Admin ID: {$admin_id}, Role: {$role_caller}.";
    error_log("Invalid parameters received by generate_kta_pdf.php: App ID: {$application_id}, Admin ID: {$admin_id}, Role: {$role_caller}.");
    header('Content-Type: application/json'); // Ensure JSON header for error output
    echo json_encode($response);
    exit();
}

try {
    // Ambil data aplikasi KTA
    $query_app = "SELECT ka.*, u.username AS user_full_name, u.email AS user_email, u.phone AS user_phone, 
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

    // Definisikan BASE_URL untuk PDF. Ini harus sama dengan BASE_URL di pengda.php dan pengcab.php
    define('BASE_URL_FOR_PDF', 'http://localhost/forbasi/php/');
    $upload_dir_relative = 'uploads/';
    $pengcab_kta_configs_subdir = 'pengcab_kta_configs/';
    $pengda_kta_configs_subdir = 'pengda_kta_configs/';
    
    // Path server root
    $server_root = $_SERVER['DOCUMENT_ROOT'];
    $php_forbasi_path = '/forbasi/php/'; // PASTIKAN INI SAMA DENGAN STRUKTUR SERVER ANDA

    // Inisialisasi variabel config
    $ketua_umum_name = '';
    $signature_image_path = '';
    $stamp_image_path = '';
    $generated_kta_subdir = ''; // Akan diset berdasarkan role_caller
    $db_update_column = ''; // Kolom yang akan diupdate di tabel kta_applications

    // Logika berdasarkan role_caller
    if ($role_caller === 'pengcab') {
        $query_config = "SELECT ketua_umum_name, signature_image_path, stamp_image_path FROM pengcab_kta_configs WHERE user_id = ?";
        $generated_kta_subdir = 'generated_kta/'; // Folder untuk KTA Pengcab
        $db_update_column = 'generated_kta_file_path';
        $kta_title_main = 'KARTU TANDA ANGGOTA';
        $kta_title_sub = 'PENGURUS CABANG';
    } elseif ($role_caller === 'pengda') {
        $query_config = "SELECT ketua_umum_name, signature_image_path, stamp_image_path FROM pengda_kta_configs WHERE user_id = ?";
        $generated_kta_subdir = 'generated_kta_pengda/'; // Folder untuk KTA Pengda
        $db_update_column = 'generated_kta_file_path_pengda';
        $kta_title_main = 'KARTU TANDA ANGGOTA';
        $kta_title_sub = 'PENGURUS BESAR'; // KTA Pengda diajukan ke PB
    }

    // Ambil konfigurasi KTA
    $stmt_config = $conn->prepare($query_config);
    if (!$stmt_config) {
        throw new Exception("Failed to prepare config query for {$role_caller}: " . $conn->error);
    }
    $stmt_config->bind_param("i", $admin_id);
    $stmt_config->execute();
    $result_config = $stmt_config->get_result();
    $config_data = $result_config->fetch_assoc();
    $stmt_config->close();

    // Pastikan konfigurasi KTA lengkap sebelum mencoba menghasilkan PDF
    if (!$config_data || empty($config_data['ketua_umum_name']) || empty($config_data['signature_image_path']) || empty($config_data['stamp_image_path'])) {
        throw new Exception("KTA configuration (Ketua Umum Name, Signature, or Stamp) for {$role_caller} ID {$admin_id} is incomplete. Please complete it first in your dashboard.");
    }

    $ketua_umum_name = $config_data['ketua_umum_name'];
    $signature_image_path = $config_data['signature_image_path'];
    $stamp_image_path = $config_data['stamp_image_path'];

    // Ambil konfigurasi KTA untuk Pengcab yang telah menyetujui sebelumnya (jika ini dari Pengda)
    $ketua_umum_name_pengcab_for_pdf = '___________________________'; // Default if not found
    $signature_image_path_pengcab_for_pdf = null;
    $stamp_image_path_pengcab_for_pdf = null;

    if ($role_caller === 'pengda' && !empty($app_data['approved_by_pengcab_id'])) {
        $query_config_pengcab = "SELECT ketua_umum_name, signature_image_path, stamp_image_path FROM pengcab_kta_configs WHERE user_id = ?";
        $stmt_config_pengcab = $conn->prepare($query_config_pengcab);
        if ($stmt_config_pengcab) {
            $stmt_config_pengcab->bind_param("i", $app_data['approved_by_pengcab_id']);
            $stmt_config_pengcab->execute();
            $result_config_pengcab = $stmt_config_pengcab->get_result();
            if ($config_data_pengcab = $result_config_pengcab->fetch_assoc()) {
                $ketua_umum_name_pengcab_for_pdf = $config_data_pengcab['ketua_umum_name'];
                $signature_image_path_pengcab_for_pdf = $config_data_pengcab['signature_image_path'];
                $stamp_image_path_pengcab_for_pdf = $config_data_pengcab['stamp_image_path'];
            }
            $stmt_config_pengcab->close();
        }
    }


    // Path ke template background
    $kta_background_template_path = $server_root . $php_forbasi_path . '../assets/kta_template_bg.png';

    // Path untuk tanda tangan dan stempel
    $signature_full_path_file = $server_root . $php_forbasi_path . $upload_dir_relative . (($role_caller === 'pengcab') ? $pengcab_kta_configs_subdir : $pengda_kta_configs_subdir) . $signature_image_path;
    $stamp_full_path_file = $server_root . $php_forbasi_path . $upload_dir_relative . (($role_caller === 'pengcab') ? $pengcab_kta_configs_subdir : $pengda_kta_configs_subdir) . $stamp_image_path;
    
    // Path untuk tanda tangan dan stempel Pengcab (jika dipanggil oleh Pengda)
    $signature_full_path_pengcab_file = null;
    $stamp_full_path_pengcab_file = null;
    if ($role_caller === 'pengda' && $signature_image_path_pengcab_for_pdf && $stamp_image_path_pengcab_for_pdf) {
        $signature_full_path_pengcab_file = $server_root . $php_forbasi_path . $upload_dir_relative . $pengcab_kta_configs_subdir . $signature_image_path_pengcab_for_pdf;
        $stamp_full_path_pengcab_file = $server_root . $php_forbasi_path . $upload_dir_relative . $pengcab_kta_configs_subdir . $stamp_image_path_pengcab_for_pdf;
    }


    $generated_kta_dir = $server_root . $php_forbasi_path . $upload_dir_relative . $generated_kta_subdir;

    // Pastikan direktori output PDF ada
    if (!is_dir($generated_kta_dir)) {
        if (!mkdir($generated_kta_dir, 0777, true)) {
            throw new Exception("Failed to create generated KTA directory: " . $generated_kta_dir . ". Check folder permissions.");
        }
    }
    if (!is_writable($generated_kta_dir)) {
        throw new Exception("Generated KTA directory is not writable: " . $generated_kta_dir . ". Check folder permissions.");
    }

    // Class untuk menghasilkan PDF KTA (disesuaikan untuk ukuran A4 Portrait, dengan tata letak yang rapi)
    class KTA_PDF extends FPDF {
        protected $kta_background_template_path;
        protected $signature_path;
        protected $stamp_path;
        protected $ketua_umum_name;
        protected $kta_title_main;
        protected $kta_title_sub;
        protected $app_data;
        protected $role_caller; // Tambahan untuk mengetahui role yang memanggil
        protected $signature_pengcab_path_for_pdf; // Hanya relevan jika role_caller adalah pengda
        protected $stamp_pengcab_path_for_pdf; // Hanya relevan jika role_caller adalah pengda
        protected $ketua_umum_name_pengcab_for_pdf; // Hanya relevan jika role_caller adalah pengda

        function __construct($kta_background, $signature, $stamp, $ketua_umum, $kta_main_title, $kta_sub_title, $app_data, $role_caller, $sig_pengcab = null, $stamp_pengcab = null, $ketua_pengcab = null) {
            parent::__construct('P', 'mm', 'A4'); // A4 Portrait
            $this->kta_background_template_path = $kta_background;
            $this->signature_path = $signature;
            $this->stamp_path = $stamp;
            $this->ketua_umum_name = $ketua_umum;
            $this->kta_title_main = $kta_main_title;
            $this->kta_title_sub = $kta_sub_title;
            $this->app_data = $app_data;
            $this->role_caller = $role_caller;
            $this->signature_pengcab_path_for_pdf = $sig_pengcab;
            $this->stamp_pengcab_path_for_pdf = $stamp_pengcab;
            $this->ketua_umum_name_pengcab_for_pdf = $ketua_pengcab;
            $this->SetMargins(0, 0, 0); // No default margins, manage positioning manually for exact layout
            $this->SetAutoPageBreak(false); // Manual page breaks
        }

        function Header() {
            // Header elements are drawn in GenerateKTA after background
        }

        function Footer() {
            // No footer for this KTA design
        }

        function GenerateKTA() {
            $data = $this->app_data;

            $this->AddPage();
            
            // TAMPILKAN BACKGROUND KTA (PENTING: Harus pertama agar elemen lain di atasnya)
            if (file_exists($this->kta_background_template_path)) {
                $this->Image($this->kta_background_template_path, 0, 0, $this->GetPageWidth(), $this->GetPageHeight());
            } else {
                error_log("KTA Background template not found at: " . $this->kta_background_template_path);
            }

            // --- Judul KTA ---
            $kta_title_y = 70; 

            $this->SetFont('Arial', 'B', 24);
            $this->SetTextColor(0, 0, 0);
            $this->SetXY(0, $kta_title_y);
            $this->Cell($this->GetPageWidth(), 12, $this->kta_title_main, 0, 1, 'C');

            $kta_title_y += 12;
            $this->SetFont('Arial', 'B', 16);
            $this->SetXY(0, $kta_title_y);
            $this->Cell($this->GetPageWidth(), 8, $this->kta_title_sub, 0, 1, 'C');
            
            $kta_title_y += 8;
            $this->SetXY(0, $kta_title_y);
            $this->Cell($this->GetPageWidth(), 8, 'FORUM BARIS INDONESIA', 0, 1, 'C');

            $kta_title_y += 10;
            $this->SetFont('Arial', '', 12);
            $this->SetXY(0, $kta_title_y);
            $this->Cell($this->GetPageWidth(), 7, 'MENETAPKAN', 0, 1, 'C');
            
            // PERUBAHAN: Naikkan Y awal informasi anggota untuk memberikan ruang lebih
            // Dari $current_y = $this->GetY() + 15; menjadi
            $current_y = $this->GetY() + 10; // Mengurangi 5mm dari asalnya


            // --- Informasi Anggota ---
            $this->SetFont('Arial', '', 11);
            $this->SetTextColor(0, 0, 0);

            $info_start_x = 55;
            $label_width = 45;
            $value_start_x = $info_start_x + $label_width + 5;
            $line_height_info = 8;

            // NAMA CLUB
            $this->SetXY($info_start_x, $current_y);
            $this->Cell($label_width, $line_height_info, 'NAMA CLUB', 0, 0, 'L');
            $this->SetX($value_start_x);
            $this->Cell(0, $line_height_info, ': ' . mb_strtoupper($data['club_name'] ?? '-', 'UTF-8'), 0, 1, 'L');
            $current_y = $this->GetY();

            // PENANGGUNG JAWAB
            $this->SetX($info_start_x);
            $this->Cell($label_width, $line_height_info, 'PENANGGUNG JAWAB', 0, 0, 'L');
            $this->SetX($value_start_x);
            $this->Cell(0, $line_height_info, ': ' . mb_strtoupper($data['leader_name'] ?? '-', 'UTF-8'), 0, 1, 'L');
            $current_y = $this->GetY();

            // ALAMAT
            $this->SetXY($info_start_x, $current_y);
            $this->Cell($label_width, $line_height_info, 'ALAMAT', 0, 0, 'L');
            $this->SetX($value_start_x);
            $address_text = mb_strtoupper($data['club_address'] ?? '-', 'UTF-8');
            // Jika alamat terlalu panjang, mungkin butuh disesuaikan ukuran font atau tinggi baris
            $this->MultiCell($this->GetPageWidth() - $value_start_x - 30, $line_height_info, ': ' . $address_text, 0, 'L'); 
            $current_y = $this->GetY();

            // PROVINSI
            $this->SetX($info_start_x);
            $this->Cell($label_width, $line_height_info, 'PROVINSI', 0, 0, 'L');
            $this->SetX($value_start_x);
            $this->Cell(0, $line_height_info, ': ' . mb_strtoupper($data['province_name'] ?? '-', 'UTF-8'), 0, 1, 'L');
            $current_y = $this->GetY();

            // KABUPATEN/KOTA
            $this->SetX($info_start_x);
            $this->Cell($label_width, $line_height_info, 'KABUPATEN/KOTA', 0, 0, 'L');
            $this->SetX($value_start_x);
            $this->Cell(0, $line_height_info, ': ' . mb_strtoupper($data['city_name'] ?? '-', 'UTF-8'), 0, 1, 'L');
            $current_y = $this->GetY();

            // SEBAGAI ANGGOTA
            $this->SetX($info_start_x);
            $this->Cell($label_width, $line_height_info, 'SEBAGAI ANGGOTA', 0, 0, 'L');
            $this->SetX($value_start_x);
            $this->Cell(0, $line_height_info, ': BIASA', 0, 1, 'L'); 
            $current_y = $this->GetY();

            // SEJAK TANGGAL
            $this->SetX($info_start_x);
            $this->Cell($label_width, $line_height_info, 'SEJAK TANGGAL', 0, 0, 'L');
            $approved_date_column = ($this->role_caller === 'pengcab') ? 'approved_at_pengcab' : 'approved_at_pengda';
            $approved_date_str = $data[$approved_date_column] ?? date('Y-m-d');
            $sejak_tanggal = date('d', strtotime($approved_date_str)) . ' ' .
                                 $this->getIndonesianMonth(date('n', strtotime($approved_date_str))) . ' ' .
                                 date('Y', strtotime($approved_date_str));
            $this->SetX($value_start_x);
            $this->Cell(0, $line_height_info, ': ' . mb_strtoupper($sejak_tanggal, 'UTF-8'), 0, 1, 'L');
            $current_y = $this->GetY();

            // NOMOR ANGGOTA
            $this->SetX($info_start_x);
            $this->SetFont('Arial', 'B', 11);
            $this->Cell($label_width, $line_height_info, 'NOMOR ANGGOTA', 0, 0, 'L');
            $tahun_persetujuan = date('Y', strtotime($data[$approved_date_column] ?? date('Y-m-d')));
            $city_name_for_abbr = $data['city_name'] ?? 'N/A';
            $city_abbr = $this->getCityAbbreviation($city_name_for_abbr);
            $padded_app_id = str_pad($data['id'] ?? '0', 3, '0', STR_PAD_LEFT);
            $member_number = "0{$padded_app_id}/FORBASI/{$city_abbr}/{$tahun_persetujuan}";
            $this->SetX($value_start_x);
            $this->Cell(0, $line_height_info, ': ' . $member_number, 0, 1, 'L');
            $current_y = $this->GetY();

            // --- Area Tanda Tangan ---
            // PERUBAHAN: Naikkan Y awal blok tanda tangan
            // Dari $sig_block_start_y = 220; menjadi
            $sig_block_start_y = 200; // Coba kurangi 20mm dari nilai asli 220mm

            $col_width = 80;
            $line_height_sig_text = 5;
            $sig_image_height = 20;
            $stamp_image_height = 25;
            $sig_image_width = 35;
            $stamp_image_width = 35;
            $spacing_after_sig_image = 5;
            $spacing_after_name_line = 3;
            
            if ($this->role_caller === 'pengcab') {
                // Posisi di tengah untuk Pengcab
                $center_col_x = ($this->GetPageWidth() / 2) - ($col_width / 2);
                $this->SetFont('Arial', '', 10);
                $this->SetXY($center_col_x, $sig_block_start_y);
                $this->Cell($col_width, $line_height_sig_text, 'Dikeluarkan Oleh:', 0, 1, 'C'); // Teks "Dikeluarkan Oleh:" di tengah
                $this->SetX($center_col_x);
                $this->Cell($col_width, $line_height_sig_text, 'Pengurus Cabang', 0, 1, 'C');
                $this->SetX($center_col_x);
                $this->Cell($col_width, $line_height_sig_text, 'Forum Baris Indonesia', 0, 1, 'C');

                $sig_y_pos = $sig_block_start_y + (3 * $line_height_sig_text);

                // Gambar TTD
                if (file_exists($this->signature_path) && !empty($this->signature_path)) {
                    list($sig_w_px, $sig_h_px) = @getimagesize($this->signature_path);
                    if ($sig_w_px !== false) {
                        $ratio_sig = $sig_h_px / $sig_w_px;
                        $calc_sig_h = $sig_image_width * $ratio_sig;
                        $final_sig_h = min($calc_sig_h, $sig_image_height);
                        $final_sig_w = $final_sig_h / $ratio_sig;
                        $this->Image($this->signature_path, $center_col_x + ($col_width - $final_sig_w) / 2, $sig_y_pos, $final_sig_w, $final_sig_h);
                    } else {
                        error_log("ERROR: Could not get image size for signature (Pengcab): " . $this->signature_path);
                    }
                }

                // Gambar Stempel
                if (file_exists($this->stamp_path) && !empty($this->stamp_path)) {
                    list($stamp_w_px, $stamp_h_px) = @getimagesize($this->stamp_path);
                    if ($stamp_w_px !== false) {
                        $ratio_stamp = $stamp_h_px / $stamp_w_px;
                        $calc_stamp_h = $stamp_image_width * $ratio_stamp;
                        $final_stamp_h = min($calc_stamp_h, $stamp_image_height);
                        $final_stamp_w = $final_stamp_h / $ratio_stamp;
                        $this->Image($this->stamp_path, $center_col_x + ($col_width - $final_stamp_w) / 2 - 10, $sig_y_pos - 5, $final_stamp_w, $final_stamp_h); 
                    } else {
                        error_log("ERROR: Could not get image size for stamp (Pengcab): " . $this->stamp_path);
                    }
                }
                
                // Nama Ketua Umum
                $this->SetFont('Arial', 'U', 11);
                $current_y_after_sig = $sig_y_pos + $sig_image_height + $spacing_after_sig_image;
                $this->SetXY($center_col_x, $current_y_after_sig);
                $this->Cell($col_width, $line_height_sig_text, mb_strtoupper($this->ketua_umum_name, 'UTF-8'), 0, 1, 'C');
                $this->SetFont('Arial', '', 10);
                $this->SetX($center_col_x);
                $this->Cell($col_width, $line_height_sig_text, 'Ketua', 0, 1, 'C');

            } elseif ($this->role_caller === 'pengda') {
                // KOLOM "Disahkan Oleh: Pengurus Daerah" (KIRI)
                $left_col_x = 25;
                $this->SetFont('Arial', '', 10);
                $this->SetXY($left_col_x, $sig_block_start_y);
                $this->Cell($col_width, $line_height_sig_text, 'Disahkan Oleh:', 0, 1, 'L');
                $this->SetX($left_col_x);
                $this->Cell($col_width, $line_height_sig_text, 'Pengurus Daerah', 0, 1, 'L');
                $this->SetX($left_col_x);
                $this->Cell($col_width, $line_height_sig_text, 'Forum Baris Indonesia', 0, 1, 'L');

                // Posisi Tanda Tangan dan Stempel Pengda
                $sig_pengda_y_pos = $sig_block_start_y + (3 * $line_height_sig_text);
                
                // Gambar TTD Pengda - Tetap di tengah kolom secara horizontal
                if (file_exists($this->signature_path) && !empty($this->signature_path)) {
                    list($sig_w_px, $sig_h_px) = @getimagesize($this->signature_path);
                    if ($sig_w_px !== false) {
                        $ratio_sig = $sig_h_px / $sig_w_px;
                        $calc_sig_h = $sig_image_width * $ratio_sig;
                        $final_sig_h = min($calc_sig_h, $sig_image_height);
                        $final_sig_w = $final_sig_h / $ratio_sig;
                        $this->Image($this->signature_path, $left_col_x + ($col_width - $final_sig_w) / 2, $sig_pengda_y_pos, $final_sig_w, $final_sig_h);
                    } else {
                        error_log("ERROR: Could not get image size for Pengda signature: " . $this->signature_path);
                    }
                }

                // Gambar Stempel Pengda - Pergeseran horizontal dan vertikal disesuaikan
                if (file_exists($this->stamp_path) && !empty($this->stamp_path)) {
                    list($stamp_w_px, $stamp_h_px) = @getimagesize($this->stamp_path);
                    if ($stamp_w_px !== false) {
                        $ratio_stamp = $stamp_h_px / $stamp_w_px;
                        $calc_stamp_h = $stamp_image_width * $ratio_stamp;
                        $final_stamp_h = min($calc_stamp_h, $stamp_image_height);
                        $final_stamp_w = $final_stamp_h / $ratio_stamp;

                        $this->Image($this->stamp_path, $left_col_x + ($col_width - $final_stamp_w) / 2 - 10, $sig_pengda_y_pos - 5, $final_stamp_w, $final_stamp_h); 
                    } else {
                        error_log("ERROR: Could not get image size for Pengda stamp: " . $this->stamp_path);
                    }
                }

                // Nama Ketua Pengda (di bawah tanda tangan)
                $this->SetFont('Arial', 'U', 11);
                $current_y_after_pengda_sig = $sig_pengda_y_pos + $sig_image_height + $spacing_after_sig_image;
                $this->SetXY($left_col_x, $current_y_after_pengda_sig); 
                $this->Cell($col_width, $line_height_sig_text, mb_strtoupper($this->ketua_umum_name, 'UTF-8'), 0, 1, 'C'); 
                $this->SetFont('Arial', '', 10);
                $this->SetX($left_col_x);
                $this->Cell($col_width, $line_height_sig_text, 'Ketua', 0, 1, 'C'); 


                // KOLOM "Didaftarkan Oleh: Pengurus Cabang" (KANAN)
                $right_col_x = $this->GetPageWidth() - $col_width - 25;
                $this->SetFont('Arial', '', 10);
                $this->SetXY($right_col_x, $sig_block_start_y);
                $this->Cell($col_width, $line_height_sig_text, 'Didaftarkan Oleh:', 0, 1, 'L');
                $this->SetX($right_col_x);
                $this->Cell($col_width, $line_height_sig_text, 'Pengurus Cabang', 0, 1, 'L');
                $this->SetX($right_col_x);
                $this->Cell($col_width, $line_height_sig_text, 'Forum Baris Indonesia', 0, 1, 'L');

                // Posisi Tanda Tangan dan Stempel Pengcab (jika ada)
                $sig_pengcab_y_pos = $sig_block_start_y + (3 * $line_height_sig_text);
                
                // Gambar TTD Pengcab
                if ($this->signature_pengcab_path_for_pdf && file_exists($this->signature_pengcab_path_for_pdf)) {
                    list($sig_w_px, $sig_h_px) = @getimagesize($this->signature_pengcab_path_for_pdf);
                    if ($sig_w_px !== false) {
                        $ratio_sig = $sig_h_px / $sig_w_px;
                        $calc_sig_h = $sig_image_width * $ratio_sig;
                        $final_sig_h = min($calc_sig_h, $sig_image_height);
                        $final_sig_w = $final_sig_h / $ratio_sig;
                        $this->Image($this->signature_pengcab_path_for_pdf, $right_col_x + ($col_width - $final_sig_w) / 2, $sig_pengcab_y_pos, $final_sig_w, $final_sig_h);
                    } else {
                        error_log("ERROR: Could not get image size for Pengcab signature (PDF generation for Pengda): " . $this->signature_pengcab_path_for_pdf);
                    }
                }

                // Gambar Stempel Pengcab
                if ($this->stamp_pengcab_path_for_pdf && file_exists($this->stamp_pengcab_path_for_pdf)) {
                    list($stamp_w_px, $stamp_h_px) = @getimagesize($this->stamp_pengcab_path_for_pdf);
                    if ($stamp_w_px !== false) {
                        $ratio_stamp = $stamp_h_px / $stamp_w_px;
                        $calc_stamp_h = $stamp_image_width * $ratio_stamp;
                        $final_stamp_h = min($calc_stamp_h, $stamp_image_height);
                        $final_stamp_w = $final_stamp_h / $ratio_stamp;

                        $this->Image($this->stamp_pengcab_path_for_pdf, $right_col_x + ($col_width - $final_stamp_w) / 2 - 10, $sig_pengcab_y_pos - 5, $final_stamp_w, $final_stamp_h); 
                    } else {
                        error_log("ERROR: Could not get image size for Pengcab stamp (PDF generation for Pengda): " . $this->stamp_pengcab_path_for_pdf);
                    }
                }
                
                // Nama Ketua Pengcab (di bawah tanda tangan)
                $this->SetFont('Arial', 'U', 11);
                $current_y_after_pengcab = $sig_pengcab_y_pos + $sig_image_height + $spacing_after_sig_image;
                $this->SetXY($right_col_x, $current_y_after_pengcab); 
                $this->Cell($col_width, $line_height_sig_text, mb_strtoupper($this->ketua_umum_name_pengcab_for_pdf, 'UTF-8'), 0, 1, 'C'); 
                $this->SetFont('Arial', '', 10);
                $this->SetX($right_col_x);
                $this->Cell($col_width, $line_height_sig_text, 'Ketua', 0, 1, 'C'); 


                // KOLOM "Dikeluarkan Oleh: Pengurus Besar" (DI BAWAH PENGURUS CABANG)
                // PERUBAHAN: Naikkan Y awal blok "Pengurus Besar"
                // Dari $pb_y_text_start = $current_y_after_pengcab + $line_height_sig_text + $spacing_after_name_line + 10; menjadi
                $pb_y_text_start = $current_y_after_pengcab + $line_height_sig_text + $spacing_after_name_line + 5; // Mengurangi 5mm
                $pb_x_start = $right_col_x; // Posisikan di kolom kanan, di bawah Pengcab

                $this->SetFont('Arial', '', 10);
                $this->SetXY($pb_x_start, $pb_y_text_start);
                $this->Cell($col_width, $line_height_sig_text, 'Dikeluarkan Oleh:', 0, 1, 'L');
                $this->SetX($pb_x_start);
                $this->Cell($col_width, $line_height_sig_text, 'Pengurus Besar', 0, 1, 'L');
                $this->SetX($pb_x_start);
                $this->Cell($col_width, $line_height_sig_text, 'Forum Baris Indonesia', 0, 1, 'L');

                // Placeholder for TTD/Stempel/Nama Ketua Umum PB
                $this->SetY($this->GetY() + 15);
                $this->SetX($pb_x_start);
                $this->SetFont('Arial', 'U', 11);
                $this->Cell($col_width, $line_height_sig_text, '___________________________', 0, 1, 'C');
                $this->SetFont('Arial', '', 10);
                $this->SetX($pb_x_start);
                $this->Cell($col_width, $line_height_sig_text, 'Ketua Umum', 0, 1, 'C');
            }
        }

        // Helper untuk mendapatkan nama bulan dalam bahasa Indonesia
        private function getIndonesianMonth($monthNum) {
            $months = [
                1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
                5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
                9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
            ];
            return $months[$monthNum] ?? '';
        }

        // Helper untuk mendapatkan singkatan kota/kabupaten
        private function getCityAbbreviation($cityName) {
            // Daftar singkatan kustom (daftar Anda sebelumnya)
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

            $cityName = strtoupper($cityName);

            // Coba cari singkatan yang sudah ada di daftar kustom
            if (isset($customAbbreviations[$cityName])) {
                return $customAbbreviations[$cityName];
            }

            // Jika tidak ditemukan, coba hapus "KOTA " atau "KABUPATEN " dan cari lagi
            $cleanedCityName = str_replace(['KOTA ', 'KABUPATEN '], ['', ''], $cityName);
            if (isset($customAbbreviations[$cleanedCityName])) {
                return $customAbbreviations[$cleanedCityName];
            }
            
            // Jika masih tidak ditemukan, gunakan logika default (ambil huruf awal)
            $parts = explode(' ', $cleanedCityName);
            $abbr = '';
            foreach ($parts as $part) {
                if (strlen($part) > 0) {
                    $abbr .= substr($part, 0, 1);
                }
            }
            
            if (empty($abbr)) {
                // Fallback jika nama kota kosong atau tidak ada huruf awal yang bisa diambil
                return substr(str_replace(' ', '', $cleanedCityName), 0, 3);
            }
            
            // Batasi panjang singkatan agar tidak terlalu panjang
            return substr($abbr, 0, 5); 
        }
    }

    $pdf = new KTA_PDF(
        $kta_background_template_path,
        $signature_full_path_file,
        $stamp_full_path_file,
        $ketua_umum_name,
        $kta_title_main,
        $kta_title_sub,
        $app_data,
        $role_caller,
        $signature_full_path_pengcab_file, // Pass Pengcab signature for Pengda
        $stamp_full_path_pengcab_file,     // Pass Pengcab stamp for Pengda
        $ketua_umum_name_pengcab_for_pdf   // Pass Pengcab Ketua Umum name for Pengda
    );
    $pdf->GenerateKTA();

    // Generate a unique filename for the PDF
    $safe_club_name = preg_replace('/[^a-zA-Z0-9_ -]/', '', $app_data['club_name'] ?? 'unknown_club');
    $safe_club_name = str_replace(' ', '_', $safe_club_name);
    
    // Nama file disesuaikan dengan role_caller
    $output_prefix = ($role_caller === 'pengcab') ? 'KTA_Pengcab_' : 'KTA_Pengda_';
    $output_filename = $output_prefix . $safe_club_name . '_' . $application_id . '.pdf';
    $output_filepath = $generated_kta_dir . $output_filename;

    // Save PDF to a file on the server
    $pdf->Output($output_filepath, 'F');

    // Update database with the generated PDF path
    $relative_kta_path_for_db = $upload_dir_relative . $generated_kta_subdir . $output_filename;
    $update_kta_path_query = "UPDATE kta_applications SET {$db_update_column} = ? WHERE id = ?";
    $stmt_update_kta_path = $conn->prepare($update_kta_path_query);
    if ($stmt_update_kta_path) {
        $stmt_update_kta_path->bind_param("si", $relative_kta_path_for_db, $application_id);
        $stmt_update_kta_path->execute();
        $stmt_update_kta_path->close();
    } else {
        throw new Exception("Failed to update KTA path in DB for {$role_caller}: " . $conn->error);
    }

    $response['success'] = true;
    $response['message'] = "KTA PDF generated successfully by " . ucfirst($role_caller) . ".";
    $response['kta_url'] = BASE_URL_FOR_PDF . $relative_kta_path_for_db;

} catch (Exception $e) {
    $response['message'] = "Error generating KTA PDF by " . ucfirst($role_caller) . ": " . $e->getMessage();
    error_log("PDF Generation Exception (generate_kta_pdf.php - Role: {$role_caller}): " . $e->getMessage());
    if (isset($output_filepath) && file_exists($output_filepath)) {
        unlink($output_filepath);
        error_log("Partially generated PDF removed by {$role_caller}: " . $output_filepath);
    }
}

// Ensure the Content-Type header is set for the final JSON response
header('Content-Type: application/json');
echo json_encode($response);
?>