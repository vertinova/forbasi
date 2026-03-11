<?php
include 'db_config.php';

// Proses pengajuan KTA
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $club_name = $_POST['club_name'];
    $manager_name = $_POST['manager_name'];
    $coach_name = $_POST['coach_name'];
    $province = $_POST['province'];
    $district = $_POST['district'];

    // Upload file (logo, anggaran dasar, surat keterangan, bukti pembayaran)
    $logo_path = 'uploads/' . basename($_FILES['logo']['name']);
    move_uploaded_file($_FILES['logo']['tmp_name'], $logo_path);

    $budget_data_path = 'uploads/' . basename($_FILES['budget_data']['name']);
    move_uploaded_file($_FILES['budget_data']['tmp_name'], $budget_data_path);

    $financial_statement_path = 'uploads/' . basename($_FILES['financial_statement']['name']);
    move_uploaded_file($_FILES['financial_statement']['tmp_name'], $financial_statement_path);

    $proof_payment_path = 'uploads/' . basename($_FILES['proof_payment']['name']);
    move_uploaded_file($_FILES['proof_payment']['tmp_name'], $proof_payment_path);

    // Insert ke database
    $query = "INSERT INTO users (club_name, manager_name, coach_name, province, district, logo_path, budget_data_path, financial_statement_path, proof_payment_path)
              VALUES ('$club_name', '$manager_name', '$coach_name', '$province', '$district', '$logo_path', '$budget_data_path', '$financial_statement_path', '$proof_payment_path')";

    if ($conn->query($query) === TRUE) {
        echo "Pengajuan KTA berhasil!";
    } else {
        echo "Error: " . $query . "<br>" . $conn->error;
    }
}
?>
