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

const LicenseApplication = {
  async findById(id) {
    const app = await prisma.license_applications.findUnique({
      where: { id },
      include: { license_user: { select: { username: true, full_name: true, email: true, phone: true, role: true } } }
    });
    if (!app) return null;
    return {
      ...normBigInt(app),
      username: app.license_user?.username,
      full_name: app.license_user?.full_name,
      email: app.license_user?.email,
      phone: app.license_user?.phone,
      user_role: app.license_user?.role,
      license_type: app.jenis_lisensi,
      biaya_lisensi: app.biaya_lisensi ? Number(app.biaya_lisensi) : 0,
    };
  },

  async findByUserId(userId) {
    const apps = await prisma.license_applications.findMany({
      where: { user_id: userId },
      orderBy: { submitted_at: 'desc' },
    });
    return apps.map(a => ({
      ...normBigInt(a),
      license_type: a.jenis_lisensi,
      biaya_lisensi: a.biaya_lisensi ? Number(a.biaya_lisensi) : 0,
    }));
  },

  async create(data) {
    const app = await prisma.license_applications.create({ data });
    return app.id;
  },

  async update(id, data) {
    await prisma.license_applications.update({ where: { id }, data });
    return true;
  },

  async findAll(filters = {}) {
    const conds = ['1=1'];
    const args = [];
    if (filters.status) { conds.push('la.status = ?'); args.push(filters.status); }
    if (filters.jenis_lisensi) { conds.push('la.jenis_lisensi = ?'); args.push(filters.jenis_lisensi); }
    if (filters.search) {
      conds.push('(lu.full_name LIKE ? OR lu.username LIKE ? OR lu.email LIKE ?)');
      const s = `%${filters.search}%`;
      args.push(s, s, s);
    }
    try {
      const rows = await prisma.$queryRawUnsafe(
        `SELECT la.*, la.jenis_lisensi as license_type, lu.username, lu.full_name, lu.email, lu.phone, lu.role as user_role
         FROM license_applications la
         JOIN license_users lu ON la.user_id = lu.id
         WHERE ${conds.join(' AND ')}
         ORDER BY la.submitted_at DESC`,
        ...args
      );
      return rows.map(r => normBigInt(r));
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

const LicenseConfig = {
  async findAll() {
    const configs = await prisma.license_configs.findMany({ orderBy: { id: 'asc' } });
    return configs.map(c => normBigInt(c));
  },

  async findByJenis(jenis_lisensi) {
    const config = await prisma.license_configs.findUnique({ where: { jenis_lisensi } });
    return config ? normBigInt(config) : null;
  },

  async upsert(jenis_lisensi, data) {
    const result = await prisma.license_configs.upsert({
      where: { jenis_lisensi },
      update: { ...data, updated_at: new Date() },
      create: { jenis_lisensi, ...data },
    });
    return normBigInt(result);
  },
};

module.exports = { LicenseUser, LicenseApplication, LicenseConfig };
