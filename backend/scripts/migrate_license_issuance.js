/**
 * Migration: Add license issuance columns and 'issued' status enum value
 * - Add 'issued' to license_applications_status enum
 * - Add issued_at, expires_at, nomor_lisensi columns
 */
const prisma = require('../src/lib/prisma');

async function migrate() {
  console.log('Starting license issuance migration...');

  // 1. Add 'issued' to status enum
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE license_applications 
      MODIFY COLUMN status ENUM('pending','proses','approved','rejected','issued') DEFAULT 'pending'
    `);
    console.log('✅ Added "issued" to status enum');
  } catch (err) {
    if (err.message.includes('Duplicate')) {
      console.log('⚠️  Status enum already has "issued"');
    } else {
      console.error('❌ Failed to modify status enum:', err.message);
    }
  }

  // 2. Add nomor_lisensi column
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE license_applications ADD COLUMN nomor_lisensi VARCHAR(100) NULL
    `);
    console.log('✅ Added nomor_lisensi column');
  } catch (err) {
    if (err.message.includes('Duplicate column')) {
      console.log('⚠️  nomor_lisensi column already exists');
    } else {
      console.error('❌ Failed to add nomor_lisensi:', err.message);
    }
  }

  // 3. Add issued_at column
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE license_applications ADD COLUMN issued_at TIMESTAMP NULL
    `);
    console.log('✅ Added issued_at column');
  } catch (err) {
    if (err.message.includes('Duplicate column')) {
      console.log('⚠️  issued_at column already exists');
    } else {
      console.error('❌ Failed to add issued_at:', err.message);
    }
  }

  // 4. Add expires_at column
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE license_applications ADD COLUMN expires_at TIMESTAMP NULL
    `);
    console.log('✅ Added expires_at column');
  } catch (err) {
    if (err.message.includes('Duplicate column')) {
      console.log('⚠️  expires_at column already exists');
    } else {
      console.error('❌ Failed to add expires_at:', err.message);
    }
  }

  console.log('\nMigration complete! Now run: npx prisma db pull && npx prisma generate');
}

migrate()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
