<?php
// forbasi/php/load_members.php
// AJAX endpoint untuk load anggota dengan pagination dan search

header('Content-Type: application/json');

// Sertakan file konfigurasi database
include_once 'db_config.php';

// Inisialisasi response
$response = [
    'success' => false,
    'members' => [],
    'total' => 0,
    'message' => ''
];

// Validasi request method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    $response['message'] = 'Invalid request method';
    echo json_encode($response);
    exit;
}

// Ambil parameter dari POST
$page = isset($_POST['page']) ? (int)$_POST['page'] : 1;
$limit = isset($_POST['limit']) ? (int)$_POST['limit'] : 8;
$search = isset($_POST['search']) ? trim($_POST['search']) : '';

// Validasi parameter
if ($page < 1) $page = 1;
if ($limit < 1 || $limit > 100) $limit = 8;

// Calculate offset
$offset = ($page - 1) * $limit;

try {
    if ($conn->connect_error) {
        throw new Exception("Koneksi database gagal: " . $conn->connect_error);
    }

    // Base query
    $status = 'kta_issued';
    
    // Build query berdasarkan apakah ada search term
    if (!empty($search)) {
        // Query dengan search
        $countQuery = "SELECT COUNT(*) as total FROM kta_applications 
                      WHERE status = ? AND (
                          club_name LIKE ? OR 
                          coach_name LIKE ? OR 
                          manager_name LIKE ? OR 
                          club_address LIKE ?
                      )";
        
        $dataQuery = "SELECT club_name, club_address, coach_name, manager_name, logo_path 
                     FROM kta_applications 
                     WHERE status = ? AND (
                         club_name LIKE ? OR 
                         coach_name LIKE ? OR 
                         manager_name LIKE ? OR 
                         club_address LIKE ?
                     )
                     ORDER BY kta_issued_at DESC 
                     LIMIT ? OFFSET ?";
        
        $searchParam = '%' . $search . '%';
        
        // Count total hasil search
        $countStmt = $conn->prepare($countQuery);
        $countStmt->bind_param("sssss", $status, $searchParam, $searchParam, $searchParam, $searchParam);
        $countStmt->execute();
        $countResult = $countStmt->get_result();
        $response['total'] = $countResult->fetch_assoc()['total'];
        $countStmt->close();
        
        // Get data dengan search
        $stmt = $conn->prepare($dataQuery);
        $stmt->bind_param("sssssii", $status, $searchParam, $searchParam, $searchParam, $searchParam, $limit, $offset);
        
    } else {
        // Query tanpa search (pagination biasa)
        $countQuery = "SELECT COUNT(*) as total FROM kta_applications WHERE status = ?";
        
        $dataQuery = "SELECT club_name, club_address, coach_name, manager_name, logo_path 
                     FROM kta_applications 
                     WHERE status = ? 
                     ORDER BY kta_issued_at DESC 
                     LIMIT ? OFFSET ?";
        
        // Count total members
        $countStmt = $conn->prepare($countQuery);
        $countStmt->bind_param("s", $status);
        $countStmt->execute();
        $countResult = $countStmt->get_result();
        $response['total'] = $countResult->fetch_assoc()['total'];
        $countStmt->close();
        
        // Get data
        $stmt = $conn->prepare($dataQuery);
        $stmt->bind_param("sii", $status, $limit, $offset);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    // Fetch all members
    while ($row = $result->fetch_assoc()) {
        $response['members'][] = [
            'club_name' => htmlspecialchars($row['club_name']),
            'club_address' => htmlspecialchars($row['club_address']),
            'coach_name' => htmlspecialchars($row['coach_name']),
            'manager_name' => htmlspecialchars($row['manager_name']),
            'logo_path' => htmlspecialchars($row['logo_path'])
        ];
    }
    
    $stmt->close();
    $response['success'] = true;
    $response['message'] = 'Data berhasil dimuat';
    
} catch (Exception $e) {
    $response['message'] = 'Error: ' . $e->getMessage();
    error_log("Error in load_members.php: " . $e->getMessage());
} finally {
    if (isset($conn) && $conn) {
        $conn->close();
    }
}

// Return JSON response
echo json_encode($response);
?>
