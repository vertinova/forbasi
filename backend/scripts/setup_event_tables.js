require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'forbasi',
  multipleStatements: true
};

async function setupEventTables() {
  let connection;
  try {
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('Connected to MySQL');

    // Add role penyelenggara (id=5) if not exists
    await connection.query(`
      INSERT IGNORE INTO roles (id, role_name) VALUES (5, 'penyelenggara')
    `);
    console.log('✅ Role penyelenggara added');

    // Create event_applications table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS event_applications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        jenis_pengajuan ENUM('event_penyelenggara', 'kejurcab') NOT NULL DEFAULT 'event_penyelenggara',
        
        -- Step 1: Detail Event
        nama_event VARCHAR(255) NOT NULL,
        jenis_event VARCHAR(100) DEFAULT NULL,
        tanggal_mulai DATE NOT NULL,
        tanggal_selesai DATE NOT NULL,
        lokasi VARCHAR(255) NOT NULL,
        deskripsi TEXT DEFAULT NULL,
        penyelenggara VARCHAR(255) DEFAULT NULL,
        kontak_person VARCHAR(100) DEFAULT NULL,
        dokumen_surat VARCHAR(500) DEFAULT NULL,
        proposal_kegiatan VARCHAR(500) DEFAULT NULL,
        poster VARCHAR(500) DEFAULT NULL,
        
        -- Step 2: Mata Lomba (JSON array)
        mata_lomba JSON DEFAULT NULL,
        
        -- Step 3: Persyaratan (JSON object with all 25 fields)
        persyaratan JSON DEFAULT NULL,
        
        -- Approval flow
        status ENUM(
          'draft',
          'submitted',
          'approved_pengcab',
          'rejected_pengcab',
          'approved_admin',
          'rejected_admin'
        ) NOT NULL DEFAULT 'submitted',
        
        -- Pengcab approval (for event_penyelenggara only)
        pengcab_approved_by INT DEFAULT NULL,
        pengcab_approved_at DATETIME DEFAULT NULL,
        pengcab_notes TEXT DEFAULT NULL,
        
        -- Admin/Pengda approval
        admin_approved_by INT DEFAULT NULL,
        admin_approved_at DATETIME DEFAULT NULL,
        admin_notes TEXT DEFAULT NULL,
        
        rejection_reason TEXT DEFAULT NULL,
        surat_rekomendasi_path VARCHAR(500) DEFAULT NULL,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_jenis (jenis_pengajuan),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ event_applications table created');

    console.log('\n🎉 Event tables setup complete!');
  } catch (err) {
    console.error('❌ Setup failed:', err.message);
  } finally {
    if (connection) await connection.end();
  }
}

setupEventTables();
