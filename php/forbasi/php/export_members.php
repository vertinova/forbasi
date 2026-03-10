<?php
session_start();

require_once __DIR__ . '/../vendor/autoload.php';

// Pastikan file koneksi database dimuat di sini
require_once 'db_config.php'; 

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\IOFactory;

// Cek apakah user sudah login dan role-nya adalah Pengurus Cabang (role_id = 2)
if (!isset($_SESSION['user_id']) || $_SESSION['role_id'] != 2) {
    die("Akses tidak sah.");
}

$admin_id = $_SESSION['user_id'];
$admin_province_id = null;
$admin_city_id = null;
// Ambil data lokasi admin
$query_admin_location = "SELECT u.province_id, u.city_id FROM users u WHERE u.id = ?";
$stmt_admin_location = $conn->prepare($query_admin_location);
if ($stmt_admin_location) {
    $stmt_admin_location->bind_param("i", $admin_id);
    $stmt_admin_location->execute();
    $result_admin_location = $stmt_admin_location->get_result();
    if ($row_admin_location = $result_admin_location->fetch_assoc()) {
        $admin_province_id = $row_admin_location['province_id'];
        $admin_city_id = $row_admin_location['city_id'];
    }
    $stmt_admin_location->close();
}

if (empty($admin_province_id) || empty($admin_city_id)) {
    die("Informasi lokasi Pengurus Cabang tidak lengkap. Hubungi admin pusat.");
}

// Ambil parameter filter dari URL
$search_query = isset($_GET['search']) ? '%' . $_GET['search'] . '%' : '%';
$kta_status_filter = $_GET['kta_status_filter'] ?? 'all';

// Fetch all data without pagination based on the filters
$conditions = ["u.role_id = 1", "u.province_id = ?", "u.city_id = ?"];
$param_types_base = "ii";
$param_values_base = [$admin_province_id, $admin_city_id];

$kta_join_clause = "LEFT JOIN kta_applications ka ON u.id = ka.user_id";
$kta_status_select = "CASE
    WHEN ka.id IS NULL THEN 'Belum Mengajukan'
    WHEN ka.status = 'kta_issued' THEN 'Diterbitkan PB'
    ELSE 'Belum Diterbitkan PB'
END AS kta_status";
$group_by_clause = "GROUP BY u.id";

if ($kta_status_filter == 'issued') {
    $conditions[] = "ka.status = 'kta_issued'";
} elseif ($kta_status_filter == 'not_issued') {
    $conditions[] = "ka.status NOT IN ('kta_issued') AND ka.id IS NOT NULL";
} elseif ($kta_status_filter == 'not_applied') {
    $conditions[] = "ka.id IS NULL";
}

$search_conditions = "(u.username LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)";
$conditions[] = $search_conditions;

$param_values = array_merge($param_values_base, [$search_query, $search_query, $search_query]);
$param_types = $param_types_base . "sss";

$where_clause = "WHERE " . implode(" AND ", $conditions);

$query_members = "SELECT u.id, u.username, u.email, u.phone, p.name AS province_name, c.name AS city_name, " . $kta_status_select . "
                  FROM users u
                  LEFT JOIN provinces p ON u.province_id = p.id
                  LEFT JOIN cities c ON u.city_id = c.id
                  " . $kta_join_clause . "
                  " . $where_clause . "
                  " . $group_by_clause . "
                  ORDER BY u.username ASC";

$stmt = $conn->prepare($query_members);
if (!$stmt) {
    die("Gagal menyiapkan query ekspor: " . $conn->error);
}

// Binding parameters
$refs = [];
foreach ($param_values as $key => $value) {
    $refs[$key] = &$param_values[$key];
}
array_unshift($refs, $param_types);
call_user_func_array([$stmt, 'bind_param'], $refs);

$stmt->execute();
$result = $stmt->get_result();

// Membuat objek Spreadsheet baru
$spreadsheet = new Spreadsheet();
$sheet = $spreadsheet->getActiveSheet();

// Mengatur judul header
$headers = ['ID', 'Nama Anggota', 'Email', 'Telepon', 'Provinsi', 'Kabupaten', 'Status KTA'];
$sheet->fromArray([$headers], null, 'A1');

// Mengisi data ke dalam sheet
$row = 2;
while ($member = $result->fetch_assoc()) {
    $rowData = [
        $member['id'],
        $member['username'],
        $member['email'],
        $member['phone'],
        $member['province_name'],
        $member['city_name'],
        $member['kta_status']
    ];
    $sheet->fromArray([$rowData], null, 'A' . $row);
    $row++;
}

// Mengatur header HTTP untuk pengunduhan file
$fileName = 'data_anggota_' . $_SESSION['user_id'] . '_' . date('Ymd_His') . '.xlsx';
header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
header('Content-Disposition: attachment; filename="' . urlencode($fileName) . '"');
header('Cache-Control: max-age=0');

// Mengirim file ke browser
$writer = new Xlsx($spreadsheet);
$writer->save('php://output');
exit;