<?php
/**
 * Database Setup Script for Forbasi System
 * This script adds a new column 'unique_barcode_id' to the kta_applications table
 */

// Database configuration
$db_host = 'localhost';
$db_username = 'root';
$db_password = '';
$db_name = 'forbasi_db';

// Connect to MySQL server
try {
    $conn = new PDO("mysql:host=$db_host;dbname=$db_name", $db_username, $db_password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "Connected successfully to database: $db_name\n";
    
    // SQL to add the new column
    $sql = "ALTER TABLE kta_applications ADD COLUMN unique_barcode_id VARCHAR(255) NULL AFTER kta_number";
    
    // Execute the query
    $conn->exec($sql);
    echo "Column 'unique_barcode_id' added successfully to kta_applications table\n";
    
} catch(PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
    
    // Check if the error is because column already exists
    if (strpos($e->getMessage(), 'duplicate column name') !== false) {
        echo "Note: The column 'unique_barcode_id' already exists in the table.\n";
    }
}

// Close connection
$conn = null;
?>