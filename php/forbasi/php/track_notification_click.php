<?php
/**
 * Log Notification Click API
 * Tracks when users click on notifications
 */

header('Content-Type: application/json');

include_once 'db_config.php';

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['tag'])) {
    echo json_encode(['success' => false, 'error' => 'Invalid input']);
    exit;
}

$tag = $input['tag'];
$action = isset($input['action']) ? $input['action'] : 'open';

try {
    // Update notifications_log with click timestamp
    $stmt = $conn->prepare("
        UPDATE notifications_log 
        SET clicked_at = NOW() 
        WHERE title LIKE ? 
        AND clicked_at IS NULL 
        ORDER BY sent_at DESC 
        LIMIT 1
    ");
    
    $searchTag = "%" . $tag . "%";
    $stmt->bind_param("s", $searchTag);
    $stmt->execute();
    
    $affectedRows = $stmt->affected_rows;
    $stmt->close();
    $conn->close();
    
    echo json_encode([
        'success' => true,
        'message' => 'Click logged successfully',
        'updated' => $affectedRows
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
