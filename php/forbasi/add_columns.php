<?php
// File: add_columns.php
// Jalankan di terminal dengan: php add_columns.php

// Konfigurasi database
$dbConfig = [
    'host' => 'localhost',
    'username' => 'root', // Ganti dengan username database Anda
    'password' => '', // Ganti dengan password database Anda
    'database' => 'forbasi_db' // Ganti dengan nama database Anda
];

// Kolom yang akan ditambahkan
$columnsToAdd = [
    [
        'name' => 'email',
        'type' => 'VARCHAR(100)',
        'after' => 'club_name',
        'null' => true
    ],
    [
        'name' => 'phone',
        'type' => 'VARCHAR(20)',
        'after' => 'email',
        'null' => true
    ],
    [
        'name' => 'address',
        'type' => 'TEXT',
        'after' => 'phone',
        'null' => true
    ]
];

try {
    // Buat koneksi ke database
    $conn = new mysqli($dbConfig['host'], $dbConfig['username'], $dbConfig['password'], $dbConfig['database']);
    
    // Cek koneksi
    if ($conn->connect_error) {
        throw new Exception("Koneksi gagal: " . $conn->connect_error);
    }
    
    echo "Terhubung ke database dengan sukses.\n";
    
    // Periksa apakah tabel users ada
    $checkTable = $conn->query("SHOW TABLES LIKE 'users'");
    if ($checkTable->num_rows == 0) {
        throw new Exception("Tabel 'users' tidak ditemukan dalam database.");
    }
    
    // Loop untuk setiap kolom yang akan ditambahkan
    foreach ($columnsToAdd as $column) {
        $columnName = $column['name'];
        
        // Periksa apakah kolom sudah ada
        $checkColumn = $conn->query("SHOW COLUMNS FROM users LIKE '$columnName'");
        if ($checkColumn->num_rows > 0) {
            echo "Kolom '$columnName' sudah ada dalam tabel users. Dilewati...\n";
            continue;
        }
        
        // Bangun query ALTER TABLE
        $nullClause = $column['null'] ? 'NULL' : 'NOT NULL';
        $afterClause = isset($column['after']) ? "AFTER `{$column['after']}`" : '';
        
        $alterQuery = "ALTER TABLE `users` 
                      ADD COLUMN `$columnName` {$column['type']} $nullClause $afterClause";
        
        // Eksekusi query
        if ($conn->query($alterQuery) === TRUE) {
            echo "Sukses menambahkan kolom '$columnName' ke tabel users.\n";
        } else {
            throw new Exception("Error menambahkan kolom '$columnName': " . $conn->error);
        }
    }
    
    echo "Proses selesai.\n";
    
    // Tutup koneksi
    $conn->close();
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}

exit(0);