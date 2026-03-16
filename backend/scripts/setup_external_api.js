/**
 * Setup External API tables
 * - external_api_keys: API key management with granular permissions
 * - regional landing tables: hero_slides, struktur_organisasi, feedback, site_config
 * - pengcab_data: Pengcab management for Pengda
 * - rekomendasi: Recommendation letters
 * - format_dokumen: Document templates
 * 
 * Run: node scripts/setup_external_api.js
 */
const db = require('../src/config/database');

async function setup() {
  const conn = await db.getConnection();
  try {
    console.log('🔧 Setting up External API tables...\n');

    // ── 1. API Keys table ──
    await conn.query(`
      CREATE TABLE IF NOT EXISTS external_api_keys (
        id INT AUTO_INCREMENT PRIMARY KEY,
        key_name VARCHAR(100) NOT NULL,
        api_key VARCHAR(255) NOT NULL UNIQUE,
        region VARCHAR(50) DEFAULT NULL COMMENT 'null = global (PB), otherwise region code like jabar',
        province_id INT DEFAULT NULL,
        permissions JSON NOT NULL COMMENT 'Array of permission strings',
        is_active TINYINT(1) DEFAULT 1,
        last_used_at TIMESTAMP NULL,
        expires_at TIMESTAMP NULL,
        created_by INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_api_key (api_key),
        INDEX idx_region (region),
        INDEX idx_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ external_api_keys');

    // ── 2. Regional hero slides ──
    await conn.query(`
      CREATE TABLE IF NOT EXISTS regional_hero_slides (
        id INT AUTO_INCREMENT PRIMARY KEY,
        region VARCHAR(50) NOT NULL,
        title VARCHAR(255) DEFAULT NULL,
        subtitle TEXT DEFAULT NULL,
        image_path VARCHAR(500) DEFAULT NULL,
        link VARCHAR(500) DEFAULT NULL,
        urutan INT DEFAULT 0,
        aktif TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_region (region),
        INDEX idx_aktif (aktif)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ regional_hero_slides');

    // ── 3. Regional berita (news) ──
    await conn.query(`
      CREATE TABLE IF NOT EXISTS regional_berita (
        id INT AUTO_INCREMENT PRIMARY KEY,
        region VARCHAR(50) NOT NULL,
        judul VARCHAR(255) NOT NULL,
        ringkasan TEXT DEFAULT NULL,
        konten TEXT DEFAULT NULL,
        gambar VARCHAR(500) DEFAULT NULL,
        kategori VARCHAR(100) DEFAULT 'Umum',
        tanggal DATE DEFAULT NULL,
        link VARCHAR(500) DEFAULT NULL,
        aktif TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_region (region),
        INDEX idx_aktif (aktif)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ regional_berita');

    // ── 4. Regional struktur organisasi ──
    await conn.query(`
      CREATE TABLE IF NOT EXISTS regional_struktur (
        id INT AUTO_INCREMENT PRIMARY KEY,
        region VARCHAR(50) NOT NULL,
        nama VARCHAR(255) NOT NULL,
        jabatan VARCHAR(255) NOT NULL,
        foto VARCHAR(500) DEFAULT NULL,
        urutan INT DEFAULT 0,
        aktif TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_region (region)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ regional_struktur');

    // ── 5. Regional feedback / testimonials ──
    await conn.query(`
      CREATE TABLE IF NOT EXISTS regional_feedback (
        id INT AUTO_INCREMENT PRIMARY KEY,
        region VARCHAR(50) NOT NULL,
        nama VARCHAR(255) NOT NULL,
        pesan TEXT NOT NULL,
        rating TINYINT DEFAULT 5,
        foto VARCHAR(500) DEFAULT NULL,
        aktif TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_region (region)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ regional_feedback');

    // ── 6. Regional site config (key-value) ──
    await conn.query(`
      CREATE TABLE IF NOT EXISTS regional_site_config (
        id INT AUTO_INCREMENT PRIMARY KEY,
        region VARCHAR(50) NOT NULL,
        config_key VARCHAR(100) NOT NULL,
        config_value TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_region_key (region, config_key),
        INDEX idx_region (region)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ regional_site_config');

    // ── 7. Pengcab data management ──
    await conn.query(`
      CREATE TABLE IF NOT EXISTS pengcab_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT DEFAULT NULL COMMENT 'Link to users table if exists',
        region VARCHAR(50) NOT NULL,
        province_id INT NOT NULL,
        city_id INT DEFAULT NULL,
        nama_pengcab VARCHAR(255) NOT NULL,
        ketua VARCHAR(255) DEFAULT NULL,
        sekretaris VARCHAR(255) DEFAULT NULL,
        bendahara VARCHAR(255) DEFAULT NULL,
        alamat TEXT DEFAULT NULL,
        telepon VARCHAR(20) DEFAULT NULL,
        email VARCHAR(100) DEFAULT NULL,
        foto VARCHAR(500) DEFAULT NULL,
        aktif TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_region (region),
        INDEX idx_province (province_id),
        INDEX idx_city (city_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ pengcab_data');

    // ── 8. Rekomendasi (recommendation letters) ──
    await conn.query(`
      CREATE TABLE IF NOT EXISTS rekomendasi (
        id INT AUTO_INCREMENT PRIMARY KEY,
        region VARCHAR(50) NOT NULL,
        province_id INT NOT NULL,
        pemohon_nama VARCHAR(255) NOT NULL,
        pemohon_jabatan VARCHAR(255) DEFAULT NULL,
        pemohon_club VARCHAR(255) DEFAULT NULL,
        pemohon_user_id INT DEFAULT NULL,
        jenis_rekomendasi VARCHAR(100) NOT NULL COMMENT 'event, pelatih, kejurcab, lainnya',
        perihal TEXT NOT NULL,
        surat_permohonan VARCHAR(500) DEFAULT NULL,
        dokumen_pendukung VARCHAR(500) DEFAULT NULL,
        status ENUM('pending','approved','rejected') DEFAULT 'pending',
        catatan_pengda TEXT DEFAULT NULL,
        approved_by INT DEFAULT NULL,
        approved_at TIMESTAMP NULL,
        surat_rekomendasi_path VARCHAR(500) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_region (region),
        INDEX idx_status (status),
        INDEX idx_province (province_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ rekomendasi');

    // ── 9. Format dokumen (document templates) ──
    await conn.query(`
      CREATE TABLE IF NOT EXISTS format_dokumen (
        id INT AUTO_INCREMENT PRIMARY KEY,
        region VARCHAR(50) DEFAULT NULL COMMENT 'null = global template',
        nama VARCHAR(255) NOT NULL,
        jenis VARCHAR(100) NOT NULL COMMENT 'surat_rekomendasi, sk, undangan, lainnya',
        template_html TEXT DEFAULT NULL COMMENT 'HTML template with {{placeholders}}',
        file_path VARCHAR(500) DEFAULT NULL,
        variables JSON DEFAULT NULL COMMENT 'List of available placeholder variables',
        aktif TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_region (region),
        INDEX idx_jenis (jenis)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ format_dokumen');

    // ── 10. Surat config (letter configuration per region) ──
    await conn.query(`
      CREATE TABLE IF NOT EXISTS surat_config (
        id INT AUTO_INCREMENT PRIMARY KEY,
        region VARCHAR(50) NOT NULL,
        kop_surat VARCHAR(500) DEFAULT NULL COMMENT 'Header image path',
        nama_organisasi VARCHAR(255) DEFAULT NULL,
        alamat_organisasi TEXT DEFAULT NULL,
        telepon_organisasi VARCHAR(50) DEFAULT NULL,
        email_organisasi VARCHAR(100) DEFAULT NULL,
        nama_ketua VARCHAR(255) DEFAULT NULL,
        signature_path VARCHAR(500) DEFAULT NULL,
        stamp_path VARCHAR(500) DEFAULT NULL,
        nomor_surat_prefix VARCHAR(100) DEFAULT NULL COMMENT 'e.g. 001/PENGDA-JABAR/REC',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_region (region)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ surat_config');

    console.log('\n🎉 All External API tables created successfully!');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    conn.release();
    process.exit(0);
  }
}

setup();
