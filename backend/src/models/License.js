const prisma = require('../lib/prisma');

function normBigInt(row) {
  if (!row) return row;
  return Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k, typeof v === 'bigint' ? Number(v) : v])
  );
}

const LicenseUser = {
  async findById(id) {
    return prisma.license_users.findUnique({ where: { id } });
  },

  async findByUsername(username) {
    return prisma.license_users.findUnique({ where: { username } });
  },

  async findByEmail(email) {
    return prisma.license_users.findFirst({ where: { email } });
  },

  async create(data) {
    const { username, password, email, role } = data;
    const user = await prisma.license_users.create({
      data: { username, password, email, role, is_active: true },
    });
    return user.id;
  },

  async updateLastLogin(id) {
    await prisma.license_users.update({ where: { id }, data: { last_login: new Date() } });
  },
};

// license_applications table does not exist in current schema — stub methods
const LicenseApplication = {
  async findById() { return null; },
  async findByUserId() { return []; },
  async create() { return null; },
  async update() { return false; },

  async findAll(filters = {}) {
    const conds = ['1=1'];
    const args = [];
    if (filters.status) { conds.push('la.status = ?'); args.push(filters.status); }
    if (filters.jenis_lisensi) { conds.push('la.jenis_lisensi = ?'); args.push(filters.jenis_lisensi); }
    if (filters.search) {
      conds.push('(la.nama_lengkap LIKE ? OR la.email LIKE ? OR la.no_telepon LIKE ?)');
      const s = `%${filters.search}%`;
      args.push(s, s, s);
    }
    try {
      return await prisma.$queryRawUnsafe(
        `SELECT la.*, lu.username, lu.role as user_role
         FROM license_applications la
         JOIN license_users lu ON la.user_id = lu.id
         WHERE ${conds.join(' AND ')}
         ORDER BY la.submitted_at DESC`,
        ...args
      );
    } catch { return []; }
  },

  async getStats() {
    try {
      const rows = await prisma.$queryRaw`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'proses' THEN 1 ELSE 0 END) as proses,
          SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
          SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
          SUM(CASE WHEN jenis_lisensi = 'pelatih' THEN 1 ELSE 0 END) as pelatih,
          SUM(CASE WHEN jenis_lisensi IN ('juri_muda', 'juri_madya') THEN 1 ELSE 0 END) as juri
        FROM license_applications
      `;
      return normBigInt(rows[0]);
    } catch { return { total: 0, pending: 0, proses: 0, approved: 0, rejected: 0, pelatih: 0, juri: 0 }; }
  },
};

module.exports = { LicenseUser, LicenseApplication };
