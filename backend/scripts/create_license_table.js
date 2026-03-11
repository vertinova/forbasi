require('dotenv').config();
const db = require('../src/config/database');

async function run() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS license_users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      username VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      full_name VARCHAR(200) DEFAULT NULL,
      email VARCHAR(150) DEFAULT NULL,
      phone VARCHAR(20) DEFAULT NULL,
      role ENUM('pelatih','juri') DEFAULT 'pelatih',
      is_active TINYINT(1) DEFAULT 1,
      last_login DATETIME DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);
  console.log('license_users table created/verified');
  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
