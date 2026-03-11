const prisma = require('../lib/prisma');

const KtaConfig = {
  // Pengcab config
  async getPengcabConfig(userId) {
    return prisma.pengcab_kta_configs.findUnique({ where: { user_id: userId } });
  },
  async savePengcabConfig(userId, data) {
    return prisma.pengcab_kta_configs.upsert({
      where: { user_id: userId },
      update: { ...data, updated_at: new Date() },
      create: { user_id: userId, ketua_umum_name: data.ketua_umum_name || '', signature_image_path: data.signature_image_path || null, ...data },
    });
  },

  // Pengda config
  async getPengdaConfig(userId) {
    return prisma.pengda_kta_configs.findUnique({ where: { user_id: userId } });
  },
  async savePengdaConfig(userId, data) {
    return prisma.pengda_kta_configs.upsert({
      where: { user_id: userId },
      update: { ...data, updated_at: new Date() },
      create: { user_id: userId, ketua_umum_name: data.ketua_umum_name || '', ...data },
    });
  },

  // PB config
  async getPbConfig(userId) {
    return prisma.pb_kta_configs.findUnique({ where: { user_id: userId } });
  },
  async savePbConfig(userId, data) {
    return prisma.pb_kta_configs.upsert({
      where: { user_id: userId },
      update: { ...data, updated_at: new Date() },
      create: { user_id: userId, ketua_umum_name: data.ketua_umum_name || '', ...data },
    });
  },

  // KTA Application History
  async addHistory(applicationId, status, notes) {
    await prisma.kta_application_history.create({
      data: { application_id: applicationId, status, notes: notes || null },
    });
  },
  async getHistory(applicationId) {
    return prisma.kta_application_history.findMany({
      where: { application_id: applicationId },
      orderBy: { created_at: 'asc' },
    });
  },

  // Notifications (in-app)
  async getNotifications(userId, limit = 10) {
    return prisma.notifications.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  },
  async createNotification(userId, title, message, type = 'info') {
    await prisma.notifications.create({
      data: { user_id: userId, title, message, type },
    });
  },
  async markNotificationRead(id, userId) {
    await prisma.notifications.updateMany({
      where: { id, user_id: userId },
      data: { is_read: true },
    });
  },
  async markAllRead(userId) {
    await prisma.notifications.updateMany({
      where: { user_id: userId },
      data: { is_read: true },
    });
  },

  // Notification Templates
  async getTemplates() {
    return prisma.notification_templates.findMany({
      orderBy: [{ category: 'asc' }, { template_name: 'asc' }],
    });
  },

  // Visitor Tracking
  async trackVisitor() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await prisma.$executeRaw`
      INSERT INTO visitor_stats (visit_date, visit_count, unique_visitors)
      VALUES (CURDATE(), 1, 1)
      ON DUPLICATE KEY UPDATE visit_count = visit_count + 1
    `;
    await prisma.$executeRaw`
      INSERT INTO total_visitors (id, total_visits, total_unique_visitors) VALUES (1, 1, 1)
      ON DUPLICATE KEY UPDATE total_visits = total_visits + 1
    `;
    return true;
  },
  async getVisitorStats() {
    const totals = await prisma.total_visitors.findUnique({ where: { id: 1 } });
    const daily = await prisma.visitor_stats.findMany({
      orderBy: { visit_date: 'desc' },
      take: 30,
    });
    return {
      totals: totals || { total_visits: 0, total_unique_visitors: 0 },
      daily,
    };
  },

  // Competition Re-registration
  async getReregistration(userId, kejurnasRegId) {
    return prisma.competition_reregistrations.findFirst({
      where: { user_id: userId, kejurnas_registration_id: kejurnasRegId },
    });
  },
  async createReregistration(data) {
    const created = await prisma.competition_reregistrations.create({ data });
    return created.id;
  },
  async updateReregistration(id, data) {
    await prisma.competition_reregistrations.update({ where: { id }, data });
  },
  async getReregistrations(filters = {}) {
    const conds = ['1=1'];
    const args = [];
    if (filters.status) { conds.push('cr.status = ?'); args.push(filters.status); }

    return prisma.$queryRawUnsafe(
      `SELECT cr.*, kr.club_name, kr.level, kc.category_name, u.username,
              p.name as province_name
       FROM competition_reregistrations cr
       JOIN kejurnas_registrations kr ON cr.kejurnas_registration_id = kr.id
       JOIN kejurnas_categories kc ON kr.category_id = kc.id
       JOIN users u ON cr.user_id = u.id
       LEFT JOIN provinces p ON kr.province_id = p.id
       WHERE ${conds.join(' AND ')}
       ORDER BY cr.submitted_at DESC`,
      ...args
    );
  },
};

module.exports = KtaConfig;
