<?php
// setup_database.php
// File untuk setup database dan tabel kta_applications dengan struktur lengkap

// Konfigurasi database
$db_host = '127.0.0.1';
$db_username = 'root';
$db_password = '';
$db_name = 'forbasi_db';

// Membuat koneksi ke database
try {
    $conn = new PDO("mysql:host=$db_host", $db_username, $db_password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Membuat database jika belum ada
    $conn->exec("CREATE DATABASE IF NOT EXISTS $db_name CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "Database berhasil dibuat atau sudah ada.<br>";
    
    // Menggunakan database
    $conn->exec("USE $db_name");
    
    // Set SQL mode dan timezone
    $conn->exec("SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO'");
    $conn->exec("SET time_zone = '+00:00'");
    
    // Membuat tabel kta_applications
    $sql = "CREATE TABLE IF NOT EXISTS kta_applications (
        id INT(11) NOT NULL AUTO_INCREMENT,
        user_id INT(11) NOT NULL,
        club_name VARCHAR(255) NOT NULL,
        leader_name VARCHAR(255) NOT NULL,
        coach_name VARCHAR(255) NOT NULL,
        manager_name VARCHAR(255) NOT NULL,
        province VARCHAR(100) NOT NULL,
        regency VARCHAR(100) NOT NULL,
        club_address TEXT NOT NULL,
        province_id INT(11) DEFAULT NULL,
        city_id INT(11) DEFAULT NULL,
        logo_path VARCHAR(255) NOT NULL,
        ad_file_path VARCHAR(255) DEFAULT NULL,
        art_file_path VARCHAR(255) NOT NULL,
        sk_file_path VARCHAR(255) NOT NULL,
        payment_proof_path VARCHAR(255) NOT NULL,
        pergetA_payment_proof_path VARCHAR(255) DEFAULT NULL,
        status ENUM('pending','approved_pengcab','approved_pengda','approved_pb','rejected','kta_issued') DEFAULT 'pending',
        approved_by_pengcab_id INT(11) DEFAULT NULL,
        approved_at_pengcab TIMESTAMP NULL DEFAULT NULL,
        notes_pengcab TEXT DEFAULT NULL,
        pengcab_payment_proof_path VARCHAR(255) DEFAULT NULL,
        approved_by_pengda_id INT(11) DEFAULT NULL,
        approved_at_pengda TIMESTAMP NULL DEFAULT NULL,
        notes_pengda TEXT DEFAULT NULL,
        pengda_payment_proof_path VARCHAR(255) DEFAULT NULL,
        approved_by_pb_id INT(11) DEFAULT NULL,
        approved_at_pb TIMESTAMP NULL DEFAULT NULL,
        notes_pb TEXT DEFAULT NULL,
        kta_file_path VARCHAR(255) DEFAULT NULL,
        kta_issued_at TIMESTAMP NULL DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
        PRIMARY KEY (id),
        KEY user_id (user_id),
        KEY idx_kta_applications_status (status),
        KEY idx_kta_applications_user_id (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $conn->exec($sql);
    echo "Tabel kta_applications berhasil dibuat atau sudah ada.<br>";
    
    // Menambahkan data contoh
    $check_data = $conn->query("SELECT COUNT(*) FROM kta_applications WHERE id = 10")->fetchColumn();
    if ($check_data == 0) {
        $insert_sql = "INSERT INTO kta_applications (
            id, user_id, club_name, leader_name, coach_name, manager_name, 
            province, regency, club_address, province_id, city_id, 
            logo_path, ad_file_path, art_file_path, sk_file_path, 
            payment_proof_path, pergetA_payment_proof_path, status, created_at
        ) VALUES (
            10, 1658, 'rajawali', 'tees', 'tessss', 'tesssss', 
            'Jawa Barat', 'Kabupaten Bogor', 'testingg', 12, 1188, 
            'kta_logo_684293ff5810f_kta_68426233914c6_kemeja__3_.jpg', 
            'kta_ad_684293ff5beb3_WhatsApp_Image_2025-06-04_at_19.54.21_97cd6101.pdf', 
            'kta_art_684293ff5df88_sppd_megamendung.pdf', 
            'kta_sk_684293ff5f362_sppd_megamendung_2.pdf', 
            'kta_payment_684293ff60f1d_ChatGPT_Image_Jun_2__2025__08_30_08_PM.png', 
            NULL, 'pending', '2025-06-06 07:08:47'
        )";
        
        $conn->exec($insert_sql);
        echo "Data contoh berhasil dimasukkan.<br>";
    } else {
        echo "Data contoh sudah ada.<br>";
    }
    
    // Menambahkan foreign key constraint (asumsi tabel users sudah ada)
    try {
        $conn->exec("ALTER TABLE kta_applications 
                    ADD CONSTRAINT kta_applications_ibfk_1 
                    FOREIGN KEY (user_id) REFERENCES users (id) 
                    ON DELETE CASCADE ON UPDATE CASCADE");
        echo "Foreign key constraint berhasil ditambahkan.<br>";
    } catch (PDOException $e) {
        echo "Catatan: Gagal menambahkan foreign key constraint (mungkin tabel users belum ada): " . $e->getMessage() . "<br>";
    }
    
    echo "Setup database selesai dengan sukses.";
    
} catch (PDOException $e) {
    die("Koneksi/query gagal: " . $e->getMessage());
}

// Tutup koneksi
$conn = null;
?>