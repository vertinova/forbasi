<?php
session_start();
require_once 'db_config.php'; // File konfigurasi database

// Fungsi untuk redirect berdasarkan role
function redirectBasedOnRole($role_id) {
    switch ($role_id) {
        case 1: // users
            header("Location: users");
            break;
        case 2: // admin_pengcab
            header("Location: pengcab");
            break;
        case 3: // admin_pengda
            header("Location: pengda");
            break;
        case 4: // admin_pb
            header("Location: pb");
            break;
        default:
            header("Location: index");
    }
    exit();
}

// Proses Login
if (isset($_POST['login'])) {
    $username = $_POST['username'];
    $password = $_POST['password'];

    // Cek dulu apakah username ada di tabel super_admins
    $checkSuperAdmin = $conn->prepare("SELECT id, username, password, full_name, email, is_active FROM super_admins WHERE username = ? AND is_active = 1");
    $checkSuperAdmin->bind_param("s", $username);
    $checkSuperAdmin->execute();
    $superAdminResult = $checkSuperAdmin->get_result();
    
    if ($superAdminResult->num_rows == 1) {
        // Login sebagai Super Admin
        $admin = $superAdminResult->fetch_assoc();
        
        if (password_verify($password, $admin['password'])) {
            // Login Super Admin berhasil
            $_SESSION['superadmin_id'] = $admin['id'];
            $_SESSION['superadmin_username'] = $admin['username'];
            $_SESSION['superadmin_name'] = $admin['full_name'];
            $_SESSION['superadmin_email'] = $admin['email'];
            
            // Update last login
            $updateStmt = $conn->prepare("UPDATE super_admins SET last_login = NOW() WHERE id = ?");
            $updateStmt->bind_param("i", $admin['id']);
            $updateStmt->execute();
            $updateStmt->close();
            
            $checkSuperAdmin->close();
            header("Location: superadmin_dashboard.php");
            exit();
        } else {
            $login_error = "Username atau password salah.";
        }
        $checkSuperAdmin->close();
    } else {
        // Bukan super admin, cek di tabel license_users (pelatih/juri)
        $checkSuperAdmin->close();
        
        $checkLicense = $conn->prepare("SELECT id, username, password, role, is_active FROM license_users WHERE username = ?");
        $checkLicense->bind_param("s", $username);
        $checkLicense->execute();
        $licenseResult = $checkLicense->get_result();
        
        if ($licenseResult->num_rows == 1) {
            // Login sebagai Pelatih/Juri
            $licenseUser = $licenseResult->fetch_assoc();
            
            if (!$licenseUser['is_active']) {
                $login_error = "Akun Anda telah dinonaktifkan.";
            } elseif (password_verify($password, $licenseUser['password'])) {
                // Set session untuk license user
                $_SESSION['license_user_id'] = $licenseUser['id'];
                $_SESSION['license_username'] = $licenseUser['username'];
                $_SESSION['license_role'] = $licenseUser['role'];
                
                // Update last login
                $updateStmt = $conn->prepare("UPDATE license_users SET last_login = NOW() WHERE id = ?");
                $updateStmt->bind_param("i", $licenseUser['id']);
                $updateStmt->execute();
                $updateStmt->close();
                
                $checkLicense->close();
                
                // Redirect berdasarkan role
                if ($licenseUser['role'] == 'pelatih') {
                    header("Location: pelatih.php");
                } else {
                    header("Location: juri.php");
                }
                exit();
            } else {
                $login_error = "Username atau password salah.";
            }
            $checkLicense->close();
        } else {
            // Bukan license user, cek di tabel users biasa
            $checkLicense->close();
        
            $stmt = $conn->prepare("SELECT * FROM users WHERE username = ?");
        $stmt->bind_param("s", $username);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows == 1) {
            $user = $result->fetch_assoc();

            // Verifikasi password
            if (password_verify($password, $user['password'])) {
                // Set session
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['username'] = $user['username'];
                $_SESSION['role_id'] = $user['role_id'];
                $_SESSION['club_name'] = $user['club_name'];
                $_SESSION['province_id'] = $user['province_id']; // Tambahkan ke session
                $_SESSION['city_id'] = $user['city_id'];     // Tambahkan ke session

                // Redirect berdasarkan role
                redirectBasedOnRole($user['role_id']);
            } else {
                $login_error = "Username atau password salah.";
            }
        } else {
            $login_error = "Username tidak terdaftar.";
        }
        $stmt->close();
        }
    }
}

