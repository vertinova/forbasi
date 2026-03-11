-- =====================================================
-- FORBASI - SQL Script untuk Fitur Lisensi Pelatih & Juri
-- Jalankan script ini di phpMyAdmin Hostinger
-- =====================================================

-- Pilih database (sesuaikan dengan nama database Anda)
-- USE nama_database_anda;

-- -----------------------------------------------------
-- Table: license_users (Akun untuk pelatih/juri)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `license_users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(100) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NULL,
    `role` ENUM('pelatih', 'juri') NOT NULL,
    `is_active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `last_login` TIMESTAMP NULL,
    INDEX `idx_username` (`username`),
    INDEX `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: license_applications (Pengajuan lisensi)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `license_applications` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    
    -- Personal Information
    `nama_lengkap` VARCHAR(255) NOT NULL,
    `alamat` TEXT NOT NULL,
    `jenis_lisensi` ENUM('pelatih', 'juri_muda', 'juri_madya') NOT NULL,
    `no_telepon` VARCHAR(20) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    
    -- File uploads
    `pas_foto` VARCHAR(500) NOT NULL COMMENT 'Path to photo with red background',
    `bukti_transfer` VARCHAR(500) NOT NULL COMMENT 'Path to transfer proof',
    `surat_rekomendasi_pengda` VARCHAR(500) NULL COMMENT 'Path to pengda recommendation letter (required for juri)',
    `surat_pengalaman` VARCHAR(500) NOT NULL COMMENT 'Path to experience certificate',
    
    -- Financial
    `biaya_lisensi` DECIMAL(10,2) NOT NULL,
    
    -- Status tracking
    `status` ENUM('pending', 'proses', 'approved', 'rejected') DEFAULT 'pending',
    `alasan_penolakan` TEXT NULL COMMENT 'Rejection reason if rejected',
    
    -- Approval info
    `approved_by` INT NULL COMMENT 'Admin PB who approved/rejected',
    `approved_at` TIMESTAMP NULL,
    
    -- Timestamps
    `submitted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_jenis_lisensi` (`jenis_lisensi`),
    INDEX `idx_submitted_at` (`submitted_at`),
    
    -- Foreign Keys
    FOREIGN KEY (`user_id`) REFERENCES `license_users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table: license_events (Event/jadwal lisensi)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `license_events` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `event_name` VARCHAR(255) NOT NULL,
    `event_date` DATE NOT NULL,
    `event_time` VARCHAR(50) NOT NULL,
    `event_location` VARCHAR(255) NOT NULL,
    `biaya_pelatih` DECIMAL(10,2) NOT NULL DEFAULT 750000,
    `biaya_juri` DECIMAL(10,2) NOT NULL DEFAULT 2000000,
    `is_active` TINYINT(1) DEFAULT 1,
    `registration_open` TINYINT(1) DEFAULT 1,
    `max_participants` INT NULL,
    `description` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Insert Event Default (Minggu, 12 April 2026)
-- -----------------------------------------------------
INSERT INTO `license_events` (
    `event_name`, 
    `event_date`, 
    `event_time`, 
    `event_location`, 
    `biaya_pelatih`, 
    `biaya_juri`, 
    `description`
) VALUES (
    'Lisensi Pelatih dan Juri (Muda dan Madya)',
    '2026-04-12',
    '08.00 WIB s/d selesai',
    'Semarang, Jawa Tengah',
    750000,
    2000000,
    'Sehubungan dengan akan dilaksanakannya Lisensi Pelatih dan Juri (Muda dan Juri Madya)'
);

-- =====================================================
-- SELESAI
-- =====================================================
-- Setelah menjalankan script ini:
-- 1. Buat folder di server: php/uploads/lisensi/
-- 2. Buat subfolder: pas_foto/, bukti_transfer/, surat_rekomendasi/, surat_pengalaman/
-- 3. Set permission folder: 755 atau 775
-- =====================================================
