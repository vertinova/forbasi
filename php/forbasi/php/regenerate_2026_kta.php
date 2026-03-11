<?php
/**
 * REGENERATE KTA PDF - Fix "Berlaku sampai 2025" untuk KTA yang diterbitkan di 2026
 * 
 * Script ini akan:
 * 1. Mencari semua KTA yang di-approve PB mulai Januari 2026 (status = 'kta_issued')
 * 2. Re-generate PDF-nya agar masa berlaku menjadi "31 Desember 2026" (bukan 2025)
 * 
 * FITUR:
 * - Resume dari posisi tertentu: ?start_from=110 (lanjut dari nomor 110)
 * - Skip ID bermasalah: ?skip_ids=715,800 (lewati App ID tertentu)
 * - Batch processing: proses per batch agar tidak timeout
 * - Real-time output flush ke browser
 * 
 * CARA PAKAI:
 * 1. Upload file ini ke folder /forbasi/php/ di server production
 * 2. Akses via browser: https://forbasi.or.id/forbasi/php/regenerate_2026_kta.php
 * 3. Untuk resume: https://forbasi.or.id/forbasi/php/regenerate_2026_kta.php?start_from=110&confirm=yes
 * 4. HAPUS file ini setelah selesai digunakan!
 */

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
ini_set('max_execution_time', 0); // Tidak ada batas waktu
ini_set('memory_limit', '512M');
set_time_limit(0); // Pastikan tidak ada timeout

require_once __DIR__ . '/db_config.php';

// Deteksi apakah jalan di CLI atau browser
$isCLI = (php_sapi_name() === 'cli');
$nl = $isCLI ? "\n" : "<br>\n";
$bold_start = $isCLI ? "" : "<b>";
$bold_end = $isCLI ? "" : "</b>";

// Parameter resume & skip
$start_from = intval($_GET['start_from'] ?? $_POST['start_from'] ?? 1); // Nomor urut mulai (1-based)
$skip_ids_str = $_GET['skip_ids'] ?? $_POST['skip_ids'] ?? '';
$skip_ids = array_filter(array_map('intval', explode(',', $skip_ids_str)));

// Fungsi helper untuk flush output ke browser secara real-time
function flush_output() {
    if (ob_get_level() > 0) {
        ob_end_flush();
    }
    ob_start();
    echo str_pad('', 4096); // Padding agar buffer terkirim
    if (ob_get_level() > 0) {
        ob_flush();
    }
    flush();
}

function output($text) {
    echo $text;
    if (ob_get_level() > 0) {
        ob_flush();
    }
    flush();
}

