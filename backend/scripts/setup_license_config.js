/**
 * Setup license_configs table and add qr_code_path to license_applications
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

async function setup() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  console.log('Creating license_configs table...');
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS license_configs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      jenis_lisensi ENUM('pelatih', 'juri_muda', 'juri_madya') NOT NULL,
      nama_kegiatan VARCHAR(255) NOT NULL DEFAULT '',
      tempat VARCHAR(500) NOT NULL DEFAULT '',
      tanggal_mulai DATE NULL,
      tanggal_selesai DATE NULL,
      harga_tanpa_kamar DECIMAL(15,2) NOT NULL DEFAULT 0,
      harga_dengan_kamar DECIMAL(15,2) NOT NULL DEFAULT 0,
      deskripsi TEXT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_jenis (jenis_lisensi)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('license_configs table created.');

  // Add qr_code_path column to license_applications if not exists
  const [cols] = await connection.execute(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'license_applications' AND COLUMN_NAME = 'qr_code_path'`
  );
  if (cols.length === 0) {
    console.log('Adding qr_code_path column to license_applications...');
    await connection.execute(`ALTER TABLE license_applications ADD COLUMN qr_code_path VARCHAR(500) NULL AFTER surat_rekomendasi`);
    console.log('qr_code_path column added.');
  } else {
    console.log('qr_code_path column already exists.');
  }

  // Insert default configs
  console.log('Inserting default license configs...');
  await connection.execute(`
    INSERT IGNORE INTO license_configs (jenis_lisensi, nama_kegiatan, tempat, tanggal_mulai, tanggal_selesai, harga_tanpa_kamar, harga_dengan_kamar)
    VALUES 
      ('pelatih_muda', 'Lisensi Pelatih Muda Forbasi', '', NULL, NULL, 750000, 1000000),
      ('pelatih_madya', 'Lisensi Pelatih Madya Forbasi', '', NULL, NULL, 750000, 1000000),
      ('pelatih_utama', 'Lisensi Pelatih Utama Forbasi', '', NULL, NULL, 750000, 1000000),
      ('juri_muda', 'Lisensi Juri Muda Forbasi', '', NULL, NULL, 2000000, 2250000),
      ('juri_madya', 'Lisensi Juri Madya Forbasi', '', NULL, NULL, 2000000, 2250000)
  `);
  console.log('Default configs inserted.');

  await connection.end();
  console.log('Done!');
  process.exit(0);
}

setup().catch(err => {
  console.error('Setup failed:', err);
  process.exit(1);
});
