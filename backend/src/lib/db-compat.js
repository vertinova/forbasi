/**
 * Compatibility shim: provides mysql2-pool-like API but uses Prisma internally.
 * Allows controllers to keep using `const db = require('../lib/db-compat')` 
 * with the same `db.query(sql, params)` pattern.
 *
 * SELECT queries  → prisma.$queryRawUnsafe → returns [rows, null]
 * Mutating queries → prisma.$executeRawUnsafe → returns [{ affectedRows, insertId }, null]
 */

const prisma = require('./prisma');

const SELECT_RE = /^\s*(SELECT|SHOW|DESCRIBE|EXPLAIN)/i;

// Recursively convert BigInt → Number so JSON.stringify works
function sanitize(val) {
  if (typeof val === 'bigint') return Number(val);
  if (Array.isArray(val)) return val.map(sanitize);
  if (val !== null && typeof val === 'object') {
    const out = {};
    for (const k of Object.keys(val)) out[k] = sanitize(val[k]);
    return out;
  }
  return val;
}

const db = {
  async query(sql, params = []) {
    if (SELECT_RE.test(sql)) {
      const rows = await prisma.$queryRawUnsafe(sql, ...params);
      return [sanitize(rows), null];
    }

    const affected = await prisma.$executeRawUnsafe(sql, ...params);

    // For INSERT, retrieve last insert ID
    let insertId = 0;
    if (/^\s*INSERT/i.test(sql)) {
      const idRows = await prisma.$queryRaw`SELECT LAST_INSERT_ID() AS id`;
      insertId = Number(idRows[0].id);
    }

    return [{ affectedRows: affected, insertId }, null];
  },
};

module.exports = db;
