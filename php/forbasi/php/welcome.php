<?php
session_start();

if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit();
}

// Redirect based on role_id after successful login
switch ($_SESSION['role_id']) {
    case 1: // User
        header("Location: views/user/dashboard.php");
        break;
    case 2: // Admin Pengcab
        header("Location: views/admin_pengcab/dashboard.php");
        break;
    case 3: // Admin Pengda
        header("Location: views/admin_pengda/dashboard.php");
        break;
    case 4: // Admin PB
        header("Location: views/admin_pb/dashboard.php");
        break;
    default:
        // Handle unknown role or redirect to a default page
        echo "Akses tidak diizinkan.";
        session_destroy(); // Optional: destroy session for unknown roles
        break;
}
exit();
?>