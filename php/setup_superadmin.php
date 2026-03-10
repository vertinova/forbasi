<?php
/**
 * Setup Super Admin untuk Push Notification
 * Jalankan file ini SATU KALI untuk membuat tabel dan akun super admin
 */

include_once 'forbasi/php/db_config.php';

?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Setup Super Admin - FORBASI</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #1a237e 0%, #0d47a1 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            max-width: 700px;
            width: 100%;
        }
        h1 {
            color: #1a237e;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .success {
            background: #e8f5e9;
            color: #2e7d32;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #4caf50;
        }
        .warning {
            background: #fff3e0;
            color: #e65100;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #ff9800;
        }
        .error {
            background: #ffebee;
            color: #c62828;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #f44336;
        }
        .credential-box {
            background: #e3f2fd;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #2196f3;
        }
        .credential-box h3 {
            color: #1565c0;
            margin-bottom: 15px;
        }
        .credential-box p {
            margin: 10px 0;
            font-family: 'Courier New', monospace;
            background: white;
            padding: 10px;
            border-radius: 5px;
        }
        .credential-box strong {
            color: #1976d2;
        }
        .btn {
            display: inline-block;
            background: #1a237e;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 8px;
            margin-top: 20px;
            transition: all 0.3s;
            margin-right: 10px;
        }
        .btn:hover {
            background: #0d47a1;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(26, 35, 126, 0.3);
        }
        .btn-secondary {
            background: #0d9500;
        }
        .btn-secondary:hover {
            background: #0a7300;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>👑 Setup Super Admin</h1>
        
        <?php
        try {
            // 1. Cek apakah tabel super_admins sudah ada
            $checkTable = $conn->query("SHOW TABLES LIKE 'super_admins'");
            $tableExists = $checkTable->num_rows > 0;
            
            if (!$tableExists) {
                // 2. Buat tabel super_admins
                $createTableSQL = "CREATE TABLE super_admins (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    full_name VARCHAR(100) NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    phone VARCHAR(20),
                    is_active TINYINT(1) DEFAULT 1,
                    last_login DATETIME NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_username (username),
                    INDEX idx_email (email),
                    INDEX idx_active (is_active)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
                
                if ($conn->query($createTableSQL)) {
                    echo "<div class='success'>✅ Tabel <strong>super_admins</strong> berhasil dibuat!</div>";
                } else {
                    throw new Exception("Gagal membuat tabel: " . $conn->error);
                }
            } else {
                echo "<div class='warning'>⚠️ Tabel <strong>super_admins</strong> sudah ada.</div>";
            }
            
            // 3. Cek apakah sudah ada super admin
            $checkAdmin = $conn->query("SELECT COUNT(*) as count FROM super_admins");
            $adminCount = $checkAdmin->fetch_assoc()['count'];
            
            if ($adminCount == 0) {
                // 4. Buat akun super admin default
                $defaultUsername = 'superadmin';
                $defaultPassword = 'SuperAdmin@2025!';
                $hashedPassword = password_hash($defaultPassword, PASSWORD_BCRYPT);
                $fullName = 'Super Administrator';
                $email = 'superadmin@forbasi.or.id';
                $phone = '08123456789';
                
                $insertSQL = "INSERT INTO super_admins 
                    (username, password, full_name, email, phone, is_active) 
                    VALUES (?, ?, ?, ?, ?, 1)";
                
                $stmt = $conn->prepare($insertSQL);
                $stmt->bind_param("sssss", $defaultUsername, $hashedPassword, $fullName, $email, $phone);
                
                if ($stmt->execute()) {
                    echo "<div class='success'>
                            <strong>✅ Super Admin berhasil dibuat!</strong><br>
                            Gunakan kredensial di bawah untuk login.
                          </div>";
                    
                    echo "<div class='credential-box'>
                            <h3>🔐 Kredensial Super Admin</h3>
                            <p><strong>Username:</strong> {$defaultUsername}</p>
                            <p><strong>Password:</strong> {$defaultPassword}</p>
                            <p><strong>Email:</strong> {$email}</p>
                            <p style='color: #d32f2f; background: #ffebee; margin-top: 15px;'>
                                ⚠️ <strong>PENTING:</strong> Segera ganti password setelah login pertama kali!
                            </p>
                          </div>";
                    
                    echo "<div class='warning'>
                            <h3>📋 Langkah Selanjutnya:</h3>
                            <ol>
                                <li>Login ke dashboard super admin</li>
                                <li>Ganti password default</li>
                                <li>Jalankan setup push notification</li>
                                <li>Generate VAPID keys</li>
                                <li>Mulai kirim notifikasi</li>
                            </ol>
                          </div>";
                    
                } else {
                    throw new Exception("Gagal membuat super admin: " . $stmt->error);
                }
                $stmt->close();
                
            } else {
                echo "<div class='warning'>
                        ⚠️ Sudah ada <strong>{$adminCount}</strong> super admin terdaftar.<br>
                        Gunakan kredensial yang sudah ada untuk login.
                      </div>";
            }
            
            // 5. Update permission di admin_push_panel.php (informasi saja)
            echo "<div class='success'>
                    <h3>✅ Setup Selesai!</h3>
                    <p>Sistem super admin untuk push notification sudah siap digunakan.</p>
                    <p><strong>Fitur yang tersedia:</strong></p>
                    <ul>
                        <li>🔐 Login sistem khusus super admin</li>
                        <li>📊 Dashboard dengan statistik lengkap</li>
                        <li>📱 Kirim push notification ke semua user</li>
                        <li>📋 Template notification management</li>
                        <li>📈 Analytics & tracking</li>
                        <li>👥 Subscriber management</li>
                    </ul>
                  </div>";
            
        } catch (Exception $e) {
            echo "<div class='error'>❌ Error: " . $e->getMessage() . "</div>";
        } finally {
            if ($conn) {
                $conn->close();
            }
        }
        ?>
        
        <a href="forbasi/php/superadmin_login.php" class="btn">🔐 Login Super Admin</a>
        <a href="index.php" class="btn btn-secondary">← Kembali ke Home</a>
    </div>
</body>
</html>
