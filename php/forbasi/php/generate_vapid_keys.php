<?php
/**
 * Generator VAPID Keys untuk Push Notification
 * VAPID (Voluntary Application Server Identification)
 * 
 * Jalankan file ini SATU KALI untuk generate keys
 */

include_once 'db_config.php';

// Function untuk generate VAPID keys
function generateVAPIDKeys() {
    // Generate private key
    $private_key_resource = openssl_pkey_new([
        'curve_name' => 'prime256v1',
        'private_key_type' => OPENSSL_KEYTYPE_EC,
    ]);
    
    // Export private key
    openssl_pkey_export($private_key_resource, $private_key_pem);
    
    // Get public key
    $key_details = openssl_pkey_get_details($private_key_resource);
    $public_key_pem = $key_details['key'];
    
    // Convert to base64url format
    $private_key = rtrim(strtr(base64_encode(openssl_pkey_get_details($private_key_resource)['ec']['d']), '+/', '-_'), '=');
    $public_key = rtrim(strtr(base64_encode($key_details['ec']['x'] . $key_details['ec']['y']), '+/', '-_'), '=');
    
    return [
        'public_key' => $public_key,
        'private_key' => $private_key,
        'public_key_pem' => $public_key_pem,
        'private_key_pem' => $private_key_pem
    ];
}

?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generate VAPID Keys - FORBASI</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #0d9500 0%, #0a7300 100%);
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
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            max-width: 800px;
            width: 100%;
        }
        h1 {
            color: #0d9500;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .key-box {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
            border-left: 4px solid #0d9500;
        }
        .key-box label {
            font-weight: bold;
            color: #333;
            display: block;
            margin-bottom: 8px;
        }
        .key-box code {
            background: #e0e0e0;
            padding: 10px;
            border-radius: 5px;
            display: block;
            word-break: break-all;
            font-size: 0.9em;
            color: #d32f2f;
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
        .btn {
            display: inline-block;
            background: #0d9500;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 8px;
            margin-top: 20px;
            transition: all 0.3s;
        }
        .btn:hover {
            background: #0a7300;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(13, 149, 0, 0.3);
        }
        .copy-btn {
            background: #1976d2;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 0.9em;
            margin-top: 10px;
        }
        .copy-btn:hover {
            background: #1565c0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔑 Generate VAPID Keys</h1>
        
        <?php
        try {
            // Cek apakah keys sudah ada
            $checkStmt = $conn->prepare("SELECT setting_value FROM notification_settings WHERE setting_key = 'vapid_public_key'");
            $checkStmt->execute();
            $result = $checkStmt->get_result();
            $existing = $result->fetch_assoc();
            $checkStmt->close();
            
            if ($existing && !empty($existing['setting_value'])) {
                echo "<div class='warning'>
                        <strong>⚠️ Peringatan!</strong><br>
                        VAPID Keys sudah ada di database. Generate keys baru akan mengganti yang lama dan 
                        semua subscription yang ada akan menjadi tidak valid.
                      </div>";
            }
            
            // Generate keys
            $keys = generateVAPIDKeys();
            
            // Simpan ke database
            $stmt1 = $conn->prepare("UPDATE notification_settings SET setting_value = ? WHERE setting_key = 'vapid_public_key'");
            $stmt1->bind_param("s", $keys['public_key']);
            $stmt1->execute();
            $stmt1->close();
            
            $stmt2 = $conn->prepare("UPDATE notification_settings SET setting_value = ? WHERE setting_key = 'vapid_private_key'");
            $stmt2->bind_param("s", $keys['private_key']);
            $stmt2->execute();
            $stmt2->close();
            
            echo "<div class='success'>
                    <strong>✅ VAPID Keys Berhasil Di-Generate!</strong><br>
                    Keys telah disimpan ke database dan siap digunakan.
                  </div>";
            
            echo "<div class='key-box'>
                    <label>🔓 Public Key (untuk frontend):</label>
                    <code id='publicKey'>" . htmlspecialchars($keys['public_key']) . "</code>
                    <button class='copy-btn' onclick='copyKey(\"publicKey\")'>📋 Copy</button>
                  </div>";
            
            echo "<div class='key-box'>
                    <label>🔐 Private Key (untuk backend - RAHASIA!):</label>
                    <code id='privateKey'>" . htmlspecialchars($keys['private_key']) . "</code>
                    <button class='copy-btn' onclick='copyKey(\"privateKey\")'>📋 Copy</button>
                    <p style='color:#d32f2f; font-size:0.9em; margin-top:10px;'>
                        ⚠️ <strong>JANGAN BAGIKAN</strong> private key ini! Simpan dengan aman.
                    </p>
                  </div>";
            
            echo "<div class='success'>
                    <h3>📋 Langkah Selanjutnya:</h3>
                    <ol>
                        <li>Public key sudah tersimpan dan akan otomatis digunakan</li>
                        <li>Private key aman tersimpan di database</li>
                        <li>Buka halaman utama website untuk test subscribe</li>
                        <li>Gunakan admin panel untuk kirim notifikasi test</li>
                    </ol>
                  </div>";
            
        } catch (Exception $e) {
            echo "<div class='warning'>❌ Error: " . $e->getMessage() . "</div>";
        } finally {
            if ($conn) {
                $conn->close();
            }
        }
        ?>
        
        <a href="../../index.php" class="btn">← Kembali ke Home</a>
        <a href="admin_push_panel.php" class="btn">Admin Panel →</a>
    </div>
    
    <script>
        function copyKey(elementId) {
            const text = document.getElementById(elementId).textContent;
            navigator.clipboard.writeText(text).then(() => {
                alert('✅ Key berhasil di-copy ke clipboard!');
            }).catch(err => {
                alert('❌ Gagal copy: ' + err);
            });
        }
    </script>
</body>
</html>
