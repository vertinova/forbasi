require('dotenv').config();
const db = require('../src/config/database');

async function run() {
  // Make old required fields nullable since new flow doesn't use them
  await db.query("ALTER TABLE license_applications MODIFY nama_lengkap VARCHAR(255) DEFAULT NULL");
  await db.query("ALTER TABLE license_applications MODIFY alamat TEXT DEFAULT NULL");
  await db.query("ALTER TABLE license_applications MODIFY no_telepon VARCHAR(20) DEFAULT NULL");
  await db.query("ALTER TABLE license_applications MODIFY email VARCHAR(255) DEFAULT NULL");
  await db.query("ALTER TABLE license_applications MODIFY pas_foto VARCHAR(500) DEFAULT NULL");
  await db.query("ALTER TABLE license_applications MODIFY bukti_transfer VARCHAR(500) DEFAULT NULL");
  await db.query("ALTER TABLE license_applications MODIFY surat_pengalaman VARCHAR(500) DEFAULT NULL");
  await db.query("ALTER TABLE license_applications MODIFY biaya_lisensi DECIMAL(15,2) DEFAULT 0.00");
  console.log('Columns modified to nullable');

  const [rows] = await db.query('DESCRIBE license_applications');
  console.log('\nFinal structure:');
  rows.forEach(r => console.log(`  ${r.Field} ${r.Type} ${r.Null} default=${r.Default}`));
  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
