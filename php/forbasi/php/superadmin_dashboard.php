<?php
/**
 * Super Admin Dashboard
 * Dashboard utama untuk Super Admin dengan akses push notification
 */

session_start();

// Hanya super admin yang bisa akses
if (!isset($_SESSION['superadmin_id'])) {
    header('Location: superadmin_login.php');
    exit;
}

include_once 'db_config.php';

// Get statistics
$statsStmt = $conn->prepare("
    SELECT 
        (SELECT COUNT(*) FROM push_subscriptions WHERE is_active = 1) as total_subscriptions,
        (SELECT COUNT(*) FROM notifications_log) as total_notifications,
        (SELECT COUNT(*) FROM notifications_log WHERE status = 'success') as successful_notifications,
        (SELECT COUNT(*) FROM notifications_log WHERE clicked_at IS NOT NULL) as clicked_notifications
");
$statsStmt->execute();
$stats = $statsStmt->get_result()->fetch_assoc();
$statsStmt->close();

// Get recent notifications
$recentStmt = $conn->prepare("
    SELECT nl.*, ps.user_type 
    FROM notifications_log nl
    LEFT JOIN push_subscriptions ps ON nl.subscription_id = ps.id
    ORDER BY nl.sent_at DESC
    LIMIT 10
");
$recentStmt->execute();
$recentNotifications = $recentStmt->get_result()->fetch_all(MYSQLI_ASSOC);
$recentStmt->close();

$conn->close();

// Calculate rates
$deliveryRate = $stats['total_notifications'] > 0 
    ? round(($stats['successful_notifications'] / $stats['total_notifications']) * 100, 1) 
    : 0;

$clickRate = $stats['successful_notifications'] > 0 
    ? round(($stats['clicked_notifications'] / $stats['successful_notifications']) * 100, 1) 
    : 0;
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Super Admin Dashboard - FORBASI</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #1a237e 0%, #0d47a1 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container { max-width: 1400px; margin: 0 auto; }
        
        .header {
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            margin-bottom: 30px;
        }
        
        .header h1 {
            color: #1a237e;
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 10px;
        }
        
        .user-info {
            margin-top: 15px;
            padding: 15px;
            background: #e3f2fd;
            border-radius: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .user-info-left {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .user-avatar {
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #1a237e 0%, #0d47a1 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: white;
            padding: 25px;
            border-radius: 15px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.2);
            transition: transform 0.3s;
        }
        
        .stat-card:hover { transform: translateY(-5px); }
        
        .stat-icon {
            font-size: 40px;
            margin-bottom: 15px;
        }
        
        .stat-value {
            font-size: 36px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .stat-label {
            color: #666;
            font-size: 14px;
        }
        
        .action-buttons {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .action-card {
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.2);
            text-align: center;
            transition: all 0.3s;
            cursor: pointer;
            text-decoration: none;
            color: inherit;
            display: block;
        }
        
        .action-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        
        .action-card i {
            font-size: 50px;
            margin-bottom: 15px;
        }
        
        .action-card h3 {
            margin-bottom: 10px;
            color: #333;
        }
        
        .action-card p {
            color: #666;
            font-size: 14px;
        }
        
        .recent-section {
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.2);
        }
        
        .recent-section h2 {
            color: #1a237e;
            margin-bottom: 20px;
        }
        
        .notification-item {
            padding: 15px;
            border-bottom: 1px solid #e0e0e0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .notification-item:last-child {
            border-bottom: none;
        }
        
        .notification-info h4 {
            margin-bottom: 5px;
            color: #333;
        }
        
        .notification-info p {
            color: #666;
            font-size: 13px;
        }
        
        .status-badge {
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }
        
        .status-success { background: #e8f5e9; color: #2e7d32; }
        .status-failed { background: #ffebee; color: #c62828; }
        
        .btn {
            padding: 12px 30px;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            display: inline-flex;
            align-items: center;
            gap: 10px;
            text-decoration: none;
        }
        
        .btn-logout {
            background: #d32f2f;
            color: white;
        }
        
        .btn-logout:hover {
            background: #b71c1c;
            transform: translateY(-2px);
        }
        
        @media (max-width: 768px) {
            .stats-grid { grid-template-columns: repeat(2, 1fr); }
            .action-buttons { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1><i class="fas fa-crown"></i> Super Admin Dashboard</h1>
            <p>Push Notification Management System</p>
            
            <div class="user-info">
                <div class="user-info-left">
                    <div class="user-avatar">
                        <i class="fas fa-user-shield"></i>
                    </div>
                    <div>
                        <strong><?= htmlspecialchars($_SESSION['superadmin_name']) ?></strong>
                        <p style="color: #666; font-size: 14px; margin-top: 3px;">
                            <?= htmlspecialchars($_SESSION['superadmin_email']) ?>
                        </p>
                    </div>
                </div>
                <a href="superadmin_logout.php" class="btn btn-logout">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </a>
            </div>
        </div>
        
        <!-- Statistics -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon" style="color: #2196f3;">📱</div>
                <div class="stat-value" style="color: #2196f3;">
                    <?= number_format($stats['total_subscriptions']) ?>
                </div>
                <div class="stat-label">Total Subscribers</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon" style="color: #4caf50;">📧</div>
                <div class="stat-value" style="color: #4caf50;">
                    <?= number_format($stats['total_notifications']) ?>
                </div>
                <div class="stat-label">Notifications Sent</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon" style="color: #ff9800;">📊</div>
                <div class="stat-value" style="color: #ff9800;">
                    <?= $deliveryRate ?>%
                </div>
                <div class="stat-label">Delivery Rate</div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon" style="color: #9c27b0;">🖱️</div>
                <div class="stat-value" style="color: #9c27b0;">
                    <?= $clickRate ?>%
                </div>
                <div class="stat-label">Click Rate</div>
            </div>
        </div>
        
        <!-- Action Buttons -->
        <div class="action-buttons">
            <a href="admin_push_panel.php" class="action-card">
                <i class="fas fa-paper-plane" style="color: #2196f3;"></i>
                <h3>Kirim Notifikasi</h3>
                <p>Kirim push notification ke semua user atau filter by type</p>
            </a>
            
            <a href="generate_vapid_keys.php" class="action-card">
                <i class="fas fa-key" style="color: #ff9800;"></i>
                <h3>VAPID Keys</h3>
                <p>Generate dan kelola VAPID authentication keys</p>
            </a>
            
            <a href="../../index.php" class="action-card">
                <i class="fas fa-home" style="color: #4caf50;"></i>
                <h3>Website Utama</h3>
                <p>Kembali ke halaman utama FORBASI</p>
            </a>
        </div>
        
        <!-- Recent Notifications -->
        <div class="recent-section">
            <h2><i class="fas fa-history"></i> 10 Notifikasi Terakhir</h2>
            
            <?php if (empty($recentNotifications)): ?>
                <p style="text-align: center; color: #999; padding: 30px;">
                    📭 Belum ada notifikasi terkirim
                </p>
            <?php else: ?>
                <?php foreach ($recentNotifications as $notif): ?>
                    <div class="notification-item">
                        <div class="notification-info">
                            <h4><?= htmlspecialchars($notif['title']) ?></h4>
                            <p>
                                <?= date('d/m/Y H:i', strtotime($notif['sent_at'])) ?> • 
                                <?= strtoupper($notif['user_type'] ?? 'ALL') ?>
                                <?= $notif['clicked_at'] ? ' • ✅ Clicked' : '' ?>
                            </p>
                        </div>
                        <span class="status-badge status-<?= $notif['status'] ?>">
                            <?= ucfirst($notif['status']) ?>
                        </span>
                    </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>
    </div>
</body>
</html>
