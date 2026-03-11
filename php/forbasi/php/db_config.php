<?php
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "forbasi";


// Buat koneksi
$conn = new mysqli($servername, $username, $password, $dbname);

// Set charset to UTF-8
if ($conn && !$conn->connect_error) {
    $conn->set_charset("utf8mb4");
}

// Don't die here - let the calling script handle the error
// The error will be checked in the calling script
// Tidak ada tag penutup ?