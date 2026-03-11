<?php
/**
 * Kejurnas Management for PB (Pengurus Besar)
 * Handles viewing and approval of Kejurnas registrations from Pengda
 */

// Suppress PHP warnings in production to prevent HTML output before JSON
error_reporting(E_ERROR | E_PARSE);
ini_set('display_errors', '0');

// Start output buffering to catch any unwanted output
ob_start();

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Catch any fatal errors
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        ob_clean();
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => false,
            'message' => 'Server error: ' . $error['message'],
            'file' => basename($error['file']),
            'line' => $error['line']
        ]);
    }
});

try {
    require_once 'db_config.php';
} catch (Exception $e) {
    ob_clean();
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'message' => 'Database config error: ' . $e->getMessage()
    ]);
    exit();
}

// Include PhpSpreadsheet for Excel export
if (file_exists(__DIR__ . '/../vendor/autoload.php')) {
    require_once __DIR__ . '/../vendor/autoload.php';
}

// Include helpers if exists (optional)
if (file_exists(__DIR__ . '/kejurnas_helpers.php')) {
    require_once 'kejurnas_helpers.php';
}

// Set response header - MUST be before any output
header('Content-Type: application/json; charset=utf-8');

// Initialize response
$response = [
    'success' => false,
    'message' => '',
    'data' => null
];

// Check if user is logged in and is PB
if (!isset($_SESSION['user_id']) || $_SESSION['role_id'] != 4) {
    $response['message'] = 'Unauthorized access. Only PB can manage Kejurnas.';
    echo json_encode($response);
    exit();
}

// Check request method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    $response['message'] = 'Invalid request method.';
    echo json_encode($response);
    exit();
}

// Get action
$action = $_POST['action'] ?? '';
$pb_admin_id = $_SESSION['user_id'];

