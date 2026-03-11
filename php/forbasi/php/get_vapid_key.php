<?php
/**
 * Get VAPID Public Key API
 * Returns public key for push notification subscription
 */

header('Content-Type: application/json');

include_once 'db_config.php';

try {
    $stmt = $conn->prepare("SELECT setting_value FROM notification_settings WHERE setting_key = 'vapid_public_key'");
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        $publicKey = $row['setting_value'];
        
        echo json_encode([
            'success' => true,
            'publicKey' => $publicKey
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'error' => 'VAPID public key not found. Please generate keys first.'
        ]);
    }
    
    $stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
