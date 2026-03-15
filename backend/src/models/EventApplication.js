const prisma = require('../lib/prisma');

const EventApplication = {
  async create(data) {
    const app = await prisma.event_applications.create({ data });
    return app.id;
  },

  async findById(id) {
    return prisma.event_applications.findUnique({ where: { id } });
  },

  async update(id, data) {
    await prisma.event_applications.update({ where: { id }, data });
    return true;
  },

  async findByUserId(userId, jenis) {
    const where = { user_id: userId };
    if (jenis) where.jenis_pengajuan = jenis;
    return prisma.event_applications.findMany({
      where,
      orderBy: { created_at: 'desc' }
    });
  },

  async findAll(filters = {}) {
    const where = {};
    if (filters.jenis_pengajuan) where.jenis_pengajuan = filters.jenis_pengajuan;
    if (filters.status) where.status = filters.status;
    if (filters.user_id) where.user_id = filters.user_id;
    if (filters.search) {
      where.OR = [
        { nama_event: { contains: filters.search } },
        { lokasi: { contains: filters.search } },
        { penyelenggara: { contains: filters.search } }
      ];
    }

    const [data, total] = await Promise.all([
      prisma.event_applications.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: filters.limit ? parseInt(filters.limit) : 50,
        skip: filters.offset ? parseInt(filters.offset) : 0
      }),
      prisma.event_applications.count({ where })
    ]);

    return { data, total };
  },

  // Check kejurcab limit: max 1 per pengcab per year
  async countKejurcabByUserAndYear(userId, year) {
    return prisma.event_applications.count({
      where: {
        user_id: userId,
        jenis_pengajuan: 'kejurcab',
        tanggal_mulai: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`)
        }
      }
    });
  },

  // Get events pending pengcab approval (for pengcab to review penyelenggara events in their area)
  async findPendingPengcabApproval(provinceId, cityId) {
    const db = require('../config/database');
    const [rows] = await db.query(`
      SELECT ea.*, u.club_name as nama_organisasi, u.username, u.province_id, u.city_id,
             p.name as province_name, c.name as city_name
      FROM event_applications ea
      JOIN users u ON ea.user_id = u.id
      LEFT JOIN provinces p ON u.province_id = p.id
      LEFT JOIN cities c ON u.city_id = c.id
      WHERE ea.jenis_pengajuan = 'event_penyelenggara'
        AND ea.status = 'submitted'
        AND u.province_id = ?
      ORDER BY ea.created_at DESC
    `, [provinceId]);
    return rows;
  },

  // Get events pending admin approval
  async findPendingAdminApproval(filters = {}) {
    const db = require('../config/database');
    let conditions = [`(
      (ea.jenis_pengajuan = 'event_penyelenggara' AND ea.status = 'approved_pengcab') OR
      (ea.jenis_pengajuan = 'kejurcab' AND ea.status = 'submitted')
    )`];
    const args = [];

    if (filters.search) {
      conditions.push('(ea.nama_event LIKE ? OR u.club_name LIKE ?)');
      args.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    const [rows] = await db.query(`
      SELECT ea.*, u.club_name as nama_organisasi, u.username, u.province_id, u.city_id,
             p.name as province_name, c.name as city_name
      FROM event_applications ea
      JOIN users u ON ea.user_id = u.id
      LEFT JOIN provinces p ON u.province_id = p.id
      LEFT JOIN cities c ON u.city_id = c.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY ea.created_at DESC
    `, args);
    return rows;
  },

  // Get all events with user info (for admin overview)
  async findAllWithUser(filters = {}) {
    const db = require('../config/database');
    let conditions = ['1=1'];
    const args = [];

    if (filters.jenis_pengajuan) {
      conditions.push('ea.jenis_pengajuan = ?');
      args.push(filters.jenis_pengajuan);
    }
    if (filters.status) {
      conditions.push('ea.status = ?');
      args.push(filters.status);
    }
    if (filters.search) {
      conditions.push('(ea.nama_event LIKE ? OR u.club_name LIKE ?)');
      args.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    const [rows] = await db.query(`
      SELECT ea.*, u.club_name as nama_organisasi, u.username, u.province_id, u.city_id,
             p.name as province_name, c.name as city_name
      FROM event_applications ea
      JOIN users u ON ea.user_id = u.id
      LEFT JOIN provinces p ON u.province_id = p.id
      LEFT JOIN cities c ON u.city_id = c.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY ea.created_at DESC
    `, args);
    return rows;
  }
};

module.exports = EventApplication;
