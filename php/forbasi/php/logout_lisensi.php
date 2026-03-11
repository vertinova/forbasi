<?php
session_start();

// Destroy license session variables
unset($_SESSION['license_user_id']);
unset($_SESSION['license_username']);
unset($_SESSION['license_role']);

// Redirect to login page
header("Location: login.php");
exit();
?>
