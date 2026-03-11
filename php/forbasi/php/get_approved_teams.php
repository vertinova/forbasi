<?php
/**
 * Get Approved Kejurnas Teams
 * Public API to display approved teams for competition
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

require_once 'db_config.php';

$response = [
    'success' => false,
    'message' => '',
    'data' => null
];

try {
    // Get approved teams grouped by category
    $sql = "
        SELECT 
            kr.id,
            kr.club_name,
            kr.logo_path,
            kr.level,
            kr.total_members,
            kr.registered_at,
            kr.approval_date,
            kc.category_name,
            ke.event_name,
            ke.event_year,
            p.name as province_name,
            u.username as pengda_name
        FROM kejurnas_registrations kr
        JOIN kejurnas_categories kc ON kr.category_id = kc.id
        JOIN kejurnas_events ke ON kr.event_id = ke.id
        JOIN provinces p ON kr.province_id = p.id
        JOIN users u ON kr.pengda_id = u.id
        WHERE kr.approval_status = 'approved'
        ORDER BY kc.category_name, kr.level, p.name, kr.club_name
    ";
    
    $result = $conn->query($sql);
    
    if (!$result) {
        throw new Exception('Query failed: ' . $conn->error);
    }
    
    $teams = [];
    $categories = [];
    
    while ($row = $result->fetch_assoc()) {
        $category = $row['category_name'];
        
        if (!isset($categories[$category])) {
            $categories[$category] = [];
        }
        
        $categories[$category][] = $row;
        $teams[] = $row;
    }
    
    // Get statistics
    $stats_sql = "
        SELECT 
            kc.category_name,
            COUNT(*) as total_teams,
            SUM(kr.total_members) as total_participants
        FROM kejurnas_registrations kr
        JOIN kejurnas_categories kc ON kr.category_id = kc.id
        WHERE kr.approval_status = 'approved'
        GROUP BY kc.category_name
    ";
    
    $stats_result = $conn->query($stats_sql);
    $statistics = [];
    
    while ($stat = $stats_result->fetch_assoc()) {
        $statistics[$stat['category_name']] = [
            'total_teams' => $stat['total_teams'],
            'total_participants' => $stat['total_participants']
        ];
    }
    
    // Get level statistics
    $level_sql = "
        SELECT 
            kr.level,
            COUNT(*) as total_teams,
            SUM(kr.total_members) as total_participants
        FROM kejurnas_registrations kr
        WHERE kr.approval_status = 'approved'
        GROUP BY kr.level
    ";
    
    $level_result = $conn->query($level_sql);
    $level_stats = [];
    
    while ($level_stat = $level_result->fetch_assoc()) {
        $level_stats[$level_stat['level']] = [
            'total_teams' => $level_stat['total_teams'],
            'total_participants' => $level_stat['total_participants']
        ];
    }
    
    $response['success'] = true;
    $response['data'] = [
        'teams' => $teams,
        'categories' => $categories,
        'statistics' => $statistics,
        'level_statistics' => $level_stats,
        'total_teams' => count($teams)
    ];
    
} catch (Exception $e) {
    $response['message'] = 'Error: ' . $e->getMessage();
    error_log('Get approved teams error: ' . $e->getMessage());
}

if (isset($conn)) {
    $conn->close();
}

echo json_encode($response);
?>
