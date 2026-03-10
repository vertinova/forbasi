<?php
session_start();

// Set timezone
date_default_timezone_set('Asia/Jakarta');

// Error reporting
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php_error_log_juri.txt');

require_once 'db_config.php';

// Check login
if (!isset($_SESSION['license_user_id']) || $_SESSION['license_role'] != 'juri') {
    header("Location: login.php");
    exit();
}

$user_id = $_SESSION['license_user_id'];
$username = $_SESSION['license_username'];

$success_message = '';
$error_message = '';

// Upload configuration
$upload_base = __DIR__ . '/uploads/lisensi/';
$max_file_size = 2 * 1024 * 1024; // 2MB
$allowed_types = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

// Get active event
$event = null;
$event_stmt = $conn->prepare("SELECT * FROM license_events WHERE is_active = 1 AND registration_open = 1 ORDER BY event_date ASC LIMIT 1");
$event_stmt->execute();
$event_result = $event_stmt->get_result();
if ($event_result->num_rows > 0) {
    $event = $event_result->fetch_assoc();
}
$event_stmt->close();

// Get user's applications
$applications = [];
$app_stmt = $conn->prepare("SELECT * FROM license_applications WHERE user_id = ? ORDER BY submitted_at DESC");
$app_stmt->bind_param("i", $user_id);
$app_stmt->execute();
$app_result = $app_stmt->get_result();
while ($row = $app_result->fetch_assoc()) {
    $applications[] = $row;
}
$app_stmt->close();

// Check if user already has pending/approved application
$has_active_application = false;
foreach ($applications as $app) {
    if (in_array($app['status'], ['pending', 'proses', 'approved'])) {
        $has_active_application = true;
        break;
    }
}

