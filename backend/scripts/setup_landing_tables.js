/**
 * Setup Landing Page Tables
 * Tables: landing_events, landing_gallery, landing_berita, landing_marketplace, landing_banners
 */
const db = require('../src/config/database');

async function setup() {
  console.log('Creating landing page tables...');

  await db.query(`
    CREATE TABLE IF NOT EXISTS landing_events (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nama VARCHAR(255) NOT NULL,
      tanggal VARCHAR(100) NOT NULL,
      lokasi VARCHAR(255) NOT NULL,
      status ENUM('upcoming','ongoing','completed') DEFAULT 'upcoming',
      icon VARCHAR(50) DEFAULT 'fa-calendar-alt',
      color ENUM('emerald','blue','purple','gold') DEFAULT 'emerald',
      deskripsi TEXT,
      banner VARCHAR(500),
      link VARCHAR(500),
      urutan INT DEFAULT 0,
      aktif TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('  ✓ landing_events');

  await db.query(`
    CREATE TABLE IF NOT EXISTS landing_gallery (
      id INT AUTO_INCREMENT PRIMARY KEY,
      src VARCHAR(500) NOT NULL,
      caption VARCHAR(255) NOT NULL,
      kategori VARCHAR(100) DEFAULT 'Umum',
      urutan INT DEFAULT 0,
      aktif TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('  ✓ landing_gallery');

  await db.query(`
    CREATE TABLE IF NOT EXISTS landing_berita (
      id INT AUTO_INCREMENT PRIMARY KEY,
      judul VARCHAR(255) NOT NULL,
      ringkasan TEXT NOT NULL,
      tanggal VARCHAR(50) NOT NULL,
      kategori VARCHAR(100) DEFAULT 'Umum',
      icon VARCHAR(50) DEFAULT 'fa-newspaper',
      link VARCHAR(500),
      aktif TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('  ✓ landing_berita');

  await db.query(`
    CREATE TABLE IF NOT EXISTS landing_marketplace (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nama VARCHAR(255) NOT NULL,
      harga VARCHAR(50) NOT NULL,
      img VARCHAR(500),
      warna ENUM('emerald','blue','purple','gold') DEFAULT 'emerald',
      link VARCHAR(500),
      urutan INT DEFAULT 0,
      aktif TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('  ✓ landing_marketplace');

  await db.query(`
    CREATE TABLE IF NOT EXISTS landing_banners (
      id INT AUTO_INCREMENT PRIMARY KEY,
      img VARCHAR(500),
      text VARCHAR(255) NOT NULL,
      link VARCHAR(500),
      section_index INT,
      urutan INT DEFAULT 0,
      aktif TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('  ✓ landing_banners');

  console.log('\nAll landing page tables created successfully!');
  process.exit(0);
}

setup().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
