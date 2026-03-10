<?php
/**
 * Database Setup Script
 * 
 * This script will create the 'regencies' table with proper structure
 * including foreign key relationship with provinces table.
 */

// Database connection parameters
$host = 'localhost';
$username = 'root';
$password = '';
$database = 'forbasi_db';

try {
    // Create connection
    $conn = new mysqli($host, $username, $password, $database);

    // Check connection
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }

    // SQL to create table
    $sql = "CREATE TABLE IF NOT EXISTS regencies (
                id INT PRIMARY KEY,
                province_id INT,
                name VARCHAR(255) NOT NULL,
                FOREIGN KEY (province_id) REFERENCES provinces(id) ON DELETE CASCADE
            )";

    // Execute query
    if ($conn->query($sql) === TRUE) {
        echo "Table 'regencies' created successfully with:";
        echo "<ul>";
        echo "<li>id (INT PRIMARY KEY)</li>";
        echo "<li>province_id (INT FOREIGN KEY references provinces(id))</li>";
        echo "<li>name (VARCHAR(255) NOT NULL)</li>";
        echo "<li>CASCADE delete relationship with provinces</li>";
        echo "</ul>";
    } else {
        throw new Exception("Error creating table: " . $conn->error);
    }

    // Close connection
    $conn->close();

} catch (Exception $e) {
    echo "Database operation failed: " . $e->getMessage();
    echo "<br>Note: Make sure the 'provinces' table exists before creating this table.";
}
?>