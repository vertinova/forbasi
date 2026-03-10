<?php
// API untuk track visitor
header('Content-Type: application/json');

include_once 'db_config.php';

try {
    // Get visitor IP
    $visitor_ip = $_SERVER['REMOTE_ADDR'];
    
    // Get current date
    $today = date('Y-m-d');
    
    // Start transaction
    $conn->begin_transaction();
    
    // Check if visitor visited today (using session)
    session_start();
    $is_unique_today = !isset($_SESSION['visited_today']) || $_SESSION['visited_today'] != $today;
    
    // Update daily stats
    $stmt = $conn->prepare("INSERT INTO visitor_stats (visit_date, visit_count, unique_visitors) 
                           VALUES (?, 1, ?) 
                           ON DUPLICATE KEY UPDATE 
                           visit_count = visit_count + 1,
                           unique_visitors = unique_visitors + ?");
    $unique_increment = $is_unique_today ? 1 : 0;
    $stmt->bind_param("sii", $today, $unique_increment, $unique_increment);
    $stmt->execute();
    $stmt->close();
    
    // Update total visitors
    $stmt2 = $conn->prepare("UPDATE total_visitors 
                            SET total_visits = total_visits + 1,
                                total_unique_visitors = total_unique_visitors + ?
                            WHERE id = 1");
    $stmt2->bind_param("i", $unique_increment);
    $stmt2->execute();
    $stmt2->close();
    
    // Get updated total
    $result = $conn->query("SELECT total_visits, total_unique_visitors FROM total_visitors WHERE id = 1");
    $data = $result->fetch_assoc();
    
    // Commit transaction
    $conn->commit();
    
    // Mark session as visited today
    $_SESSION['visited_today'] = $today;
    
    // Return success response
    echo json_encode([
        'success' => true,
        'data' => [
            'total_visits' => (int)$data['total_visits'],
            'total_unique_visitors' => (int)$data['total_unique_visitors'],
            'is_unique_today' => $is_unique_today
        ]
    ]);
    
} catch (Exception $e) {
    if ($conn) {
        $conn->rollback();
    }
    echo json_encode([
        'success' => false,
        'message' => 'Error tracking visitor: ' . $e->getMessage()
    ]);
} finally {
    if ($conn) {
        $conn->close();
    }
}
?>
