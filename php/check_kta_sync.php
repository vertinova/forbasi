<?php
// Script untuk menganalisis perbedaan data KTA - akses via browser
// HAPUS FILE INI SETELAH SELESAI!

header('Content-Type: text/html; charset=UTF-8');
include_once __DIR__ . '/php/db_config.php';

if ($conn->connect_error) {
    die("Koneksi database gagal: " . $conn->connect_error);
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>Analisis Data KTA</title>
    <style>
        body { font-family: monospace; padding: 20px; background: #1a1a2e; color: #eee; }
        .box { background: #16213e; padding: 15px; margin: 10px 0; border-radius: 8px; }
        .title { color: #0f4c75; font-size: 1.2em; margin-bottom: 10px; }
        .num { color: #00ff88; font-size: 1.5em; font-weight: bold; }
        .warning { color: #ff6b6b; }
        table { border-collapse: collapse; width: 100%; margin-top: 10px; }
        th, td { border: 1px solid #444; padding: 8px; text-align: left; }
        th { background: #0f4c75; }
        tr:nth-child(even) { background: #1a1a3e; }
    </style>
</head>
<body>
<h1>🔍 Analisis Data KTA - Perbedaan Ringkasan vs Lihat Anggota</h1>

<?php
// 1. Total KTA dengan status kta_issued (query seperti di index.php / lihat anggota)
$r1 = $conn->query("SELECT COUNT(*) as total FROM kta_applications WHERE status = 'kta_issued'");
$total_all = $r1->fetch_assoc()['total'];

// 2. KTA issued DENGAN file PDF PB (query seperti di countIssuedKTAApplications pb.php)
$r2 = $conn->query("SELECT COUNT(*) as total FROM kta_applications WHERE status = 'kta_issued' AND generated_kta_file_path_pb IS NOT NULL");
$with_pdf = $r2->fetch_assoc()['total'];

// Selisih
$diff_pdf = $total_all - $with_pdf;

// 3. Filter tahun 2026 berdasarkan kta_issued_at
$r3 = $conn->query("SELECT COUNT(*) as total FROM kta_applications WHERE status = 'kta_issued' AND YEAR(kta_issued_at) = 2026");
$issued_2026 = $r3->fetch_assoc()['total'];

// 4. KTA issued tapi kta_issued_at NULL
$r4 = $conn->query("SELECT COUNT(*) as total FROM kta_applications WHERE status = 'kta_issued' AND kta_issued_at IS NULL");
$null_date = $r4->fetch_assoc()['total'];

// 5. KTA issued tahun 2025
$r5 = $conn->query("SELECT COUNT(*) as total FROM kta_applications WHERE status = 'kta_issued' AND YEAR(kta_issued_at) = 2025");
$issued_2025 = $r5->fetch_assoc()['total'];
?>

<div class="box">
    <div class="title">📊 RINGKASAN JUMLAH KTA</div>
    <table>
        <tr>
            <th>Query</th>
            <th>Jumlah</th>
            <th>Keterangan</th>
        </tr>
        <tr>
            <td>status = 'kta_issued' (SEMUA)</td>
            <td class="num"><?= $total_all ?></td>
            <td>Query di index.php / Lihat Anggota</td>
        </tr>
        <tr>
            <td>status = 'kta_issued' + PDF ada</td>
            <td class="num"><?= $with_pdf ?></td>
            <td>Query di pb.php countIssuedKTAApplications</td>
        </tr>
        <tr>
            <td>KTA issued TANPA PDF</td>
            <td class="num <?= $diff_pdf > 0 ? 'warning' : '' ?>"><?= $diff_pdf ?></td>
            <td><?= $diff_pdf > 0 ? '⚠️ MASALAH! PDF belum digenerate' : '✅ Semua sudah ada PDF' ?></td>
        </tr>
        <tr>
            <td>KTA issued tahun 2026</td>
            <td class="num"><?= $issued_2026 ?></td>
            <td>YEAR(kta_issued_at) = 2026</td>
        </tr>
        <tr>
            <td>KTA issued tahun 2025</td>
            <td class="num"><?= $issued_2025 ?></td>
            <td>YEAR(kta_issued_at) = 2025</td>
        </tr>
        <tr>
            <td>KTA issued tapi tanggal NULL</td>
            <td class="num <?= $null_date > 0 ? 'warning' : '' ?>"><?= $null_date ?></td>
            <td><?= $null_date > 0 ? '⚠️ MASALAH! kta_issued_at tidak di-set' : '✅ Semua ada tanggal' ?></td>
        </tr>
    </table>
</div>

<?php if ($diff_pdf > 0): ?>
<div class="box">
    <div class="title warning">⚠️ DETAIL KTA ISSUED TANPA PDF (max 20)</div>
    <table>
        <tr>
            <th>ID</th>
            <th>Club Name</th>
            <th>Status</th>
            <th>kta_issued_at</th>
            <th>generated_kta_file_path_pb</th>
        </tr>
        <?php
        $r_detail = $conn->query("SELECT id, club_name, status, kta_issued_at, generated_kta_file_path_pb 
                                  FROM kta_applications 
                                  WHERE status = 'kta_issued' AND generated_kta_file_path_pb IS NULL 
                                  ORDER BY id DESC LIMIT 20");
        while ($row = $r_detail->fetch_assoc()):
        ?>
        <tr>
            <td><?= $row['id'] ?></td>
            <td><?= htmlspecialchars($row['club_name']) ?></td>
            <td><?= $row['status'] ?></td>
            <td><?= $row['kta_issued_at'] ?? '<span class="warning">NULL</span>' ?></td>
            <td><span class="warning">NULL</span></td>
        </tr>
        <?php endwhile; ?>
    </table>
</div>
<?php endif; ?>

<?php if ($null_date > 0): ?>
<div class="box">
    <div class="title warning">⚠️ DETAIL KTA ISSUED TANPA TANGGAL (max 20)</div>
    <table>
        <tr>
            <th>ID</th>
            <th>Club Name</th>
            <th>Status</th>
            <th>created_at</th>
            <th>approved_at_pb</th>
        </tr>
        <?php
        $r_null = $conn->query("SELECT id, club_name, status, created_at, approved_at_pb 
                                FROM kta_applications 
                                WHERE status = 'kta_issued' AND kta_issued_at IS NULL 
                                ORDER BY id DESC LIMIT 20");
        while ($row = $r_null->fetch_assoc()):
        ?>
        <tr>
            <td><?= $row['id'] ?></td>
            <td><?= htmlspecialchars($row['club_name']) ?></td>
            <td><?= $row['status'] ?></td>
            <td><?= $row['created_at'] ?></td>
            <td><?= $row['approved_at_pb'] ?? 'NULL' ?></td>
        </tr>
        <?php endwhile; ?>
    </table>
</div>
<?php endif; ?>

<div class="box">
    <div class="title">📈 KESIMPULAN</div>
    <ul>
        <li><strong>Total di "Lihat Anggota":</strong> <?= $total_all ?> (semua KTA issued)</li>
        <li><strong>Total di "Ringkasan Saldo" (dengan filter PDF):</strong> <?= $with_pdf ?></li>
        <li><strong>Selisih:</strong> <?= $diff_pdf ?> KTA</li>
        <?php if ($diff_pdf > 0): ?>
        <li class="warning"><strong>PENYEBAB:</strong> Ada <?= $diff_pdf ?> KTA yang statusnya sudah 'kta_issued' tapi file PDF belum digenerate!</li>
        <?php endif; ?>
        <?php if ($null_date > 0): ?>
        <li class="warning"><strong>MASALAH LAIN:</strong> Ada <?= $null_date ?> KTA yang kta_issued_at NULL, sehingga tidak masuk filter tahun 2026!</li>
        <?php endif; ?>
    </ul>
</div>

<p style="color: #ff6b6b; margin-top: 20px;">⚠️ <strong>HAPUS FILE INI SETELAH SELESAI!</strong> File: check_kta_sync.php</p>

</body>
</html>
<?php $conn->close(); ?>
