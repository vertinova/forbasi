<?php
/**
 * Kejurnas Registration Process
 * Handles registration submissions from Pengda for Kejurnas events
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
require_once 'db_config.php';
require_once 'kejurnas_helpers.php';

// Set response header
header('Content-Type: application/json');

// Initialize response
$response = [
    'success' => false,
    'message' => '',
    'data' => null
];

// Check if user is logged in and is Pengda
if (!isset($_SESSION['user_id']) || $_SESSION['role_id'] != 3) {
    $response['message'] = 'Unauthorized access. Only Pengda can register for Kejurnas.';
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

try {
    // Get Pengda info and validate region
    $pengda_id = $_SESSION['user_id'];
    $province_id = $_SESSION['province_id'];
    
    // Get province info using helper function
    $province_info = getProvinceInfo($conn, $province_id);
    
    if (!$province_info['valid']) {
        $response['message'] = 'Invalid province. Please contact administrator.';
        echo json_encode($response);
        exit();
    }
    
    $province_name = $province_info['province_name'];
    $is_jawa = $province_info['is_jawa'];
    $region = $province_info['region'];
    
    switch ($action) {
        case 'search_clubs':
            // Search clubs in the same province with approved KTA
            $search_term = '%' . ($_POST['search'] ?? '') . '%';
            
            $stmt_search = $conn->prepare("
                SELECT 
                    kta.id as kta_id,
                    kta.club_name,
                    kta.club_address,
                    kta.coach_name,
                    kta.manager_name,
                    kta.logo_path,
                    u.id as user_id,
                    u.phone,
                    u.email,
                    COUNT(DISTINCT m.id) as total_members
                FROM kta_applications kta
                LEFT JOIN users u ON kta.user_id = u.id
                LEFT JOIN users m ON m.club_name = kta.club_name AND m.province_id = ?
                WHERE kta.province_id = ? 
                AND kta.status = 'kta_issued'
                AND kta.club_name LIKE ?
                GROUP BY kta.id
                ORDER BY kta.club_name ASC
                LIMIT 20
            ");
            
            $stmt_search->bind_param("iis", $province_id, $province_id, $search_term);
            $stmt_search->execute();
            $result_search = $stmt_search->get_result();
            
            $clubs = [];
            while ($row = $result_search->fetch_assoc()) {
                $clubs[] = $row;
            }
            
            $response['success'] = true;
            $response['data'] = $clubs;
            $stmt_search->close();
            break;
            
        case 'get_club_details':
            // Get detailed club information
            $kta_id = filter_var($_POST['kta_id'] ?? 0, FILTER_VALIDATE_INT);
            
            if (!$kta_id) {
                $response['message'] = 'KTA ID required.';
                echo json_encode($response);
                exit();
            }
            
            $stmt_detail = $conn->prepare("
                SELECT 
                    kta.id as kta_id,
                    kta.club_name,
                    kta.club_address,
                    kta.coach_name,
                    kta.manager_name,
                    kta.logo_path,
                    u.id as user_id,
                    u.phone as coach_phone,
                    u.email,
                    (SELECT phone FROM users WHERE club_name = kta.club_name AND province_id = ? AND role_id = 1 LIMIT 1) as manager_phone,
                    COUNT(DISTINCT m.id) as total_members
                FROM kta_applications kta
                LEFT JOIN users u ON kta.user_id = u.id
                LEFT JOIN users m ON m.club_name = kta.club_name AND m.province_id = ?
                WHERE kta.id = ? AND kta.province_id = ?
                GROUP BY kta.id
            ");
            
            $stmt_detail->bind_param("iiii", $province_id, $province_id, $kta_id, $province_id);
            $stmt_detail->execute();
            $result_detail = $stmt_detail->get_result();
            
            if ($club_data = $result_detail->fetch_assoc()) {
                $response['success'] = true;
                $response['data'] = $club_data;
            } else {
                $response['message'] = 'Club not found.';
            }
            
            $stmt_detail->close();
            break;

        case 'register':
            // Get POST data
            $event_id = filter_var($_POST['event_id'] ?? 0, FILTER_VALIDATE_INT);
            $category_name = $_POST['category_name'] ?? '';
            $level = $_POST['level'] ?? '';
            $kta_id = filter_var($_POST['kta_id'] ?? 0, FILTER_VALIDATE_INT);
            
            // Validate required fields
            if (!$event_id || empty($category_name) || empty($level) || !$kta_id) {
                $response['message'] = 'Please fill all required fields.';
                echo json_encode($response);
                exit();
            }
            
            // Get club data from kta_applications
            $stmt_club = $conn->prepare("
                SELECT 
                    club_name, 
                    club_address,
                    coach_name, 
                    manager_name,
                    logo_path,
                    user_id
                FROM kta_applications 
                WHERE id = ? AND province_id = ? AND status = 'kta_issued'
            ");
            $stmt_club->bind_param("ii", $kta_id, $province_id);
            $stmt_club->execute();
            $result_club = $stmt_club->get_result();
            
            if ($result_club->num_rows === 0) {
                $response['message'] = 'Club not found or not approved.';
                $stmt_club->close();
                echo json_encode($response);
                exit();
            }
            
            $club_data = $result_club->fetch_assoc();
            $club_name = $club_data['club_name'];
            $coach_name = $club_data['coach_name'];
            $manager_name = $club_data['manager_name'];
            $logo_path = $club_data['logo_path'];
            $club_user_id = $club_data['user_id'];
            $stmt_club->close();
            
            // Get contact info from users table
            $coach_phone = '';
            $manager_phone = '';
            if ($club_user_id) {
                $stmt_user = $conn->prepare("SELECT phone FROM users WHERE id = ?");
                $stmt_user->bind_param("i", $club_user_id);
                $stmt_user->execute();
                $result_user = $stmt_user->get_result();
                if ($user_data = $result_user->fetch_assoc()) {
                    $coach_phone = $user_data['phone'];
                    $manager_phone = $user_data['phone'];
                }
                $stmt_user->close();
            }
            
            // Count total members
            $stmt_count_members = $conn->prepare("
                SELECT COUNT(*) as total 
                FROM users 
                WHERE club_name = ? AND province_id = ?
            ");
            $stmt_count_members->bind_param("si", $club_name, $province_id);
            $stmt_count_members->execute();
            $result_count_members = $stmt_count_members->get_result();
            $total_members = 0;
            if ($count_data = $result_count_members->fetch_assoc()) {
                $total_members = $count_data['total'];
            }
            $stmt_count_members->close();
            
            $notes = trim($_POST['notes'] ?? '');
            
            // Get category ID (tidak ada validasi kuota lagi)
            $stmt_cat = $conn->prepare("SELECT id FROM kejurnas_categories WHERE category_name = ? AND level = ?");
            $stmt_cat->bind_param("ss", $category_name, $level);
            $stmt_cat->execute();
            $result_cat = $stmt_cat->get_result();
            
            if ($result_cat->num_rows === 0) {
                $response['message'] = 'Invalid category or level selected.';
                $stmt_cat->close();
                echo json_encode($response);
                exit();
            }
            
            $category_data = $result_cat->fetch_assoc();
            $category_id = $category_data['id'];
            $stmt_cat->close();
            
            // Check if this EXACT CLUB already registered for this category and level
            $stmt_check = $conn->prepare("
                SELECT id FROM kejurnas_registrations 
                WHERE event_id = ? 
                AND category_id = ? 
                AND club_name = ? 
                AND approval_status != 'rejected'
            ");
            $stmt_check->bind_param("iis", $event_id, $category_id, $club_name);
            $stmt_check->execute();
            $result_check = $stmt_check->get_result();
            
            if ($result_check->num_rows > 0) {
                $response['message'] = "Club '$club_name' sudah terdaftar untuk kategori ini. Namun club ini masih bisa mendaftar ke kategori lomba lainnya.";
                $stmt_check->close();
                echo json_encode($response);
                exit();
            }
            $stmt_check->close();
            
            // Insert registration with logo_path
            $stmt_insert = $conn->prepare("
                INSERT INTO kejurnas_registrations 
                (event_id, category_id, pengda_id, province_id, club_name, club_id, level, is_jawa, 
                coach_name, coach_phone, manager_name, manager_phone, total_members, notes, logo_path) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt_insert->bind_param(
                "iiiisisissssiss",
                $event_id,
                $category_id,
                $pengda_id,
                $province_id,
                $club_name,
                $kta_id,
                $level,
                $is_jawa,
                $coach_name,
                $coach_phone,
                $manager_name,
                $manager_phone,
                $total_members,
                $notes,
                $logo_path
            );
            
            if ($stmt_insert->execute()) {
                $response['success'] = true;
                $response['message'] = 'Registration submitted successfully!';
                $response['data'] = ['registration_id' => $stmt_insert->insert_id];
            } else {
                $response['message'] = 'Failed to submit registration: ' . $stmt_insert->error;
            }
            
            $stmt_insert->close();
            break;
            
        case 'get_registrations':
            // Get registrations for this pengda
            $stmt_get = $conn->prepare("
                SELECT 
                    kr.id,
                    kr.club_name,
                    kr.level,
                    kr.coach_name,
                    kr.manager_name,
                    kr.total_members,
                    kr.approval_status,
                    kr.approved_by,
                    kr.approval_date,
                    kr.approval_notes,
                    kr.registered_at,
                    kr.notes,
                    kr.logo_path,
                    kc.category_name,
                    ke.event_name,
                    ke.event_year,
                    p.name as province_name,
                    approver.username as approved_by_username
                FROM kejurnas_registrations kr
                JOIN kejurnas_categories kc ON kr.category_id = kc.id
                JOIN kejurnas_events ke ON kr.event_id = ke.id
                JOIN provinces p ON kr.province_id = p.id
                LEFT JOIN users approver ON kr.approved_by = approver.id
                WHERE kr.pengda_id = ?
                ORDER BY 
                    CASE kr.approval_status
                        WHEN 'pending' THEN 1
                        WHEN 'approved' THEN 2
                        WHEN 'rejected' THEN 3
                    END,
                    kr.registered_at DESC
            ");
            
            $stmt_get->bind_param("i", $pengda_id);
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
            
        case 'get_available_slots':
            // Get available slots for each category
            $event_id = filter_var($_POST['event_id'] ?? 0, FILTER_VALIDATE_INT);
            
            if (!$event_id) {
                $response['message'] = 'Event ID required.';
                echo json_encode($response);
                exit();
            }
            
            $stmt_slots = $conn->prepare("
                SELECT 
                    kc.id,
                    kc.category_name,
                    kc.level,
                    kc.quota_jawa,
                    kc.quota_luar_jawa,
                    (SELECT COUNT(*) FROM kejurnas_registrations 
                     WHERE category_id = kc.id AND event_id = ? AND is_jawa = 1 AND status != 'rejected') as filled_jawa,
                    (SELECT COUNT(*) FROM kejurnas_registrations 
                     WHERE category_id = kc.id AND event_id = ? AND is_jawa = 0 AND status != 'rejected') as filled_luar_jawa
                FROM kejurnas_categories kc
                ORDER BY kc.category_name, kc.level
            ");
            
            $stmt_slots->bind_param("ii", $event_id, $event_id);
            $stmt_slots->execute();
            $result_slots = $stmt_slots->get_result();
            
            $slots = [];
            while ($row = $result_slots->fetch_assoc()) {
                $row['available_jawa'] = $row['quota_jawa'] - $row['filled_jawa'];
                $row['available_luar_jawa'] = $row['quota_luar_jawa'] - $row['filled_luar_jawa'];
                $row['is_user_jawa'] = $is_jawa;
                $row['available_for_user'] = $is_jawa ? $row['available_jawa'] : $row['available_luar_jawa'];
                $slots[] = $row;
            }
            
            $response['success'] = true;
            $response['data'] = $slots;
            $stmt_slots->close();
            break;
            
        case 'delete':
            $registration_id = filter_var($_POST['registration_id'] ?? 0, FILTER_VALIDATE_INT);
            
            if (!$registration_id) {
                $response['message'] = 'Registration ID required.';
                echo json_encode($response);
                exit();
            }
            
            // Check if registration belongs to this pengda and is still pending
            $stmt_delete = $conn->prepare("
                DELETE FROM kejurnas_registrations 
                WHERE id = ? AND pengda_id = ? AND status = 'pending'
            ");
            
            $stmt_delete->bind_param("ii", $registration_id, $pengda_id);
            
            if ($stmt_delete->execute()) {
                if ($stmt_delete->affected_rows > 0) {
                    $response['success'] = true;
                    $response['message'] = 'Registration deleted successfully.';
                } else {
                    $response['message'] = 'Registration not found or cannot be deleted.';
                }
            } else {
                $response['message'] = 'Failed to delete registration: ' . $stmt_delete->error;
            }
            
            $stmt_delete->close();
            break;
            
        case 'get_my_quota':
            // Get registration count for current Pengda (TANPA BATASAN KUOTA)
            $event_id = filter_var($_POST['event_id'] ?? 0, FILTER_VALIDATE_INT);
            
            if (!$event_id) {
                $response['message'] = 'Event ID required.';
                echo json_encode($response);
                exit();
            }
            
            $stmt_quota = $conn->prepare("
                SELECT 
                    kc.id,
                    kc.category_name,
                    kc.level,
                    (SELECT COUNT(*) FROM kejurnas_registrations 
                     WHERE category_id = kc.id AND event_id = ? AND pengda_id = ? AND approval_status != 'rejected') as filled
                FROM kejurnas_categories kc
                ORDER BY kc.category_name, kc.level
            ");
            
            $stmt_quota->bind_param("ii", $event_id, $pengda_id);
            $stmt_quota->execute();
            $result_quota = $stmt_quota->get_result();
            
            $quotas = [];
            while ($row = $result_quota->fetch_assoc()) {
                // TIDAK ADA BATASAN KUOTA - Unlimited registrations
                $row['quota'] = 999; // Unlimited (tampilkan angka besar)
                $row['available'] = 999; // Selalu tersedia
                $row['is_jawa'] = $is_jawa;
                $row['is_special'] = false;
                $row['unlimited'] = true; // Flag untuk frontend
                $quotas[] = $row;
            }
            
            $response['success'] = true;
            $response['data'] = $quotas;
            $stmt_quota->close();
            break;
            
        default:
            $response['message'] = 'Invalid action.';
            break;
    }
    
} catch (Exception $e) {
    $response['message'] = 'Error: ' . $e->getMessage();
    error_log('Kejurnas registration error: ' . $e->getMessage());
}

// Close connection
if (isset($conn)) {
    $conn->close();
}

echo json_encode($response);
?>
