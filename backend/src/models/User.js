const prisma = require('../lib/prisma');

function buildWhere(f) {
  const w = {};
  if (f.role_id) w.role_id = parseInt(f.role_id);
  if (f.province_id) w.province_id = parseInt(f.province_id);
  if (f.city_id) w.city_id = parseInt(f.city_id);
  if (f.search) {
    w.OR = [
      { club_name: { contains: f.search } },
      { username: { contains: f.search } },
      { email: { contains: f.search } },
    ];
  }
  return w;
}

const User = {
  async findById(id) {
    return prisma.users.findUnique({ where: { id } });
  },

  async findByUsername(username) {
    return prisma.users.findUnique({ where: { username } });
  },

  async findByEmail(email) {
    return prisma.users.findFirst({ where: { email } });
  },

  async create(data) {
    const { club_name, username, email, phone, address, password, role_id, province_id, city_id } = data;
    const user = await prisma.users.create({
      data: { club_name, username, email, phone, address, password, role_id, province_id, city_id },
    });
    return user.id;
  },

  async update(id, data) {
    try {
      await prisma.users.update({ where: { id }, data });
      return true;
    } catch {
      return false;
    }
  },

  async findAll(filters = {}) {
    const where = buildWhere(filters);
    return prisma.users.findMany({
      where,
      select: {
        id: true, club_name: true, username: true, email: true,
        phone: true, address: true, role_id: true, province_id: true,
        city_id: true, created_at: true,
      },
      orderBy: { created_at: 'desc' },
      ...(filters.limit && {
        take: parseInt(filters.limit),
        skip: filters.offset ? parseInt(filters.offset) : 0,
      }),
    });
  },

  async count(filters = {}) {
    return prisma.users.count({ where: buildWhere(filters) });
  },

  async setResetToken(email, token, expiresAt) {
    const r = await prisma.users.updateMany({
      where: { email },
      data: { reset_token: token, reset_token_expires_at: new Date(expiresAt) },
    });
    return r.count > 0;
  },

  async findByResetToken(token) {
    return prisma.users.findFirst({
      where: { reset_token: token, reset_token_expires_at: { gt: new Date() } },
    });
  },

  async clearResetToken(id) {
    await prisma.users.update({
      where: { id },
      data: { reset_token: null, reset_token_expires_at: null },
    });
  },

  // Get members with KTA status for Pengda/Pengcab dashboards
  async getMembersWithKtaStatus(filters = {}) {
    const conds = ['u.role_id IN (1, 2)'];
    const args = [];

    if (filters.province_id) { conds.push('u.province_id = ?'); args.push(filters.province_id); }
    if (filters.city_id) { conds.push('u.city_id = ?'); args.push(filters.city_id); }
    if (filters.role_id) { conds.push('u.role_id = ?'); args.push(filters.role_id); }
    if (filters.search) {
      conds.push('(u.club_name LIKE ? OR u.username LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)');
      const term = `%${filters.search}%`;
      args.push(term, term, term, term);
    }

    // KTA status filter
    if (filters.kta_status === 'issued') {
      conds.push("latest_kta.status = 'kta_issued'");
    } else if (filters.kta_status === 'not_issued') {
      conds.push("(latest_kta.status IS NULL OR latest_kta.status != 'kta_issued')");
    } else if (filters.kta_status === 'not_applied') {
      conds.push('latest_kta.status IS NULL');
    } else if (filters.kta_status && filters.kta_status !== 'all') {
      conds.push('latest_kta.status = ?');
      args.push(filters.kta_status);
    }

    const whereClause = conds.join(' AND ');

    let sql = `
      SELECT u.id, u.club_name, u.username, u.email, u.phone, u.address,
             r.role_name, p.name AS province_name, c.name AS city_name,
             latest_kta.id AS kta_application_id, latest_kta.logo_path,
             COALESCE(
               CASE
                 WHEN latest_kta.status = 'kta_issued' THEN 'Diterbitkan PB'
                 WHEN latest_kta.status = 'approved_pb' THEN 'Disetujui PB'
                 WHEN latest_kta.status = 'approved_pengda' THEN 'Disetujui Pengda'
                 WHEN latest_kta.status = 'approved_pengcab' THEN 'Disetujui Pengcab'
                 WHEN latest_kta.status = 'pending' THEN 'Menunggu Verifikasi Pengcab'
                 WHEN latest_kta.status = 'rejected_pengcab' THEN 'Ditolak Pengcab'
                 WHEN latest_kta.status = 'rejected_pengda' THEN 'Ditolak Pengda'
                 WHEN latest_kta.status = 'rejected_pb' THEN 'Ditolak PB'
                 ELSE 'Belum Mengajukan'
               END, 'Belum Mengajukan') AS kta_status_label,
             latest_kta.status AS kta_status
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN provinces p ON u.province_id = p.id
      LEFT JOIN cities c ON u.city_id = c.id
      LEFT JOIN (
        SELECT ka.user_id, ka.id, ka.status, ka.logo_path, ka.created_at
        FROM kta_applications ka
        INNER JOIN (
          SELECT user_id, MAX(created_at) AS max_created_at
          FROM kta_applications
          GROUP BY user_id
        ) latest ON ka.user_id = latest.user_id AND ka.created_at = latest.max_created_at
      ) latest_kta ON u.id = latest_kta.user_id
      WHERE ${whereClause}
      ORDER BY u.role_id ASC, u.created_at DESC
    `;

    if (filters.limit) { sql += ' LIMIT ?'; args.push(filters.limit); }
    if (filters.offset) { sql += ' OFFSET ?'; args.push(filters.offset); }

    return prisma.$queryRawUnsafe(sql, ...args);
  },

  // Count members with KTA status filter
  async countMembersWithKtaStatus(filters = {}) {
    const conds = ['u.role_id IN (1, 2)'];
    const args = [];

    if (filters.province_id) { conds.push('u.province_id = ?'); args.push(filters.province_id); }
    if (filters.city_id) { conds.push('u.city_id = ?'); args.push(filters.city_id); }
    if (filters.role_id) { conds.push('u.role_id = ?'); args.push(filters.role_id); }
    if (filters.search) {
      conds.push('(u.club_name LIKE ? OR u.username LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)');
      const term = `%${filters.search}%`;
      args.push(term, term, term, term);
    }

    // KTA status filter
    if (filters.kta_status === 'issued') {
      conds.push("latest_kta.status = 'kta_issued'");
    } else if (filters.kta_status === 'not_issued') {
      conds.push("(latest_kta.status IS NULL OR latest_kta.status != 'kta_issued')");
    } else if (filters.kta_status === 'not_applied') {
      conds.push('latest_kta.status IS NULL');
    } else if (filters.kta_status && filters.kta_status !== 'all') {
      conds.push('latest_kta.status = ?');
      args.push(filters.kta_status);
    }

    const whereClause = conds.join(' AND ');

    const result = await prisma.$queryRawUnsafe(`
      SELECT COUNT(DISTINCT u.id) AS total
      FROM users u
      LEFT JOIN (
        SELECT ka.user_id, ka.status
        FROM kta_applications ka
        INNER JOIN (
          SELECT user_id, MAX(created_at) AS max_created_at
          FROM kta_applications
          GROUP BY user_id
        ) latest ON ka.user_id = latest.user_id AND ka.created_at = latest.max_created_at
      ) latest_kta ON u.id = latest_kta.user_id
      WHERE ${whereClause}
    `, ...args);

    return Number(result[0].total);
  },

  // Get issued KTAs for a region (Pengda/Pengcab to see their issued KTAs)
  async getIssuedKtaMembers(filters = {}) {
    const conds = ["ka.status IN ('approved_pb', 'kta_issued')", 'ka.generated_kta_file_path_pb IS NOT NULL'];
    const args = [];

    if (filters.province_id) { conds.push('ka.province_id = ?'); args.push(filters.province_id); }
    if (filters.city_id) { conds.push('ka.city_id = ?'); args.push(filters.city_id); }
    if (filters.search) {
      conds.push('(ka.club_name LIKE ? OR ka.leader_name LIKE ? OR u.email LIKE ?)');
      const term = `%${filters.search}%`;
      args.push(term, term, term);
    }

    let sql = `
      SELECT ka.id, ka.club_name, ka.leader_name, u.email AS user_email, u.phone AS user_phone,
             ka.status, ka.generated_kta_file_path_pb, ka.kta_barcode_unique_id, ka.kta_issued_at
      FROM kta_applications ka
      JOIN users u ON ka.user_id = u.id
      WHERE ${conds.join(' AND ')}
      ORDER BY ka.updated_at DESC
    `;

    if (filters.limit) { sql += ' LIMIT ?'; args.push(filters.limit); }
    if (filters.offset) { sql += ' OFFSET ?'; args.push(filters.offset); }

    return prisma.$queryRawUnsafe(sql, ...args);
  },

  // Count issued KTA members
  async countIssuedKtaMembers(filters = {}) {
    const conds = ["ka.status IN ('approved_pb', 'kta_issued')", 'ka.generated_kta_file_path_pb IS NOT NULL'];
    const args = [];

    if (filters.province_id) { conds.push('ka.province_id = ?'); args.push(filters.province_id); }
    if (filters.city_id) { conds.push('ka.city_id = ?'); args.push(filters.city_id); }
    if (filters.search) {
      conds.push('(ka.club_name LIKE ? OR ka.leader_name LIKE ? OR u.email LIKE ?)');
      const term = `%${filters.search}%`;
      args.push(term, term, term);
    }

    const result = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) AS total
      FROM kta_applications ka
      JOIN users u ON ka.user_id = u.id
      WHERE ${conds.join(' AND ')}
    `, ...args);

    return Number(result[0].total);
  },
};

module.exports = User;
