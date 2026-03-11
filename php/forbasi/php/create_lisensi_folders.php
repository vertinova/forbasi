<?php
/**
 * Script untuk membuat folder upload lisensi secara otomatis
 * Jalankan sekali di Hostinger: akses URL ini di browser
 * Contoh: https://forbasi.or.id/forbasi/php/create_lisensi_folders.php
 */

// Set the base path for uploads
$base_path = __DIR__ . '/uploads/lisensi';

// List of folders to create
$folders = [
    $base_path,
    $base_path . '/pas_foto',
    $base_path . '/bukti_transfer',
    $base_path . '/surat_rekomendasi',
    $base_path . '/surat_pengalaman'
];

echo "<!DOCTYPE html>
<html>
<head>
    <title>Setup Folder Lisensi</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; }
        .success { color: green; }
        .error { color: red; }
        .info { color: blue; }
        h1 { color: #1d3557; }
        ul { list-style: none; padding: 0; }
        li { padding: 8px; margin: 5px 0; background: #f5f5f5; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>🗂️ Setup Folder Upload Lisensi</h1>
    <ul>";

$all_success = true;

foreach ($folders as $folder) {
    $folder_name = basename($folder);
    if ($folder_name === 'lisensi') {
        $folder_name = 'uploads/lisensi (root)';
    }
    
    if (!is_dir($folder)) {
        if (mkdir($folder, 0755, true)) {
            echo "<li class='success'>✓ Folder dibuat: <strong>$folder_name</strong></li>";
        } else {
            echo "<li class='error'>✗ Gagal membuat: <strong>$folder_name</strong></li>";
            $all_success = false;
        }
    } else {
        echo "<li class='info'>ℹ Sudah ada: <strong>$folder_name</strong></li>";
    }
}

// Create .htaccess to protect uploads but allow images
$htaccess_content = "# Protect upload directory
Options -Indexes

# Allow only specific file types
<FilesMatch \"\.(jpg|jpeg|png|gif|pdf)$\">
    Order Allow,Deny
    Allow from all
</FilesMatch>

# Deny PHP execution
<FilesMatch \"\.php$\">
    Order Deny,Allow
    Deny from all
</FilesMatch>
";

$htaccess_path = $base_path . '/.htaccess';
if (!file_exists($htaccess_path)) {
    if (file_put_contents($htaccess_path, $htaccess_content)) {
        echo "<li class='success'>✓ File .htaccess dibuat untuk keamanan</li>";
    } else {
        echo "<li class='error'>✗ Gagal membuat file .htaccess</li>";
    }
} else {
    echo "<li class='info'>ℹ File .htaccess sudah ada</li>";
}

echo "</ul>";

if ($all_success) {
    echo "<p class='success'><strong>✅ Semua folder berhasil dibuat!</strong></p>";
    echo "<p>Anda dapat menghapus file ini setelah selesai untuk keamanan.</p>";
} else {
    echo "<p class='error'><strong>⚠️ Ada folder yang gagal dibuat. Cek permission direktori.</strong></p>";
}

echo "<hr><p><a href='../index.php'>← Kembali ke Beranda</a></p>";
echo "</body></html>";
?>
