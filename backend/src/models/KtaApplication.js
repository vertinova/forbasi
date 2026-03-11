const prisma = require('../lib/prisma');

function normBigInt(row) {
  if (!row) return row;
  return Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k, typeof v === 'bigint' ? Number(v) : v])
  );
}

/**
 * Normalizes a stored file path to "subfolder/filename" format.
 * Old PHP records stored paths like "/forbasi/php/uploads/generated_kta_pb/KTA_PB_xxx.pdf"
 * or sometimes just the bare filename "KTA_PB_xxx.pdf".
 * The new Node.js backend expects "generated_kta_pb/KTA_PB_xxx.pdf".
 */
function normalizePath(storedPath, defaultSubdir) {
  if (!storedPath) return storedPath;
  // Contains /uploads/ — strip everything up to and including it
  const uploadsIdx = storedPath.indexOf('/uploads/');
  if (uploadsIdx !== -1) {
    return storedPath.slice(uploadsIdx + '/uploads/'.length);
  }
  // Already "subdir/filename" format (contains / but doesn't start with /)
  if (storedPath.includes('/') && !storedPath.startsWith('/')) {
    return storedPath;
  }
  // Just a bare filename — prepend the default subfolder
  const baseName = storedPath.replace(/\\/g, '/').split('/').pop();
  return defaultSubdir ? `${defaultSubdir}/${baseName}` : baseName;
}

const FILE_FIELDS = [
  { field: 'logo_path',                    dir: 'kta_files' },
  { field: 'ad_file_path',                 dir: 'kta_files' },
  { field: 'art_file_path',                dir: 'kta_files' },
  { field: 'sk_file_path',                 dir: 'kta_files' },
  { field: 'payment_proof_path',           dir: 'kta_files' },
  { field: 'generated_kta_file_path',      dir: 'generated_kta' },
  { field: 'generated_kta_file_path_pengda', dir: 'generated_kta_pengda' },
  { field: 'generated_kta_file_path_pb',   dir: 'generated_kta_pb' },
  { field: 'pengcab_payment_proof_path',   dir: 'pengcab_payment_proofs' },
  { field: 'pengda_payment_proof_path',    dir: 'pengda_payment_proofs' },
];

function normalizeRow(row) {
  if (!row) return row;
  const out = normBigInt(row);
  for (const { field, dir } of FILE_FIELDS) {
    if (out[field] != null) out[field] = normalizePath(out[field], dir);
  }
  return out;
}

