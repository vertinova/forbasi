<?php
session_start();
require_once 'db_config.php'; // Pastikan path ke db_config.php benar

$message = '';
$message_type = '';
$token_valid = false;
$user_id = null;

if (isset($_GET['token'])) {
    $token = $_GET['token'];

    // Cari user berdasarkan token yang valid dan belum kadaluarsa
    $stmt = $conn->prepare("SELECT id FROM users WHERE reset_token = ? AND reset_token_expires_at > NOW()");
    $stmt->bind_param("s", $token);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows == 1) {
        $user = $result->fetch_assoc();
        $user_id = $user['id'];
        $token_valid = true;
    } else {
        $message = "Tautan reset password tidak valid atau sudah kadaluarsa.";
        $message_type = "danger";
    }
    $stmt->close();
} else if (isset($_POST['reset_password'])) {
    $token = $_POST['token'];
    $new_password = $_POST['new_password'];
    $confirm_new_password = $_POST['confirm_new_password'];

    if ($new_password !== $confirm_new_password) {
        $message = "Password baru dan konfirmasi password tidak cocok.";
        $message_type = "danger";
        // Untuk menjaga token tetap di form jika terjadi kesalahan input
        $token_valid = true; 
    } else {
        // Verifikasi token lagi untuk keamanan sebelum update password
        $stmt = $conn->prepare("SELECT id FROM users WHERE reset_token = ? AND reset_token_expires_at > NOW()");
        $stmt->bind_param("s", $token);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows == 1) {
            $user = $result->fetch_assoc();
            $user_id = $user['id'];
            $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);

            // Update password dan hapus token reset
            $stmt_update = $conn->prepare("UPDATE users SET password = ?, reset_token = NULL, reset_token_expires_at = NULL WHERE id = ?");
            $stmt_update->bind_param("si", $hashed_password, $user_id);

            if ($stmt_update->execute()) {
                $message = "Password Anda berhasil direset. Silakan login dengan password baru Anda.";
                $message_type = "success";
                // Redirect ke halaman login setelah 5 detik
                header("Refresh: 5; URL=index.php");
            } else {
                $message = "Terjadi kesalahan saat mereset password. Silakan coba lagi.";
                $message_type = "danger";
                $token_valid = true; // Jaga form tetap tampil
            }
            $stmt_update->close();
        } else {
            $message = "Tautan reset password tidak valid atau sudah kadaluarsa. Silakan coba lagi.";
            $message_type = "danger";
        }
        $stmt->close();
    }
} else {
    $message = "Akses tidak valid.";
    $message_type = "danger";
}
$conn->close();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FORBASI - Reset Password</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        /* Sertakan CSS yang sama dengan index.php untuk konsistensi */
        :root {
            --primary: green;
            --primary-dark: #005600;
            --secondary: #1d3557;
            --light: #f1faee;
            --dark: #0a1128;
            --white: #ffffff;
            --font-primary: 'Poppins', sans-serif;
            --box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            --transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
            --border-radius: 12px;
        }

        body {
            font-family: var(--font-primary);
            background-color: var(--light);
            color: var(--dark);
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background-image:
                radial-gradient(circle at 20% 30%, rgba(0, 128, 0, 0.1) 0%, transparent 30%),
                radial-gradient(circle at 80% 70%, rgba(29, 53, 87, 0.1) 0%, transparent 30%);
        }

        .auth-container {
            width: 100%;
            max-width: 400px;
            padding: 2rem;
            margin: auto;
        }

        .auth-card {
            padding: 3rem;
            background: var(--white);
            border-radius: var(--border-radius);
            box-shadow: var(--box-shadow);
            display: flex;
            flex-direction: column;
            position: relative;
        }

        .auth-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 5px;
            background: var(--primary);
        }

        .auth-header {
            text-align: center;
            margin-bottom: 2.5rem;
        }

        .auth-header img {
            height: 80px;
            margin-bottom: 1.5rem;
        }

        .auth-header h2 {
            font-size: 1.8rem;
            color: var(--secondary);
            margin-bottom: 0.5rem;
        }

        .auth-header p {
            color: #888;
            font-size: 0.9rem;
        }

        .form-group {
            margin-bottom: 1.5rem;
        }

        .form-control {
            width: 100%;
            padding: 0.8rem 1rem;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-family: var(--font-primary);
            font-size: 1rem;
            transition: var(--transition);
        }

        .form-control:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(0, 128, 0, 0.2);
        }

        .btn {
            display: inline-block;
            width: 100%;
            padding: 0.9rem;
            background: var(--primary);
            color: var(--white);
            border: none;
            border-radius: 6px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: var(--transition);
        }

        .btn:hover {
            background: var(--primary-dark);
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 128, 0, 0.3);
        }

        .alert {
            padding: 0.75rem 1.25rem;
            margin-bottom: 1rem;
            border-radius: 6px;
            font-size: 0.9rem;
        }

        .alert-danger {
            color: #721c24;
            background-color: #f8d7da;
            border-color: #f5c6cb;
        }

        .alert-success {
            color: #155724;
            background-color: #d4edda;
            border-color: #c3e6cb;
        }

        .password-wrapper {
            position: relative;
        }

        .password-toggle {
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: #888;
            cursor: pointer;
        }

        .back-to-login {
            display: block;
            text-align: center;
            margin-top: 1.5rem;
            color: var(--primary);
            font-weight: 600;
            text-decoration: none;
        }

        .back-to-login:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="auth-container">
        <div class="auth-card">
            <div class="auth-header">
                <img src="../assets/LOGO-FORBASI.png" alt="FORBASI Logo">
                <h2>Reset Password</h2>
                <p>Silakan masukkan password baru Anda.</p>
            </div>

            <?php if ($message): ?>
                <div class="alert alert-<?php echo $message_type; ?>"><?php echo $message; ?></div>
            <?php endif; ?>

            <?php if ($token_valid): ?>
                <form action="" method="POST">
                    <input type="hidden" name="token" value="<?php echo htmlspecialchars($token); ?>">
                    <div class="form-group">
                        <label for="new_password">Password Baru</label>
                        <div class="password-wrapper">
                            <input type="password" id="new_password" name="new_password" class="form-control" placeholder="Masukkan password baru" required>
                            <button type="button" class="password-toggle">
                                <i class="far fa-eye"></i>
                            </button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="confirm_new_password">Konfirmasi Password Baru</label>
                        <div class="password-wrapper">
                            <input type="password" id="confirm_new_password" name="confirm_new_password" class="form-control" placeholder="Ulangi password baru" required>
                            <button type="button" class="password-toggle">
                                <i class="far fa-eye"></i>
                            </button>
                        </div>
                    </div>
                    <button type="submit" name="reset_password" class="btn">Reset Password</button>
                </form>
            <?php endif; ?>
            <a href="index.php" class="back-to-login">Kembali ke Login</a>
        </div>
    </div>
    <script>
        document.querySelectorAll('.password-toggle').forEach(toggle => {
            toggle.addEventListener('click', function() {
                const input = this.previousElementSibling;
                const icon = this.querySelector('i');

                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        });
    </script>
</body>
</html>