if (!$isCLI) {
    // Matikan output buffering agar real-time
    while (ob_get_level()) ob_end_clean();
    
    // Header untuk streaming
    header('Content-Type: text/html; charset=UTF-8');
    header('Cache-Control: no-cache, no-store, must-revalidate');
    header('X-Accel-Buffering: no'); // Untuk Nginx
    
    echo "<!DOCTYPE html><html><head><title>Regenerate KTA 2026</title>
    <style>body{font-family:monospace;padding:20px;background:#1a1a2e;color:#e0e0e0;white-space:pre-wrap;}
    .success{color:#00ff88;}.error{color:#ff4444;}.info{color:#66bbff;}.warning{color:#ffaa00;}
    h1{color:#fff;}table{border-collapse:collapse;margin:20px 0;}
    th,td{border:1px solid #444;padding:8px 12px;text-align:left;}
    th{background:#2a2a4e;color:#fff;}tr:nth-child(even){background:#1e1e3e;}
    .btn{display:inline-block;padding:12px 24px;background:#00aa55;color:#fff;text-decoration:none;border-radius:5px;font-size:16px;margin:10px 5px;border:none;cursor:pointer;}
    .btn:hover{background:#00cc66;}.btn-danger{background:#cc3333;}.btn-danger:hover{background:#ff4444;}
    .btn-resume{background:#2266cc;}.btn-resume:hover{background:#3388ee;}
    pre{white-space:pre-wrap;}
    </style></head><body>";
    echo "<h1>🔄 Regenerate KTA 2026 - Fix Masa Berlaku</h1>";
    flush();
}

if (!isset($conn) || $conn->connect_error) {
    output("{$bold_start}ERROR: Koneksi database gagal!{$bold_end} " . ($conn->connect_error ?? 'Unknown error') . $nl);
    exit;
}

// ============================================================
// LANGKAH 1: Cari semua KTA yang perlu di-regenerate
// ============================================================
$sql = "SELECT ka.id, ka.user_id, ka.club_name, ka.status, 
               ka.approved_at_pb, ka.approved_by_pb_id,
               ka.kta_barcode_unique_id, ka.generated_kta_file_path_pb,
               ka.kta_issued_at,
               u.username AS user_full_name
        FROM kta_applications ka
        JOIN users u ON ka.user_id = u.id
        WHERE ka.approved_at_pb >= '2026-01-01'
        AND ka.approved_at_pb IS NOT NULL
        AND ka.generated_kta_file_path_pb IS NOT NULL
        AND ka.generated_kta_file_path_pb != ''
        ORDER BY ka.approved_at_pb ASC";

$result = $conn->query($sql);

if (!$result) {
    output("{$bold_start}ERROR: Query gagal:{$bold_end} " . $conn->error . $nl);
    exit;
}

$kta_list = [];
while ($row = $result->fetch_assoc()) {
    $kta_list[] = $row;
}

$total = count($kta_list);

output("{$bold_start}Ditemukan {$total} KTA yang diterbitkan mulai Januari 2026{$bold_end}{$nl}");
output("KTA ini sebelumnya memiliki masa berlaku '31 Desember 2025' (hardcoded lama){$nl}");
output("Akan di-regenerate agar masa berlaku sesuai tahun approve: '31 Desember 2026'{$nl}{$nl}");

if ($start_from > 1) {
    output("<span class='info'>📌 RESUME MODE: Mulai dari nomor urut {$start_from}</span>{$nl}");
}
if (!empty($skip_ids)) {
    output("<span class='info'>⏩ SKIP IDs: " . implode(', ', $skip_ids) . "</span>{$nl}");
}
output($nl);

if ($total === 0) {
    output("<span class='success'>✅ Tidak ada KTA yang perlu di-regenerate. Semua sudah benar!</span>{$nl}");
    if (!$isCLI) echo "</body></html>";
    exit;
}

// Tampilkan daftar (hanya yang belum diproses)
if (!$isCLI) {
    echo "<details><summary style='cursor:pointer;color:#66bbff;'>📋 Klik untuk lihat daftar {$total} KTA</summary>";
    echo "<table><tr><th>No</th><th>App ID</th><th>Club Name</th><th>Username</th><th>Approved At PB</th><th>PB Admin ID</th><th>Barcode ID</th><th>Status</th></tr>";
    foreach ($kta_list as $i => $kta) {
        $num = $i + 1;
        $row_status = '';
        if ($num < $start_from) $row_status = '<span class="success">✅ Sudah</span>';
        elseif (in_array($kta['id'], $skip_ids)) $row_status = '<span class="warning">⏩ Skip</span>';
        else $row_status = '<span class="info">⏳ Pending</span>';
        
        echo "<tr>
            <td>{$num}</td>
            <td>{$kta['id']}</td>
            <td>" . htmlspecialchars($kta['club_name']) . "</td>
            <td>" . htmlspecialchars($kta['user_full_name']) . "</td>
            <td>{$kta['approved_at_pb']}</td>
            <td>{$kta['approved_by_pb_id']}</td>
            <td>{$kta['kta_barcode_unique_id']}</td>
            <td>{$row_status}</td>
        </tr>";
    }
    echo "</table></details>";
    flush();
}

// ============================================================
// LANGKAH 2: Cek apakah user konfirmasi untuk regenerate
// ============================================================
$do_regenerate = false;

if ($isCLI) {
    echo "\nKetik 'yes' untuk melanjutkan regenerate: ";
    $input = trim(fgets(STDIN));
    $do_regenerate = (strtolower($input) === 'yes');
} else {
    $confirm = $_POST['confirm_regenerate'] ?? $_GET['confirm'] ?? '';
    if ($confirm === 'yes') {
        $do_regenerate = true;
    } else {
        $remaining = $total - ($start_from - 1) - count(array_filter($skip_ids, function($sid) use ($kta_list, $start_from) {
            foreach ($kta_list as $i => $k) { if ($k['id'] == $sid && ($i+1) >= $start_from) return true; }
            return false;
        }));
        
        echo "<form method='POST'>
            <input type='hidden' name='confirm_regenerate' value='yes'>
            <input type='hidden' name='start_from' value='{$start_from}'>
            <input type='hidden' name='skip_ids' value='{$skip_ids_str}'>
            <p>Akan memproses sekitar <b>{$remaining}</b> KTA (dari posisi {$start_from})</p>
            <button type='submit' class='btn'>🔄 Regenerate Sekarang</button>
        </form>";
        
        if ($start_from <= 1) {
            echo "<p class='warning'>⚠️ Pastikan file generate_kta_pdf.php sudah diperbarui dengan kode dinamis tahun berlaku sebelum menjalankan regenerate!</p>";
        }
        echo "</body></html>";
        exit;
    }
}

if (!$do_regenerate) {
    output("{$nl}Dibatalkan oleh user.{$nl}");
    if (!$isCLI) echo "</body></html>";
    exit;
}

// ============================================================
// LANGKAH 3: Regenerate setiap KTA
// ============================================================
output("{$nl}{$bold_start}Memulai regenerate dari nomor {$start_from}...{$bold_end}{$nl}{$nl}");

// Detect base URL for internal cURL call
$base_url = 'https://forbasi.or.id/forbasi/php/';
if (isset($_SERVER['HTTP_HOST'])) {
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $base_url = $protocol . '://' . $_SERVER['HTTP_HOST'] . '/forbasi/php/';
}

$success_count = 0;
$fail_count = 0;
$skip_count = 0;
$results = [];
$last_processed_num = 0;

foreach ($kta_list as $i => $kta) {
    $num = $i + 1;
    
    // Skip jika belum sampai start_from
    if ($num < $start_from) {
        continue;
    }
    
    // Skip ID yang di-exclude
    if (in_array($kta['id'], $skip_ids)) {
        output("{$bold_start}[{$num}/{$total}]{$bold_end} App ID: {$kta['id']} - " . htmlspecialchars($kta['club_name']) . "... <span class='warning'>⏩ SKIPPED (by user)</span>{$nl}");
        $skip_count++;
        continue;
    }
    
    $last_processed_num = $num;
    output("{$bold_start}[{$num}/{$total}]{$bold_end} App ID: {$kta['id']} - " . htmlspecialchars($kta['club_name']) . "... ");

    // Validasi data yang diperlukan
    if (empty($kta['approved_by_pb_id'])) {
        output("<span class='error'>SKIP - Tidak ada approved_by_pb_id</span>{$nl}");
        $fail_count++;
        $results[] = ['id' => $kta['id'], 'num' => $num, 'status' => 'SKIP', 'message' => 'No approved_by_pb_id'];
        continue;
    }
    if (empty($kta['kta_barcode_unique_id'])) {
        output("<span class='error'>SKIP - Tidak ada kta_barcode_unique_id</span>{$nl}");
        $fail_count++;
        $results[] = ['id' => $kta['id'], 'num' => $num, 'status' => 'SKIP', 'message' => 'No barcode ID'];
        continue;
    }

    // Panggil generate_kta_pdf.php via cURL
    $post_data = [
        'application_id' => $kta['id'],
        'admin_id'       => $kta['approved_by_pb_id'],
        'role_caller'    => 'pb',
        'unique_barcode_id' => $kta['kta_barcode_unique_id'],
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $base_url . 'generate_kta_pdf.php');
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($post_data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 60); // Timeout per request: 60 detik (turun dari 120)
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 15); // Timeout koneksi: 15 detik
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

    $curl_response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_error = curl_error($ch);
    curl_close($ch);

    if ($curl_response === false) {
        output("<span class='error'>GAGAL - cURL error: {$curl_error} (HTTP {$http_code})</span>{$nl}");
        $fail_count++;
        $results[] = ['id' => $kta['id'], 'num' => $num, 'status' => 'FAIL', 'message' => "cURL: {$curl_error}"];
        
        // Jika timeout, tampilkan hint resume
        if (stripos($curl_error, 'timeout') !== false || stripos($curl_error, 'timed out') !== false) {
            $next_num = $num + 1;
            output("<span class='warning'>💡 Hint: App ID {$kta['id']} timeout. Untuk skip dan lanjutkan, gunakan: ?start_from={$next_num}&skip_ids=" . ($skip_ids_str ? $skip_ids_str . ',' : '') . "{$kta['id']}&confirm=yes</span>{$nl}");
        }
        continue;
    }

    $response_data = json_decode($curl_response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        output("<span class='error'>GAGAL - Response bukan JSON valid: " . htmlspecialchars(substr($curl_response, 0, 150)) . "</span>{$nl}");
        $fail_count++;
        $results[] = ['id' => $kta['id'], 'num' => $num, 'status' => 'FAIL', 'message' => 'Invalid JSON response'];
        continue;
    }

    if (isset($response_data['success']) && $response_data['success']) {
        output("<span class='success'>✅ BERHASIL</span> - " . ($response_data['kta_url'] ?? '') . $nl);
        $success_count++;
        $results[] = ['id' => $kta['id'], 'num' => $num, 'status' => 'OK', 'message' => $response_data['kta_url'] ?? 'Success'];
    } else {
        output("<span class='error'>GAGAL - " . htmlspecialchars($response_data['message'] ?? 'Unknown error') . "</span>{$nl}");
        $fail_count++;
        $results[] = ['id' => $kta['id'], 'num' => $num, 'status' => 'FAIL', 'message' => $response_data['message'] ?? 'Unknown'];
    }

    // Jeda sedikit antar request agar tidak overload server
    usleep(300000); // 0.3 detik
}

// ============================================================
// LANGKAH 4: Ringkasan
// ============================================================
output("{$nl}{$bold_start}========== RINGKASAN =========={$bold_end}{$nl}");
output("Total KTA dalam DB : {$total}{$nl}");
output("Diproses kali ini  : " . ($success_count + $fail_count) . "{$nl}");
output("<span class='success'>Berhasil           : {$success_count}</span>{$nl}");
output("<span class='error'>Gagal              : {$fail_count}</span>{$nl}");
if ($skip_count > 0) {
    output("<span class='warning'>Di-skip user       : {$skip_count}</span>{$nl}");
}
output($nl);

if ($fail_count > 0) {
    output("{$bold_start}Detail yang gagal:{$bold_end}{$nl}");
    $failed_ids = [];
    foreach ($results as $r) {
        if ($r['status'] !== 'OK') {
            output("  - [#{$r['num']}] App ID {$r['id']}: [{$r['status']}] {$r['message']}{$nl}");
            $failed_ids[] = $r['id'];
        }
    }
    
    // Tampilkan link untuk retry hanya yang gagal
    if (!$isCLI && !empty($failed_ids)) {
        $failed_ids_str = implode(',', $failed_ids);
        output("{$nl}<span class='info'>Untuk retry hanya yang gagal, buat script terpisah atau proses manual per ID.</span>{$nl}");
    }
}

output("{$nl}<span class='warning'>⚠️ PENTING: Hapus file regenerate_2026_kta.php dari server setelah selesai!</span>{$nl}");

if (!$isCLI) {
    // Tombol resume jika belum selesai semua
    if ($last_processed_num < $total) {
        $next_start = $last_processed_num + 1;
        echo "<br><a href='regenerate_2026_kta.php?start_from={$next_start}&skip_ids={$skip_ids_str}&confirm=yes' class='btn btn-resume'>▶️ Lanjutkan dari #{$next_start}</a>";
    }
    echo "<br><a href='regenerate_2026_kta.php' class='btn btn-danger'>🔄 Mulai Ulang dari Awal</a>";
    echo "</body></html>";
}

$conn->close();
?>
