/**
 * External API Controller — Users & Anggota KTA
 * View users, members, KTA data scoped by region/province
 */
const db = require('../lib/db-compat');

exports.getUsers = async (req, res) => {
  try {
    const province_id = req.apiKey.province_id;
    const { role_id, city_id, search, page = 1, per_page = 20 } = req.query;

    let sql = `SELECT u.id, u.username, u.email, u.phone, u.club_name, u.school_name,
               u.role_id, u.province_id, u.city_id, u.created_at, u.updated_at,
               r.role_name, p.name as province_name, c.name as city_name
               FROM users u
               LEFT JOIN roles r ON u.role_id = r.id
               LEFT JOIN provinces p ON u.province_id = p.id
               LEFT JOIN cities c ON u.city_id = c.id
               WHERE u.province_id = ?`;
    const params = [province_id];

    if (role_id) { sql += ' AND u.role_id = ?'; params.push(parseInt(role_id)); }
    if (city_id) { sql += ' AND u.city_id = ?'; params.push(parseInt(city_id)); }
    if (search) { sql += ' AND (u.club_name LIKE ? OR u.username LIKE ? OR u.email LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }

    // Count
    let countSql = sql.replace(/SELECT .+ FROM/, 'SELECT COUNT(*) as total FROM');
    const [countResult] = await db.query(countSql, params);

    const offset = (parseInt(page) - 1) * parseInt(per_page);
    sql += ` ORDER BY u.created_at DESC LIMIT ${parseInt(per_page)} OFFSET ${offset}`;
    const [rows] = await db.query(sql, params);

    res.json({
      success: true,
      data: rows,
      pagination: { total: countResult[0].total, page: parseInt(page), per_page: parseInt(per_page) }
    });
  } catch (err) {
    console.error('getUsers error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data users' });
  }
};

exports.getUserDetail = async (req, res) => {
  try {
    const province_id = req.apiKey.province_id;
    const { id } = req.params;

    const [rows] = await db.query(
      `SELECT u.id, u.username, u.email, u.phone, u.address, u.club_name, u.school_name,
       u.role_id, u.province_id, u.city_id, u.created_at, u.updated_at,
       r.role_name, p.name as province_name, c.name as city_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN provinces p ON u.province_id = p.id
       LEFT JOIN cities c ON u.city_id = c.id
       WHERE u.id = ? AND u.province_id = ?`,
      [id, province_id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('getUserDetail error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil detail user' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const province_id = req.apiKey.province_id;
    const { id } = req.params;
    const { club_name, email, phone, address, school_name } = req.body;

    const [existing] = await db.query('SELECT id FROM users WHERE id = ? AND province_id = ?', [id, province_id]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });

    const updates = [];
    const params = [];
    if (club_name !== undefined) { updates.push('club_name = ?'); params.push(club_name); }
    if (email !== undefined) { updates.push('email = ?'); params.push(email); }
    if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
    if (address !== undefined) { updates.push('address = ?'); params.push(address); }
    if (school_name !== undefined) { updates.push('school_name = ?'); params.push(school_name); }

    if (!updates.length) return res.status(400).json({ success: false, message: 'Tidak ada data yang diubah' });

    params.push(id, province_id);
    await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ? AND province_id = ?`, params);
    res.json({ success: true, message: 'User berhasil diperbarui' });
  } catch (err) {
    console.error('updateUser error:', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui user' });
  }
};

exports.getUserStats = async (req, res) => {
  try {
    const province_id = req.apiKey.province_id;

    const [total] = await db.query('SELECT COUNT(*) as count FROM users WHERE province_id = ?', [province_id]);
    const [anggota] = await db.query('SELECT COUNT(*) as count FROM users WHERE province_id = ? AND role_id = 1', [province_id]);
    const [pengcab] = await db.query('SELECT COUNT(*) as count FROM users WHERE province_id = ? AND role_id = 2', [province_id]);

    res.json({
      success: true,
      data: {
        total: total[0].count,
        anggota: anggota[0].count,
        pengcab: pengcab[0].count
      }
    });
  } catch (err) {
    console.error('getUserStats error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil statistik user' });
  }
};

exports.getAnggotaKta = async (req, res) => {
  try {
    const province_id = req.apiKey.province_id;
    const { status, city_id, search, page = 1, per_page = 20 } = req.query;

    let sql = `SELECT u.id, u.username, u.club_name, u.email, u.phone, u.city_id,
               c.name as city_name,
               ka.id as kta_id, ka.status as kta_status, ka.kta_barcode_unique_id,
               ka.kta_issued_at, ka.created_at as kta_created_at
               FROM users u
               LEFT JOIN (
                 SELECT ka1.* FROM kta_applications ka1
                 INNER JOIN (SELECT user_id, MAX(id) as max_id FROM kta_applications GROUP BY user_id) ka2
                 ON ka1.id = ka2.max_id
               ) ka ON u.id = ka.user_id
               LEFT JOIN cities c ON u.city_id = c.id
               WHERE u.province_id = ? AND u.role_id = 1`;
    const params = [province_id];

    if (status === 'active') { sql += " AND ka.status = 'kta_issued'"; }
    else if (status === 'no_kta') { sql += ' AND ka.id IS NULL'; }
    else if (status) { sql += ' AND ka.status = ?'; params.push(status); }
    if (city_id) { sql += ' AND u.city_id = ?'; params.push(parseInt(city_id)); }
    if (search) { sql += ' AND (u.club_name LIKE ? OR u.username LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    const offset = (parseInt(page) - 1) * parseInt(per_page);
    sql += ` ORDER BY u.created_at DESC LIMIT ${parseInt(per_page)} OFFSET ${offset}`;

    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getAnggotaKta error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data anggota KTA' });
  }
};
