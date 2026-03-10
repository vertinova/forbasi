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
};

module.exports = User;
