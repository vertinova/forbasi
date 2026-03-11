<?php
// Koneksi ke database
$db = new mysqli('localhost', 'root', '', 'forbasi_db');

if ($db->connect_error) {
    die("Koneksi gagal: " . $db->connect_error);
}

// Fungsi untuk generate password hash
function generatePasswordHash($password) {
    return password_hash($password, PASSWORD_DEFAULT);
}

// Fungsi untuk mendapatkan input dari terminal
function getInput($prompt) {
    echo $prompt;
    return trim(fgets(STDIN));
}

echo "================================\n";
echo "  Pembuatan Akun Pengda (Pengurus Daerah)\n";
echo "================================\n\n";

// Input data dari terminal
$club_name = getInput("Nama Pengda:jawa barat ");
$email = getInput("Email: jabar@gmail.com ");
$phone = getInput("Nomor Telepon: 08231831213");
$address = getInput("Alamat:sdfasfsaf ");
$username = getInput("Username: jawabarat");
$password = getInput("Password: jabar12345");
$confirm_password = getInput("Konfirmasi Password: jabar12345");

// Validasi password
if ($password !== $confirm_password) {
    echo "\nError: Password tidak cocok!\n";
    exit;
}

// Generate password hash
$password_hash = generatePasswordHash($password);

// Role ID untuk Pengda (misalnya 2, sesuaikan dengan sistem Anda)
$role_id = 3;

// Query untuk insert data
$sql = "INSERT INTO users (club_name, email, phone, address, username, password, role_id, is_active, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)";

$stmt = $db->prepare($sql);
$stmt->bind_param("ssssssi", $club_name, $email, $phone, $address, $username, $password_hash, $role_id);

if ($stmt->execute()) {
    echo "\n================================\n";
    echo "  Akun Pengda berhasil dibuat!\n";
    echo "================================\n";
    echo "jawa barat: $club_name\n";
    echo "jawabarat: $username\n";
    echo "Email: $email\n";
} else {
    echo "\nError: " . $db->error . "\n";
}

$stmt->close();
$db->close();
?>