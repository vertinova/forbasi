<?php
session_start();
// db_config.php ada di direktori yang sama (php/), jadi path-nya benar
require_once 'db_config.php'; 

// Tambahkan ini di bagian paling atas file untuk PHPMailer
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// PENTING: Path ke autoload.php perlu naik satu direktori (..)
// karena folder 'vendor' ada di luar folder 'php'.
require '../vendor/autoload.php'; 
// Jika tidak menggunakan Composer, sesuaikan path ini:
// require 'path/to/PHPMailer/src/Exception.php';
// require 'path/to/PHPMailer/src/PHPMailer.php';
// require 'path/to/PHPMailer/src/SMTP.php'; // Penting untuk SMTP

$message = '';
$message_type = '';

if (isset($_POST['submit_email'])) {
    $email = $_POST['email'];

    // Cari user berdasarkan email
    $stmt = $conn->prepare("SELECT id, username FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows == 1) {
        $user = $result->fetch_assoc();
        $user_id = $user['id'];
        $username = $user['username'];

        // Generate unique token (64 karakter heksadesimal)
        $token = bin2hex(random_bytes(32));
        // Token berlaku 1 jam dari sekarang
        $expires_at = date('Y-m-d H:i:s', strtotime('+1 hour'));

        // Simpan token ke database
        $stmt_update = $conn->prepare("UPDATE users SET reset_token = ?, reset_token_expires_at = ? WHERE id = ?");
        $stmt_update->bind_param("ssi", $token, $expires_at, $user_id);

        if ($stmt_update->execute()) {
            // Link reset password
            // PENTING: Ganti 'https://seagreen-meerkat-531550.hostingersite.com/forbasi' dengan URL domain aplikasi Anda yang sebenarnya di produksi
            $reset_link = "https://seagreen-meerkat-531550.hostingersite.com/forbasi/php/reset_password.php?token=" . $token;

            $mail = new PHPMailer(true); // true enables exceptions for error handling

            try {
                // Konfigurasi Server SMTP Brevo Anda
                $mail->isSMTP();
                $mail->Host       = 'smtp-relay.brevo.com';
                $mail->SMTPAuth   = true;
                $mail->Username   = '912154001@smtp-brevo.com'; // Gunakan Login Brevo Anda di sini
                $mail->Password   = 'XPTtdy1KxJbjc3MS';         // Gunakan Password Brevo Anda di sini
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS; // Atau PHPMailer::ENCRYPTION_SMTPS untuk port 465
                $mail->Port       = 587; // Port SMTP Brevo (biasanya 587 untuk TLS/STARTTLS)

                // Pengirim
                // PENTING: Ganti dengan alamat email pengirim yang Anda inginkan.
                // Pastikan domain email ini sudah diverifikasi di Brevo!
                $mail->setFrom('no-reply@forbasi.com', 'FORBASI');

                // Penerima
                $mail->addAddress($email, htmlspecialchars($username));

                // Konten Email
                $mail->isHTML(false); // Set email format to plain text (false) atau HTML (true)
                $mail->Subject = "Permintaan Reset Password FORBASI";
                $mail->Body    = "Halo " . htmlspecialchars($username) . ",\n\n";
                $mail->Body   .= "Anda telah meminta reset password untuk akun FORBASI Anda. Klik link berikut untuk mengatur password baru:\n\n";
                $mail->Body   .= $reset_link . "\n\n";
                $mail->Body   .= "Jika Anda tidak merasa melakukan permintaan ini, abaikan email ini.\n\n";
                $mail->Body   .= "Terima kasih,\nTim FORBASI";

                $mail->send();
                $message = "Link reset password telah dikirim ke email Anda. Silakan cek inbox (dan folder spam/junk) Anda.";
                $message_type = "success";
            } catch (Exception $e) {
                $message = "Terjadi kesalahan saat mengirim email. Error: " . $mail->ErrorInfo;
                $message_type = "danger";
                // Untuk debugging, Anda bisa menampilkan atau log pesan error PHPMailer yang lebih detail:
                // error_log("PHPMailer Error: " . $e->getMessage());
            }
        } else {
            $message = "Terjadi kesalahan saat menyimpan token reset. Silakan coba lagi.";
            $message_type = "danger";
        }
        $stmt_update->close();
    } else {
        $message = "Email tidak terdaftar.";
        $message_type = "danger";
    }
    $stmt->close();
}
$conn->close();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FORBASI - Lupa Password</title>
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
                <h2>Lupa Password Anda?</h2>
                <p>Masukkan alamat email Anda yang terdaftar untuk menerima tautan reset password.</p>
            </div>

            <?php if ($message): ?>
                <div class="alert alert-<?php echo $message_type; ?>"><?php echo $message; ?></div>
            <?php endif; ?>

            <form action="" method="POST">
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email" class="form-control" placeholder="Masukkan email Anda" required>
                </div>
                <button type="submit" name="submit_email" class="btn">Kirim Tautan Reset</button>
            </form>
            <a href="login.php" class="back-to-login">Kembali ke Login</a>
        </div>
    </div>
</body>
</html>