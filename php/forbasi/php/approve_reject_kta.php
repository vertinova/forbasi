<?php
include 'db_config.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $kta_id = $_POST['kta_id'];
    $status = $_POST['status']; // approved or rejected
    $feedback = $_POST['feedback'];
    $action_by = $_POST['action_by']; // admin_pengcab, admin_pengda, admin_pb

    // Update status pengajuan KTA
    $query = "UPDATE kta_tracking SET status='$status', feedback='$feedback', action_by='$action_by' WHERE id='$kta_id'";

    if ($conn->query($query) === TRUE) {
        echo "Status pengajuan KTA berhasil diperbarui!";
    } else {
        echo "Error: " . $query . "<br>" . $conn->error;
    }
}
?>
