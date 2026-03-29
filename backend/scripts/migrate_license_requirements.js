/**
 * Migration: Update license requirements
 * - Add pelatih_muda, pelatih_madya, pelatih_utama to jenis_lisensi enum
 * - Add new document columns for additional requirements
 * - Add default configs for new pelatih types
 * - Migrate existing 'pelatih' applications to 'pelatih_muda' (default)
 */

const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'forbasi_js',
    port: process.env.DB_PORT || 3306,
  });

  console.log('Connected to database.');

  try {
    // 1. Update enum for license_applications.jenis_lisensi
    console.log('1. Updating jenis_lisensi enum...');
    await connection.execute(`
      ALTER TABLE license_applications 
      MODIFY COLUMN jenis_lisensi ENUM('pelatih','juri_muda','juri_madya','pelatih_muda','pelatih_madya','pelatih_utama') NOT NULL
    `);
    console.log('   jenis_lisensi enum updated.');

    // 2. Update enum for license_configs.jenis_lisensi
    console.log('2. Updating license_configs jenis_lisensi enum...');
    await connection.execute(`
      ALTER TABLE license_configs 
      MODIFY COLUMN jenis_lisensi ENUM('pelatih','juri_muda','juri_madya','pelatih_muda','pelatih_madya','pelatih_utama') NOT NULL
    `);
    console.log('   license_configs enum updated.');

    // 3. Add new document columns
    console.log('3. Adding new document columns...');
    const newColumns = [
      ['kartu_identitas', 'VARCHAR(500) NULL'],
      ['ijazah', 'VARCHAR(500) NULL'],
      ['surat_kesediaan', 'VARCHAR(500) NULL'],
      ['pakta_integritas', 'VARCHAR(500) NULL'],
      ['surat_keterangan_sehat', 'VARCHAR(500) NULL'],
      ['daftar_riwayat_hidup', 'VARCHAR(500) NULL'],
      ['surat_tugas', 'VARCHAR(500) NULL'],
    ];

    for (const [col, def] of newColumns) {
      try {
        await connection.execute(`ALTER TABLE license_applications ADD COLUMN ${col} ${def}`);
        console.log(`   Added column: ${col}`);
      } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
          console.log(`   Column ${col} already exists, skipping.`);
        } else {
          throw err;
        }
      }
    }

    // 4. Migrate existing 'pelatih' records to 'pelatih_muda'
    console.log('4. Migrating existing pelatih records to pelatih_muda...');
    const [result] = await connection.execute(`
      UPDATE license_applications SET jenis_lisensi = 'pelatih_muda' WHERE jenis_lisensi = 'pelatih'
    `);
    console.log(`   Migrated ${result.affectedRows} pelatih records to pelatih_muda.`);

    // 5. Add default configs for new pelatih types
    console.log('5. Adding default configs for pelatih types...');
    
    // Get existing pelatih config as template
    const [existingConfigs] = await connection.execute(`
      SELECT * FROM license_configs WHERE jenis_lisensi = 'pelatih' LIMIT 1
    `);
    
    const template = existingConfigs[0] || {};
    
    for (const jenis of ['pelatih_muda', 'pelatih_madya', 'pelatih_utama']) {
      try {
        await connection.execute(`
          INSERT IGNORE INTO license_configs (jenis_lisensi, nama_kegiatan, tempat, tanggal_mulai, tanggal_selesai, harga_tanpa_kamar, harga_dengan_kamar, deskripsi)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          jenis,
          template.nama_kegiatan || `Lisensi ${jenis.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Forbasi`,
          template.tempat || '',
          template.tanggal_mulai || null,
          template.tanggal_selesai || null,
          template.harga_tanpa_kamar || 750000,
          template.harga_dengan_kamar || 1000000,
          template.deskripsi || null,
        ]);
        console.log(`   Config for ${jenis} added/exists.`);
      } catch (err) {
        console.log(`   Config for ${jenis}: ${err.message}`);
      }
    }

    // 6. Optionally migrate old 'pelatih' config to 'pelatih_muda' if exists
    console.log('6. Migrating old pelatih config...');
    try {
      await connection.execute(`
        UPDATE license_configs SET jenis_lisensi = 'pelatih_muda' WHERE jenis_lisensi = 'pelatih'
      `);
      console.log('   Old pelatih config migrated to pelatih_muda.');
    } catch (err) {
      console.log(`   Config migration: ${err.message}`);
    }

    // 7. Now remove old 'pelatih' from enums (optional - keep for safety)
    console.log('7. Cleaning up enum (removing old pelatih value)...');
    try {
      await connection.execute(`
        ALTER TABLE license_applications 
        MODIFY COLUMN jenis_lisensi ENUM('juri_muda','juri_madya','pelatih_muda','pelatih_madya','pelatih_utama') NOT NULL
      `);
      await connection.execute(`
        ALTER TABLE license_configs 
        MODIFY COLUMN jenis_lisensi ENUM('juri_muda','juri_madya','pelatih_muda','pelatih_madya','pelatih_utama') NOT NULL
      `);
      console.log('   Old pelatih enum value removed.');
    } catch (err) {
      console.log(`   Enum cleanup: ${err.message} (may have remaining records)`);
    }

    console.log('\n✅ Migration completed successfully!');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await connection.end();
  }
}

migrate();