try {
    switch ($action) {
        case 'get_all_registrations':
            // Get all registrations from all Pengda
            $filter_status = $_POST['filter_status'] ?? 'all';
            $filter_category = $_POST['filter_category'] ?? 'all';
            $filter_level = $_POST['filter_level'] ?? 'all';
            $filter_pengda = $_POST['filter_pengda'] ?? 'all';
            
            $where_clauses = [];
            $params = [];
            $types = '';
            
            if ($filter_status !== 'all') {
                $where_clauses[] = "kr.approval_status = ?";
                $params[] = $filter_status;
                $types .= 's';
            }
            
            if ($filter_category !== 'all') {
                $where_clauses[] = "kc.category_name = ?";
                $params[] = $filter_category;
                $types .= 's';
            }
            
            if ($filter_level !== 'all') {
                $where_clauses[] = "kr.level = ?";
                $params[] = $filter_level;
                $types .= 's';
            }
            
            if ($filter_pengda !== 'all') {
                $where_clauses[] = "kr.pengda_id = ?";
                $params[] = (int)$filter_pengda;
                $types .= 'i';
            }
            
            $where_sql = count($where_clauses) > 0 ? 'WHERE ' . implode(' AND ', $where_clauses) : '';
            
            $sql = "
                SELECT 
                    kr.id,
                    kr.club_name,
                    kr.logo_path,
                    kr.level,
                    kr.coach_name,
                    kr.coach_phone,
                    kr.manager_name,
                    kr.manager_phone,
                    kr.total_members,
                    kr.approval_status,
                    kr.approved_by,
                    kr.approval_date,
                    kr.approval_notes,
                    kr.registered_at,
                    kr.notes,
                    kr.is_jawa,
                    kc.category_name,
                    ke.event_name,
                    ke.event_year,
                    p.name as province_name,
                    u.username as pengda_username,
                    u.email as pengda_email,
                    u.phone as pengda_phone,
                    approver.username as approved_by_username
                FROM kejurnas_registrations kr
                JOIN kejurnas_categories kc ON kr.category_id = kc.id
                JOIN kejurnas_events ke ON kr.event_id = ke.id
                JOIN provinces p ON kr.province_id = p.id
                JOIN users u ON kr.pengda_id = u.id
                LEFT JOIN users approver ON kr.approved_by = approver.id
                $where_sql
                ORDER BY 
                    CASE kr.approval_status
                        WHEN 'pending' THEN 1
                        WHEN 'approved' THEN 2
                        WHEN 'rejected' THEN 3
                    END,
                    kr.registered_at DESC
            ";
            
            $stmt_get = $conn->prepare($sql);
            
            if (count($params) > 0) {
                $stmt_get->bind_param($types, ...$params);
            }
            
            $stmt_get->execute();
            $result_get = $stmt_get->get_result();
            
            $registrations = [];
            while ($row = $result_get->fetch_assoc()) {
                $registrations[] = $row;
            }
            
            $response['success'] = true;
            $response['data'] = $registrations;
            $stmt_get->close();
            break;
            
        case 'approve':
            $registration_id = filter_var($_POST['registration_id'] ?? 0, FILTER_VALIDATE_INT);
            $approval_notes = trim($_POST['approval_notes'] ?? '');
            
            if (!$registration_id) {
                $response['message'] = 'Registration ID required.';
                echo json_encode($response);
                exit();
            }
            
            // Update status to approved
            $stmt_approve = $conn->prepare("
                UPDATE kejurnas_registrations 
                SET approval_status = 'approved', 
                    approved_by = ?, 
                    approval_date = NOW(),
                    approval_notes = ?
                WHERE id = ? AND approval_status = 'pending'
            ");
            
            $stmt_approve->bind_param("isi", $pb_admin_id, $approval_notes, $registration_id);
            
            if ($stmt_approve->execute()) {
                if ($stmt_approve->affected_rows > 0) {
                    $response['success'] = true;
                    $response['message'] = 'Registration approved successfully.';
                } else {
                    $response['message'] = 'Registration not found or already processed.';
                }
            } else {
                $response['message'] = 'Failed to approve registration: ' . $stmt_approve->error;
            }
            
            $stmt_approve->close();
            break;
            
        case 'reject':
            $registration_id = filter_var($_POST['registration_id'] ?? 0, FILTER_VALIDATE_INT);
            $approval_notes = trim($_POST['approval_notes'] ?? '');
            
            if (!$registration_id) {
                $response['message'] = 'Registration ID required.';
                echo json_encode($response);
                exit();
            }
            
            if (empty($approval_notes)) {
                $response['message'] = 'Rejection reason is required.';
                echo json_encode($response);
                exit();
            }
            
            // Update status to rejected
            $stmt_reject = $conn->prepare("
                UPDATE kejurnas_registrations 
                SET approval_status = 'rejected', 
                    approved_by = ?, 
                    approval_date = NOW(),
                    approval_notes = ?
                WHERE id = ? AND approval_status = 'pending'
            ");
            
            $stmt_reject->bind_param("isi", $pb_admin_id, $approval_notes, $registration_id);
            
            if ($stmt_reject->execute()) {
                if ($stmt_reject->affected_rows > 0) {
                    $response['success'] = true;
                    $response['message'] = 'Registration rejected successfully.';
                } else {
                    $response['message'] = 'Registration not found or already processed.';
                }
            } else {
                $response['message'] = 'Failed to reject registration: ' . $stmt_reject->error;
            }
            
            $stmt_reject->close();
            break;
            
        case 'get_summary':
            // Get summary statistics - total participants by category and level
            $stmt_summary = $conn->prepare("
                SELECT 
                    COUNT(DISTINCT kr.id) as total_registrations,
                    COUNT(DISTINCT CASE WHEN kr.approval_status = 'pending' THEN kr.id END) as total_pending,
                    COUNT(DISTINCT CASE WHEN kr.approval_status = 'approved' THEN kr.id END) as total_approved,
                    COUNT(DISTINCT CASE WHEN kr.approval_status = 'rejected' THEN kr.id END) as total_rejected,
                    COALESCE(SUM(CASE WHEN kr.approval_status != 'rejected' THEN kr.total_members ELSE 0 END), 0) as total_participants,
                    COALESCE(SUM(CASE WHEN kr.approval_status = 'approved' THEN kr.total_members ELSE 0 END), 0) as total_approved_participants,
                    COALESCE(SUM(CASE WHEN kr.approval_status = 'pending' THEN kr.total_members ELSE 0 END), 0) as total_pending_participants,
                    COALESCE(SUM(CASE WHEN kc.category_name = 'rukibra' AND kr.approval_status != 'rejected' THEN kr.total_members ELSE 0 END), 0) as total_rukibra,
                    COALESCE(SUM(CASE WHEN kc.category_name = 'baris_berbaris' AND kr.approval_status != 'rejected' THEN kr.total_members ELSE 0 END), 0) as total_baris_berbaris,
                    COALESCE(SUM(CASE WHEN kc.category_name = 'varfor_musik' AND kr.approval_status != 'rejected' THEN kr.total_members ELSE 0 END), 0) as total_varfor_musik,
                    COALESCE(SUM(CASE WHEN kr.level = 'SD' AND kr.approval_status != 'rejected' THEN kr.total_members ELSE 0 END), 0) as total_sd,
                    COALESCE(SUM(CASE WHEN kr.level = 'SMP' AND kr.approval_status != 'rejected' THEN kr.total_members ELSE 0 END), 0) as total_smp,
                    COALESCE(SUM(CASE WHEN kr.level = 'SMA' AND kr.approval_status != 'rejected' THEN kr.total_members ELSE 0 END), 0) as total_sma,
                    COALESCE(SUM(CASE WHEN kr.level = 'Purna' AND kr.approval_status != 'rejected' THEN kr.total_members ELSE 0 END), 0) as total_purna
                FROM kejurnas_registrations kr
                LEFT JOIN kejurnas_categories kc ON kr.category_id = kc.id
            ");
            
            if ($stmt_summary) {
                $stmt_summary->execute();
                $result_summary = $stmt_summary->get_result();
                $summary = $result_summary->fetch_assoc();
                
                $response['success'] = true;
                $response['data'] = $summary;
                $stmt_summary->close();
            } else {
                $response['message'] = 'Database error: ' . $conn->error;
            }
            break;
            
        case 'get_statistics':
            // Get statistics for dashboard - PER PENGDA
            // Get latest event ID first
            $latest_event_sql = "SELECT id FROM kejurnas_events ORDER BY event_year DESC LIMIT 1";
            $latest_event_result = $conn->query($latest_event_sql);
            $latest_event_id = null;
            
            if ($latest_event_result && $latest_event_result->num_rows > 0) {
                $latest_event_row = $latest_event_result->fetch_assoc();
                $latest_event_id = $latest_event_row['id'];
            }
            
            // If no event exists, return empty statistics
            if ($latest_event_id === null) {
                $response['success'] = true;
                $response['data'] = [];
                $response['message'] = 'Belum ada event kejurnas';
                break;
            }
            
            // Get statistics PER PENGDA PER CATEGORY
            $stmt_stats = $conn->prepare("
                SELECT 
                    kc.id as category_id,
                    kc.category_name,
                    kc.level,
                    kc.quota_per_pengda_jawa,
                    kc.quota_per_pengda_luar_jawa,
                    u.id as pengda_id,
                    u.username as pengda_name,
                    p.name as province_name,
                    p.id as province_id,
                    COUNT(CASE WHEN kr.approval_status != 'rejected' THEN 1 END) as filled,
                    COUNT(CASE WHEN kr.approval_status = 'pending' THEN 1 END) as pending,
                    COUNT(CASE WHEN kr.approval_status = 'approved' THEN 1 END) as approved,
                    COUNT(CASE WHEN kr.approval_status = 'rejected' THEN 1 END) as rejected
                FROM kejurnas_categories kc
                CROSS JOIN users u
                LEFT JOIN provinces p ON u.province_id = p.id
                LEFT JOIN kejurnas_registrations kr ON kc.id = kr.category_id 
                    AND kr.pengda_id = u.id 
                    AND kr.event_id = ?
                WHERE u.role_id = 3
                GROUP BY kc.id, kc.category_name, kc.level, u.id, u.username, p.name, p.id
                ORDER BY p.name, kc.category_name, kc.level
            ");
            
            if (!$stmt_stats) {
                $response['message'] = 'Database error: ' . $conn->error;
                break;
            }
            
            $stmt_stats->bind_param('i', $latest_event_id);
            
            if (!$stmt_stats->execute()) {
                $response['message'] = 'Query error: ' . $stmt_stats->error;
                $stmt_stats->close();
                break;
            }
            
            $result_stats = $stmt_stats->get_result();
            
            $statistics = [];
            $jawa_provinces = [11, 12, 13, 14, 15, 16]; // DKI Jakarta, Jawa Barat, Jawa Tengah, DI Yogyakarta, Jawa Timur, Banten
            $kalimantan_barat_id = 20; // Kalimantan Barat province ID
            
            while ($row = $result_stats->fetch_assoc()) {
                $is_jawa = in_array((int)$row['province_id'], $jawa_provinces);
                $is_kalbar = (int)$row['province_id'] === $kalimantan_barat_id;
                
                $row['is_jawa'] = $is_jawa ? 1 : 0;
                
                // Special quota for Kalimantan Barat: 4 for each category and level
                if ($is_kalbar) {
                    $row['quota'] = 4;
                    $row['is_special'] = 1;
                    $row['special_note'] = 'Kuota Khusus Kalimantan Barat';
                } else {
                    $row['quota'] = $is_jawa ? $row['quota_per_pengda_jawa'] : $row['quota_per_pengda_luar_jawa'];
                    $row['is_special'] = 0;
                }
                
                $row['available'] = $row['quota'] - $row['filled'];
                $statistics[] = $row;
            }
            
            $response['success'] = true;
            $response['data'] = $statistics;
            $stmt_stats->close();
            break;
            
        case 'get_pengda_list':
            // Get list of all Pengda for filter dropdown
            $stmt_pengda = $conn->prepare("
                SELECT 
                    u.id,
                    u.username,
                    p.name as province_name,
                    p.id as province_id
                FROM users u
                LEFT JOIN provinces p ON u.province_id = p.id
                WHERE u.role_id = 3
                ORDER BY p.name ASC
            ");
            
            if ($stmt_pengda) {
                $stmt_pengda->execute();
                $result_pengda = $stmt_pengda->get_result();
                
                $pengda_list = [];
                while ($row = $result_pengda->fetch_assoc()) {
                    $pengda_list[] = $row;
                }
                
                $response['success'] = true;
                $response['data'] = $pengda_list;
                $stmt_pengda->close();
            } else {
                $response['message'] = 'Database error: ' . $conn->error;
            }
            break;
            
        case 'export_to_excel':
            // Export kejurnas registrations to Excel
            if (!class_exists('PhpOffice\PhpSpreadsheet\Spreadsheet')) {
                $response['success'] = false;
                $response['message'] = 'PhpSpreadsheet library not found';
                break;
            }
            
            $filter_status = $_POST['filter_status'] ?? 'all';
            $filter_category = $_POST['filter_category'] ?? 'all';
            $filter_level = $_POST['filter_level'] ?? 'all';
            $filter_pengda = $_POST['filter_pengda'] ?? 'all';
            
            $where_clauses = [];
            $params = [];
            $types = '';
            
            if ($filter_status !== 'all') {
                $where_clauses[] = "kr.approval_status = ?";
                $params[] = $filter_status;
                $types .= 's';
            }
            
            if ($filter_category !== 'all') {
                $where_clauses[] = "kc.category_name = ?";
                $params[] = $filter_category;
                $types .= 's';
            }
            
            if ($filter_level !== 'all') {
                $where_clauses[] = "kr.level = ?";
                $params[] = $filter_level;
                $types .= 's';
            }
            
            if ($filter_pengda !== 'all') {
                $where_clauses[] = "kr.pengda_id = ?";
                $params[] = (int)$filter_pengda;
                $types .= 'i';
            }
            
            $where_sql = count($where_clauses) > 0 ? 'WHERE ' . implode(' AND ', $where_clauses) : '';
            
            $sql = "
                SELECT 
                    kr.id,
                    kr.club_name,
                    kr.level,
                    kr.coach_name,
                    kr.coach_phone,
                    kr.manager_name,
                    kr.manager_phone,
                    kr.total_members,
                    kr.approval_status,
                    kr.registered_at,
                    kr.notes,
                    kr.is_jawa,
                    kc.category_name,
                    ke.event_name,
                    ke.event_year,
                    p.name as province_name,
                    u.username as pengda_username,
                    u.email as pengda_email,
                    u.phone as pengda_phone
                FROM kejurnas_registrations kr
                JOIN kejurnas_categories kc ON kr.category_id = kc.id
                JOIN kejurnas_events ke ON kr.event_id = ke.id
                JOIN provinces p ON kr.province_id = p.id
                JOIN users u ON kr.pengda_id = u.id
                $where_sql
                ORDER BY p.name, kc.category_name, kr.level
            ";
            
            $stmt_export = $conn->prepare($sql);
            
            if (count($params) > 0) {
                $stmt_export->bind_param($types, ...$params);
            }
            
            $stmt_export->execute();
            $result_export = $stmt_export->get_result();
            
            // Create new Spreadsheet
            $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle('Peserta Kompetisi');
            
            // Set header
            $headers = [
                'No', 'Nama Club', 'Kategori', 'Level', 'Total Anggota', 'Provinsi', 'Wilayah',
                'Pelatih', 'Telp Pelatih', 'Manager', 'Telp Manager', 
                'Status', 'Event', 'Tahun', 'Pengda', 'Email Pengda', 'Tgl Daftar'
            ];
            
            $col = 'A';
            foreach ($headers as $header) {
                $sheet->setCellValue($col . '1', $header);
                $col++;
            }
            
            // Style header
            $headerStyle = [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 11],
                'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['rgb' => '0d9500']],
                'borders' => ['allBorders' => ['borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN]],
                'alignment' => ['horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER, 'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER]
            ];
            $sheet->getStyle('A1:Q1')->applyFromArray($headerStyle);
            
            // Set data
            $row = 2;
            $no = 1;
            while ($data = $result_export->fetch_assoc()) {
                $category_display = [
                    'rukibra' => 'Rukibra',
                    'varfor_musik' => 'Varfor Musik',
                    'baris_berbaris' => 'Baris Berbaris'
                ];
                
                $status_display = [
                    'pending' => 'Menunggu',
                    'approved' => 'Disetujui',
                    'rejected' => 'Ditolak'
                ];
                
                $wilayah = $data['is_jawa'] == 1 ? 'Jawa' : 'Luar Jawa';
                
                $sheet->setCellValue('A' . $row, $no);
                $sheet->setCellValue('B' . $row, $data['club_name']);
                $sheet->setCellValue('C' . $row, $category_display[$data['category_name']] ?? $data['category_name']);
                $sheet->setCellValue('D' . $row, $data['level']);
                $sheet->setCellValue('E' . $row, $data['total_members']);
                $sheet->setCellValue('F' . $row, $data['province_name']);
                $sheet->setCellValue('G' . $row, $wilayah);
                $sheet->setCellValue('H' . $row, $data['coach_name']);
                $sheet->setCellValue('I' . $row, $data['coach_phone']);
                $sheet->setCellValue('J' . $row, $data['manager_name']);
                $sheet->setCellValue('K' . $row, $data['manager_phone']);
                $sheet->setCellValue('L' . $row, $status_display[$data['approval_status']] ?? $data['approval_status']);
                $sheet->setCellValue('M' . $row, $data['event_name']);
                $sheet->setCellValue('N' . $row, $data['event_year']);
                $sheet->setCellValue('O' . $row, $data['pengda_username']);
                $sheet->setCellValue('P' . $row, $data['pengda_email']);
                $sheet->setCellValue('Q' . $row, date('d/m/Y H:i', strtotime($data['registered_at'])));
                
                $row++;
                $no++;
            }
            
            // Auto size columns
            foreach (range('A', 'Q') as $col) {
                $sheet->getColumnDimension($col)->setAutoSize(true);
            }
            
            // Add borders to all data
            $sheet->getStyle('A1:Q' . ($row - 1))->applyFromArray([
                'borders' => ['allBorders' => ['borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN, 'color' => ['rgb' => '000000']]]
            ]);
            
            $stmt_export->close();
            $conn->close();
            
            // Clear output buffer
            ob_clean();
            
            // Set headers for download
            header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            header('Content-Disposition: attachment;filename="Peserta_Kompetisi_' . date('Y-m-d') . '.xlsx"');
            header('Cache-Control: max-age=0');
            
            $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
            $writer->save('php://output');
            exit();
            
        default:
            $response['message'] = 'Invalid action.';
            break;
    }
    
} catch (Exception $e) {
    $response['message'] = 'Error: ' . $e->getMessage();
    error_log('Kejurnas PB management error: ' . $e->getMessage());
}

// Close connection
if (isset($conn)) {
    $conn->close();
}

// Clean any unwanted output
ob_clean();

// Output JSON
echo json_encode($response);

// Flush and end output buffering
ob_end_flush();
?>
