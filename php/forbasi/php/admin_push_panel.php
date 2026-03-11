<?php
/**
 * Admin Panel untuk Push Notification
 * Halaman untuk Super Admin mengirim notifikasi ke pengguna
 */

session_start();

// Hanya Super Admin yang bisa akses
if (!isset($_SESSION['superadmin_id'])) {
    header('Location: login.php');
    exit;
}

include_once 'db_config.php';

// Ambil statistik subscribers
$statsStmt = $conn->prepare("
    SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN user_type = 'admin' THEN 1 ELSE 0 END) as admin_count,
        SUM(CASE WHEN user_type = 'pengda' THEN 1 ELSE 0 END) as pengda_count,
        SUM(CASE WHEN user_type = 'pengcab' THEN 1 ELSE 0 END) as pengcab_count,
        SUM(CASE WHEN user_type = 'pb' THEN 1 ELSE 0 END) as pb_count,
        SUM(CASE WHEN user_type = 'guest' THEN 1 ELSE 0 END) as guest_count
    FROM push_subscriptions 
    WHERE is_active = 1
");
$statsStmt->execute();
$stats = $statsStmt->get_result()->fetch_assoc();
$statsStmt->close();

// Ambil notification templates
$templatesStmt = $conn->prepare("SELECT * FROM notification_templates ORDER BY category, template_name");
$templatesStmt->execute();
$templates = $templatesStmt->get_result()->fetch_all(MYSQLI_ASSOC);
$templatesStmt->close();

