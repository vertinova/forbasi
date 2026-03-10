<?php
// Setup Push Notification Tables
include_once 'forbasi/php/db_config.php';

echo "<!DOCTYPE html>
<html lang='id'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Setup Push Notifications - FORBASI</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; background: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #0d9500; }
        .success { color: #0d9500; background: #e8f5e9; padding: 10px; border-radius: 5px; margin: 10px 0; }
        .error { color: #d32f2f; background: #ffebee; padding: 10px; border-radius: 5px; margin: 10px 0; }
        .info { color: #1976d2; background: #e3f2fd; padding: 10px; border-radius: 5px; margin: 10px 0; }
        a.btn { display: inline-block; background: #0d9500; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        a.btn:hover { background: #0a7300; }
    </style>
</head>
<body>
    <div class='container'>
        <h1>🔔 Setup Push Notifications System</h1>";

try {
    // 1. Create push_subscriptions table
    $sql1 = "CREATE TABLE IF NOT EXISTS push_subscriptions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT DEFAULT NULL,
        user_type ENUM('guest', 'admin', 'pengda', 'pengcab', 'pb') DEFAULT 'guest',
        endpoint TEXT NOT NULL,
        p256dh_key TEXT NOT NULL,
        auth_key TEXT NOT NULL,
        user_agent TEXT,
        ip_address VARCHAR(45),
        subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_notification_at TIMESTAMP NULL,
        is_active TINYINT(1) DEFAULT 1,
        UNIQUE KEY unique_endpoint (endpoint(255))
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    if ($conn->query($sql1) === TRUE) {
        echo "<div class='success'>✅ Tabel <strong>push_subscriptions</strong> berhasil dibuat!</div>";
    } else {
        echo "<div class='error'>❌ Error creating push_subscriptions: " . $conn->error . "</div>";
    }
    
    // 2. Create notification_templates table
    $sql2 = "CREATE TABLE IF NOT EXISTS notification_templates (
        id INT PRIMARY KEY AUTO_INCREMENT,
        template_name VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        icon VARCHAR(255) DEFAULT 'forbasi/assets/icon-192x192.png',
        badge VARCHAR(255) DEFAULT 'forbasi/assets/icon-72x72.png',
        click_action VARCHAR(255),
        category ENUM('kta', 'competition', 'announcement', 'membership', 'general') DEFAULT 'general',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_name (template_name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    if ($conn->query($sql2) === TRUE) {
        echo "<div class='success'>✅ Tabel <strong>notification_templates</strong> berhasil dibuat!</div>";
    } else {
        echo "<div class='error'>❌ Error creating notification_templates: " . $conn->error . "</div>";
    }
    
    // 3. Create notifications_log table
    $sql3 = "CREATE TABLE IF NOT EXISTS notifications_log (
        id INT PRIMARY KEY AUTO_INCREMENT,
        subscription_id INT,
        title VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status ENUM('success', 'failed', 'pending') DEFAULT 'pending',
        error_message TEXT,
        clicked_at TIMESTAMP NULL,
        FOREIGN KEY (subscription_id) REFERENCES push_subscriptions(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    if ($conn->query($sql3) === TRUE) {
        echo "<div class='success'>✅ Tabel <strong>notifications_log</strong> berhasil dibuat!</div>";
    } else {
        echo "<div class='error'>❌ Error creating notifications_log: " . $conn->error . "</div>";
    }
    
    // 4. Create notification_settings table
    $sql4 = "CREATE TABLE IF NOT EXISTS notification_settings (
        id INT PRIMARY KEY AUTO_INCREMENT,
        setting_key VARCHAR(100) NOT NULL,
        setting_value TEXT,
        description TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_key (setting_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    if ($conn->query($sql4) === TRUE) {
        echo "<div class='success'>✅ Tabel <strong>notification_settings</strong> berhasil dibuat!</div>";
    } else {
        echo "<div class='error'>❌ Error creating notification_settings: " . $conn->error . "</div>";
    }
    
    // 5. Insert default templates
    $templates = [
        [
            'name' => 'kta_approved',
            'title' => '✅ KTA Anda Disetujui!',
            'body' => 'Selamat! Kartu Tanda Anggota (KTA) Anda telah disetujui. Klik untuk melihat detail.',
            'action' => '/forbasi/php/users.php',
            'category' => 'kta'
        ],
        [
            'name' => 'kta_rejected',
            'title' => '❌ KTA Ditolak',
            'body' => 'Mohon maaf, pengajuan KTA Anda ditolak. Silakan cek detail dan ajukan kembali.',
            'action' => '/forbasi/php/users.php',
            'category' => 'kta'
        ],
        [
            'name' => 'competition_approved',
            'title' => '🏆 Tim Anda Lolos Kompetisi!',
            'body' => 'Selamat! Tim Anda telah lolos seleksi kompetisi Kejurnas. Persiapkan tim terbaik!',
            'action' => '/index.php#competition',
            'category' => 'competition'
        ],
        [
            'name' => 'welcome',
            'title' => '👋 Selamat Datang di FORBASI!',
            'body' => 'Terima kasih telah bergabung. Aktifkan notifikasi untuk update terbaru.',
            'action' => '/index.php',
            'category' => 'membership'
        ],
        [
            'name' => 'announcement',
            'title' => '📢 Pengumuman Penting',
            'body' => 'Ada pengumuman penting dari FORBASI. Klik untuk membaca selengkapnya.',
            'action' => '/index.php',
            'category' => 'announcement'
        ]
    ];
    
    $inserted = 0;
    foreach ($templates as $template) {
        $stmt = $conn->prepare("INSERT IGNORE INTO notification_templates 
                               (template_name, title, body, click_action, category) 
                               VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("sssss", 
            $template['name'], 
            $template['title'], 
            $template['body'], 
            $template['action'], 
            $template['category']
        );
        if ($stmt->execute() && $stmt->affected_rows > 0) {
            $inserted++;
        }
        $stmt->close();
    }
    
    if ($inserted > 0) {
        echo "<div class='success'>✅ Berhasil menambahkan <strong>$inserted template notifikasi</strong> default!</div>";
    } else {
        echo "<div class='info'>ℹ️ Template notifikasi sudah ada di database.</div>";
    }
    
    // 6. Insert default settings
    $settings = [
        ['key' => 'vapid_public_key', 'value' => '', 'desc' => 'VAPID Public Key untuk Web Push'],
        ['key' => 'vapid_private_key', 'value' => '', 'desc' => 'VAPID Private Key untuk Web Push'],
        ['key' => 'push_enabled', 'value' => '1', 'desc' => 'Enable/Disable push notifications'],
        ['key' => 'max_notifications_per_day', 'value' => '10', 'desc' => 'Maximum notifications per user per day']
    ];
    
    $settingsInserted = 0;
    foreach ($settings as $setting) {
        $stmt = $conn->prepare("INSERT IGNORE INTO notification_settings 
                               (setting_key, setting_value, description) 
                               VALUES (?, ?, ?)");
        $stmt->bind_param("sss", $setting['key'], $setting['value'], $setting['desc']);
        if ($stmt->execute() && $stmt->affected_rows > 0) {
            $settingsInserted++;
        }
        $stmt->close();
    }
    
    if ($settingsInserted > 0) {
        echo "<div class='success'>✅ Berhasil menambahkan <strong>$settingsInserted pengaturan</strong> default!</div>";
    }
    
    echo "<div class='success' style='margin-top: 30px;'>
            <h3>🎉 Setup Berhasil!</h3>
            <p>Sistem Push Notification telah siap digunakan. Langkah selanjutnya:</p>
            <ol>
                <li><strong>Generate VAPID Keys</strong> - Jalankan script generate_vapid_keys.php</li>
                <li><strong>Update Service Worker</strong> - Sudah tersedia di service-worker.js</li>
                <li><strong>Test Notification</strong> - Buka halaman utama dan klik 'Allow Notifications'</li>
                <li><strong>Admin Panel</strong> - Kirim notifikasi dari admin panel (coming soon)</li>
            </ol>
          </div>";
    
    echo "<div class='info'>
            <h4>📊 Database Statistics:</h4>
            <ul>
                <li>Tables Created: <strong>4</strong> (push_subscriptions, notification_templates, notifications_log, notification_settings)</li>
                <li>Default Templates: <strong>5</strong></li>
                <li>Settings: <strong>4</strong></li>
            </ul>
          </div>";
    
} catch (Exception $e) {
    echo "<div class='error'>❌ Error: " . $e->getMessage() . "</div>";
} finally {
    if ($conn) {
        $conn->close();
    }
}

echo "
        <a href='index.php' class='btn'>← Kembali ke Home</a>
        <a href='forbasi/php/admin.php' class='btn' style='background:#1976d2;margin-left:10px;'>Go to Admin Panel →</a>
    </div>
</body>
</html>";
?>