// Fetch provinces for the dropdown
$provinces = [];
$stmt_provinces = $conn->prepare("SELECT id, name FROM provinces ORDER BY name ASC");
$stmt_provinces->execute();
$result_provinces = $stmt_provinces->get_result();
while ($row = $result_provinces->fetch_assoc()) {
    $provinces[] = $row;
}
$stmt_provinces->close();

// Fetch cities (initially empty, filled via AJAX)
$cities = [];
if (isset($_GET['province_id'])) {
    $selected_province_id = $_GET['province_id'];
    $stmt_cities = $conn->prepare("SELECT id, name FROM cities WHERE province_id = ? ORDER BY name ASC");
    $stmt_cities->bind_param("i", $selected_province_id);
    $stmt_cities->execute();
    $result_cities = $stmt_cities->get_result();
    while ($row = $result_cities->fetch_assoc()) {
        $cities[] = $row;
    }
    $stmt_cities->close();
    // If this is an AJAX request, send JSON response and exit
    if (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') {
        header('Content-Type: application/json');
        echo json_encode($cities);
        exit();
    }
}


// Proses Register
if (isset($_POST['register'])) {
    $club_name = $_POST['club_name'];
    $email = $_POST['email'];
    $phone = $_POST['phone'];
    $address = $_POST['address'];
    $province_id = $_POST['province_id']; // Ambil province_id
    $city_id = $_POST['city_id'];         // Ambil city_id
    $username = $_POST['username'];
    $password = $_POST['password'];
    $confirm_password = $_POST['confirm_password'];

    // Validasi
    if ($password !== $confirm_password) {
        $register_error = "Password dan konfirmasi password tidak cocok.";
    } else {
        // Cek apakah username sudah terdaftar
        $stmt_username = $conn->prepare("SELECT id FROM users WHERE username = ?");
        $stmt_username->bind_param("s", $username);
        $stmt_username->execute();
        $result_username = $stmt_username->get_result();

        // Cek apakah email sudah terdaftar
        $stmt_email = $conn->prepare("SELECT id FROM users WHERE email = ?");
        $stmt_email->bind_param("s", $email);
        $stmt_email->execute();
        $result_email = $stmt_email->get_result();

        if ($result_username->num_rows > 0) {
            $register_error = "Username sudah terdaftar.";
        } elseif ($result_email->num_rows > 0) {
            $register_error = "Email sudah terdaftar. Silakan gunakan email lain.";
        } else {
            // Hash password
            $hashed_password = password_hash($password, PASSWORD_DEFAULT);

            // Default role_id adalah 1 (users)
            $role_id = 1;

            // Insert ke database
            $stmt = $conn->prepare("INSERT INTO users (club_name, username, email, phone, address, province_id, city_id, password, role_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("sssssiisi", $club_name, $username, $email, $phone, $address, $province_id, $city_id, $hashed_password, $role_id);

            if ($stmt->execute()) {
                $register_success = "Pendaftaran berhasil! Silakan login.";
            } else {
                $register_error = "Terjadi kesalahan saat mendaftar. Silakan coba lagi. " . $stmt->error;
            }
            $stmt->close();
        }
        $stmt_username->close();
        $stmt_email->close();
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FORBASI - Login & Register</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        /* Base Styles */
        :root {
            --primary:green;
            --primary-dark: #005600; /* Darker shade of green */
            --secondary: #1d3557;
            --secondary-dark: #0a1a36;
            --accent: #a8dadc;
            --light: #f1faee;
            --dark: #0a1128;
            --white: #ffffff;
            --font-primary: 'Poppins', sans-serif;
            --box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            --transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
            --border-radius: 12px;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: var(--font-primary);
            background-color: var(--light);
            color: var(--dark);
            height: 100vh;
            margin: auto;
            display: flex;
            align-items: center;
            justify-content: center;
            background-image:
                radial-gradient(circle at 20% 30%, rgba(0, 128, 0, 0.1) 0%, transparent 30%), /* Green tint */
                radial-gradient(circle at 80% 70%, rgba(29, 53, 87, 0.1) 0%, transparent 30%);
        }

        /* Auth Container */
        .auth-container {
            width: 100%;
            max-width: 1200px;
            padding: 2rem;
            display: flex;
            margin: auto;
            align-items: center;
            justify-content: center;
        }

        /* Auth Card Wrapper - For Transition Animation */
        .auth-card-wrapper {
            position: relative;
            width: 100%;
            max-width: 400px;
            margin: auto;
            justify-content: center;
            height: 600px; /* Adjust height to accommodate new fields */
            perspective: 1000px;
        }

        /* Auth Card (Login/Register) */
        .auth-card {
            position: absolute;
            width: 100%;
            margin-top: -10vh;
            height: auto;
            padding: 3rem;
            background: var(--white);
            border-radius: var(--border-radius);
            box-shadow: var(--box-shadow);
            backface-visibility: hidden;
            transition: transform 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55), opacity 0.4s ease;
            display: flex;
            flex-direction: column;
            overflow: hidden;
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

        /* Login Card */
        .login-card {
            z-index: 2;
            transform: rotateY(0deg);
            opacity: 1;
        }

        /* Register Card */
        .register-card {
            transform: rotateY(180deg);
            opacity: 0;
            height: auto; /* Ensure register card expands as needed */
        }

        /* When showing register */
        .auth-card-wrapper.show-register .login-card {
            transform: rotateY(-180deg);
            opacity: 0;
        }

        .auth-card-wrapper.show-register .register-card {
            transform: rotateY(0deg);
            opacity: 1;
        }

        /* Auth Header */
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
            color: var(--gray);
            font-size: 0.9rem;
        }

        /* Form Elements */
        .form-group {
            margin-bottom: 1.5rem;
            position: relative;
        }

        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-size: 0.9rem;
            color: var(--secondary);
            font-weight: 500;
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
            box-shadow: 0 0 0 3px rgba(0, 128, 0, 0.2); /* Green tint */
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
            color: #888; /* Changed from var(--gray) for better visibility */
            cursor: pointer;
        }

        /* Auth Footer */
        .auth-footer {
            margin-top: auto;
            text-align: center;
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
            margin-bottom: 1.5rem;
        }

        .btn:hover {
            background: var(--primary-dark);
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 128, 0, 0.3); /* Green tint */
        }

        .btn-secondary {
            background: var(--secondary);
        }

        .btn-secondary:hover {
            background: var(--secondary-dark);
            box-shadow: 0 5px 15px rgba(29, 53, 87, 0.3);
        }

        .toggle-auth {
            color: var(--primary);
            font-weight: 600;
            cursor: pointer;
            transition: var(--transition);
        }

        .toggle-auth:hover {
            color: var(--primary-dark);
            text-decoration: underline;
        }

        /* Divider */
        .divider {
            display: flex;
            align-items: center;
            margin: 1.5rem 0;
            color: #888; /* Changed from var(--gray) for better visibility */
            font-size: 0.8rem;
        }

        .divider::before,
        .divider::after {
            content: '';
            flex: 1;
            height: 1px;
            background: #ddd;
            margin: 0 0.5rem;
        }

        /* Social Login */
        .social-login {
            display: flex;
            justify-content: center;
            gap: 1rem;
            margin-bottom: 1.5rem;
        }

        .social-btn {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--white);
            border: 1px solid #ddd;
            color: var(--dark);
            transition: var(--transition);
        }

        .social-btn:hover {
            background: var(--light);
            transform: translateY(-2px);
        }

        /* Error Messages */
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

        /* Responsive */
        @media (max-width: 768px) {
            .auth-card {
                padding: 2rem;
            }

            .auth-header img {
                height: 60px;
            }

            .auth-header h2 {
                font-size: 1.5rem;
            }
        }

        @media (max-width: 480px) {
            .auth-card {
                padding: 1.5rem;
            }

            .auth-card-wrapper {
                height: auto;
                min-height: 500px;
            }
        }
    </style>