// Ambil log notifications (10 terakhir)
$logsStmt = $conn->prepare("
    SELECT nl.*, ps.user_type 
    FROM notifications_log nl
    LEFT JOIN push_subscriptions ps ON nl.subscription_id = ps.id
    ORDER BY nl.sent_at DESC
    LIMIT 20
");
$logsStmt->execute();
$logs = $logsStmt->get_result()->fetch_all(MYSQLI_ASSOC);
$logsStmt->close();

$conn->close();
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Push Notification - FORBASI</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #0d9500 0%, #0a7300 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .header {
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            margin-bottom: 30px;
        }
        
        .header h1 {
            color: #0d9500;
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 10px;
        }
        
        .header p {
            color: #666;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
            text-align: center;
            transition: transform 0.3s;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
        }
        
        .stat-card .icon {
            font-size: 40px;
            margin-bottom: 15px;
        }
        
        .stat-card .number {
            font-size: 32px;
            font-weight: bold;
            color: #0d9500;
            margin-bottom: 5px;
        }
        
        .stat-card .label {
            color: #666;
            font-size: 14px;
        }
        
        .main-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }
        
        .panel {
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }
        
        .panel h2 {
            color: #0d9500;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: 600;
        }
        
        .form-group input,
        .form-group textarea,
        .form-group select {
            width: 100%;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 14px;
            transition: all 0.3s;
        }
        
        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
            outline: none;
            border-color: #0d9500;
            box-shadow: 0 0 0 3px rgba(13, 149, 0, 0.1);
        }
        
        .form-group textarea {
            resize: vertical;
            min-height: 100px;
        }
        
        .btn {
            padding: 12px 30px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            display: inline-flex;
            align-items: center;
            gap: 10px;
        }
        
        .btn-primary {
            background: #0d9500;
            color: white;
        }
        
        .btn-primary:hover {
            background: #0a7300;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(13, 149, 0, 0.3);
        }
        
        .btn-secondary {
            background: #6c757d;
            color: white;
        }
        
        .btn-secondary:hover {
            background: #5a6268;
        }
        
        .template-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .template-card {
            padding: 15px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .template-card:hover,
        .template-card.selected {
            border-color: #0d9500;
            background: #f0f9ee;
        }
        
        .template-card h4 {
            color: #0d9500;
            margin-bottom: 8px;
        }
        
        .template-card p {
            color: #666;
            font-size: 14px;
        }
        
        .log-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        
        .log-table th,
        .log-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .log-table th {
            background: #f5f5f5;
            font-weight: 600;
            color: #333;
        }
        
        .log-table tbody tr:hover {
            background: #f9f9f9;
        }
        
        .status {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }
        
        .status.success {
            background: #e8f5e9;
            color: #2e7d32;
        }
        
        .status.failed {
            background: #ffebee;
            color: #c62828;
        }
        
        .status.pending {
            background: #fff3e0;
            color: #e65100;
        }
        
        .alert {
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: none;
        }
        
        .alert.show {
            display: block;
        }
        
        .alert-success {
            background: #e8f5e9;
            color: #2e7d32;
            border-left: 4px solid #4caf50;
        }
        
        .alert-error {
            background: #ffebee;
            color: #c62828;
            border-left: 4px solid #f44336;
        }
        
        @media (max-width: 768px) {
            .main-grid {
                grid-template-columns: 1fr;
            }
            
            .stats-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1><i class="fas fa-crown"></i> Super Admin Push Notification</h1>
            <p>Kelola dan kirim notifikasi push ke semua pengguna FORBASI</p>
            <div style="margin-top: 15px; padding: 12px; background: #e3f2fd; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>👤 <?= htmlspecialchars($_SESSION['superadmin_name']) ?></strong>
                    <small style="color: #666; display: block; margin-top: 3px;">
                        <?= htmlspecialchars($_SESSION['superadmin_email']) ?>
                    </small>
                </div>
                <a href="superadmin_logout.php" style="padding: 8px 20px; background: #d32f2f; color: white; text-decoration: none; border-radius: 6px; font-size: 14px;">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </a>
            </div>
        </div>
        
        <!-- Statistics -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="icon">📱</div>
                <div class="number"><?= $stats['total'] ?></div>
                <div class="label">Total Subscribers</div>
            </div>
            <div class="stat-card">
                <div class="icon">👤</div>
                <div class="number"><?= $stats['guest_count'] ?></div>
                <div class="label">Guest</div>
            </div>
            <div class="stat-card">
                <div class="icon">🏛️</div>
                <div class="number"><?= $stats['pengda_count'] ?></div>
                <div class="label">Pengda</div>
            </div>
            <div class="stat-card">
                <div class="icon">🏢</div>
                <div class="number"><?= $stats['pengcab_count'] ?></div>
                <div class="label">Pengcab</div>
            </div>
            <div class="stat-card">
                <div class="icon">🏐</div>
                <div class="number"><?= $stats['pb_count'] ?></div>
                <div class="label">Paskibraka</div>
            </div>
            <div class="stat-card">
                <div class="icon">🔑</div>
                <div class="number"><?= $stats['admin_count'] ?></div>
                <div class="label">Admin</div>
            </div>
        </div>
        
        <!-- Main Grid -->
        <div class="main-grid">
            <!-- Send Notification Form -->
            <div class="panel">
                <h2><i class="fas fa-paper-plane"></i> Kirim Notifikasi</h2>
                
                <div id="alert" class="alert"></div>
                
                <form id="notificationForm">
                    <div class="form-group">
                        <label>Gunakan Template (Opsional)</label>
                        <div class="template-grid">
                            <?php foreach ($templates as $template): ?>
                                <div class="template-card" data-template='<?= htmlspecialchars(json_encode($template)) ?>'>
                                    <h4><?= htmlspecialchars($template['title']) ?></h4>
                                    <p><?= htmlspecialchars(substr($template['body'], 0, 60)) ?>...</p>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Judul Notifikasi *</label>
                        <input type="text" id="title" name="title" required placeholder="Contoh: KTA Anda Disetujui!">
                    </div>
                    
                    <div class="form-group">
                        <label>Isi Pesan *</label>
                        <textarea id="body" name="body" required placeholder="Tuliskan pesan notifikasi di sini..."></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label>URL Klik (Opsional)</label>
                        <input type="url" id="click_action" name="click_action" placeholder="https://forbasi.or.id/...">
                    </div>
                    
                    <div class="form-group">
                        <label>Penerima *</label>
                        <select id="recipients" name="recipients" required>
                            <option value="all">📱 Semua Pengguna (<?= $stats['total'] ?>)</option>
                            <option value="guest">👤 Guest (<?= $stats['guest_count'] ?>)</option>
                            <option value="pengda">🏛️ Pengda (<?= $stats['pengda_count'] ?>)</option>
                            <option value="pengcab">🏢 Pengcab (<?= $stats['pengcab_count'] ?>)</option>
                            <option value="pb">🏐 Paskibraka (<?= $stats['pb_count'] ?>)</option>
                            <option value="admin">🔑 Admin (<?= $stats['admin_count'] ?>)</option>
                        </select>
                    </div>
                    
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-paper-plane"></i> Kirim Notifikasi
                    </button>
                    <a href="superadmin_dashboard.php" class="btn btn-secondary">
                        <i class="fas fa-arrow-left"></i> Kembali
                    </a>
                </form>
            </div>
            
            <!-- Notification Logs -->
            <div class="panel">
                <h2><i class="fas fa-history"></i> Log Notifikasi (20 Terakhir)</h2>
                
                <table class="log-table">
                    <thead>
                        <tr>
                            <th>Waktu</th>
                            <th>Judul</th>
                            <th>Penerima</th>
                            <th>Status</th>
                            <th>Click</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (empty($logs)): ?>
                            <tr>
                                <td colspan="5" style="text-align: center; color: #999;">Belum ada notifikasi terkirim</td>
                            </tr>
                        <?php else: ?>
                            <?php foreach ($logs as $log): ?>
                                <tr>
                                    <td><?= date('d/m H:i', strtotime($log['sent_at'])) ?></td>
                                    <td><?= htmlspecialchars(substr($log['title'], 0, 30)) ?></td>
                                    <td><?= strtoupper($log['user_type'] ?? 'N/A') ?></td>
                                    <td>
                                        <span class="status <?= $log['status'] ?>"><?= ucfirst($log['status']) ?></span>
                                    </td>
                                    <td><?= $log['clicked_at'] ? '✅' : '⏳' ?></td>
                                </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    
    <script>
        // Handle template selection
        document.querySelectorAll('.template-card').forEach(card => {
            card.addEventListener('click', function() {
                // Remove selected class from all cards
                document.querySelectorAll('.template-card').forEach(c => c.classList.remove('selected'));
                
                // Add selected class to clicked card
                this.classList.add('selected');
                
                // Fill form with template data
                const template = JSON.parse(this.dataset.template);
                document.getElementById('title').value = template.title;
                document.getElementById('body').value = template.body;
                document.getElementById('click_action').value = template.click_action || '';
            });
        });
        
        // Handle form submission
        document.getElementById('notificationForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const alertDiv = document.getElementById('alert');
            const submitBtn = this.querySelector('button[type="submit"]');
            
            // Disable button
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';
            
            // Get form data
            const formData = {
                title: document.getElementById('title').value,
                body: document.getElementById('body').value,
                click_action: document.getElementById('click_action').value || 'https://forbasi.or.id',
                recipients: document.getElementById('recipients').value
            };
            
            try {
                const response = await fetch('send_notification.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                const data = await response.json();
                
                if (data.success) {
                    alertDiv.className = 'alert alert-success show';
                    alertDiv.textContent = `✅ ${data.message}`;
                    
                    // Reset form
                    this.reset();
                    document.querySelectorAll('.template-card').forEach(c => c.classList.remove('selected'));
                    
                    // Reload page after 2 seconds to show new log
                    setTimeout(() => location.reload(), 2000);
                } else {
                    alertDiv.className = 'alert alert-error show';
                    alertDiv.textContent = `❌ ${data.message}`;
                }
            } catch (error) {
                alertDiv.className = 'alert alert-error show';
                alertDiv.textContent = '❌ Terjadi kesalahan: ' + error.message;
            } finally {
                // Re-enable button
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Kirim Notifikasi';
                
                // Hide alert after 5 seconds
                setTimeout(() => alertDiv.classList.remove('show'), 5000);
            }
        });
    </script>
</body>
</html>
