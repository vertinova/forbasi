<?php
/**
 * API untuk mengirim Push Notification (dengan Web-Push Library)
 * Endpoint: POST /php/send_notification.php
 * 
 * Versi yang menggunakan library Minishlink\WebPush
 * Alternatif dari send_push_notification.php (yang pakai cURL manual)
 */

header('Content-Type: application/json');

// Load Composer autoloader
require_once __DIR__ . '/../vendor/autoload.php';
include_once 'db_config.php';

use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

// Validasi admin access
session_start();
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode([
        'success' => false, 
        'error' => '❌ Akses ditolak. Hanya admin yang dapat mengirim notifikasi.'
    ]);
    exit;
}

// Hanya terima POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false, 
        'error' => 'Method tidak diizinkan. Gunakan POST.'
    ]);
    exit;
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode([
        'success' => false, 
        'error' => 'Invalid JSON input'
    ]);
    exit;
}

// Validate required fields
if (!isset($input['title']) || !isset($input['body'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false, 
        'error' => 'Field title dan body wajib diisi'
    ]);
    exit;
}

$title = $input['title'];
$body = $input['body'];
$icon = $input['icon'] ?? '/forbasi/forbasi/assets/icon-192x192.png';
$badge = $input['badge'] ?? '/forbasi/forbasi/assets/icon-72x72.png';
$url = $input['url'] ?? '/forbasi/index.php';
$tag = $input['tag'] ?? 'forbasi-notification-' . time();
$recipients = $input['recipients'] ?? 'all'; // all, guest, admin, pengda, pengcab, pb
$requireInteraction = $input['requireInteraction'] ?? false;

try {
    // Cek apakah library web-push tersedia
    if (!class_exists('Minishlink\WebPush\WebPush')) {
        throw new Exception('Library web-push belum terinstall. Jalankan: composer install di folder forbasi/');
    }
    
    // Get VAPID keys from database
    $stmt = $conn->prepare("SELECT setting_key, setting_value FROM notification_settings WHERE setting_key IN ('vapid_public_key', 'vapid_private_key')");
    $stmt->execute();
    $result = $stmt->get_result();
    
    $vapidKeys = [];
    while ($row = $result->fetch_assoc()) {
        $vapidKeys[$row['setting_key']] = $row['setting_value'];
    }
    $stmt->close();
    
    if (empty($vapidKeys['vapid_public_key']) || empty($vapidKeys['vapid_private_key'])) {
        throw new Exception('VAPID keys belum di-generate. Jalankan generate_vapid_keys.php terlebih dahulu.');
    }
    
    // Get subscriptions based on user type (ganti $userType jadi $recipients)
    if ($recipients === 'all') {
        $stmt = $conn->prepare("SELECT id, endpoint, p256dh_key, auth_key FROM push_subscriptions WHERE is_active = 1");
        $stmt->execute();
    } else {
        $stmt = $conn->prepare("SELECT id, endpoint, p256dh_key, auth_key FROM push_subscriptions WHERE is_active = 1 AND user_type = ?");
        $stmt->bind_param("s", $recipients);
        $stmt->execute();
    }
    
    $result = $stmt->get_result();
    $subscriptions = [];
    
    while ($row = $result->fetch_assoc()) {
        $subscriptions[] = $row;
    }
    $stmt->close();
    
    if (empty($subscriptions)) {
        echo json_encode([
            'success' => false, 
            'error' => 'Tidak ada subscription aktif untuk kategori: ' . $recipients
        ]);
        exit;
    }
    
    // Initialize WebPush
    $auth = [
        'VAPID' => [
            'subject' => 'mailto:admin@forbasi.or.id',
            'publicKey' => $vapidKeys['vapid_public_key'],
            'privateKey' => $vapidKeys['vapid_private_key']
        ]
    ];
    
    $webPush = new WebPush($auth);
    $webPush->setAutomaticPadding(true);
    
    // Prepare notification payload
    $payload = json_encode([
        'title' => $title,
        'body' => $body,
        'icon' => $icon,
        'badge' => $badge,
        'url' => $url,
        'tag' => $tag,
        'requireInteraction' => $requireInteraction
    ]);
    
    // Send notifications to all subscriptions
    $successCount = 0;
    $failureCount = 0;
    $expiredSubscriptions = [];
    
    foreach ($subscriptions as $sub) {
        $subscription = Subscription::create([
            'endpoint' => $sub['endpoint'],
            'keys' => [
                'p256dh' => $sub['p256dh_key'],
                'auth' => $sub['auth_key']
            ]
        ]);
        
        $webPush->queueNotification($subscription, $payload);
    }
    
    // Send all queued notifications
    foreach ($webPush->flush() as $report) {
        $endpoint = $report->getEndpoint();
        
        // Find subscription ID
        $subscriptionId = null;
        foreach ($subscriptions as $sub) {
            if ($sub['endpoint'] === $endpoint) {
                $subscriptionId = $sub['id'];
                break;
            }
        }
        
        if ($report->isSuccess()) {
            $successCount++;
            $status = 'success';
            $errorMsg = null;
        } else {
            $failureCount++;
            $status = 'failed';
            $errorMsg = $report->getReason();
            
            // Check if subscription is expired/invalid
            if ($report->isSubscriptionExpired()) {
                $expiredSubscriptions[] = $subscriptionId;
            }
        }
        
        // Log notification
        $stmt = $conn->prepare("INSERT INTO notifications_log (subscription_id, title, body, sent_at, status, error_message) VALUES (?, ?, ?, NOW(), ?, ?)");
        $stmt->bind_param("issss", $subscriptionId, $title, $body, $status, $errorMsg);
        $stmt->execute();
        $stmt->close();
    }
    
    // Deactivate expired subscriptions
    if (!empty($expiredSubscriptions)) {
        $placeholders = implode(',', array_fill(0, count($expiredSubscriptions), '?'));
        $stmt = $conn->prepare("UPDATE push_subscriptions SET is_active = 0 WHERE id IN ($placeholders)");
        
        $types = str_repeat('i', count($expiredSubscriptions));
        $stmt->bind_param($types, ...$expiredSubscriptions);
        $stmt->execute();
        $stmt->close();
    }
    
    $conn->close();
    
    echo json_encode([
        'success' => true,
        'message' => "✅ Notifikasi berhasil dikirim ke {$successCount} dari " . count($subscriptions) . " subscriber",
        'stats' => [
            'total' => count($subscriptions),
            'success' => $successCount,
            'failed' => $failureCount,
            'expired' => count($expiredSubscriptions)
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => '❌ Server error: ' . $e->getMessage()
    ]);
    
    if ($conn) {
        $conn->close();
    }
}
?>
