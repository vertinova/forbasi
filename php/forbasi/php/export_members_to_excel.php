<?php
session_start();
require_once 'db_config.php';
// Perbaiki path autoload.php. Asumsi folder 'vendor' berada satu tingkat di atas file ini.
require_once __DIR__ . '/../vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

// Check if user is logged in and is Pengurus Daerah (role_id = 3)
if (!isset($_SESSION['user_id']) || $_SESSION['role_id'] != 3) {
    header("Location: login.php");
    exit();
}

$admin_id = $_SESSION['user_id'];

// Get the province_id and full profile of the currently logged-in Pengurus Daerah admin
$admin_province_id = null;
$admin_province_name = null;

$query_admin_profile = "SELECT u.province_id, p.name AS province_name FROM users u LEFT JOIN provinces p ON u.province_id = p.id WHERE u.id = ?";
$stmt_admin_profile = $conn->prepare($query_admin_profile);
if ($stmt_admin_profile) {
    $stmt_admin_profile->bind_param("i", $admin_id);
    $stmt_admin_profile->execute();
    $result_admin_profile = $stmt_admin_profile->get_result();
    if ($row_admin_profile = $result_admin_profile->fetch_assoc()) {
        $admin_province_id = $row_admin_profile['province_id'];
        $admin_province_name = $row_admin_profile['province_name'];
    }
    $stmt_admin_profile->close();
}

if (empty($admin_province_id)) {
    // If admin has no province, they can't export anything.
    exit("Profil Pengurus Daerah Anda belum memiliki informasi Provinsi yang terdaftar.");
}

// Fetch members data
$query_members = "SELECT u.id, u.username, u.email, u.phone, u.username AS full_name, u.address, u.club_name,
                        r.role_name, p.name AS province_name, c.name AS city_name,
                        COALESCE(
                            CASE
                                WHEN latest_kta.status = 'kta_issued' THEN 'Diterbitkan PB'
                                WHEN latest_kta.status = 'approved_pb' THEN 'Disetujui PB'
                                WHEN latest_kta.status = 'approved_pengda' THEN 'Disetujui Pengda'
                                WHEN latest_kta.status = 'approved_pengcab' THEN 'Disetujui Pengcab'
                                WHEN latest_kta.status = 'pending' THEN 'Menunggu Verifikasi Pengcab'
                                WHEN latest_kta.status = 'rejected_pengcab' THEN 'Ditolak Pengcab'
                                WHEN latest_kta.status = 'rejected_pengda' THEN 'Ditolak Pengda'
                                WHEN latest_kta.status = 'rejected_pb' THEN 'Ditolak PB'
                                WHEN latest_kta.status = 'pending_pengda_resubmit' THEN 'Menunggu Verifikasi PB (Diajukan Kembali)'
                                ELSE 'Belum Mengajukan'
                            END
                        , 'Belum Mengajukan') AS kta_status
                    FROM users u
                    LEFT JOIN roles r ON u.role_id = r.id
                    LEFT JOIN provinces p ON u.province_id = p.id
                    LEFT JOIN cities c ON u.city_id = c.id
                    LEFT JOIN (
                        SELECT ka.user_id, ka.status, ka.created_at
                        FROM kta_applications ka
                        INNER JOIN (
                            SELECT user_id, MAX(created_at) AS max_created_at
                            FROM kta_applications
                            GROUP BY user_id
                        ) AS latest_ka ON ka.user_id = latest_ka.user_id AND ka.created_at = latest_ka.max_created_at
                    ) AS latest_kta ON u.id = latest_kta.user_id
                    WHERE u.province_id = ?
                    AND u.role_id IN (1, 2)
                    ORDER BY u.role_id ASC, u.created_at DESC";

$stmt_members = $conn->prepare($query_members);
$members = [];
if ($stmt_members) {
    $stmt_members->bind_param("i", $admin_province_id);
    $stmt_members->execute();
    $result_members = $stmt_members->get_result();
    while ($row = $result_members->fetch_assoc()) {
        $members[] = $row;
    }
    $stmt_members->close();
} else {
    exit("Gagal mengambil data anggota: " . $conn->error);
}

// Create a new Spreadsheet object
$spreadsheet = new Spreadsheet();
$sheet = $spreadsheet->getActiveSheet();

// Set up column headers
$headers = [
    'ID', 'Username', 'Nama Lengkap', 'Email', 'Telepon', 'Peran', 
    'Club (Jika Pengcab/Anggota)', 'Provinsi', 'Kabupaten/Kota', 'Alamat', 
    'Status KTA'
];
$sheet->fromArray([$headers], NULL, 'A1');

// Apply styling to the header row
$headerStyle = [
    'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
    'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['rgb' => '212529']],
    'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'DDDDDD']]],
    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
];
$sheet->getStyle('A1:' . $sheet->getHighestColumn() . '1')->applyFromArray($headerStyle);

// Add member data to the sheet
$row_index = 2;
foreach ($members as $member) {
    $rowData = [
        $member['id'],
        $member['username'],
        $member['full_name'],
        $member['email'],
        $member['phone'],
        $member['role_name'],
        $member['club_name'],
        $member['province_name'],
        $member['city_name'],
        $member['address'],
        $member['kta_status']
    ];
    $sheet->fromArray([$rowData], NULL, 'A' . $row_index);
    $row_index++;
}

// Auto-size columns for better readability
foreach (range('A', $sheet->getHighestColumn()) as $col) {
    $sheet->getColumnDimension($col)->setAutoSize(true);
}

// Set the header for file download
$filename = 'data_anggota_forbasi_' . str_replace(' ', '_', strtolower($admin_province_name)) . '_' . date('Ymd_His') . '.xlsx';
header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
header('Content-Disposition: attachment;filename="' . $filename . '"');
header('Cache-Control: max-age=0');

$writer = new Xlsx($spreadsheet);
$writer->save('php://output');
exit;