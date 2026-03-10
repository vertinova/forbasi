<?php
// create-pengda-accounts.php

// Konfigurasi database
$db_host = 'localhost';
$db_user = 'root'; // Ganti dengan username database Anda
$db_pass = '';     // Ganti dengan password database Anda
$db_name = 'forbasi_db';

// Daftar lengkap 34 provinsi di Indonesia
$provinsiIndonesia = [
    'Aceh',
    'Sumatera Utara',
    'Sumatera Barat',
    'Riau',
    'Jambi',
    'Sumatera Selatan',
    'Bengkulu',
    'Lampung',
    'Kepulauan Bangka Belitung',
    'Kepulauan Riau',
    'DKI Jakarta',
    'Jawa Barat',
    'Jawa Tengah',
    'DI Yogyakarta',
    'Jawa Timur',
    'Banten',
    'Bali',
    'Nusa Tenggara Barat',
    'Nusa Tenggara Timur',
    'Kalimantan Barat',
    'Kalimantan Tengah',
    'Kalimantan Selatan',
    'Kalimantan Timur',
    'Kalimantan Utara',
    'Sulawesi Utara',
    'Sulawesi Tengah',
    'Sulawesi Selatan',
    'Sulawesi Tenggara',
    'Gorontalo',
    'Sulawesi Barat',
    'Maluku',
    'Maluku Utara',
    'Papua Barat',
    'Papua'
];

try {
    // Buat koneksi ke database
    $conn = new PDO("mysql:host=$db_host;dbname=$db_name", $db_user, $db_pass);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Fungsi untuk membuat akun admin_pengda
    function createPengdaAccount($conn, $provinsi) {
        // Format username: nama provinsi tanpa spasi (lowercase)
        $username = strtolower(str_replace(' ', '', $provinsi));
        $email = $username . '@pengda.forbasi.id';
        $password = 'PENGDAFORBASI2025';
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        
        // Dapatkan role_id untuk admin_pengda
        $stmt = $conn->prepare("SELECT id FROM roles WHERE role_name = 'admin_pengda'");
        $stmt->execute();
        $roleId = $stmt->fetchColumn();
        
        if (!$roleId) {
            die("Role 'admin_pengda' tidak ditemukan di database!");
        }
        
        // Cek apakah akun sudah ada
        $stmt = $conn->prepare("SELECT COUNT(*) FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetchColumn() > 0) {
            echo "[SKIP] Akun untuk {$provinsi} sudah ada\n";
            return;
        }
        
        // Mulai transaksi
        $conn->beginTransaction();
        
        try {
            // Insert ke tabel users
            $stmt = $conn->prepare("INSERT INTO users (club_name, email, password, role_id) VALUES (?, ?, ?, ?)");
            $stmt->execute([$provinsi, $email, $hashedPassword, $roleId]);
            $userId = $conn->lastInsertId();
            
            // Insert ke tabel admin_profiles
            $stmt = $conn->prepare("INSERT INTO admin_profiles (user_id, level, region) VALUES (?, 'Pengda', ?)");
            $stmt->execute([$userId, $provinsi]);
            
            $conn->commit();
            echo "[SUKSES] Akun PENGDA untuk {$provinsi} berhasil dibuat\n";
        } catch (PDOException $e) {
            $conn->rollBack();
            echo "[GAGAL] Error saat membuat akun {$provinsi}: " . $e->getMessage() . "\n";
        }
    }

    echo "Memulai proses pembuatan akun admin PENGDA untuk seluruh provinsi di Indonesia...\n";
    echo "Total provinsi yang akan diproses: " . count($provinsiIndonesia) . "\n\n";

    // Proses setiap provinsi
    foreach ($provinsiIndonesia as $provinsi) {
        createPengdaAccount($conn, $provinsi);
    }

    echo "\nProses selesai. Total akun PENGDA yang berhasil dibuat/dilewati: " . count($provinsiIndonesia) . "\n";

} catch(PDOException $e) {
    die("ERROR: Tidak dapat terhubung ke database. " . $e->getMessage());
}

// Tutup koneksi
$conn = null;