const KtaApplication = {
  async findById(id) {
    const rows = await prisma.$queryRaw`
      SELECT ka.*, u.club_name, u.username, u.email, u.phone, u.province_id, u.city_id,
             p.name as province_name, c.name as city_name
      FROM kta_applications ka
      JOIN users u ON ka.user_id = u.id
      LEFT JOIN provinces p ON u.province_id = p.id
      LEFT JOIN cities c ON u.city_id = c.id
      WHERE ka.id = ${id}
    `;
    return normalizeRow(rows[0] || null);
  },

  async findByUserId(userId) {
    const rows = await prisma.$queryRaw`
      SELECT ka.*, p.name as province_name, c.name as city_name
      FROM kta_applications ka
      LEFT JOIN provinces p ON ka.province_id = p.id
      LEFT JOIN cities c ON ka.city_id = c.id
      WHERE ka.user_id = ${userId}
      ORDER BY ka.created_at DESC
    `;
    return rows.map(normalizeRow);
  },

  async create(data) {
    const fields = Object.keys(data);
    const placeholders = fields.map(() => '?').join(', ');
    await prisma.$executeRawUnsafe(
      `INSERT INTO kta_applications (${fields.join(', ')}) VALUES (${placeholders})`,
      ...Object.values(data)
    );
    const rows = await prisma.$queryRaw`SELECT LAST_INSERT_ID() AS id`;
    return Number(rows[0].id);
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
    values.push(id);
    const count = await prisma.$executeRawUnsafe(
      `UPDATE kta_applications SET ${fields.join(', ')} WHERE id = ?`,
      ...values
    );
    return count > 0;
  },

  async findAll(filters = {}) {
    const conds = ['1=1'];
    const args = [];

    if (filters.status) {
      const statuses = filters.status.split(',').map(s => s.trim()).filter(Boolean);
      if (statuses.length > 1) {
        conds.push(`ka.status IN (${statuses.map(() => '?').join(',')})`);
        args.push(...statuses);
      } else {
        conds.push('ka.status = ?');
        args.push(statuses[0]);
      }
    }
    if (filters.province_id) { conds.push('ka.province_id = ?'); args.push(parseInt(filters.province_id)); }
    if (filters.city_id) { conds.push('ka.city_id = ?'); args.push(parseInt(filters.city_id)); }
    if (filters.search) {
      conds.push('(u.club_name LIKE ? OR u.username LIKE ? OR ka.coach_name LIKE ?)');
      const s = `%${filters.search}%`;
      args.push(s, s, s);
    }

    let sql = `
      SELECT ka.*, u.club_name, u.username, u.email, u.phone,
             p.name as province_name, c.name as city_name
      FROM kta_applications ka
      JOIN users u ON ka.user_id = u.id
      LEFT JOIN provinces p ON ka.province_id = p.id
      LEFT JOIN cities c ON ka.city_id = c.id
      WHERE ${conds.join(' AND ')}
      ORDER BY
        CASE ka.status
          WHEN 'pending' THEN 1
          WHEN 'approved_pengcab' THEN 2
          WHEN 'resubmit_to_pengda' THEN 3
          WHEN 'pending_pengda_resubmit' THEN 4
          WHEN 'approved_pengda' THEN 5
          WHEN 'approved_pb' THEN 6
          WHEN 'kta_issued' THEN 7
          WHEN 'rejected_pengcab' THEN 8
          WHEN 'rejected_pengda' THEN 9
          WHEN 'rejected_pb' THEN 10
          WHEN 'rejected' THEN 11
          ELSE 12
        END, ka.created_at DESC
    `;

    if (filters.limit) {
      sql += ' LIMIT ? OFFSET ?';
      args.push(parseInt(filters.limit), filters.offset ? parseInt(filters.offset) : 0);
    }

    const rows = await prisma.$queryRawUnsafe(sql, ...args);
    return rows.map(normalizeRow);
  },

  async getStats(filters = {}) {
    const conds = ['1=1'];
    const args = [];

    if (filters.province_id) { conds.push('ka.province_id = ?'); args.push(parseInt(filters.province_id)); }
    if (filters.city_id) { conds.push('ka.city_id = ?'); args.push(parseInt(filters.city_id)); }

    const sql = `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN ka.status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN ka.status = 'approved_pengcab' THEN 1 ELSE 0 END) as approved_pengcab,
        SUM(CASE WHEN ka.status = 'approved_pengda' THEN 1 ELSE 0 END) as approved_pengda,
        SUM(CASE WHEN ka.status = 'approved_pb' THEN 1 ELSE 0 END) as approved_pb,
        SUM(CASE WHEN ka.status = 'kta_issued' THEN 1 ELSE 0 END) as kta_issued,
        SUM(CASE WHEN ka.status IN ('rejected','rejected_pengcab','rejected_pengda','rejected_pb') THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN ka.status = 'rejected_pengcab' THEN 1 ELSE 0 END) as rejected_pengcab,
        SUM(CASE WHEN ka.status = 'rejected_pengda' THEN 1 ELSE 0 END) as rejected_pengda,
        SUM(CASE WHEN ka.status = 'rejected_pb' THEN 1 ELSE 0 END) as rejected_pb,
        SUM(CASE WHEN ka.status IN ('resubmit_to_pengda','pending_pengda_resubmit') THEN 1 ELSE 0 END) as resubmitting
      FROM kta_applications ka
      WHERE ${conds.join(' AND ')}
    `;

    const rows = await prisma.$queryRawUnsafe(sql, ...args);
    return normBigInt(rows[0]);
  },

  async count(filters = {}) {
    const conds = ['1=1'];
    const args = [];

    if (filters.status) {
      const statuses = filters.status.split(',').map(s => s.trim()).filter(Boolean);
      if (statuses.length > 1) {
        conds.push(`ka.status IN (${statuses.map(() => '?').join(',')})`);
        args.push(...statuses);
      } else {
        conds.push('ka.status = ?');
        args.push(statuses[0]);
      }
    }
    if (filters.province_id) { conds.push('ka.province_id = ?'); args.push(parseInt(filters.province_id)); }

    const rows = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as total FROM kta_applications ka WHERE ${conds.join(' AND ')}`,
      ...args
    );
    return Number(rows[0].total);
  },
};

module.exports = KtaApplication;