// Handle AJAX submission
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['ajax'])) {
    header('Content-Type: application/json');
    $response = ['success' => false, 'message' => ''];
    
    if ($has_active_application) {
        $response['message'] = "Anda sudah memiliki pengajuan yang masih aktif.";
    } else {
        // Validate required fields
        $nama_lengkap = trim($_POST['nama_lengkap'] ?? '');
        $alamat = trim($_POST['alamat'] ?? '');
        $no_telepon = trim($_POST['no_telepon'] ?? '');
        $email = trim($_POST['email'] ?? '');
        $jenis_lisensi = $_POST['jenis_lisensi'] ?? '';
        
        if (empty($nama_lengkap) || empty($alamat) || empty($no_telepon) || empty($email)) {
            $response['message'] = "Semua field wajib diisi.";
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $response['message'] = "Format email tidak valid.";
        } elseif (!in_array($jenis_lisensi, ['juri_muda', 'juri_madya'])) {
            $response['message'] = "Pilih jenis lisensi juri yang valid.";
        } else {
            // Process file uploads
            $upload_errors = [];
            $uploaded_files = [];
            
            // Pas Foto (Required)
            if (isset($_FILES['pas_foto']) && $_FILES['pas_foto']['error'] === UPLOAD_ERR_OK) {
                $file = $_FILES['pas_foto'];
                if ($file['size'] > $max_file_size) {
                    $upload_errors[] = "Pas foto maksimal 2MB";
                } elseif (!in_array($file['type'], ['image/jpeg', 'image/png', 'image/jpg'])) {
                    $upload_errors[] = "Pas foto harus berformat JPG/PNG";
                } else {
                    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
                    $filename = 'pasfoto_juri_' . $user_id . '_' . time() . '.' . $ext;
                    $filepath = $upload_base . 'pas_foto/' . $filename;
                    if (move_uploaded_file($file['tmp_name'], $filepath)) {
                        $uploaded_files['pas_foto'] = 'lisensi/pas_foto/' . $filename;
                    } else {
                        $upload_errors[] = "Gagal upload pas foto";
                    }
                }
            } else {
                $upload_errors[] = "Pas foto wajib diupload";
            }
            
            // Bukti Transfer (Required)
            if (isset($_FILES['bukti_transfer']) && $_FILES['bukti_transfer']['error'] === UPLOAD_ERR_OK) {
                $file = $_FILES['bukti_transfer'];
                if ($file['size'] > $max_file_size) {
                    $upload_errors[] = "Bukti transfer maksimal 2MB";
                } elseif (!in_array($file['type'], $allowed_types)) {
                    $upload_errors[] = "Bukti transfer harus berformat JPG/PNG/PDF";
                } else {
                    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
                    $filename = 'bukti_tf_juri_' . $user_id . '_' . time() . '.' . $ext;
                    $filepath = $upload_base . 'bukti_transfer/' . $filename;
                    if (move_uploaded_file($file['tmp_name'], $filepath)) {
                        $uploaded_files['bukti_transfer'] = 'lisensi/bukti_transfer/' . $filename;
                    } else {
                        $upload_errors[] = "Gagal upload bukti transfer";
                    }
                }
            } else {
                $upload_errors[] = "Bukti transfer wajib diupload";
            }
            
            // Surat Rekomendasi Pengda (Required for Juri)
            if (isset($_FILES['surat_rekomendasi']) && $_FILES['surat_rekomendasi']['error'] === UPLOAD_ERR_OK) {
                $file = $_FILES['surat_rekomendasi'];
                if ($file['size'] > $max_file_size) {
                    $upload_errors[] = "Surat rekomendasi maksimal 2MB";
                } elseif (!in_array($file['type'], $allowed_types)) {
                    $upload_errors[] = "Surat rekomendasi harus berformat JPG/PNG/PDF";
                } else {
                    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
                    $filename = 'rekomendasi_' . $user_id . '_' . time() . '.' . $ext;
                    $filepath = $upload_base . 'surat_rekomendasi/' . $filename;
                    if (move_uploaded_file($file['tmp_name'], $filepath)) {
                        $uploaded_files['surat_rekomendasi'] = 'lisensi/surat_rekomendasi/' . $filename;
                    } else {
                        $upload_errors[] = "Gagal upload surat rekomendasi";
                    }
                }
            } else {
                $upload_errors[] = "Surat rekomendasi PENGDA wajib diupload";
            }
            
            // Surat Pengalaman (Required)
            if (isset($_FILES['surat_pengalaman']) && $_FILES['surat_pengalaman']['error'] === UPLOAD_ERR_OK) {
                $file = $_FILES['surat_pengalaman'];
                if ($file['size'] > $max_file_size) {
                    $upload_errors[] = "Surat pengalaman maksimal 2MB";
                } elseif (!in_array($file['type'], $allowed_types)) {
                    $upload_errors[] = "Surat pengalaman harus berformat JPG/PNG/PDF";
                } else {
                    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
                    $filename = 'pengalaman_juri_' . $user_id . '_' . time() . '.' . $ext;
                    $filepath = $upload_base . 'surat_pengalaman/' . $filename;
                    if (move_uploaded_file($file['tmp_name'], $filepath)) {
                        $uploaded_files['surat_pengalaman'] = 'lisensi/surat_pengalaman/' . $filename;
                    } else {
                        $upload_errors[] = "Gagal upload surat pengalaman";
                    }
                }
            } else {
                $upload_errors[] = "Surat keterangan pengalaman wajib diupload";
            }
            
            if (!empty($upload_errors)) {
                $response['message'] = implode("\n", $upload_errors);
            } else {
                // Insert application
                $biaya = $event ? $event['biaya_juri'] : 2000000;
                
                $insert_stmt = $conn->prepare("INSERT INTO license_applications 
                    (user_id, nama_lengkap, alamat, jenis_lisensi, no_telepon, email, pas_foto, bukti_transfer, surat_rekomendasi_pengda, surat_pengalaman, biaya_lisensi, status) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')");
                
                $insert_stmt->bind_param("isssssssssd", 
                    $user_id, 
                    $nama_lengkap, 
                    $alamat, 
                    $jenis_lisensi,
                    $no_telepon, 
                    $email, 
                    $uploaded_files['pas_foto'], 
                    $uploaded_files['bukti_transfer'],
                    $uploaded_files['surat_rekomendasi'],
                    $uploaded_files['surat_pengalaman'],
                    $biaya
                );
                
                if ($insert_stmt->execute()) {
                    $response['success'] = true;
                    $response['message'] = "Pengajuan lisensi juri berhasil dikirim!";
                } else {
                    $response['message'] = "Terjadi kesalahan saat menyimpan data.";
                    error_log("Error inserting license application: " . $conn->error);
                }
                $insert_stmt->close();
            }
        }
    }
    
    echo json_encode($response);
    exit();
}

// Status badge helper
function getStatusBadge($status) {
    switch ($status) {
        case 'pending':
            return '<span class="status-badge pending"><i class="fas fa-clock"></i> Menunggu</span>';
        case 'proses':
            return '<span class="status-badge process"><i class="fas fa-spinner"></i> Proses</span>';
        case 'approved':
            return '<span class="status-badge approved"><i class="fas fa-check-circle"></i> Disetujui</span>';
        case 'rejected':
            return '<span class="status-badge rejected"><i class="fas fa-times-circle"></i> Ditolak</span>';
        default:
            return '<span class="status-badge">' . ucfirst($status) . '</span>';
    }
}

function getLicenseTypeLabel($type) {
    switch ($type) {
        case 'juri_muda': return 'Juri Muda';
        case 'juri_madya': return 'Juri Madya';
        default: return ucfirst(str_replace('_', ' ', $type));
    }
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard Juri - FORBASI</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="icon" type="image/png" sizes="32x32" href="../assets/icon-32x32.png">
    <style>
        :root {
            --primary: #ff5252;
            --primary-dark: #d32f2f;
            --primary-light: rgba(255, 82, 82, 0.15);
            --secondary: #1d3557;
            --accent: #ffd700;
            --success: #00c853;
            --dark-bg: #0a1628;
            --dark-card: rgba(255, 255, 255, 0.08);
            --white: #ffffff;
            --gray: #94a3b8;
            --gray-light: #cbd5e1;
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
            background: linear-gradient(135deg, #0a1628 0%, #1a2f4a 50%, #0d1f35 100%);
            color: var(--white);
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
                radial-gradient(circle at 20% 80%, rgba(255, 82, 82, 0.08) 0%, transparent 40%),
                radial-gradient(circle at 80% 20%, rgba(255, 215, 0, 0.05) 0%, transparent 40%),
                radial-gradient(circle at 50% 50%, rgba(255, 82, 82, 0.03) 0%, transparent 50%);
            animation: floatBg 20s ease-in-out infinite;
            z-index: 0;
            pointer-events: none;
        }

        @keyframes floatBg {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            33% { transform: translate(2%, 2%) rotate(1deg); }
            66% { transform: translate(-1%, 1%) rotate(-1deg); }
        }

        /* Navbar */
        .navbar {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: rgba(10, 22, 40, 0.9);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(255,255,255,0.1);
            padding: 0.75rem 1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 1000;
        }

        .navbar-brand {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .navbar-brand img {
            height: 36px;
            filter: drop-shadow(0 2px 8px rgba(255,82,82,0.3));
        }

        .navbar-brand h1 {
            font-size: 1rem;
            font-weight: 600;
            background: linear-gradient(135deg, var(--primary), var(--accent));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .navbar-user {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .user-info {
            display: none;
            align-items: center;
            gap: 0.5rem;
            color: var(--gray);
            font-size: 0.85rem;
        }

        .btn-logout {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            background: rgba(255,82,82,0.2);
            border: 1px solid rgba(255,82,82,0.3);
            color: #ff8a80;
            border-radius: 10px;
            font-size: 0.8rem;
            font-weight: 500;
            text-decoration: none;
            transition: all 0.3s;
        }

        .btn-logout:hover {
            background: rgba(255,82,82,0.3);
        }

        /* Main Content */
        .main-content {
            position: relative;
            z-index: 1;
            padding: 5rem 1rem 2rem;
            max-width: 800px;
            margin: 0 auto;
        }

        /* Welcome Card */
        .welcome-card {
            background: linear-gradient(135deg, rgba(255,82,82,0.15) 0%, rgba(255,82,82,0.05) 100%);
            border: 1px solid rgba(255,82,82,0.2);
            border-radius: 20px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            position: relative;
            overflow: hidden;
        }

        .welcome-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, var(--primary), var(--accent));
        }

        .welcome-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1rem;
        }

        .welcome-icon {
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, var(--primary), var(--primary-dark));
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            color: white;
            box-shadow: 0 8px 20px rgba(255,82,82,0.3);
        }

        .welcome-text h2 {
            font-size: 1.25rem;
            font-weight: 700;
            margin-bottom: 0.25rem;
        }

        .welcome-text p {
            color: var(--gray);
            font-size: 0.85rem;
        }

        /* Important Note */
        .important-note {
            background: linear-gradient(135deg, rgba(255,193,7,0.15) 0%, rgba(255,193,7,0.05) 100%);
            border: 1px solid rgba(255,193,7,0.3);
            border-radius: 14px;
            padding: 1rem;
            margin-bottom: 1.5rem;
            display: flex;
            align-items: flex-start;
            gap: 0.75rem;
        }

        .important-note i {
            color: #ffca28;
            font-size: 1.25rem;
            flex-shrink: 0;
            margin-top: 0.1rem;
        }

        .important-note p {
            color: var(--gray-light);
            font-size: 0.85rem;
            line-height: 1.5;
        }

        .important-note strong {
            color: #ffca28;
        }

        /* Event Card */
        .event-card {
            background: linear-gradient(135deg, rgba(29,53,87,0.8) 0%, rgba(29,53,87,0.4) 100%);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 20px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
        }

        .event-title {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 1rem;
        }

        .event-title i {
            color: var(--accent);
            font-size: 1.25rem;
        }

        .event-title h3 {
            font-size: 1rem;
            font-weight: 600;
        }

        .event-details {
            display: grid;
            grid-template-columns: 1fr;
            gap: 0.75rem;
            margin-bottom: 1rem;
        }

        .event-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            color: var(--gray-light);
            font-size: 0.85rem;
        }

        .event-item i {
            color: var(--primary);
            width: 20px;
            text-align: center;
        }

        .event-price {
            background: linear-gradient(135deg, var(--primary), var(--primary-dark));
            padding: 1rem;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 8px 25px rgba(255,82,82,0.25);
        }

        .event-price .label {
            font-size: 0.75rem;
            color: rgba(255,255,255,0.8);
            margin-bottom: 0.25rem;
        }

        .event-price .amount {
            font-size: 1.5rem;
            font-weight: 700;
        }

        /* Section Title */
        .section-title {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 1rem;
            font-size: 1rem;
            font-weight: 600;
        }

        .section-title i {
            color: var(--primary);
        }

        /* Application Cards */
        .app-card {
            background: var(--dark-card);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 16px;
            padding: 1.25rem;
            margin-bottom: 1rem;
        }

        .app-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1rem;
            flex-wrap: wrap;
            gap: 0.75rem;
        }

        .app-info h4 {
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 0.25rem;
        }

        .app-info p {
            color: var(--gray);
            font-size: 0.8rem;
        }

        .license-type-badge {
            display: inline-block;
            padding: 0.25rem 0.6rem;
            background: rgba(255,82,82,0.15);
            border: 1px solid rgba(255,82,82,0.3);
            border-radius: 8px;
            color: #ff8a80;
            font-size: 0.7rem;
            font-weight: 600;
            margin-top: 0.25rem;
        }

        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.4rem 0.75rem;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
        }

        .status-badge.pending {
            background: rgba(255,193,7,0.15);
            color: #ffca28;
            border: 1px solid rgba(255,193,7,0.3);
        }

        .status-badge.process {
            background: rgba(0,188,212,0.15);
            color: #4dd0e1;
            border: 1px solid rgba(0,188,212,0.3);
        }

        .status-badge.approved {
            background: rgba(0,200,83,0.15);
            color: #69f0ae;
            border: 1px solid rgba(0,200,83,0.3);
        }

        .status-badge.rejected {
            background: rgba(255,82,82,0.15);
            color: #ff8a80;
            border: 1px solid rgba(255,82,82,0.3);
        }

        /* Timeline */
        .timeline {
            display: flex;
            justify-content: space-between;
            position: relative;
            padding: 0 0.5rem;
        }

        .timeline::before {
            content: '';
            position: absolute;
            top: 18px;
            left: 15%;
            right: 15%;
            height: 2px;
            background: rgba(255,255,255,0.1);
        }

        .timeline-step {
            display: flex;
            flex-direction: column;
            align-items: center;
            position: relative;
            z-index: 1;
        }

        .step-icon {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: rgba(255,255,255,0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 0.5rem;
            color: var(--gray);
            font-size: 0.85rem;
            transition: all 0.3s;
        }

        .timeline-step.active .step-icon {
            background: linear-gradient(135deg, var(--primary), var(--primary-dark));
            color: white;
            box-shadow: 0 4px 15px rgba(255,82,82,0.4);
            animation: pulse 2s infinite;
        }

        .timeline-step.completed .step-icon {
            background: var(--success);
            color: white;
        }

        .timeline-step.rejected .step-icon {
            background: var(--primary);
            color: white;
        }

        .timeline-step p {
            font-size: 0.65rem;
            color: var(--gray);
            text-align: center;
        }

        @keyframes pulse {
            0%, 100% { box-shadow: 0 4px 15px rgba(255,82,82,0.4); }
            50% { box-shadow: 0 4px 25px rgba(255,82,82,0.6); }
        }

        .rejection-box {
            background: rgba(255,82,82,0.1);
            border: 1px solid rgba(255,82,82,0.2);
            border-radius: 12px;
            padding: 1rem;
            margin-top: 1rem;
        }

        .rejection-box h5 {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: #ff8a80;
            font-size: 0.85rem;
            margin-bottom: 0.5rem;
        }

        .rejection-box p {
            color: var(--gray-light);
            font-size: 0.85rem;
            line-height: 1.5;
        }

        .btn-resubmit {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            margin-top: 1rem;
            padding: 0.75rem 1.5rem;
            background: linear-gradient(135deg, var(--primary), #c9302c);
            color: white;
            border: none;
            border-radius: 10px;
            font-family: var(--font-primary);
            font-size: 0.9rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s;
            text-decoration: none;
        }

        .btn-resubmit:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(255,82,82,0.4);
        }

        /* Form Card */
        .form-card {
            background: var(--dark-card);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 20px;
            overflow: hidden;
            margin-bottom: 1.5rem;
        }

        .form-header {
            background: linear-gradient(135deg, var(--primary), var(--primary-dark));
            padding: 1.25rem 1.5rem;
        }

        .form-header h3 {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-size: 1rem;
            font-weight: 600;
        }

        .form-body {
            padding: 1.5rem;
        }

        /* License Type Selection */
        .license-type-selection {
            display: flex;
            gap: 1rem;
            margin-bottom: 1.5rem;
        }

        .license-option {
            flex: 1;
            position: relative;
        }

        .license-option input {
            position: absolute;
            opacity: 0;
        }

        .license-option-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 1.25rem 1rem;
            background: rgba(255,255,255,0.05);
            border: 2px solid rgba(255,255,255,0.1);
            border-radius: 16px;
            cursor: pointer;
            transition: all 0.3s;
            text-align: center;
        }

        .license-option-card:hover {
            border-color: rgba(255,255,255,0.2);
            background: rgba(255,255,255,0.08);
        }

        .license-option-card .opt-icon {
            width: 45px;
            height: 45px;
            border-radius: 12px;
            background: rgba(255,82,82,0.15);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 0.75rem;
            font-size: 1.25rem;
            color: var(--gray);
            transition: all 0.3s;
        }

        .license-option input:checked + .license-option-card {
            border-color: var(--primary);
            background: rgba(255,82,82,0.1);
            box-shadow: 0 8px 25px rgba(255,82,82,0.2);
        }

        .license-option input:checked + .license-option-card .opt-icon {
            background: var(--primary);
            color: white;
        }

        .license-option-card .opt-title {
            font-weight: 600;
            font-size: 0.95rem;
            margin-bottom: 0.25rem;
        }

        .license-option-card .opt-desc {
            font-size: 0.75rem;
            color: var(--gray);
        }

        /* Form Elements */
        .form-group {
            margin-bottom: 1.25rem;
        }

        .form-group label {
            display: block;
            color: var(--gray-light);
            font-size: 0.85rem;
            font-weight: 500;
            margin-bottom: 0.5rem;
        }

        .form-group label .required {
            color: var(--primary);
        }

        .form-control {
            width: 100%;
            padding: 0.875rem 1rem;
            background: rgba(255,255,255,0.05);
            border: 2px solid rgba(255,255,255,0.1);
            border-radius: 12px;
            color: var(--white);
            font-family: var(--font);
            font-size: 0.95rem;
            transition: all 0.3s;
        }

        .form-control::placeholder {
            color: rgba(255,255,255,0.3);
        }

        .form-control:focus {
            outline: none;
            border-color: var(--primary);
            background: rgba(255,82,82,0.05);
            box-shadow: 0 0 0 3px rgba(255,82,82,0.1);
        }

        textarea.form-control {
            min-height: 100px;
            resize: vertical;
        }

        .form-row {
            display: grid;
            grid-template-columns: 1fr;
            gap: 1rem;
        }

        /* File Upload */
        .upload-section h4 {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-size: 0.95rem;
            margin-bottom: 1rem;
            padding-bottom: 0.75rem;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        .upload-section h4 i {
            color: var(--accent);
        }

        .bank-info-box {
            background: linear-gradient(135deg, rgba(0,102,178,0.15), rgba(0,102,178,0.05));
            border: 1px solid rgba(0,102,178,0.3);
            border-radius: 12px;
            padding: 1rem;
            margin-bottom: 1rem;
        }

        .bank-info-header {
            font-weight: 600;
            color: #4da3ff;
            margin-bottom: 0.75rem;
            font-size: 0.9rem;
        }

        .bank-info-header i {
            margin-right: 0.5rem;
        }

        .bank-info-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.5rem 0;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .bank-info-row:last-child {
            border-bottom: none;
        }

        .bank-info-row.copyable {
            cursor: pointer;
            padding: 0.5rem 0.75rem;
            margin: 0 -0.75rem;
            border-radius: 8px;
            transition: all 0.2s;
        }

        .bank-info-row.copyable:hover {
            background: rgba(255,255,255,0.05);
        }

        .bank-info-row.copyable .fa-copy {
            color: var(--gray);
            font-size: 0.85rem;
            margin-left: 0.5rem;
            transition: color 0.2s;
        }

        .bank-info-row.copyable:hover .fa-copy {
            color: var(--primary);
        }

        .bank-label {
            color: var(--gray);
            font-size: 0.85rem;
        }

        .bank-value {
            color: var(--text);
            font-weight: 500;
            font-size: 0.9rem;
        }

        .file-upload {
            border: 2px dashed rgba(255,255,255,0.2);
            border-radius: 16px;
            padding: 1.5rem;
            text-align: center;
            cursor: pointer;
            position: relative;
            transition: all 0.3s;
            background: rgba(255,255,255,0.02);
        }

        .file-upload:hover {
            border-color: var(--primary);
            background: rgba(255,82,82,0.05);
        }

        .file-upload.has-file {
            border-color: var(--primary);
            background: rgba(255,82,82,0.08);
        }

        .file-upload.important {
            border-color: rgba(255,193,7,0.4);
            background: rgba(255,193,7,0.05);
        }

        .file-upload.important:hover {
            border-color: var(--primary);
            background: rgba(255,82,82,0.05);
        }

        .file-upload input[type="file"] {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0;
            cursor: pointer;
        }

        .file-upload .upload-icon {
            width: 50px;
            height: 50px;
            background: rgba(255,255,255,0.1);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 0.75rem;
            font-size: 1.25rem;
            color: var(--gray);
            transition: all 0.3s;
        }

        .file-upload:hover .upload-icon,
        .file-upload.has-file .upload-icon {
            background: rgba(255,82,82,0.2);
            color: var(--primary);
        }

        .file-upload .upload-text {
            color: var(--gray-light);
            font-size: 0.85rem;
            margin-bottom: 0.25rem;
        }

        .file-upload .file-info {
            font-size: 0.75rem;
            color: var(--gray);
        }

        .file-upload .file-name {
            font-size: 0.8rem;
            color: var(--primary);
            font-weight: 500;
            margin-top: 0.5rem;
        }

        /* Submit Button */
        .btn-submit {
            width: 100%;
            padding: 1rem;
            background: linear-gradient(135deg, var(--primary), var(--primary-dark));
            border: none;
            border-radius: 14px;
            color: white;
            font-family: var(--font);
            font-size: 1rem;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            transition: all 0.3s;
            box-shadow: 0 8px 25px rgba(255,82,82,0.3);
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
            box-shadow: 0 12px 35px rgba(255,82,82,0.4);
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
            border-top-color: white;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            display: none;
        }

        .btn-submit.loading .spinner { display: block; }
        .btn-submit.loading .btn-text { display: none; }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        /* Info Box */
        .info-box {
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 16px;
            padding: 2rem;
            text-align: center;
        }

        .info-box i {
            font-size: 3rem;
            color: var(--gray);
            margin-bottom: 1rem;
            opacity: 0.5;
        }

        .info-box h4 {
            font-size: 1.1rem;
            margin-bottom: 0.5rem;
        }

        .info-box p {
            color: var(--gray);
            font-size: 0.9rem;
        }

        /* Contact Box */
        .contact-box {
            background: linear-gradient(135deg, rgba(37,211,102,0.1), rgba(37,211,102,0.05));
            border: 1px solid rgba(37,211,102,0.3);
            border-radius: 16px;
            padding: 1.25rem;
            text-align: center;
            margin-top: 1.5rem;
        }

        .contact-box p {
            color: var(--gray-light);
            font-size: 0.9rem;
            margin-bottom: 0.75rem;
        }

        .btn-whatsapp {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            background: linear-gradient(135deg, #25d366, #128c7e);
            color: white;
            border: none;
            border-radius: 50px;
            font-family: var(--font-primary);
            font-size: 0.9rem;
            font-weight: 500;
            cursor: pointer;
            text-decoration: none;
            transition: all 0.3s;
        }

        .btn-whatsapp:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(37,211,102,0.4);
        }

        .btn-whatsapp i {
            font-size: 1.1rem;
        }

        /* Toast */
        .toast {
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%) translateY(-150px);
            padding: 1rem 1.5rem;
            border-radius: 14px;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            max-width: 90%;
            width: 400px;
            z-index: 9999;
            opacity: 0;
            transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            box-shadow: 0 15px 40px rgba(0,0,0,0.4);
        }

        .toast.show {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }

        .toast.success {
            background: linear-gradient(135deg, var(--success), #009624);
        }

        .toast.error {
            background: linear-gradient(135deg, var(--primary), var(--primary-dark));
        }

        .toast .toast-icon {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(255,255,255,0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.1rem;
            flex-shrink: 0;
        }

        .toast .toast-content h4 {
            font-size: 0.9rem;
            font-weight: 600;
            margin-bottom: 0.2rem;
        }

        .toast .toast-content p {
            font-size: 0.8rem;
            opacity: 0.9;
        }

        /* Success Modal */
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            backdrop-filter: blur(5px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s;
            padding: 1rem;
        }

        .modal-overlay.show {
            opacity: 1;
            visibility: visible;
        }

        .modal {
            background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 100%);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 24px;
            padding: 2rem;
            text-align: center;
            max-width: 380px;
            width: 100%;
            transform: scale(0.8);
            transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .modal-overlay.show .modal {
            transform: scale(1);
        }

        .modal .icon-circle {
            width: 70px;
            height: 70px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--success), #009624);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.25rem;
            font-size: 2rem;
            color: white;
            box-shadow: 0 10px 30px rgba(0,200,83,0.4);
            animation: bounceIn 0.6s ease-out;
        }

        @keyframes bounceIn {
            0% { transform: scale(0); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
        }

        .modal h2 {
            font-size: 1.25rem;
            margin-bottom: 0.5rem;
        }

        .modal p {
            color: var(--gray);
            font-size: 0.9rem;
            line-height: 1.5;
            margin-bottom: 1.25rem;
        }

        .modal .btn-ok {
            padding: 0.75rem 2rem;
            background: linear-gradient(135deg, var(--primary), var(--primary-dark));
            border: none;
            border-radius: 12px;
            color: white;
            font-family: var(--font);
            font-size: 0.95rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }

        .modal .btn-ok:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(255,82,82,0.4);
        }

        /* Responsive */
        @media (min-width: 480px) {
            .user-info {
                display: flex;
            }

            .event-details {
                grid-template-columns: 1fr 1fr;
            }

            .form-row {
                grid-template-columns: 1fr 1fr;
            }

            .license-type-selection {
                flex-direction: row;
            }
        }

        @media (max-width: 479px) {
            .license-type-selection {
                flex-direction: column;
            }
        }

        @media (min-width: 640px) {
            .main-content {
                padding: 6rem 1.5rem 2rem;
            }

            .navbar {
                padding: 1rem 1.5rem;
            }

            .navbar-brand h1 {
                font-size: 1.1rem;
            }
        }
    </style>
</head>
<body>
    <nav class="navbar">
        <div class="navbar-brand">
            <img src="../assets/LOGO-FORBASI.png" alt="FORBASI">
            <h1>Dashboard Juri</h1>
        </div>
        <div class="navbar-user">
            <span class="user-info"><i class="fas fa-user-circle"></i> <?php echo htmlspecialchars($username); ?></span>
            <a href="logout_lisensi.php" class="btn-logout"><i class="fas fa-sign-out-alt"></i> Keluar</a>
        </div>
    </nav>

    <div class="main-content">
        <!-- Welcome Card -->
        <div class="welcome-card">
            <div class="welcome-header">
                <div class="welcome-icon"><i class="fas fa-gavel"></i></div>
                <div class="welcome-text">
                    <h2>Halo, <?php echo htmlspecialchars($username); ?>!</h2>
                    <p>Ajukan lisensi juri dan pantau status pengajuan Anda</p>
                </div>
            </div>
        </div>

        <!-- Important Note -->
        <div class="important-note">
            <i class="fas fa-exclamation-triangle"></i>
            <p><strong>Penting!</strong> Untuk pendaftaran lisensi Juri, Anda <strong>WAJIB</strong> menyertakan Surat Rekomendasi dari PENGDA FORBASI setempat.</p>
        </div>

        <!-- Event Info -->
        <?php if ($event): ?>
        <div class="event-card">
            <div class="event-title">
                <i class="fas fa-star"></i>
                <h3><?php echo htmlspecialchars($event['event_name']); ?></h3>
            </div>
            <div class="event-details">
                <div class="event-item">
                    <i class="fas fa-calendar"></i>
                    <span><?php echo date('l, d M Y', strtotime($event['event_date'])); ?></span>
                </div>
                <div class="event-item">
                    <i class="fas fa-clock"></i>
                    <span><?php echo htmlspecialchars($event['event_time']); ?></span>
                </div>
                <div class="event-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span><?php echo htmlspecialchars($event['event_location']); ?></span>
                </div>
            </div>
            <div class="event-price">
                <div class="label">Biaya Lisensi Juri</div>
                <div class="amount">Rp <?php echo number_format($event['biaya_juri'], 0, ',', '.'); ?></div>
            </div>
        </div>
        <?php endif; ?>

        <!-- Application History -->
        <?php if (!empty($applications)): ?>
        <h3 class="section-title"><i class="fas fa-history"></i> Riwayat Pengajuan</h3>
        
        <?php foreach ($applications as $app): ?>
        <div class="app-card">
            <div class="app-header">
                <div class="app-info">
                    <h4><?php echo htmlspecialchars($app['nama_lengkap']); ?></h4>
                    <p><i class="fas fa-calendar-alt"></i> <?php echo date('d M Y, H:i', strtotime($app['submitted_at'])); ?></p>
                    <span class="license-type-badge"><?php echo getLicenseTypeLabel($app['jenis_lisensi']); ?></span>
                </div>
                <?php echo getStatusBadge($app['status']); ?>
            </div>
            
            <div class="timeline">
                <div class="timeline-step <?php echo in_array($app['status'], ['pending', 'proses', 'approved', 'rejected']) ? 'completed' : ''; ?>">
                    <div class="step-icon"><i class="fas fa-paper-plane"></i></div>
                    <p>Diajukan</p>
                </div>
                <div class="timeline-step <?php echo in_array($app['status'], ['proses', 'approved', 'rejected']) ? 'completed' : ($app['status'] == 'pending' ? 'active' : ''); ?>">
                    <div class="step-icon"><i class="fas fa-search"></i></div>
                    <p>Verifikasi</p>
                </div>
                <div class="timeline-step <?php echo $app['status'] == 'proses' ? 'active' : ($app['status'] == 'approved' ? 'completed' : ($app['status'] == 'rejected' ? 'rejected' : '')); ?>">
                    <div class="step-icon"><i class="fas fa-cogs"></i></div>
                    <p>Proses</p>
                </div>
                <div class="timeline-step <?php echo $app['status'] == 'approved' ? 'completed' : ($app['status'] == 'rejected' ? 'rejected' : ''); ?>">
                    <div class="step-icon">
                        <i class="fas <?php echo $app['status'] == 'rejected' ? 'fa-times' : 'fa-check'; ?>"></i>
                    </div>
                    <p><?php echo $app['status'] == 'rejected' ? 'Ditolak' : 'Selesai'; ?></p>
                </div>
            </div>
            
            <?php if ($app['status'] == 'rejected' && !empty($app['alasan_penolakan'])): ?>
            <div class="rejection-box">
                <h5><i class="fas fa-exclamation-triangle"></i> Alasan Penolakan</h5>
                <p><?php echo nl2br(htmlspecialchars($app['alasan_penolakan'])); ?></p>
                <?php if ($event && $event['registration_open']): ?>
                <button class="btn-resubmit" onclick="scrollToForm()">
                    <i class="fas fa-redo"></i> Ajukan Ulang
                </button>
                <?php endif; ?>
            </div>
            <?php endif; ?>
        </div>
        <?php endforeach; ?>
        <?php endif; ?>

        <!-- Application Form -->
        <?php if (!$has_active_application && $event && $event['registration_open']): ?>
        <div class="form-card" id="formSection">
            <div class="form-header">
                <h3><i class="fas fa-file-alt"></i> Form Pengajuan Lisensi Juri</h3>
            </div>
            <div class="form-body">
                <form id="applicationForm" enctype="multipart/form-data">
                    <div class="form-group">
                        <label>Pilih Jenis Lisensi <span class="required">*</span></label>
                        <div class="license-type-selection">
                            <div class="license-option">
                                <input type="radio" name="jenis_lisensi" id="juri-muda" value="juri_muda" required checked>
                                <label for="juri-muda" class="license-option-card">
                                    <div class="opt-icon"><i class="fas fa-star"></i></div>
                                    <span class="opt-title">Juri Muda</span>
                                    <span class="opt-desc">Untuk juri pemula</span>
                                </label>
                            </div>
                            <div class="license-option">
                                <input type="radio" name="jenis_lisensi" id="juri-madya" value="juri_madya">
                                <label for="juri-madya" class="license-option-card">
                                    <div class="opt-icon"><i class="fas fa-award"></i></div>
                                    <span class="opt-title">Juri Madya</span>
                                    <span class="opt-desc">Pengalaman menengah</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Nama Lengkap <span class="required">*</span></label>
                            <input type="text" class="form-control" name="nama_lengkap" required placeholder="Masukkan nama lengkap">
                        </div>
                        <div class="form-group">
                            <label>Email <span class="required">*</span></label>
                            <input type="email" class="form-control" name="email" required placeholder="contoh@email.com">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>No. Telepon/WhatsApp <span class="required">*</span></label>
                            <input type="tel" class="form-control" name="no_telepon" required placeholder="08xxxxxxxxxx">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Alamat Lengkap <span class="required">*</span></label>
                        <textarea class="form-control" name="alamat" required placeholder="Masukkan alamat lengkap"></textarea>
                    </div>

                    <div class="upload-section">
                        <h4><i class="fas fa-cloud-upload-alt"></i> Upload Dokumen</h4>

                        <div class="form-row">
                            <div class="form-group">
                                <label>Pas Foto (Background Merah) <span class="required">*</span></label>
                                <div class="file-upload" id="upload-pasfoto">
                                    <input type="file" name="pas_foto" accept="image/jpeg,image/png,image/jpg" required>
                                    <div class="upload-icon"><i class="fas fa-camera"></i></div>
                                    <div class="upload-text">Klik untuk upload</div>
                                    <div class="file-info">JPG/PNG, Maks. 2MB</div>
                                    <div class="file-name"></div>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Bukti Transfer <span class="required">*</span></label>
                                <div class="bank-info-box">
                                    <div class="bank-info-header"><i class="fas fa-university"></i> Transfer ke Rekening:</div>
                                    <div class="bank-info-row">
                                        <span class="bank-label">Bank</span>
                                        <span class="bank-value">Bank Mandiri</span>
                                    </div>
                                    <div class="bank-info-row copyable" onclick="copyToClipboard('1320520205205')">
                                        <span class="bank-label">No. Rekening</span>
                                        <span class="bank-value">1320520205205 <i class="fas fa-copy"></i></span>
                                    </div>
                                    <div class="bank-info-row">
                                        <span class="bank-label">Atas Nama</span>
                                        <span class="bank-value">FORUM BARIS INDONESIA</span>
                                    </div>
                                </div>
                                <div class="file-upload" id="upload-bukti">
                                    <input type="file" name="bukti_transfer" accept="image/jpeg,image/png,image/jpg,application/pdf" required>
                                    <div class="upload-icon"><i class="fas fa-receipt"></i></div>
                                    <div class="upload-text">Klik untuk upload</div>
                                    <div class="file-info">JPG/PNG/PDF, Maks. 2MB</div>
                                    <div class="file-name"></div>
                                </div>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Surat Rekomendasi PENGDA <span class="required">*</span></label>
                            <div class="file-upload important" id="upload-rekomendasi">
                                <input type="file" name="surat_rekomendasi" accept="image/jpeg,image/png,image/jpg,application/pdf" required>
                                <div class="upload-icon"><i class="fas fa-file-signature"></i></div>
                                <div class="upload-text">Klik untuk upload</div>
                                <div class="file-info">JPG/PNG/PDF, Maks. 2MB - WAJIB dari PENGDA</div>
                                <div class="file-name"></div>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Surat Keterangan Pengalaman Juri <span class="required">*</span></label>
                            <div class="file-upload" id="upload-pengalaman">
                                <input type="file" name="surat_pengalaman" accept="image/jpeg,image/png,image/jpg,application/pdf" required>
                                <div class="upload-icon"><i class="fas fa-file-certificate"></i></div>
                                <div class="upload-text">Klik untuk upload</div>
                                <div class="file-info">JPG/PNG/PDF, Maks. 2MB</div>
                                <div class="file-name"></div>
                            </div>
                        </div>
                    </div>

                    <button type="submit" class="btn-submit">
                        <span class="btn-text"><i class="fas fa-paper-plane"></i> Kirim Pengajuan</span>
                        <span class="spinner"></span>
                    </button>
                </form>
            </div>
        </div>
        <?php elseif ($has_active_application): ?>
        <div class="info-box">
            <i class="fas fa-info-circle"></i>
            <h4>Pengajuan Aktif</h4>
            <p>Anda sudah memiliki pengajuan yang masih dalam proses. Mohon tunggu hingga pengajuan sebelumnya selesai.</p>
        </div>
        <?php else: ?>
        <div class="info-box">
            <i class="fas fa-calendar-times"></i>
            <h4>Pendaftaran Belum Dibuka</h4>
            <p>Saat ini tidak ada event lisensi yang membuka pendaftaran.</p>
        </div>
        <?php endif; ?>

        <!-- Contact Info -->
        <div class="contact-box">
            <p>Untuk informasi lebih lanjut dapat menghubungi<br><strong>Sdr. Tito Riansyah</strong></p>
            <a href="https://wa.me/6282111543777?text=Halo%20Pak%20Tito%2C%20saya%20ingin%20bertanya%20tentang%20lisensi%20juri%20FORBASI" target="_blank" class="btn-whatsapp">
                <i class="fab fa-whatsapp"></i> Hubungi via WhatsApp
            </a>
        </div>
    </div>

    <!-- Toast -->
    <div id="toast" class="toast">
        <div class="toast-icon"><i class="fas fa-check"></i></div>
        <div class="toast-content">
            <h4 id="toast-title">Title</h4>
            <p id="toast-message">Message</p>
        </div>
    </div>

    <!-- Success Modal -->
    <div id="successModal" class="modal-overlay">
        <div class="modal">
            <div class="icon-circle"><i class="fas fa-check"></i></div>
            <h2>Pengajuan Berhasil!</h2>
            <p>Pengajuan lisensi Anda telah dikirim. Tim PB FORBASI akan memproses dalam waktu 1-3 hari kerja.</p>
            <button class="btn-ok" onclick="location.reload()">OK, Mengerti</button>
        </div>
    </div>

    <script>
        // File Upload Handler
        document.querySelectorAll('.file-upload input[type="file"]').forEach(input => {
            input.addEventListener('change', function() {
                const wrapper = this.closest('.file-upload');
                const fileNameEl = wrapper.querySelector('.file-name');
                
                if (this.files && this.files[0]) {
                    const fileName = this.files[0].name;
                    const fileSize = (this.files[0].size / 1024 / 1024).toFixed(2);
                    fileNameEl.textContent = `${fileName} (${fileSize}MB)`;
                    wrapper.classList.add('has-file');
                } else {
                    fileNameEl.textContent = '';
                    wrapper.classList.remove('has-file');
                }
            });
        });

        // Form Submit
        const form = document.getElementById('applicationForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const btn = document.querySelector('.btn-submit');
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
                        document.getElementById('successModal').classList.add('show');
                    } else {
                        showToast('error', 'Gagal', result.message);
                    }
                } catch (error) {
                    showToast('error', 'Error', 'Terjadi kesalahan koneksi.');
                } finally {
                    btn.classList.remove('loading');
                    btn.disabled = false;
                }
            });
        }

        // Toast
        function showToast(type, title, message) {
            const toast = document.getElementById('toast');
            const icon = toast.querySelector('.toast-icon i');
            
            toast.className = 'toast ' + type;
            icon.className = type === 'success' ? 'fas fa-check' : 'fas fa-exclamation-triangle';
            document.getElementById('toast-title').textContent = title;
            document.getElementById('toast-message').textContent = message;
            
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 5000);
        }

        // Copy to Clipboard
        function copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(() => {
                showToast('success', 'Berhasil', 'Nomor rekening berhasil disalin!');
            }).catch(err => {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                showToast('success', 'Berhasil', 'Nomor rekening berhasil disalin!');
            });
        }

        // Scroll to Form Section
        function scrollToForm() {
            const formSection = document.getElementById('formSection');
            if (formSection) {
                formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    </script>
</body>
</html>
