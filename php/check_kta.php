<?php
// Koneksi lokal Laragon (root, tanpa password)
$conn = new mysqli("localhost", "root", "", "u390451403_forbasi");
if ($conn->connect_error) {
    die("Koneksi gagal: " . $conn->connect_error . "\n");
}
$conn->set_charset("utf8mb4");

echo "=== ANALISIS DATA KTA ISSUED ===\n\n";

$r1 = $conn->query("SELECT COUNT(*) as total FROM kta_applications WHERE status = 'kta_issued'");
$total_all = $r1->fetch_assoc()['total'];
echo "1. Total KTA status='kta_issued' (SEMUA): $total_all\n";

$r2 = $conn->query("SELECT COUNT(*) as total FROM kta_applications WHERE status = 'kta_issued' AND generated_kta_file_path_pb IS NOT NULL");
$with_pdf = $r2->fetch_assoc()['total'];
echo "2. KTA issued + PDF sudah generate: $with_pdf\n";

$diff = $total_all - $with_pdf;
echo "   -> SELISIH (tanpa PDF): $diff\n\n";

$r3 = $conn->query("SELECT COUNT(*) as total FROM kta_applications WHERE status = 'kta_issued' AND YEAR(kta_issued_at) = 2026");
$y2026 = $r3->fetch_assoc()['total'];
echo "3. KTA issued tahun 2026: $y2026\n";

$r4 = $conn->query("SELECT COUNT(*) as total FROM kta_applications WHERE status = 'kta_issued' AND YEAR(kta_issued_at) = 2025");
$y2025 = $r4->fetch_assoc()['total'];
echo "4. KTA issued tahun 2025: $y2025\n";

$r5 = $conn->query("SELECT COUNT(*) as total FROM kta_applications WHERE status = 'kta_issued' AND kta_issued_at IS NULL");
$null_date = $r5->fetch_assoc()['total'];
echo "5. KTA issued tapi kta_issued_at NULL: $null_date\n\n";

if ($diff > 0) {
    echo "=== DETAIL KTA TANPA PDF (max 10) ===\n";
    $r = $conn->query("SELECT id, club_name, kta_issued_at FROM kta_applications WHERE status = 'kta_issued' AND generated_kta_file_path_pb IS NULL LIMIT 10");
    while ($row = $r->fetch_assoc()) {
        echo "ID: {$row['id']} | {$row['club_name']} | Issued: " . ($row['kta_issued_at'] ?? 'NULL') . "\n";
    }
}

if ($null_date > 0) {
    echo "\n=== DETAIL KTA TANPA TANGGAL (max 10) ===\n";
    $r = $conn->query("SELECT id, club_name, created_at FROM kta_applications WHERE status = 'kta_issued' AND kta_issued_at IS NULL LIMIT 10");
    while ($row = $r->fetch_assoc()) {
        echo "ID: {$row['id']} | {$row['club_name']} | Created: {$row['created_at']}\n";
    }
}

echo "\n=== KESIMPULAN ===\n";
echo "Lihat Anggota menampilkan: $total_all KTA\n";
echo "Ringkasan Saldo (dengan filter PDF): $with_pdf KTA\n";
echo "Selisih: $diff KTA\n";
if ($diff > 0) {
    echo "PENYEBAB: Ada $diff KTA dengan status 'kta_issued' tapi PDF belum digenerate!\n";
}
if ($null_date > 0) {
    echo "MASALAH: Ada $null_date KTA dengan kta_issued_at NULL (tidak masuk filter tahun)!\n";
}

$conn->close();
