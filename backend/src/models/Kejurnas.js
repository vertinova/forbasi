const prisma = require('../lib/prisma');

function normBigInt(row) {
  if (!row) return row;
  return Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k, typeof v === 'bigint' ? Number(v) : v])
  );
}

const Kejurnas = {
  async getCategories() {
    return prisma.kejurnas_categories.findMany({ orderBy: { category_name: 'asc' } });
  },

  async findRegistrationById(id) {
    const rows = await prisma.$queryRaw`
      SELECT kr.*, kc.category_name, p.name as province_name
      FROM kejurnas_registrations kr
      JOIN kejurnas_categories kc ON kr.category_id = kc.id
      LEFT JOIN provinces p ON kr.province_id = p.id
      WHERE kr.id = ${id}
    `;
    return rows[0] || null;
  },

  async createRegistration(data) {
    const fields = Object.keys(data);
    const placeholders = fields.map(() => '?').join(', ');
    await prisma.$executeRawUnsafe(
      `INSERT INTO kejurnas_registrations (${fields.join(', ')}) VALUES (${placeholders})`,
      ...Object.values(data)
    );
    const rows = await prisma.$queryRaw`SELECT LAST_INSERT_ID() AS id`;
    return Number(rows[0].id);
  },

  async findRegistrations(filters = {}) {
    const conds = ['1=1'];
    const args = [];

    if (filters.pengda_id) { conds.push('kr.pengda_id = ?'); args.push(filters.pengda_id); }
    if (filters.category_id) { conds.push('kr.category_id = ?'); args.push(filters.category_id); }
    if (filters.province_id) { conds.push('kr.province_id = ?'); args.push(filters.province_id); }
    if (filters.search) {
      conds.push('(kr.club_name LIKE ? OR kr.coach_name LIKE ?)');
      const s = `%${filters.search}%`;
      args.push(s, s);
    }

    return prisma.$queryRawUnsafe(
      `SELECT kr.*, kc.category_name, p.name as province_name
       FROM kejurnas_registrations kr
       JOIN kejurnas_categories kc ON kr.category_id = kc.id
       LEFT JOIN provinces p ON kr.province_id = p.id
       WHERE ${conds.join(' AND ')}
       ORDER BY kr.registered_at DESC`,
      ...args
    );
  },

  async deleteRegistration(id) {
    try {
      await prisma.kejurnas_registrations.delete({ where: { id } });
      return true;
    } catch { return false; }
  },

  async getStats(filters = {}) {
    const conds = ['1=1'];
    const args = [];
    if (filters.pengda_id) { conds.push('kr.pengda_id = ?'); args.push(filters.pengda_id); }

    const rows = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as total, COUNT(DISTINCT kr.club_id) as total_clubs
       FROM kejurnas_registrations kr
       WHERE ${conds.join(' AND ')}`,
      ...args
    );
    return normBigInt(rows[0]);
  },

  async searchApprovedClubs(filters = {}) {
    const conds = ["ka.status = 'kta_issued'"];
    const args = [];

    if (filters.province_id) { conds.push('u.province_id = ?'); args.push(filters.province_id); }
    if (filters.search) {
      conds.push('(u.club_name LIKE ? OR ka.coach_name LIKE ?)');
      const s = `%${filters.search}%`;
      args.push(s, s);
    }

    return prisma.$queryRawUnsafe(
      `SELECT ka.id, ka.user_id, u.club_name, ka.coach_name, ka.manager_name,
              ka.logo_path, p.name as province_name, c.name as city_name,
              u.province_id, u.city_id
       FROM kta_applications ka
       JOIN users u ON ka.user_id = u.id
       LEFT JOIN provinces p ON u.province_id = p.id
       LEFT JOIN cities c ON u.city_id = c.id
       WHERE ${conds.join(' AND ')}
       ORDER BY u.club_name ASC LIMIT 20`,
      ...args
    );
  },

  async updateRegistrationStatus(id, data) {
    const fields = Object.keys(data);
    const sets = fields.map(f => `${f} = ?`).join(', ');
    await prisma.$executeRawUnsafe(
      `UPDATE kejurnas_registrations SET ${sets} WHERE id = ?`,
      ...Object.values(data), id
    );
  },

  // Events
  async getEvents() {
    return prisma.kejurnas_events.findMany({ orderBy: { event_date: 'desc' } });
  },

  async getEventById(id) {
    return prisma.kejurnas_events.findUnique({ where: { id } });
  },

  async createEvent(data) {
    const event = await prisma.kejurnas_events.create({ data });
    return event.id;
  },

  async updateEvent(id, data) {
    await prisma.kejurnas_events.update({ where: { id }, data });
  },

  async deleteEvent(id) {
    await prisma.kejurnas_events.delete({ where: { id } });
  },
};

module.exports = Kejurnas;
