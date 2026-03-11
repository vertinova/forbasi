const prisma = require('../lib/prisma');

// Helper: convert BigInt values in a row to Number
function normBigInt(row) {
  if (!row) return row;
  return Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k, typeof v === 'bigint' ? Number(v) : v])
  );
}

const SuperAdmin = {
  async findById(id) {
    return prisma.super_admins.findFirst({ where: { id, is_active: true } });
  },

  async findByUsername(username) {
    return prisma.super_admins.findFirst({ where: { username, is_active: true } });
  },

  async updateLastLogin(id) {
    await prisma.super_admins.update({ where: { id }, data: { last_login: new Date() } });
  },
};

const ActivityLog = {
  async create(data) {
    const { user_id, role_name, activity_type, description, application_id, old_status, new_status } = data;
    await prisma.activity_logs.create({
      data: {
        user_id,
        role_name,
        activity_type,
        description: description || null,
        application_id: application_id || null,
        old_status: old_status || null,
        new_status: new_status || null,
      },
    });
  },

  async findAll(filters = {}) {
    const where = {};
    if (filters.user_id) where.user_id = filters.user_id;
    if (filters.application_id) where.application_id = filters.application_id;
    if (filters.role_name) where.role_name = filters.role_name;

    return prisma.activity_logs.findMany({
      where,
      orderBy: { created_at: 'desc' },
      ...(filters.limit && { take: parseInt(filters.limit) }),
    });
  },
};

const Province = {
  async findAll() {
    return prisma.provinces.findMany({ orderBy: { name: 'asc' } });
  },

  async findById(id) {
    return prisma.provinces.findUnique({ where: { id } });
  },
};

const City = {
  async findByProvinceId(provinceId) {
    return prisma.cities.findMany({
      where: { province_id: parseInt(provinceId) },
      orderBy: { name: 'asc' },
    });
  },

  async findById(id) {
    return prisma.cities.findUnique({ where: { id } });
  },
};

const PushSubscription = {
  async create(data) {
    const { user_id, user_type, endpoint, p256dh_key, auth_key } = data;
    const existing = await prisma.push_subscriptions.findFirst({ where: { endpoint } });
    if (existing) {
      await prisma.push_subscriptions.update({
        where: { id: existing.id },
        data: { user_id, user_type, p256dh_key, auth_key, is_active: true },
      });
      return existing.id;
    }
    const created = await prisma.push_subscriptions.create({
      data: { user_id, user_type, endpoint, p256dh_key, auth_key, subscribed_at: new Date(), is_active: true },
    });
    return created.id;
  },

  async findActive(filters = {}) {
    const where = { is_active: true };
    if (filters.user_type) where.user_type = filters.user_type;
    if (filters.user_id) where.user_id = filters.user_id;
    return prisma.push_subscriptions.findMany({ where });
  },

  async deactivate(endpoint) {
    await prisma.push_subscriptions.updateMany({
      where: { endpoint },
      data: { is_active: false },
    });
  },

  async getStats() {
    const rows = await prisma.$queryRaw`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN user_type = 'user' THEN 1 ELSE 0 END) as users,
        SUM(CASE WHEN user_type = 'pengcab' THEN 1 ELSE 0 END) as pengcab,
        SUM(CASE WHEN user_type = 'pengda' THEN 1 ELSE 0 END) as pengda,
        SUM(CASE WHEN user_type = 'pb' THEN 1 ELSE 0 END) as pb
      FROM push_subscriptions WHERE is_active = 1
    `;
    return normBigInt(rows[0]);
  },
};

const NotificationLog = {
  async create(subscriptionId, status) {
    await prisma.$executeRaw`
      INSERT INTO notifications_log (subscription_id, title, body, sent_at, status)
      VALUES (${subscriptionId}, '', '', NOW(), ${status})
    `;
  },

  async trackClick(subscriptionId) {
    await prisma.$executeRaw`
      UPDATE notifications_log SET clicked_at = NOW()
      WHERE subscription_id = ${subscriptionId}
      ORDER BY sent_at DESC LIMIT 1
    `;
  },

  async getRecentLogs(limit = 50) {
    return prisma.$queryRawUnsafe(
      `SELECT nl.*, ps.user_type, ps.endpoint
       FROM notifications_log nl
       JOIN push_subscriptions ps ON nl.subscription_id = ps.id
       ORDER BY nl.sent_at DESC LIMIT ?`,
      limit
    );
  },
};

// LicenseEvent table does not exist in current schema — return empty stubs
const LicenseEvent = {
  async findAll() { return []; },
  async findById() { return null; },
};

module.exports = {
  SuperAdmin,
  ActivityLog,
  Province,
  City,
  PushSubscription,
  NotificationLog,
  LicenseEvent,
};
