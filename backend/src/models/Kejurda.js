const prisma = require('../lib/prisma');

function normBigInt(row) {
  if (!row) return row;
  return Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k, typeof v === 'bigint' ? Number(v) : v])
  );
}

const Kejurda = {
  // Categories
  async getCategories(pengdaId) {
    const conds = ['1=1'];
    const args = [];
    if (pengdaId) { conds.push('(pengda_id = ? OR pengda_id IS NULL)'); args.push(pengdaId); }
    return prisma.$queryRawUnsafe(
      `SELECT * FROM kejurda_categories WHERE ${conds.join(' AND ')} ORDER BY category_name ASC`,
      ...args
    );
  },

  async createCategory(data) {
    const fields = Object.keys(data);
    const placeholders = fields.map(() => '?').join(', ');
    await prisma.$executeRawUnsafe(
      `INSERT INTO kejurda_categories (${fields.join(', ')}) VALUES (${placeholders})`,
      ...Object.values(data)
    );
    const rows = await prisma.$queryRaw`SELECT LAST_INSERT_ID() AS id`;
    return Number(rows[0].id);
  },

  async deleteCategory(id) {
    try {
      await prisma.$executeRawUnsafe('DELETE FROM kejurda_categories WHERE id = ?', id);
      return true;
    } catch { return false; }
  },

  // Registrations
  async findRegistrationById(id) {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT kr.*, kc.category_name, p.name as province_name, c.name as city_name
       FROM kejurda_registrations kr
       JOIN kejurda_categories kc ON kr.category_id = kc.id
       LEFT JOIN provinces p ON kr.province_id = p.id
       LEFT JOIN cities c ON kr.city_id = c.id
       WHERE kr.id = ?`,
      id
    );
    return rows[0] ? normBigInt(rows[0]) : null;
  },

  async createRegistration(data) {
    const fields = Object.keys(data);
    const placeholders = fields.map(() => '?').join(', ');
    await prisma.$executeRawUnsafe(
      `INSERT INTO kejurda_registrations (${fields.join(', ')}) VALUES (${placeholders})`,
      ...Object.values(data)
    );
    const rows = await prisma.$queryRaw`SELECT LAST_INSERT_ID() AS id`;
    return Number(rows[0].id);
  },

  async findRegistrations(filters = {}) {
    const conds = ['1=1'];
    const args = [];

    if (filters.pengda_id) { conds.push('kr.pengda_id = ?'); args.push(filters.pengda_id); }
    if (filters.pengcab_id) { conds.push('kr.pengcab_id = ?'); args.push(filters.pengcab_id); }
    if (filters.event_id) { conds.push('kr.event_id = ?'); args.push(filters.event_id); }
    if (filters.category_id) { conds.push('kr.category_id = ?'); args.push(filters.category_id); }
    if (filters.status) { conds.push('kr.status = ?'); args.push(filters.status); }
    if (filters.search) {
      conds.push('(kr.club_name LIKE ? OR kr.team_name LIKE ? OR kr.coach_name LIKE ?)');
      const s = `%${filters.search}%`;
      args.push(s, s, s);
    }

    return prisma.$queryRawUnsafe(
      `SELECT kr.*, kc.category_name, p.name as province_name, c.name as city_name,
              u.username as pengcab_name
       FROM kejurda_registrations kr
       JOIN kejurda_categories kc ON kr.category_id = kc.id
       LEFT JOIN provinces p ON kr.province_id = p.id
       LEFT JOIN cities c ON kr.city_id = c.id
       LEFT JOIN users u ON kr.pengcab_id = u.id
       WHERE ${conds.join(' AND ')}
       ORDER BY kr.created_at DESC`,
      ...args
    );
  },

  async deleteRegistration(id) {
    try {
      await prisma.$executeRawUnsafe('DELETE FROM kejurda_registrations WHERE id = ?', id);
      return true;
    } catch { return false; }
  },

  async updateRegistrationStatus(id, data) {
    const fields = Object.keys(data);
    const sets = fields.map(f => `${f} = ?`).join(', ');
    await prisma.$executeRawUnsafe(
      `UPDATE kejurda_registrations SET ${sets} WHERE id = ?`,
      ...Object.values(data), id
    );
  },

  async getStats(filters = {}) {
    const conds = ['1=1'];
    const args = [];
    if (filters.pengda_id) { conds.push('kr.pengda_id = ?'); args.push(filters.pengda_id); }
    if (filters.pengcab_id) { conds.push('kr.pengcab_id = ?'); args.push(filters.pengcab_id); }

    const rows = await prisma.$queryRawUnsafe(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN kr.status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN kr.status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN kr.status = 'rejected' THEN 1 END) as rejected
       FROM kejurda_registrations kr
       WHERE ${conds.join(' AND ')}`,
      ...args
    );
    return normBigInt(rows[0]);
  },

  async searchApprovedClubs(filters = {}) {
    const conds = ["ka.status = 'kta_issued'"];
    const args = [];

    if (filters.province_id) { conds.push('u.province_id = ?'); args.push(filters.province_id); }
    if (filters.city_id) { conds.push('u.city_id = ?'); args.push(filters.city_id); }
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

  // Events
  async getEvents(pengdaId) {
    const conds = ['1=1'];
    const args = [];
    if (pengdaId) { conds.push('pengda_id = ?'); args.push(pengdaId); }
    return prisma.$queryRawUnsafe(
      `SELECT * FROM kejurda_events WHERE ${conds.join(' AND ')} ORDER BY event_date DESC`,
      ...args
    );
  },

  async getEventById(id) {
    const rows = await prisma.$queryRawUnsafe('SELECT * FROM kejurda_events WHERE id = ?', id);
    return rows[0] || null;
  },

  async createEvent(data) {
    const fields = Object.keys(data);
    const placeholders = fields.map(() => '?').join(', ');
    await prisma.$executeRawUnsafe(
      `INSERT INTO kejurda_events (${fields.join(', ')}) VALUES (${placeholders})`,
      ...Object.values(data)
    );
    const rows = await prisma.$queryRaw`SELECT LAST_INSERT_ID() AS id`;
    return Number(rows[0].id);
  },

  async updateEvent(id, data) {
    const fields = Object.keys(data);
    const sets = fields.map(f => `${f} = ?`).join(', ');
    await prisma.$executeRawUnsafe(
      `UPDATE kejurda_events SET ${sets} WHERE id = ?`,
      ...Object.values(data), id
    );
  },

  async deleteEvent(id) {
    await prisma.$executeRawUnsafe('DELETE FROM kejurda_events WHERE id = ?', id);
  },

  // Pengcab list for a pengda's province
  async getPengcabList(provinceId) {
    return prisma.$queryRawUnsafe(
      `SELECT u.id, u.username, c.name as city_name, c.id as city_id
       FROM users u
       LEFT JOIN cities c ON u.city_id = c.id
       WHERE u.role_id = 2 AND u.province_id = ?
       ORDER BY c.name ASC`,
      provinceId
    );
  },
};

module.exports = Kejurda;
