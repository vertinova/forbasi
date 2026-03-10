<?php
/**
 * Database Setup Script for License Applications (Lisensi Pelatih & Juri)
 * This script creates the necessary tables for coach and referee license applications
 * 
 * Event Details:
 * - Hari/tanggal: Minggu, 12 April 2026
 * - Pukul: 08.00 WIB s/d selesai
 * - Tempat: Semarang Jawa Tengah
 * 
 * Investasi:
 * - Pelatih: Rp. 750.000,-
 * - Juri: Rp. 2.000.000,-
 */

require_once __DIR__ . '/php/db_config.php';

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

echo "<h1>Setup Database Lisensi Pelatih & Juri</h1>";

// Create license_users table (untuk akun pelatih/juri)
$sql_license_users = "CREATE TABLE IF NOT EXISTS license_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) NULL,
    role ENUM('pelatih', 'juri') NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_username (username),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

if ($conn->query($sql_license_users) === TRUE) {
    echo "<p style='color: green;'>✓ Tabel license_users berhasil dibuat</p>";
} else {
    echo "<p style='color: red;'>✗ Error membuat tabel license_users: " . $conn->error . "</p>";
}

// Create license_applications table (untuk pengajuan lisensi)
$sql_license_applications = "CREATE TABLE IF NOT EXISTS license_applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    
    -- Personal Information
    nama_lengkap VARCHAR(255) NOT NULL,
    alamat TEXT NOT NULL,
    jenis_lisensi ENUM('pelatih', 'juri_muda', 'juri_madya') NOT NULL,
    no_telepon VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    
    -- File uploads
    pas_foto VARCHAR(500) NOT NULL COMMENT 'Path to photo with red background',
    bukti_transfer VARCHAR(500) NOT NULL COMMENT 'Path to transfer proof',
    surat_rekomendasi_pengda VARCHAR(500) NULL COMMENT 'Path to pengda recommendation letter (required for juri)',
    surat_pengalaman VARCHAR(500) NOT NULL COMMENT 'Path to experience certificate',
    
    -- Financial
    biaya_lisensi DECIMAL(10,2) NOT NULL,
    
    -- Status tracking
    status ENUM('pending', 'proses', 'approved', 'rejected') DEFAULT 'pending',
    alasan_penolakan TEXT NULL COMMENT 'Rejection reason if rejected',
    
    -- Approval info
    approved_by INT NULL COMMENT 'Admin PB who approved/rejected',
    approved_at TIMESTAMP NULL,
    
    -- Timestamps
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_jenis_lisensi (jenis_lisensi),
    INDEX idx_submitted_at (submitted_at),
    
    -- Foreign Keys
    FOREIGN KEY (user_id) REFERENCES license_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

if ($conn->query($sql_license_applications) === TRUE) {
    echo "<p style='color: green;'>✓ Tabel license_applications berhasil dibuat</p>";
} else {
    echo "<p style='color: red;'>✗ Error membuat tabel license_applications: " . $conn->error . "</p>";
}

// Create license_events table (untuk event/jadwal lisensi)
$sql_license_events = "CREATE TABLE IF NOT EXISTS license_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_name VARCHAR(255) NOT NULL,
    event_date DATE NOT NULL,
    event_time VARCHAR(50) NOT NULL,
    event_location VARCHAR(255) NOT NULL,
    biaya_pelatih DECIMAL(10,2) NOT NULL DEFAULT 750000,
    biaya_juri DECIMAL(10,2) NOT NULL DEFAULT 2000000,
    is_active TINYINT(1) DEFAULT 1,
    registration_open TINYINT(1) DEFAULT 1,
    max_participants INT NULL,
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

if ($conn->query($sql_license_events) === TRUE) {
    echo "<p style='color: green;'>✓ Tabel license_events berhasil dibuat</p>";
} else {
    echo "<p style='color: red;'>✗ Error membuat tabel license_events: " . $conn->error . "</p>";
}

// Insert default event (Minggu, 12 April 2026)
$check_event = $conn->query("SELECT COUNT(*) as cnt FROM license_events WHERE event_date = '2026-04-12'");
$event_exists = $check_event->fetch_assoc()['cnt'];

if ($event_exists == 0) {
    $insert_event = "INSERT INTO license_events (event_name, event_date, event_time, event_location, biaya_pelatih, biaya_juri, description) 
                     VALUES (
                         'Lisensi Pelatih dan Juri (Muda dan Madya)',
                         '2026-04-12',
                         '08.00 WIB s/d selesai',
                         'Semarang, Jawa Tengah',
                         750000,
                         2000000,
                         'Sehubungan dengan akan dilaksanakannya Lisensi Pelatih dan Juri (Muda dan Juri Madya)'
                     )";
    
    if ($conn->query($insert_event) === TRUE) {
        echo "<p style='color: green;'>✓ Event default (12 April 2026) berhasil ditambahkan</p>";
    } else {
        echo "<p style='color: red;'>✗ Error menambahkan event default: " . $conn->error . "</p>";
    }
} else {
    echo "<p style='color: blue;'>ℹ Event default (12 April 2026) sudah ada</p>";
}

// Create upload directories
$upload_dirs = [
    __DIR__ . '/php/uploads/lisensi/',
    __DIR__ . '/php/uploads/lisensi/pas_foto/',
    __DIR__ . '/php/uploads/lisensi/bukti_transfer/',
    __DIR__ . '/php/uploads/lisensi/surat_rekomendasi/',
    __DIR__ . '/php/uploads/lisensi/surat_pengalaman/'
];

echo "<h2>Membuat Direktori Upload</h2>";
foreach ($upload_dirs as $dir) {
    if (!is_dir($dir)) {
        if (mkdir($dir, 0755, true)) {
            echo "<p style='color: green;'>✓ Direktori dibuat: " . basename($dir) . "</p>";
        } else {
            echo "<p style='color: red;'>✗ Gagal membuat direktori: " . basename($dir) . "</p>";
        }
    } else {
        echo "<p style='color: blue;'>ℹ Direktori sudah ada: " . basename($dir) . "</p>";
    }
}

echo "<hr>";
echo "<h2>Setup Selesai!</h2>";
echo "<p>Anda sekarang dapat mengakses halaman pendaftaran lisensi.</p>";
echo "<p><a href='php/login.php'>Ke Halaman Login</a></p>";

$conn->close();
?>
