require('dotenv').config();
const db = require('../src/config/database');

async function run() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS license_applications (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      jenis_lisensi ENUM('pelatih','juri_muda','juri_madya') NOT NULL,
      akomodasi ENUM('tanpa_kamar','dengan_kamar') DEFAULT 'tanpa_kamar',
      biaya_lisensi DECIMAL(15,2) DEFAULT 0.00,
      pas_foto VARCHAR(500) DEFAULT NULL,
      bukti_transfer VARCHAR(500) DEFAULT NULL,
      surat_pengalaman VARCHAR(500) DEFAULT NULL,
      sertifikat_tot VARCHAR(500) DEFAULT NULL,
      surat_rekomendasi VARCHAR(500) DEFAULT NULL,
      notes TEXT DEFAULT NULL,
      status ENUM('pending','proses','approved','rejected') DEFAULT 'pending',
      alasan_penolakan TEXT DEFAULT NULL,
      approved_by INT DEFAULT NULL,
      approved_at DATETIME DEFAULT NULL,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_license_app_user FOREIGN KEY (user_id) REFERENCES license_users(id) ON DELETE CASCADE,
      INDEX idx_license_app_user (user_id),
      INDEX idx_license_app_status (status),
      INDEX idx_license_app_jenis (jenis_lisensi)
    ) ENGINE=InnoDB
  `);
  console.log('license_applications table created successfully');
  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
