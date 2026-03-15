require('dotenv').config();
const db = require('../src/config/database');

async function run() {
  const alters = [
    `ALTER TABLE license_applications ADD COLUMN akomodasi ENUM('tanpa_kamar','dengan_kamar') DEFAULT 'tanpa_kamar' AFTER jenis_lisensi`,
    `ALTER TABLE license_applications ADD COLUMN sertifikat_tot VARCHAR(500) DEFAULT NULL AFTER surat_pengalaman`,
    `ALTER TABLE license_applications ADD COLUMN surat_rekomendasi VARCHAR(500) DEFAULT NULL AFTER sertifikat_tot`,
    `ALTER TABLE license_applications ADD COLUMN notes TEXT DEFAULT NULL AFTER surat_rekomendasi`,
    `ALTER TABLE license_applications ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP AFTER submitted_at`,
  ];

  for (const sql of alters) {
    try {
      await db.query(sql);
      console.log('OK:', sql.substring(0, 60) + '...');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('SKIP (already exists):', sql.substring(0, 60) + '...');
      } else {
        throw e;
      }
    }
  }

  // Verify final structure
  const [rows] = await db.query('DESCRIBE license_applications');
  console.log('\nFinal table structure:');
  rows.forEach(r => console.log(`  ${r.Field} ${r.Type} ${r.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${r.Default || ''}`));

  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