</head>
<body>
    <div class="auth-container">
        <div class="auth-card-wrapper" id="authCardWrapper">
            <div class="auth-card login-card">
                <div class="auth-header">
                    <img src="../assets/LOGO-FORBASI.png" alt="FORBASI Logo">
                    <h2>Selamat Datang</h2>
                    <p>Masuk ke akun FORBASI Anda</p>
                </div>

                <?php if (isset($login_error)): ?>
                    <div class="alert alert-danger"><?php echo $login_error; ?></div>
                <?php endif; ?>

                <?php if (isset($register_success)): ?>
                    <div class="alert alert-success"><?php echo $register_success; ?></div>
                <?php endif; ?>

                <form class="auth-form" method="POST" action="">
                    <div class="form-group">
                        <label for="login-username">Username</label>
                        <input type="text" id="login-username" name="username" class="form-control" placeholder="Username" required>
                    </div>

                    <div class="form-group">
                        <label for="login-password">Password</label>
                        <div class="password-wrapper">
                            <input type="password" id="login-password" name="password" class="form-control" placeholder="Masukkan password" required>
                            <button type="button" class="password-toggle">
                                <i class="far fa-eye"></i>
                            </button>
                        </div>
                    </div>

                    <div class="form-group" style="text-align: right;">
                        <a href="fitur-kembang.php" style="font-size: 0.8rem; color: var(--primary);">Lupa password?</a>
                    </div>

                    <button type="submit" name="login" class="btn">Masuk</button>
                </form>

                <div class="auth-footer">
                    <p>Belum punya akun? <span class="toggle-auth" onclick="showRegister()">Daftar sekarang</span></p>
                </div>
            </div>

            <div class="auth-card register-card">
                <div class="auth-header">
                    <img src="../assets/LOGO-FORBASI.png" alt="FORBASI Logo">
                    <h2>Buat Akun Baru</h2>
                    <p>Bergabung dengan FORBASI</p>
                </div>

                <?php if (isset($register_error)): ?>
                    <div class="alert alert-danger"><?php echo $register_error; ?></div>
                <?php endif; ?>

                <form class="auth-form" method="POST" action="">
                    <div class="form-group">
                        <label for="register-name">Nama Club</label>
                        <input type="text" id="register-name" name="club_name" class="form-control" placeholder="Nama Club" required value="<?php echo isset($_POST['club_name']) ? htmlspecialchars($_POST['club_name']) : ''; ?>">
                    </div>
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" name="email" class="form-control" placeholder="Masukan email" required value="<?php echo isset($_POST['email']) ? htmlspecialchars($_POST['email']) : ''; ?>">
                    </div>
                    <div class="form-group">
                        <label for="phone">No. WhatsApp</label>
                        <input type="text" id="phone" name="phone" class="form-control" placeholder="Masukan no WhatsApp" required value="<?php echo isset($_POST['phone']) ? htmlspecialchars($_POST['phone']) : ''; ?>">
                    </div>
                    <div class="form-group">
                        <label for="address">Alamat</label>
                        <input type="text" id="address" name="address" class="form-control" maxlength="45" placeholder="Alamat" required value="<?php echo isset($_POST['address']) ? htmlspecialchars($_POST['address']) : ''; ?>">
                    </div>

                    <div class="form-group">
                        <label for="province">Provinsi</label>
                        <select id="province" name="province_id" class="form-control" required>
                            <option value="">Pilih Provinsi</option>
                            <?php foreach ($provinces as $province): ?>
                                <option value="<?php echo $province['id']; ?>" <?php echo (isset($_POST['province_id']) && $_POST['province_id'] == $province['id']) ? 'selected' : ''; ?>>
                                    <?php echo htmlspecialchars($province['name']); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="city">Kabupaten/Kota</label>
                        <select id="city" name="city_id" class="form-control" required disabled>
                            <option value="">Pilih Kabupaten/Kota</option>
                            <?php if (isset($_POST['province_id']) && !empty($cities)): ?>
                                <?php foreach ($cities as $city): ?>
                                    <option value="<?php echo $city['id']; ?>" <?php echo (isset($_POST['city_id']) && $_POST['city_id'] == $city['id']) ? 'selected' : ''; ?>>
                                        <?php echo htmlspecialchars($city['name']); ?>
                                    </option>
                                <?php endforeach; ?>
                            <?php endif; ?>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="register-username">Username</label>
                        <input type="text" id="register-username" name="username" class="form-control" placeholder="Username" required value="<?php echo isset($_POST['username']) ? htmlspecialchars($_POST['username']) : ''; ?>">
                    </div>

                    <div class="form-group">
                        <label for="register-password">Password</label>
                        <div class="password-wrapper">
                            <input type="password" id="register-password" name="password" class="form-control" placeholder="Buat password" required>
                            <button type="button" class="password-toggle">
                                <i class="far fa-eye"></i>
                            </button>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="register-confirm-password">Konfirmasi Password</label>
                        <div class="password-wrapper">
                            <input type="password" id="register-confirm-password" name="confirm_password" class="form-control" placeholder="Ulangi password" required>
                            <button type="button" class="password-toggle">
                                <i class="far fa-eye"></i>
                            </button>
                        </div>
                    </div>

                    <button type="submit" name="register" class="btn btn-secondary">Daftar</button>
                </form>

                <div class="auth-footer">
                    <p>Sudah punya akun? <span class="toggle-auth" onclick="showLogin()">Masuk disini</span></p>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Toggle between login and register cards
        function showRegister() {
            document.getElementById('authCardWrapper').classList.add('show-register');
        }

        function showLogin() {
            document.getElementById('authCardWrapper').classList.remove('show-register');
        }

        // Password toggle functionality
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

        // Dynamic City Dropdown based on Province selection
        const provinceSelect = document.getElementById('province');
        const citySelect = document.getElementById('city');

        provinceSelect.addEventListener('change', function() {
            const provinceId = this.value;
            citySelect.innerHTML = '<option value="">Memuat Kabupaten/Kota...</option>';
            citySelect.disabled = true;

            if (provinceId) {
                // Use fetch API to get cities based on selected province
                fetch(`?province_id=${provinceId}`, {
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest' // Identify as AJAX request
                    }
                })
                .then(response => response.json())
                .then(data => {
                    citySelect.innerHTML = '<option value="">Pilih Kabupaten/Kota</option>';
                    if (data.length > 0) {
                        data.forEach(city => {
                            const option = document.createElement('option');
                            option.value = city.id;
                            option.textContent = city.name;
                            citySelect.appendChild(option);
                        });
                        citySelect.disabled = false;
                    } else {
                        citySelect.innerHTML = '<option value="">Tidak ada Kabupaten/Kota ditemukan</option>';
                    }
                })
                .catch(error => {
                    console.error('Error fetching cities:', error);
                    citySelect.innerHTML = '<option value="">Gagal memuat Kabupaten/Kota</option>';
                });
            } else {
                citySelect.innerHTML = '<option value="">Pilih Kabupaten/Kota</option>';
            }
        });

        // If there was a previous selection (due to validation error), trigger the change event
        // This ensures the city dropdown is populated correctly after a failed registration attempt
        document.addEventListener('DOMContentLoaded', function() {
            if (provinceSelect.value) {
                const event = new Event('change');
                provinceSelect.dispatchEvent(event);
            }
        });

        // --- Perbaikan untuk masalah Anda ---
        // Kode ini akan mengecek apakah ada pesan error/sukses dari PHP
        // dan menampilkan card yang sesuai saat halaman dimuat.
        document.addEventListener('DOMContentLoaded', function() {
            // Jika ada error registrasi, tampilkan card register
            <?php if (isset($register_error)): ?>
                showRegister();
            <?php endif; ?>

            // Jika registrasi berhasil, tampilkan card login
            <?php if (isset($register_success)): ?>
                showLogin();
            <?php endif; ?>
        });
    </script>
</body>
</html>