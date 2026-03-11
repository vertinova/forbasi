<?php
// Download All Competition Re-registrations Export
// This file handles ZIP download of all reregistration data with logos

session_start();

// Authentication check
if (!isset($_SESSION['user_id']) || $_SESSION['role_id'] != 4) {
    header('HTTP/1.1 403 Forbidden');
    exit('Access denied');
}

require_once __DIR__ . '/db_config.php';

try {
    // Query all reregistration data with logo_path from kta_applications
    // Note: Using 'cities' table (not 'regencies') based on actual database structure
    // Filter: ONLY RUKIBRA category (as per users.php filter for re-registration)
    $query = "SELECT cr.id, cr.user_id, cr.kejurnas_registration_id, cr.status, 
                     cr.school_name, cr.total_cost, cr.submitted_at,
                     jr.club_name, jr.level,
                     kc.category_name,
                     u.username, u.province_id, u.city_id,
                     ka.logo_path,
                     prov.name as province_name,
                     city.name as city_name
              FROM competition_reregistrations cr
              INNER JOIN kejurnas_registrations jr ON cr.kejurnas_registration_id = jr.id
              LEFT JOIN kejurnas_categories kc ON jr.category_id = kc.id
              INNER JOIN users u ON cr.user_id = u.id
              LEFT JOIN kta_applications ka ON u.id = ka.user_id
              LEFT JOIN provinces prov ON u.province_id = prov.id
              LEFT JOIN cities city ON u.city_id = city.id
              WHERE kc.category_name = 'rukibra'
              ORDER BY cr.submitted_at DESC";
    
    $result = $conn->query($query);
    
    if (!$result) {
        throw new Exception("Database query failed: " . $conn->error);
    }
    
    // Create temporary directory for export
    $temp_dir = sys_get_temp_dir() . '/reregistration_export_' . time() . '_' . rand(1000, 9999);
    if (!mkdir($temp_dir, 0755, true)) {
        throw new Exception("Failed to create temporary directory");
    }
    
    $logo_dir = $temp_dir . '/logos';
    if (!mkdir($logo_dir, 0755, true)) {
        throw new Exception("Failed to create logo directory");
    }
    
    // Create CSV file
    $csv_file = $temp_dir . '/data_peserta_daftar_ulang.csv';
    $csv_handle = fopen($csv_file, 'w');
    
    if (!$csv_handle) {
        throw new Exception("Failed to create CSV file");
    }
    
    // Add BOM for Excel UTF-8 support
    fprintf($csv_handle, chr(0xEF).chr(0xBB).chr(0xBF));
    
    // CSV Headers
    fputcsv($csv_handle, [
        'No',
        'Nama Club',
        'Nama Sekolah',
        'Kategori',
        'Level',
        'Status',
        'Pengda (Provinsi)',
        'Kota/Kabupaten',
        'Username',
        'Biaya Total',
        'Tanggal Submit',
        'Logo File'
    ]);
    
    $row_num = 1;
    $logo_count = 0;
    $missing_logos = [];
    
    while ($row = $result->fetch_assoc()) {
        // Determine status text
        $status_text = '';
        switch($row['status']) {
            case 'submitted':
                $status_text = 'Menunggu Review';
                break;
            case 'approved':
                $status_text = 'Disetujui';
                break;
            case 'rejected':
                $status_text = 'Ditolak';
                break;
            case 'incomplete':
                $status_text = 'Tidak Lengkap';
                break;
            default:
                $status_text = $row['status'];
        }
        
        $logo_filename = '';
        
        // Copy logo file if exists
        if (!empty($row['logo_path'])) {
            // Try multiple possible paths for logo file
            $possible_paths = [
                __DIR__ . '/uploads/' . $row['logo_path'],  // Full path from DB (e.g., kta_files/logo.jpg)
                __DIR__ . '/uploads/kta_files/' . basename($row['logo_path']),  // Just filename in kta_files
                __DIR__ . '/../uploads/' . $row['logo_path'],  // One level up
                __DIR__ . '/../kta_files/' . basename($row['logo_path'])  // Legacy path
            ];
            
            $source_logo = null;
            foreach ($possible_paths as $path) {
                if (file_exists($path)) {
                    $source_logo = $path;
                    break;
                }
            }
            
            if ($source_logo && file_exists($source_logo)) {
                $logo_extension = pathinfo($source_logo, PATHINFO_EXTENSION);
                $safe_club_name = preg_replace('/[^a-zA-Z0-9_-]/', '_', $row['club_name']);
                $logo_filename = $safe_club_name . '_' . $row['id'] . '.' . $logo_extension;
                $dest_logo = $logo_dir . '/' . $logo_filename;
                
                if (copy($source_logo, $dest_logo)) {
                    $logo_count++;
                } else {
                    $logo_filename = 'ERROR_COPY_FAILED';
                    $missing_logos[] = $row['club_name'] . " (ID: " . $row['id'] . ") - Copy failed from: " . $source_logo;
                }
            } else {
                $logo_filename = 'NOT_FOUND';
                $missing_logos[] = $row['club_name'] . " (ID: " . $row['id'] . ") - File not found. DB path: " . $row['logo_path'];
            }
        } else {
            $logo_filename = 'NO_LOGO';
            $missing_logos[] = $row['club_name'] . " (ID: " . $row['id'] . ") - No logo uploaded in database";
        }
        
        // Write to CSV
        fputcsv($csv_handle, [
            $row_num,
            $row['club_name'] ?? '-',
            $row['school_name'] ?? '-',
            $row['category_name'] ?? '-',
            $row['level'] ?? '-',
            $status_text,
            $row['province_name'] ?? '-',
            $row['city_name'] ?? '-',
            $row['username'] ?? '-',
            $row['total_cost'] ? 'Rp ' . number_format($row['total_cost'], 0, ',', '.') : '-',
            $row['submitted_at'] ? date('d-m-Y H:i', strtotime($row['submitted_at'])) : '-',
            $logo_filename
        ]);
        
        $row_num++;
    }
    
    fclose($csv_handle);
    
    // Create report file for missing logos
    if (!empty($missing_logos)) {
        $report_file = $temp_dir . '/MISSING_LOGOS_REPORT.txt';
        file_put_contents($report_file, "LAPORAN LOGO YANG TIDAK DITEMUKAN\n");
        file_put_contents($report_file, "================================\n\n", FILE_APPEND);
        file_put_contents($report_file, "Total Logo Ditemukan: $logo_count\n", FILE_APPEND);
        file_put_contents($report_file, "Total Logo Hilang: " . count($missing_logos) . "\n\n", FILE_APPEND);
        file_put_contents($report_file, "Detail:\n", FILE_APPEND);
        foreach ($missing_logos as $missing) {
            file_put_contents($report_file, "- $missing\n", FILE_APPEND);
        }
    }
    
    // Create ZIP file
    $zip_filename = 'Data_Peserta_Daftar_Ulang_' . date('Ymd_His') . '.zip';
    $zip_path = $temp_dir . '/' . $zip_filename;
    
    $zip = new ZipArchive();
    if ($zip->open($zip_path, ZipArchive::CREATE) !== TRUE) {
        throw new Exception("Cannot create ZIP file");
    }
    
    // Add CSV to zip
    $zip->addFile($csv_file, 'data_peserta_daftar_ulang.csv');
    
    // Add all logo files
    $logo_files = glob($logo_dir . '/*');
    foreach ($logo_files as $logo_file) {
        $zip->addFile($logo_file, 'logos/' . basename($logo_file));
    }
    
    // Add report if exists
    if (!empty($missing_logos) && file_exists($temp_dir . '/MISSING_LOGOS_REPORT.txt')) {
        $zip->addFile($temp_dir . '/MISSING_LOGOS_REPORT.txt', 'MISSING_LOGOS_REPORT.txt');
    }
    
    $zip->close();
    
    // Verify ZIP file was created successfully
    if (!file_exists($zip_path) || filesize($zip_path) == 0) {
        throw new Exception("Failed to create ZIP file or file is empty");
    }
    
    $zip_size = filesize($zip_path);
    
    // Send ZIP file to browser with proper headers
    header('Content-Type: application/zip');
    header('Content-Disposition: attachment; filename="' . $zip_filename . '"');
    header('Content-Length: ' . $zip_size);
    header('Cache-Control: no-cache, no-store, must-revalidate');
    header('Pragma: no-cache');
    header('Expires: 0');
    
    // Read and output file
    readfile($zip_path);
    
    // Cleanup temporary files
    $logo_files = glob($logo_dir . '/*');
    foreach ($logo_files as $file) {
        if (is_file($file)) {
            unlink($file);
        }
    }
    rmdir($logo_dir);
    
    if (file_exists($csv_file)) {
        unlink($csv_file);
    }
    
    if (file_exists($temp_dir . '/MISSING_LOGOS_REPORT.txt')) {
        unlink($temp_dir . '/MISSING_LOGOS_REPORT.txt');
    }
    
    if (file_exists($zip_path)) {
        unlink($zip_path);
    }
    
    rmdir($temp_dir);
    
    exit();
    
} catch (Exception $e) {
    error_log("Error in download_reregistration_export.php: " . $e->getMessage());
    header('HTTP/1.1 500 Internal Server Error');
    echo "Error: " . $e->getMessage();
    exit();
}
