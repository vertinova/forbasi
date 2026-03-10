<?php
session_start();
require_once 'db_config.php';

// Redirect if already logged in
if (isset($_SESSION['license_user_id'])) {
    $role = $_SESSION['license_role'];
    header("Location: " . ($role == 'pelatih' ? 'pelatih.php' : 'juri.php'));
    exit();
}

// Handle AJAX request
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['ajax'])) {
    header('Content-Type: application/json');
    
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';
    $confirm_password = $_POST['confirm_password'] ?? '';
    $role = $_POST['role'] ?? '';
    
    $response = ['success' => false, 'message' => ''];
    
    // Validation
    if (strlen($username) < 4) {
        $response['message'] = 'Username minimal 4 karakter.';
    } elseif (!preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
        $response['message'] = 'Username hanya boleh huruf, angka, dan underscore.';
    } elseif (strlen($password) < 6) {
        $response['message'] = 'Password minimal 6 karakter.';
    } elseif ($password !== $confirm_password) {
        $response['message'] = 'Password dan konfirmasi password tidak cocok.';
    } elseif (!in_array($role, ['pelatih', 'juri'])) {
        $response['message'] = 'Pilih jenis akun (Pelatih atau Juri).';
    } else {
        // Check if username exists
        $stmt = $conn->prepare("SELECT id FROM license_users WHERE username = ?");
        $stmt->bind_param("s", $username);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $response['message'] = 'Username "' . htmlspecialchars($username) . '" sudah terdaftar. Gunakan username lain.';
        } else {
            $hashed_password = password_hash($password, PASSWORD_DEFAULT);
            $stmt_insert = $conn->prepare("INSERT INTO license_users (username, password, role) VALUES (?, ?, ?)");
            $stmt_insert->bind_param("sss", $username, $hashed_password, $role);
            
            if ($stmt_insert->execute()) {
                $response['success'] = true;
                $response['message'] = 'Pendaftaran berhasil! Silakan login untuk melanjutkan pengajuan lisensi.';
                $response['role'] = $role;
            } else {
                $response['message'] = 'Terjadi kesalahan server. Silakan coba lagi.';
            }
            $stmt_insert->close();
        }
        $stmt->close();
    }
    
    echo json_encode($response);
    exit();
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Daftar Akun Lisensi - FORBASI</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="icon" type="image/png" sizes="32x32" href="../assets/icon-32x32.png">
    <style>
        :root {
            --primary: #00c853;
            --primary-dark: #009624;
            --secondary: #1d3557;
            --accent: #ffd700;
            --danger: #ff5252;
            --danger-dark: #d32f2f;
            --dark-bg: #0a1628;
            --dark-card: rgba(255, 255, 255, 0.08);
            --white: #ffffff;
            --gray: #94a3b8;
            --font: 'Poppins', sans-serif;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: var(--font);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: linear-gradient(135deg, #0a1628 0%, #1a2f4a 50%, #0d1f35 100%);
            position: relative;
            overflow-x: hidden;
        }

        /* Animated Background */
        body::before {
            content: '';
            position: fixed;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: 
                radial-gradient(circle at 20% 80%, rgba(0, 200, 83, 0.1) 0%, transparent 40%),
                radial-gradient(circle at 80% 20%, rgba(255, 82, 82, 0.08) 0%, transparent 40%),
                radial-gradient(circle at 50% 50%, rgba(255, 215, 0, 0.05) 0%, transparent 50%);
            animation: floatBg 20s ease-in-out infinite;
            z-index: 0;
        }

        @keyframes floatBg {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            33% { transform: translate(2%, 2%) rotate(1deg); }
            66% { transform: translate(-1%, 1%) rotate(-1deg); }
        }

        .container {
            position: relative;
            z-index: 1;
            width: 100%;
            max-width: 480px;
        }

        /* Glass Card */
        .register-card {
            background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 24px;
            padding: 2.5rem;
            box-shadow: 0 25px 60px rgba(0,0,0,0.3);
            position: relative;
            overflow: hidden;
        }

        .register-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, var(--primary), var(--accent), var(--danger));
        }

        /* Header */
        .header {
            text-align: center;
            margin-bottom: 2rem;
        }

        .logo {
            width: 80px;
            height: 80px;
            margin-bottom: 1rem;
            filter: drop-shadow(0 4px 20px rgba(0,200,83,0.3));
            animation: pulse 3s ease-in-out infinite;
        }

        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }

        .header h1 {
            color: var(--white);
            font-size: 1.75rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            background: linear-gradient(135deg, #fff 0%, #e0e0e0 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .header p {
            color: var(--gray);
            font-size: 0.9rem;
        }

        /* Event Info */
        .event-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            background: linear-gradient(135deg, var(--accent), #ffaa00);
            color: #1a1a1a;
            padding: 0.5rem 1.25rem;
            border-radius: 50px;
            font-size: 0.8rem;
            font-weight: 700;
            margin-bottom: 1.5rem;
            box-shadow: 0 4px 15px rgba(255,215,0,0.3);
        }

        .event-info {
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 16px;
            padding: 1.25rem;
            margin-bottom: 2rem;
        }

        .event-info h4 {
            color: var(--white);
            font-size: 0.95rem;
            margin-bottom: 0.75rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .event-info h4 i {
            color: var(--accent);
        }

        .event-details {
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
            margin-bottom: 1rem;
        }

        .event-details span {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            font-size: 0.8rem;
            color: var(--gray);
        }

        .event-details span i {
            color: var(--primary);
            font-size: 0.85rem;
        }

        .price-row {
            display: flex;
            gap: 1rem;
            padding-top: 0.75rem;
            border-top: 1px solid rgba(255,255,255,0.1);
        }

        .price-item {
            flex: 1;
            text-align: center;
            padding: 0.5rem;
            border-radius: 10px;
            background: rgba(255,255,255,0.05);
        }

        .price-item.pelatih { border: 1px solid rgba(0,200,83,0.3); }
        .price-item.juri { border: 1px solid rgba(255,82,82,0.3); }

        .price-item i {
            font-size: 1rem;
            margin-bottom: 0.25rem;
        }

        .price-item.pelatih i { color: var(--primary); }
        .price-item.juri i { color: var(--danger); }

        .price-item .label {
            display: block;
            font-size: 0.7rem;
            color: var(--gray);
            margin-bottom: 0.15rem;
        }

        .price-item .amount {
            font-size: 0.85rem;
            font-weight: 700;
        }

        .price-item.pelatih .amount { color: var(--primary); }
        .price-item.juri .amount { color: var(--danger); }

        /* Form Styles */
        .form-group {
            margin-bottom: 1.25rem;
        }

        .form-group label {
            display: block;
            color: var(--white);
            font-size: 0.85rem;
            font-weight: 500;
            margin-bottom: 0.5rem;
        }

        .input-wrapper {
            position: relative;
        }

        .input-wrapper i {
            position: absolute;
            left: 1rem;
            top: 50%;
            transform: translateY(-50%);
            color: var(--gray);
            font-size: 0.9rem;
            transition: all 0.3s;
        }

        .input-wrapper input {
            width: 100%;
            padding: 0.9rem 1rem 0.9rem 2.75rem;
            background: rgba(255,255,255,0.08);
            border: 2px solid rgba(255,255,255,0.1);
            border-radius: 12px;
            color: var(--white);
            font-family: var(--font);
            font-size: 0.95rem;
            transition: all 0.3s;
        }

        .input-wrapper input::placeholder {
            color: rgba(255,255,255,0.4);
        }

        .input-wrapper input:focus {
            outline: none;
            border-color: var(--primary);
            background: rgba(0,200,83,0.08);
            box-shadow: 0 0 0 3px rgba(0,200,83,0.15);
        }

        .input-wrapper input:focus + i,
        .input-wrapper:focus-within i {
            color: var(--primary);
        }

        /* Role Selection */
        .role-selection {
            display: flex;
            gap: 1rem;
            margin-bottom: 1.5rem;
        }

        .role-option {
            flex: 1;
            position: relative;
        }

        .role-option input {
            position: absolute;
            opacity: 0;
            cursor: pointer;
        }

        .role-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 1.25rem 1rem;
            background: rgba(255,255,255,0.05);
            border: 2px solid rgba(255,255,255,0.1);
            border-radius: 16px;
            cursor: pointer;
            transition: all 0.3s;
        }

        .role-card:hover {
            background: rgba(255,255,255,0.08);
            border-color: rgba(255,255,255,0.2);
        }

        .role-card .icon {
            width: 50px;
            height: 50px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 0.75rem;
            font-size: 1.25rem;
            transition: all 0.3s;
        }

        .role-option:first-child .icon {
            background: rgba(0,200,83,0.15);
            color: var(--primary);
        }

        .role-option:last-child .icon {
            background: rgba(255,82,82,0.15);
            color: var(--danger);
        }

        .role-card .title {
            color: var(--white);
            font-weight: 600;
            font-size: 0.95rem;
            margin-bottom: 0.25rem;
        }

        .role-card .price {
            font-size: 0.8rem;
            font-weight: 600;
        }

        .role-option:first-child .price { color: var(--primary); }
        .role-option:last-child .price { color: var(--danger); }

        /* Selected State */
        .role-option input:checked + .role-card {
            transform: scale(1.02);
        }

        .role-option:first-child input:checked + .role-card {
            border-color: var(--primary);
            background: rgba(0,200,83,0.1);
            box-shadow: 0 8px 25px rgba(0,200,83,0.25);
        }

        .role-option:last-child input:checked + .role-card {
            border-color: var(--danger);
            background: rgba(255,82,82,0.1);
            box-shadow: 0 8px 25px rgba(255,82,82,0.25);
        }

        .role-option input:checked + .role-card .icon {
            transform: scale(1.1);
        }

        /* Submit Button */
        .btn-submit {
            width: 100%;
            padding: 1rem;
            background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
            border: none;
            border-radius: 12px;
            color: var(--white);
            font-family: var(--font);
            font-size: 1rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            box-shadow: 0 8px 25px rgba(0,200,83,0.3);
            position: relative;
            overflow: hidden;
        }

        .btn-submit::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: 0.5s;
        }

        .btn-submit:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 35px rgba(0,200,83,0.4);
        }

        .btn-submit:hover::before {
            left: 100%;
        }

        .btn-submit:disabled {
            opacity: 0.7;
            cursor: not-allowed;
            transform: none;
        }

        .btn-submit .spinner {
            width: 20px;
            height: 20px;
            border: 2px solid transparent;
            border-top-color: var(--white);
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            display: none;
        }

        .btn-submit.loading .spinner {
            display: block;
        }

        .btn-submit.loading .btn-text {
            display: none;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        /* Links */
        .links {
            text-align: center;
            margin-top: 1.5rem;
            padding-top: 1.5rem;
            border-top: 1px solid rgba(255,255,255,0.1);
        }

        .links p {
            color: var(--gray);
            font-size: 0.9rem;
            margin-bottom: 0.75rem;
        }

        .links a {
            color: var(--primary);
            font-weight: 600;
            text-decoration: none;
            transition: all 0.3s;
        }

        .links a:hover {
            color: var(--accent);
            text-shadow: 0 0 10px rgba(255,215,0,0.3);
        }

        .back-home {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--gray);
            font-size: 0.85rem;
            text-decoration: none;
            margin-top: 0.5rem;
            transition: all 0.3s;
        }

        .back-home:hover {
            color: var(--white);
        }

        /* Toast Notification */
        .toast {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 16px;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            max-width: 400px;
            z-index: 9999;
            transform: translateX(500px);
            opacity: 0;
            transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            box-shadow: 0 15px 40px rgba(0,0,0,0.3);
        }

        .toast.show {
            transform: translateX(0);
            opacity: 1;
        }

        .toast.success {
            background: linear-gradient(135deg, #00c853, #009624);
            color: white;
        }

        .toast.error {
            background: linear-gradient(135deg, #ff5252, #d32f2f);
            color: white;
        }

        .toast .icon {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(255,255,255,0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.25rem;
            flex-shrink: 0;
        }

        .toast .content h4 {
            font-size: 0.95rem;
            font-weight: 600;
            margin-bottom: 0.25rem;
        }

        .toast .content p {
            font-size: 0.85rem;
            opacity: 0.9;
            line-height: 1.4;
        }

        .toast .close {
            position: absolute;
            top: 8px;
            right: 12px;
            background: none;
            border: none;
            color: rgba(255,255,255,0.7);
            cursor: pointer;
            font-size: 1rem;
            transition: all 0.2s;
        }

        .toast .close:hover {
            color: white;
            transform: scale(1.1);
        }

        /* Success Modal */
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            backdrop-filter: blur(5px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s;
        }

        .modal-overlay.show {
            opacity: 1;
            visibility: visible;
        }

        .modal {
            background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 24px;
            padding: 2.5rem;
            text-align: center;
            max-width: 400px;
            width: 90%;
            transform: scale(0.8);
            transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .modal-overlay.show .modal {
            transform: scale(1);
        }

        .modal .icon-circle {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--primary), var(--primary-dark));
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem;
            box-shadow: 0 10px 30px rgba(0,200,83,0.4);
            animation: bounceIn 0.6s ease-out;
        }

        @keyframes bounceIn {
            0% { transform: scale(0); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
        }

        .modal .icon-circle i {
            font-size: 2.5rem;
            color: white;
        }

        .modal h2 {
            color: white;
            font-size: 1.5rem;
            margin-bottom: 0.75rem;
        }

        .modal p {
            color: var(--gray);
            font-size: 0.95rem;
            line-height: 1.6;
            margin-bottom: 1.5rem;
        }

        .modal .btn-login {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.9rem 2rem;
            background: linear-gradient(135deg, var(--primary), var(--primary-dark));
            color: white;
            border: none;
            border-radius: 12px;
            font-family: var(--font);
            font-size: 0.95rem;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            transition: all 0.3s;
            box-shadow: 0 8px 25px rgba(0,200,83,0.3);
        }

        .modal .btn-login:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 35px rgba(0,200,83,0.4);
        }

        /* Responsive */
        @media (max-width: 480px) {
            .register-card {
                padding: 1.75rem;
            }

            .header h1 {
                font-size: 1.5rem;
            }

            .role-selection {
                flex-direction: column;
                gap: 0.75rem;
            }

            .toast {
                left: 10px;
                right: 10px;
                max-width: none;
                transform: translateY(-200px);
            }

            .toast.show {
                transform: translateY(0);
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="register-card">
            <div class="header">
                <img src="../assets/LOGO-FORBASI.png" alt="FORBASI" class="logo">
                <span class="event-badge"><i class="fas fa-star"></i> Pendaftaran Dibuka</span>
                <h1>Daftar Lisensi</h1>
                <p>Buat akun untuk mengajukan lisensi pelatih atau juri</p>
            </div>

            <div class="event-info">
                <h4><i class="fas fa-calendar-check"></i> Jadwal Lisensi 2026</h4>
                <div class="event-details">
                    <span><i class="fas fa-calendar"></i> Minggu, 12 April 2026</span>
                    <span><i class="fas fa-clock"></i> 08.00 WIB</span>
                    <span><i class="fas fa-map-marker-alt"></i> Semarang, Jawa Tengah</span>
                </div>
                <div class="price-row">
                    <div class="price-item pelatih">
                        <i class="fas fa-chalkboard-teacher"></i>
                        <span class="label">Pelatih</span>
                        <span class="amount">Rp 750.000</span>
                    </div>
                    <div class="price-item juri">
                        <i class="fas fa-gavel"></i>
                        <span class="label">Juri</span>
                        <span class="amount">Rp 2.000.000</span>
                    </div>
                </div>
            </div>

            <form id="registerForm">
                <div class="form-group">
                    <label>Pilih Jenis Lisensi</label>
                    <div class="role-selection">
                        <div class="role-option">
                            <input type="radio" name="role" id="role-pelatih" value="pelatih" checked>
                            <label for="role-pelatih" class="role-card">
                                <div class="icon"><i class="fas fa-chalkboard-teacher"></i></div>
                                <span class="title">Pelatih</span>
                                <span class="price">Rp 750.000</span>
                            </label>
                        </div>
                        <div class="role-option">
                            <input type="radio" name="role" id="role-juri" value="juri">
                            <label for="role-juri" class="role-card">
                                <div class="icon"><i class="fas fa-gavel"></i></div>
                                <span class="title">Juri</span>
                                <span class="price">Rp 2.000.000</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label for="username">Username</label>
                    <div class="input-wrapper">
                        <input type="text" id="username" name="username" placeholder="Minimal 4 karakter" required minlength="4" autocomplete="username">
                        <i class="fas fa-user"></i>
                    </div>
                </div>

                <div class="form-group">
                    <label for="password">Password</label>
                    <div class="input-wrapper">
                        <input type="password" id="password" name="password" placeholder="Minimal 6 karakter" required minlength="6" autocomplete="new-password">
                        <i class="fas fa-lock"></i>
                    </div>
                </div>

                <div class="form-group">
                    <label for="confirm_password">Konfirmasi Password</label>
                    <div class="input-wrapper">
                        <input type="password" id="confirm_password" name="confirm_password" placeholder="Ulangi password" required autocomplete="new-password">
                        <i class="fas fa-lock"></i>
                    </div>
                </div>

                <button type="submit" class="btn-submit">
                    <span class="btn-text"><i class="fas fa-user-plus"></i> Daftar Sekarang</span>
                    <span class="spinner"></span>
                </button>
            </form>

            <div class="links">
                <p>Sudah punya akun? <a href="login.php">Login di sini</a></p>
                <a href="../../index.php" class="back-home"><i class="fas fa-arrow-left"></i> Kembali ke Beranda</a>
            </div>
        </div>
    </div>

    <!-- Toast Notification -->
    <div id="toast" class="toast">
        <div class="icon"><i class="fas fa-check"></i></div>
        <div class="content">
            <h4 id="toast-title">Title</h4>
            <p id="toast-message">Message</p>
        </div>
        <button class="close" onclick="hideToast()"><i class="fas fa-times"></i></button>
    </div>

    <!-- Success Modal -->
    <div id="successModal" class="modal-overlay">
        <div class="modal">
            <div class="icon-circle"><i class="fas fa-check"></i></div>
            <h2>Pendaftaran Berhasil!</h2>
            <p>Akun Anda telah berhasil dibuat. Silakan login untuk melanjutkan pengajuan lisensi.</p>
            <a href="login.php" class="btn-login"><i class="fas fa-sign-in-alt"></i> Login Sekarang</a>
        </div>
    </div>

    <script>
        const form = document.getElementById('registerForm');
        const btn = document.querySelector('.btn-submit');
        const toast = document.getElementById('toast');
        const modal = document.getElementById('successModal');

        // Form Submit Handler
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Client-side validation
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm_password').value;
            const role = document.querySelector('input[name="role"]:checked')?.value;

            if (username.length < 4) {
                showToast('error', 'Validasi Gagal', 'Username minimal 4 karakter.');
                return;
            }

            if (!/^[a-zA-Z0-9_]+$/.test(username)) {
                showToast('error', 'Validasi Gagal', 'Username hanya boleh huruf, angka, dan underscore.');
                return;
            }

            if (password.length < 6) {
                showToast('error', 'Validasi Gagal', 'Password minimal 6 karakter.');
                return;
            }

            if (password !== confirmPassword) {
                showToast('error', 'Validasi Gagal', 'Password dan konfirmasi password tidak cocok.');
                return;
            }

            if (!role) {
                showToast('error', 'Validasi Gagal', 'Pilih jenis lisensi (Pelatih atau Juri).');
                return;
            }

            // Show loading state
            btn.classList.add('loading');
            btn.disabled = true;

            try {
                const formData = new FormData(form);
                formData.append('ajax', '1');

                const response = await fetch('', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (result.success) {
                    // Show success modal
                    modal.classList.add('show');
                } else {
                    // Show error toast
                    showToast('error', 'Pendaftaran Gagal', result.message);
                }
            } catch (error) {
                showToast('error', 'Error', 'Terjadi kesalahan koneksi. Silakan coba lagi.');
            } finally {
                btn.classList.remove('loading');
                btn.disabled = false;
            }
        });

        // Toast Functions
        function showToast(type, title, message) {
            const icon = toast.querySelector('.icon i');
            
            toast.className = 'toast ' + type;
            icon.className = type === 'success' ? 'fas fa-check' : 'fas fa-exclamation-triangle';
            document.getElementById('toast-title').textContent = title;
            document.getElementById('toast-message').textContent = message;
            
            toast.classList.add('show');

            // Auto hide after 5 seconds
            setTimeout(hideToast, 5000);
        }

        function hideToast() {
            toast.classList.remove('show');
        }

        // Close modal on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });

        // Password visibility toggle (optional enhancement)
        document.querySelectorAll('.input-wrapper input[type="password"]').forEach(input => {
            const wrapper = input.parentElement;
            const toggleBtn = document.createElement('button');
            toggleBtn.type = 'button';
            toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
            toggleBtn.style.cssText = 'position:absolute;right:1rem;top:50%;transform:translateY(-50%);background:none;border:none;color:var(--gray);cursor:pointer;font-size:0.9rem;';
            toggleBtn.onclick = () => {
                const type = input.type === 'password' ? 'text' : 'password';
                input.type = type;
                toggleBtn.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
            };
            wrapper.appendChild(toggleBtn);
        });
    </script>
</body>
</html>
