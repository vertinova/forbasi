/**
 * Setup Kejurda (Kejuaraan Daerah) tables
 * Kejurda is regional championship managed by Pengda (role 3)
 * Pengcab (role 2) registers teams, Pengda approves/rejects
 */

const db = require('../src/config/database');

async function setupKejurdaTables() {
  const connection = await db.getConnection();
  
  try {
    console.log('Creating kejurda tables...');

    // Kejurda Categories
    await connection.query(`
      CREATE TABLE IF NOT EXISTS kejurda_categories (
        id INT PRIMARY KEY AUTO_INCREMENT,
        category_name VARCHAR(200) NOT NULL,
        level VARCHAR(50) NOT NULL DEFAULT '',
        quota_per_pengcab INT DEFAULT 5,
        pengda_id INT DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_category (category_name, level, pengda_id)
      ) ENGINE=InnoDB
    `);
    console.log('✅ kejurda_categories created');

    // Kejurda Events
    await connection.query(`
      CREATE TABLE IF NOT EXISTS kejurda_events (
        id INT PRIMARY KEY AUTO_INCREMENT,
        event_name VARCHAR(200) NOT NULL,
        event_year INT NOT NULL,
        event_date DATE DEFAULT NULL,
        location VARCHAR(300) DEFAULT NULL,
        description TEXT DEFAULT NULL,
        pengda_id INT NOT NULL,
        status ENUM('upcoming','ongoing','completed','cancelled') DEFAULT 'upcoming',
        created_by INT DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_event (event_name, event_year, pengda_id),
        FOREIGN KEY (pengda_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
    console.log('✅ kejurda_events created');

    // Kejurda Registrations
    await connection.query(`
      CREATE TABLE IF NOT EXISTS kejurda_registrations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        event_id INT NOT NULL,
        category_id INT NOT NULL,
        pengcab_id INT NOT NULL,
        pengda_id INT NOT NULL,
        province_id INT DEFAULT NULL,
        city_id INT DEFAULT NULL,
        club_id INT DEFAULT NULL,
        club_name VARCHAR(200) NOT NULL,
        team_name VARCHAR(200) DEFAULT NULL,
        coach_name VARCHAR(200) DEFAULT NULL,
        manager_name VARCHAR(200) DEFAULT NULL,
        logo_path VARCHAR(500) DEFAULT NULL,
        total_members INT DEFAULT NULL,
        notes TEXT DEFAULT NULL,
        status ENUM('pending','approved','rejected') DEFAULT 'pending',
        approved_by INT DEFAULT NULL,
        approved_at DATETIME DEFAULT NULL,
        rejected_by INT DEFAULT NULL,
        rejection_reason TEXT DEFAULT NULL,
        rejected_at DATETIME DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES kejurda_events(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES kejurda_categories(id) ON DELETE CASCADE,
        FOREIGN KEY (pengcab_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (pengda_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (province_id) REFERENCES provinces(id) ON DELETE SET NULL,
        INDEX idx_event_category (event_id, category_id),
        INDEX idx_pengcab (pengcab_id),
        INDEX idx_pengda (pengda_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB
    `);
    console.log('✅ kejurda_registrations created');

    console.log('\n🎉 All kejurda tables created successfully!');
  } catch (err) {
    console.error('❌ Error creating kejurda tables:', err.message);
    throw err;
  } finally {
    connection.release();
  }
}

setupKejurdaTables()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
