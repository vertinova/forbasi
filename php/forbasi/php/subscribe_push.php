<?php
/**
 * Subscribe to Push Notifications API
 * Saves device subscription endpoint and keys to database
 */

header('Content-Type: application/json');

include_once 'db_config.php';

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    echo json_encode(['success' => false, 'error' => 'Invalid JSON input']);
    exit;
}

// Validate required fields
if (!isset($input['endpoint']) || !isset($input['keys']['p256dh']) || !isset($input['keys']['auth'])) {
    echo json_encode(['success' => false, 'error' => 'Missing required fields']);
    exit;
}

$endpoint = $input['endpoint'];
$p256dh = $input['keys']['p256dh'];
$auth = $input['keys']['auth'];
$userType = isset($input['userType']) ? $input['userType'] : 'guest';
$userId = isset($input['userId']) ? intval($input['userId']) : null;

try {
    // Check if subscription already exists
    $stmt = $conn->prepare("SELECT id FROM push_subscriptions WHERE endpoint = ?");
    $stmt->bind_param("s", $endpoint);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        // Update existing subscription
        $row = $result->fetch_assoc();
        $subscriptionId = $row['id'];
        
        $stmt = $conn->prepare("UPDATE push_subscriptions SET p256dh_key = ?, auth_key = ?, user_type = ?, user_id = ?, is_active = 1, subscribed_at = NOW() WHERE id = ?");
        $stmt->bind_param("sssii", $p256dh, $auth, $userType, $userId, $subscriptionId);
        $stmt->execute();
        
        $message = 'Subscription updated successfully';
    } else {
        // Insert new subscription
        $stmt = $conn->prepare("INSERT INTO push_subscriptions (user_id, user_type, endpoint, p256dh_key, auth_key, subscribed_at, is_active) VALUES (?, ?, ?, ?, ?, NOW(), 1)");
        $stmt->bind_param("issss", $userId, $userType, $endpoint, $p256dh, $auth);
        $stmt->execute();
        
        $subscriptionId = $conn->insert_id;
        $message = 'Subscription created successfully';
    }
    
    $stmt->close();
    $conn->close();
    
    echo json_encode([
        'success' => true,
        'message' => $message,
        'subscriptionId' => $subscriptionId
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
