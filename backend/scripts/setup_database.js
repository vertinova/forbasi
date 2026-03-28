require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true
};

const DB_NAME = process.env.DB_NAME || 'forbasi';

async function setupDatabase() {
  let connection;
  try {
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('Connected to MySQL');

    // Create database
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.query(`USE \`${DB_NAME}\``);
    console.log(`Using database: ${DB_NAME}`);

    // Provinces
    await connection.query(`
      CREATE TABLE IF NOT EXISTS provinces (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL
      ) ENGINE=InnoDB
    `);

    // Cities
    await connection.query(`
      CREATE TABLE IF NOT EXISTS cities (
        id INT PRIMARY KEY AUTO_INCREMENT,
        province_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        FOREIGN KEY (province_id) REFERENCES provinces(id)
      ) ENGINE=InnoDB
    `);

    // Users
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(150) DEFAULT NULL,
        club_name VARCHAR(200) DEFAULT NULL,
        phone VARCHAR(20) DEFAULT NULL,
        address TEXT DEFAULT NULL,
        logo_path VARCHAR(500) DEFAULT NULL,
        province_id INT DEFAULT NULL,
        city_id INT DEFAULT NULL,
        role_id INT DEFAULT 1 COMMENT '1=anggota,2=pengcab,3=pengda,4=pb',
        bank_account_number VARCHAR(50) DEFAULT NULL,
        is_suspended TINYINT(1) DEFAULT 0,
        reset_token VARCHAR(255) DEFAULT NULL,
        reset_token_expires_at DATETIME DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (province_id) REFERENCES provinces(id) ON DELETE SET NULL,
        FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE SET NULL
      ) ENGINE=InnoDB
    `);

    // Super Admins
    await connection.query(`
      CREATE TABLE IF NOT EXISTS super_admins (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        is_active TINYINT(1) DEFAULT 1,
        last_login DATETIME DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `);

    // KTA Applications
    await connection.query(`
      CREATE TABLE IF NOT EXISTS kta_applications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        club_name VARCHAR(255) DEFAULT NULL,
        school_name VARCHAR(255) DEFAULT NULL,
        leader_name VARCHAR(255) DEFAULT NULL,
        coach_name VARCHAR(255) DEFAULT NULL,
        manager_name VARCHAR(255) DEFAULT NULL,
        club_address TEXT DEFAULT NULL,
        logo_path VARCHAR(500) DEFAULT NULL,
        ad_file_path VARCHAR(500) DEFAULT NULL,
        art_file_path VARCHAR(500) DEFAULT NULL,
        sk_file_path VARCHAR(500) DEFAULT NULL,
        payment_proof_path VARCHAR(500) DEFAULT NULL,
        province_id INT DEFAULT NULL,
        city_id INT DEFAULT NULL,
        province VARCHAR(255) DEFAULT NULL,
        regency VARCHAR(255) DEFAULT NULL,
        status ENUM('pending','approved_pengcab','approved_pengda','approved_pb','kta_issued','rejected','rejected_pengcab','rejected_pengda','rejected_pb','resubmit_to_pengda','pending_pengda_resubmit') DEFAULT 'pending',
        notes_pengcab TEXT DEFAULT NULL,
        notes_pengda TEXT DEFAULT NULL,
        notes_pb TEXT DEFAULT NULL,
        rejection_reason TEXT DEFAULT NULL,
        nominal_paid DECIMAL(12,2) DEFAULT 0,
        pengcab_payment_proof_path VARCHAR(500) DEFAULT NULL,
        pengda_payment_proof_path VARCHAR(500) DEFAULT NULL,
        approved_by_pengcab_id INT DEFAULT NULL,
        approved_at_pengcab DATETIME DEFAULT NULL,
        rejected_by_pengcab_id INT DEFAULT NULL,
        rejected_at_pengcab DATETIME DEFAULT NULL,
        approved_by_pengda_id INT DEFAULT NULL,
        approved_at_pengda DATETIME DEFAULT NULL,
        rejected_by_pengda_id INT DEFAULT NULL,
        rejected_at_pengda DATETIME DEFAULT NULL,
        approved_by_pb_id INT DEFAULT NULL,
        approved_at_pb DATETIME DEFAULT NULL,
        rejected_by_pb_id INT DEFAULT NULL,
        rejected_at_pb DATETIME DEFAULT NULL,
        kta_issued_at DATETIME DEFAULT NULL,
        kta_barcode_unique_id VARCHAR(100) DEFAULT NULL UNIQUE,
        generated_kta_file_path VARCHAR(500) DEFAULT NULL,
        generated_kta_file_path_pengda VARCHAR(500) DEFAULT NULL,
        generated_kta_file_path_pb VARCHAR(500) DEFAULT NULL,
        member_photos_json JSON DEFAULT NULL,
        last_resubmitted_at DATETIME DEFAULT NULL,
        pb_payment_recap_id INT DEFAULT NULL,
        amount_pb_to_pengda INT DEFAULT 35000,
        amount_pb_to_pengcab INT DEFAULT 50000,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (province_id) REFERENCES provinces(id) ON DELETE SET NULL,
        FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE SET NULL
      ) ENGINE=InnoDB
    `);

    // KTA Configs (signature, stamp, signer info per level)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS kta_configs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        config_level ENUM('pengcab','pengda','pb') NOT NULL,
        config_key VARCHAR(100) NOT NULL,
        config_value TEXT DEFAULT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_config (config_level, config_key)
      ) ENGINE=InnoDB
    `);

    // KTA Application History
    await connection.query(`
      CREATE TABLE IF NOT EXISTS kta_application_history (
        id INT PRIMARY KEY AUTO_INCREMENT,
        application_id INT NOT NULL,
        status VARCHAR(50) NOT NULL,
        notes TEXT DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (application_id) REFERENCES kta_applications(id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);

    // In-app Notifications
    await connection.query(`
      CREATE TABLE IF NOT EXISTS in_app_notifications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        user_type ENUM('user','pengcab','pengda','pb','super_admin') DEFAULT 'user',
        title VARCHAR(255) NOT NULL,
        message TEXT DEFAULT NULL,
        is_read TINYINT(1) DEFAULT 0,
        link VARCHAR(500) DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `);

    // Notification Templates
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notification_templates (
        id INT PRIMARY KEY AUTO_INCREMENT,
        template_name VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        is_active TINYINT(1) DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `);

    // Push Subscriptions
    await connection.query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT DEFAULT NULL,
        user_type VARCHAR(50) DEFAULT 'user',
        endpoint TEXT NOT NULL,
        p256dh_key TEXT DEFAULT NULL,
        auth_key TEXT DEFAULT NULL,
        subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active TINYINT(1) DEFAULT 1
      ) ENGINE=InnoDB
    `);

    // Notification Logs
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notifications_log (
        id INT PRIMARY KEY AUTO_INCREMENT,
        subscription_id INT DEFAULT NULL,
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        clicked_at DATETIME DEFAULT NULL,
        status VARCHAR(50) DEFAULT 'sent',
        FOREIGN KEY (subscription_id) REFERENCES push_subscriptions(id) ON DELETE SET NULL
      ) ENGINE=InnoDB
    `);

    // Visitor Tracking
    await connection.query(`
      CREATE TABLE IF NOT EXISTS visitor_tracking (
        id INT PRIMARY KEY AUTO_INCREMENT,
        visit_date DATE NOT NULL UNIQUE,
        visit_count INT DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `);

    // License Users
    await connection.query(`
      CREATE TABLE IF NOT EXISTS license_users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(200) DEFAULT NULL,
        email VARCHAR(255) DEFAULT NULL,
        phone VARCHAR(20) DEFAULT NULL,
        role ENUM('pelatih','juri') DEFAULT 'pelatih',
        is_active TINYINT(1) DEFAULT 1,
        last_login DATETIME DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `);

    // License Events
    await connection.query(`
      CREATE TABLE IF NOT EXISTS license_events (
        id INT PRIMARY KEY AUTO_INCREMENT,
        event_name VARCHAR(200) NOT NULL,
        event_date DATE DEFAULT NULL,
        location VARCHAR(300) DEFAULT NULL,
        description TEXT DEFAULT NULL,
        is_active TINYINT(1) DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `);

    // License Applications
    await connection.query(`
      CREATE TABLE IF NOT EXISTS license_applications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        nama_lengkap VARCHAR(255) DEFAULT NULL,
        alamat TEXT DEFAULT NULL,
        jenis_lisensi ENUM('pelatih','juri_muda','juri_madya') NOT NULL,
        akomodasi ENUM('tanpa_kamar','dengan_kamar') DEFAULT 'tanpa_kamar',
        no_telepon VARCHAR(20) DEFAULT NULL,
        email VARCHAR(255) DEFAULT NULL,
        pas_foto VARCHAR(500) DEFAULT NULL,
        bukti_transfer VARCHAR(500) DEFAULT NULL,
        surat_rekomendasi_pengda VARCHAR(500) DEFAULT NULL,
        surat_pengalaman VARCHAR(500) DEFAULT NULL,
        sertifikat_tot VARCHAR(500) DEFAULT NULL,
        surat_rekomendasi VARCHAR(500) DEFAULT NULL,
        qr_code_path VARCHAR(500) DEFAULT NULL,
        notes TEXT DEFAULT NULL,
        biaya_lisensi DECIMAL(15,2) DEFAULT 0.00,
        status ENUM('pending','proses','approved','rejected') DEFAULT 'pending',
        show_on_landing TINYINT(1) NOT NULL DEFAULT 0,
        alasan_penolakan TEXT DEFAULT NULL,
        approved_by INT DEFAULT NULL,
        approved_at TIMESTAMP NULL DEFAULT NULL,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_license_app_user FOREIGN KEY (user_id) REFERENCES license_users(id) ON DELETE CASCADE,
        INDEX idx_license_app_user (user_id),
        INDEX idx_license_app_status (status),
        INDEX idx_license_app_jenis (jenis_lisensi)
      ) ENGINE=InnoDB
    `);

    // Kejurnas Categories
    await connection.query(`
      CREATE TABLE IF NOT EXISTS kejurnas_categories (
        id INT PRIMARY KEY AUTO_INCREMENT,
        category_name VARCHAR(200) NOT NULL,
        description TEXT DEFAULT NULL,
        is_active TINYINT(1) DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `);

    // Kejurnas Events
    await connection.query(`
      CREATE TABLE IF NOT EXISTS kejurnas_events (
        id INT PRIMARY KEY AUTO_INCREMENT,
        event_name VARCHAR(200) NOT NULL,
        event_date DATE DEFAULT NULL,
        location VARCHAR(300) DEFAULT NULL,
        description TEXT DEFAULT NULL,
        created_by INT DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `);

    // Kejurnas Registrations
    await connection.query(`
      CREATE TABLE IF NOT EXISTS kejurnas_registrations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        pengda_id INT DEFAULT NULL,
        club_id INT DEFAULT NULL,
        event_id INT DEFAULT NULL,
        category_id INT NOT NULL,
        level VARCHAR(50) DEFAULT NULL,
        club_name VARCHAR(200) NOT NULL,
        coach_name VARCHAR(200) DEFAULT NULL,
        manager_name VARCHAR(200) DEFAULT NULL,
        logo_path VARCHAR(500) DEFAULT NULL,
        province_id INT DEFAULT NULL,
        region ENUM('Jawa','Luar Jawa') DEFAULT NULL,
        status ENUM('pending','approved','rejected') DEFAULT 'pending',
        approved_by INT DEFAULT NULL,
        approved_at DATETIME DEFAULT NULL,
        rejected_by INT DEFAULT NULL,
        rejection_reason TEXT DEFAULT NULL,
        rejected_at DATETIME DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES kejurnas_categories(id),
        FOREIGN KEY (province_id) REFERENCES provinces(id) ON DELETE SET NULL
      ) ENGINE=InnoDB
    `);

    // Competition Re-registration (full version matching PHP)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS competition_reregistrations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        kejurnas_registration_id INT DEFAULT NULL,
        club_id INT DEFAULT NULL,
        school_name VARCHAR(200) DEFAULT NULL,
        school_level VARCHAR(100) DEFAULT NULL,
        phone VARCHAR(30) DEFAULT NULL,
        attendance_count INT DEFAULT 20,
        total_cost DECIMAL(12,2) DEFAULT 600000,
        school_permission_letter VARCHAR(500) DEFAULT NULL,
        parent_permission_letter VARCHAR(500) DEFAULT NULL,
        team_photo VARCHAR(500) DEFAULT NULL,
        payment_proof VARCHAR(500) DEFAULT NULL,
        komandan_photo VARCHAR(500) DEFAULT NULL,
        manager_photo VARCHAR(500) DEFAULT NULL,
        pelatih_photo VARCHAR(500) DEFAULT NULL,
        cadangan_1_photo VARCHAR(500) DEFAULT NULL,
        cadangan_2_photo VARCHAR(500) DEFAULT NULL,
        komandan_nama VARCHAR(200) DEFAULT NULL,
        manager_nama VARCHAR(200) DEFAULT NULL,
        pelatih_nama VARCHAR(200) DEFAULT NULL,
        komandan_sekolah VARCHAR(200) DEFAULT NULL,
        manager_sekolah VARCHAR(200) DEFAULT NULL,
        pelatih_sekolah VARCHAR(200) DEFAULT NULL,
        cadangan_1_nama VARCHAR(200) DEFAULT NULL,
        cadangan_2_nama VARCHAR(200) DEFAULT NULL,
        status ENUM('submitted','approved','rejected') DEFAULT 'submitted',
        admin_notes TEXT DEFAULT NULL,
        reviewed_at DATETIME DEFAULT NULL,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB
    `);
    // Add pasukan columns dynamically
    for (let i = 1; i <= 15; i++) {
      await connection.query(`ALTER TABLE competition_reregistrations ADD COLUMN IF NOT EXISTS pasukan_${i}_photo VARCHAR(500) DEFAULT NULL`).catch(() => {});
      await connection.query(`ALTER TABLE competition_reregistrations ADD COLUMN IF NOT EXISTS pasukan_${i}_nama VARCHAR(200) DEFAULT NULL`).catch(() => {});
    }

    // PB Payments Recap (saldo keluar)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS pb_payments_recap (
        id INT PRIMARY KEY AUTO_INCREMENT,
        recap_date DATE NOT NULL,
        recipient_type ENUM('pengda','pengcab') NOT NULL,
        recipient_id INT NOT NULL,
        amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        payment_proof_path VARCHAR(500) DEFAULT NULL,
        notes TEXT DEFAULT NULL,
        paid_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        processed_by_pb_id INT DEFAULT NULL,
        FOREIGN KEY (recipient_id) REFERENCES users(id),
        FOREIGN KEY (processed_by_pb_id) REFERENCES users(id)
      ) ENGINE=InnoDB
    `);

    // Add PB payment tracking columns to kta_applications
    await connection.query(`ALTER TABLE kta_applications ADD COLUMN IF NOT EXISTS pb_payment_recap_id INT DEFAULT NULL`).catch(() => {});
    await connection.query(`ALTER TABLE kta_applications ADD COLUMN IF NOT EXISTS amount_pb_to_pengda DECIMAL(12,2) DEFAULT NULL`).catch(() => {});
    await connection.query(`ALTER TABLE kta_applications ADD COLUMN IF NOT EXISTS amount_pb_to_pengcab DECIMAL(12,2) DEFAULT NULL`).catch(() => {});
    await connection.query(`ALTER TABLE kta_applications ADD COLUMN IF NOT EXISTS member_photos_json TEXT DEFAULT NULL`).catch(() => {});
    await connection.query(`ALTER TABLE kta_applications ADD COLUMN IF NOT EXISTS ad_file_path VARCHAR(500) DEFAULT NULL`).catch(() => {});
    await connection.query(`ALTER TABLE kta_applications ADD COLUMN IF NOT EXISTS art_file_path VARCHAR(500) DEFAULT NULL`).catch(() => {});
    await connection.query(`ALTER TABLE kta_applications ADD COLUMN IF NOT EXISTS sk_file_path VARCHAR(500) DEFAULT NULL`).catch(() => {});
    await connection.query(`ALTER TABLE kta_applications ADD COLUMN IF NOT EXISTS payment_proof_path VARCHAR(500) DEFAULT NULL`).catch(() => {});

    // Visitor Stats (daily + total)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS visitor_stats (
        id INT PRIMARY KEY AUTO_INCREMENT,
        visit_date DATE NOT NULL UNIQUE,
        visit_count INT DEFAULT 0,
        unique_visitors INT DEFAULT 0
      ) ENGINE=InnoDB
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS total_visitors (
        id INT PRIMARY KEY,
        total_visits INT DEFAULT 0,
        total_unique_visitors INT DEFAULT 0
      ) ENGINE=InnoDB
    `);

    // Per-role KTA config tables (pengcab, pengda, pb)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS pengcab_kta_configs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL UNIQUE,
        ketua_umum_name VARCHAR(200) DEFAULT NULL,
        signature_image_path VARCHAR(500) DEFAULT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS pengda_kta_configs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL UNIQUE,
        ketua_umum_name VARCHAR(200) DEFAULT NULL,
        signature_image_path VARCHAR(500) DEFAULT NULL,
        stamp_image_path VARCHAR(500) DEFAULT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS pb_kta_configs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL UNIQUE,
        ketua_umum_name VARCHAR(200) DEFAULT NULL,
        signature_image_path VARCHAR(500) DEFAULT NULL,
        stamp_image_path VARCHAR(500) DEFAULT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB
    `);

    // Notifications table (in-app)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT DEFAULT NULL,
        type VARCHAR(50) DEFAULT 'info',
        is_read TINYINT(1) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `);

    // Roles table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT PRIMARY KEY AUTO_INCREMENT,
        role_name VARCHAR(50) NOT NULL UNIQUE
      ) ENGINE=InnoDB
    `);
    await connection.query(`
      INSERT IGNORE INTO roles (id, role_name) VALUES (1, 'Anggota'), (2, 'Pengurus Cabang'), (3, 'Pengurus Daerah'), (4, 'Pengurus Besar')
    `);

    console.log('All tables created successfully!');

    // Seed default super admin
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await connection.query(`
      INSERT IGNORE INTO super_admins (username, password, is_active) VALUES ('superadmin', ?, 1)
    `, [hashedPassword]);
    console.log('Default super admin created (username: superadmin, password: admin123)');

    console.log('\nDatabase setup complete!');
  } catch (err) {
    console.error('Database setup error:', err.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

setupDatabase();
