/**
 * External API Controller — Kejurda & Kategori Event
 * Read kejurda data, registrations, events scoped by region
 */
const db = require('../lib/db-compat');

exports.getKejurdaCategories = async (req, res) => {
  try {
    const province_id = req.apiKey.province_id;
    // kejurda_categories uses pengda_id (user id of pengda), find pengda user first
    const [pengdaUsers] = await db.query('SELECT id FROM users WHERE province_id = ? AND role_id = 3', [province_id]);
    const pengdaIds = pengdaUsers.map(u => u.id);
    if (!pengdaIds.length) return res.json({ success: true, data: [] });
    const placeholders = pengdaIds.map(() => '?').join(',');
    const [rows] = await db.query(
      `SELECT * FROM kejurda_categories WHERE pengda_id IN (${placeholders}) ORDER BY category_name ASC`,
      pengdaIds
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getKejurdaCategories error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data kategori kejurda' });
  }
};

exports.createKejurdaCategory = async (req, res) => {
  try {
    const province_id = req.apiKey.province_id;
    const { category_name, level, quota, pengda_id } = req.body;
    // Use provided pengda_id or find first pengda user in province
    let pid = pengda_id;
    if (!pid) {
      const [pengda] = await db.query('SELECT id FROM users WHERE province_id = ? AND role_id = 3 LIMIT 1', [province_id]);
      pid = pengda.length ? pengda[0].id : null;
    }
    if (!pid) return res.status(400).json({ success: false, message: 'Tidak ditemukan akun Pengda di provinsi ini' });
    const [result] = await db.query(
      'INSERT INTO kejurda_categories (category_name, level, pengda_id, quota_per_pengcab) VALUES (?,?,?,?)',
      [category_name, level || 'umum', pid, parseInt(quota) || 0]
    );
    res.json({ success: true, message: 'Kategori kejurda berhasil ditambahkan', data: { id: result.insertId } });
  } catch (err) {
    console.error('createKejurdaCategory error:', err);
    res.status(500).json({ success: false, message: 'Gagal menambahkan kategori kejurda' });
  }
};

exports.deleteKejurdaCategory = async (req, res) => {
  try {
    const province_id = req.apiKey.province_id;
    const [pengdaUsers] = await db.query('SELECT id FROM users WHERE province_id = ? AND role_id = 3', [province_id]);
    const pengdaIds = pengdaUsers.map(u => u.id);
    if (!pengdaIds.length) return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
    const placeholders = pengdaIds.map(() => '?').join(',');
    await db.query(`DELETE FROM kejurda_categories WHERE id = ? AND pengda_id IN (${placeholders})`, [req.params.id, ...pengdaIds]);
    res.json({ success: true, message: 'Kategori kejurda berhasil dihapus' });
  } catch (err) {
    console.error('deleteKejurdaCategory error:', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus kategori kejurda' });
  }
};

exports.getKejurdaRegistrations = async (req, res) => {
  try {
    const province_id = req.apiKey.province_id;
    const { status, page = 1, per_page = 20 } = req.query;

    let sql = `SELECT kr.*, kc.category_name, u.club_name
               FROM kejurda_registrations kr
               LEFT JOIN kejurda_categories kc ON kr.category_id = kc.id
               LEFT JOIN users u ON kr.club_id = u.id
               WHERE kr.province_id = ?`;
    const params = [province_id];

    if (status) { sql += ' AND kr.status = ?'; params.push(status); }
    sql += ' ORDER BY kr.created_at DESC';
    const offset = (parseInt(page) - 1) * parseInt(per_page);
    sql += ` LIMIT ${parseInt(per_page)} OFFSET ${offset}`;

    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getKejurdaRegistrations error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data pendaftaran kejurda' });
  }
};

exports.approveKejurdaRegistration = async (req, res) => {
  try {
    const province_id = req.apiKey.province_id;
    const { id } = req.params;
    await db.query(
      "UPDATE kejurda_registrations SET status = 'approved', approved_at = NOW() WHERE id = ? AND province_id = ?",
      [id, province_id]
    );
    res.json({ success: true, message: 'Pendaftaran berhasil disetujui' });
  } catch (err) {
    console.error('approveKejurdaRegistration error:', err);
    res.status(500).json({ success: false, message: 'Gagal menyetujui pendaftaran' });
  }
};

exports.rejectKejurdaRegistration = async (req, res) => {
  try {
    const province_id = req.apiKey.province_id;
    const { id } = req.params;
    const { reason } = req.body;
    await db.query(
      "UPDATE kejurda_registrations SET status = 'rejected', rejection_reason = ? WHERE id = ? AND province_id = ?",
      [reason || 'Ditolak', id, province_id]
    );
    res.json({ success: true, message: 'Pendaftaran berhasil ditolak' });
  } catch (err) {
    console.error('rejectKejurdaRegistration error:', err);
    res.status(500).json({ success: false, message: 'Gagal menolak pendaftaran' });
  }
};

exports.getKejurdaEvents = async (req, res) => {
  try {
    const province_id = req.apiKey.province_id;
    const [pengdaUsers] = await db.query('SELECT id FROM users WHERE province_id = ? AND role_id = 3', [province_id]);
    const pengdaIds = pengdaUsers.map(u => u.id);
    if (!pengdaIds.length) return res.json({ success: true, data: [] });
    const placeholders = pengdaIds.map(() => '?').join(',');
    const [rows] = await db.query(
      `SELECT * FROM kejurda_events WHERE pengda_id IN (${placeholders}) ORDER BY event_date DESC`,
      pengdaIds
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getKejurdaEvents error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data event kejurda' });
  }
};

exports.createKejurdaEvent = async (req, res) => {
  try {
    const province_id = req.apiKey.province_id;
    const { event_name, event_date, location, description, status, pengda_id } = req.body;
    let pid = pengda_id;
    if (!pid) {
      const [pengda] = await db.query('SELECT id FROM users WHERE province_id = ? AND role_id = 3 LIMIT 1', [province_id]);
      pid = pengda.length ? pengda[0].id : null;
    }
    if (!pid) return res.status(400).json({ success: false, message: 'Tidak ditemukan akun Pengda di provinsi ini' });
    const currentYear = new Date().getFullYear();
    const [result] = await db.query(
      'INSERT INTO kejurda_events (event_name, event_year, event_date, location, description, status, pengda_id) VALUES (?,?,?,?,?,?,?)',
      [event_name, currentYear, event_date || null, location || null, description || null, status || 'upcoming', pid]
    );
    res.json({ success: true, message: 'Event kejurda berhasil ditambahkan', data: { id: result.insertId } });
  } catch (err) {
    console.error('createKejurdaEvent error:', err);
    res.status(500).json({ success: false, message: 'Gagal menambahkan event kejurda' });
  }
};

exports.updateKejurdaEvent = async (req, res) => {
  try {
    const province_id = req.apiKey.province_id;
    const { id } = req.params;
    const { event_name, event_date, location, description, status } = req.body;
    const [pengdaUsers] = await db.query('SELECT id FROM users WHERE province_id = ? AND role_id = 3', [province_id]);
    const pengdaIds = pengdaUsers.map(u => u.id);
    if (!pengdaIds.length) return res.status(404).json({ success: false, message: 'Event tidak ditemukan' });
    const placeholders = pengdaIds.map(() => '?').join(',');
    await db.query(
      `UPDATE kejurda_events SET event_name=?, event_date=?, location=?, description=?, status=? WHERE id=? AND pengda_id IN (${placeholders})`,
      [event_name, event_date || null, location || null, description || null, status, id, ...pengdaIds]
    );
    res.json({ success: true, message: 'Event kejurda berhasil diperbarui' });
  } catch (err) {
    console.error('updateKejurdaEvent error:', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui event kejurda' });
  }
};

exports.deleteKejurdaEvent = async (req, res) => {
  try {
    const province_id = req.apiKey.province_id;
    const [pengdaUsers] = await db.query('SELECT id FROM users WHERE province_id = ? AND role_id = 3', [province_id]);
    const pengdaIds = pengdaUsers.map(u => u.id);
    if (!pengdaIds.length) return res.status(404).json({ success: false, message: 'Event tidak ditemukan' });
    const placeholders = pengdaIds.map(() => '?').join(',');
    await db.query(`DELETE FROM kejurda_events WHERE id = ? AND pengda_id IN (${placeholders})`, [req.params.id, ...pengdaIds]);
    res.json({ success: true, message: 'Event kejurda berhasil dihapus' });
  } catch (err) {
    console.error('deleteKejurdaEvent error:', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus event kejurda' });
  }
};

/* ── Kategori Event (event_applications jenis) ── */
exports.getKategoriEvent = async (req, res) => {
  try {
    const province_id = req.apiKey.province_id;
    const [rows] = await db.query(
      `SELECT ea.*, u.club_name as penyelenggara_club
       FROM event_applications ea
       LEFT JOIN users u ON ea.user_id = u.id
       WHERE u.province_id = ?
       ORDER BY ea.created_at DESC`,
      [province_id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getKategoriEvent error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data kategori event' });
  }
};

exports.getKejurdaStats = async (req, res) => {
  try {
    const province_id = req.apiKey.province_id;
    const [pengdaUsers] = await db.query('SELECT id FROM users WHERE province_id = ? AND role_id = 3', [province_id]);
    const pengdaIds = pengdaUsers.map(u => u.id);

    let totalCount = 0, pendingCount = 0, approvedCount = 0, catCount = 0, eventCount = 0;
    if (pengdaIds.length) {
      const ph = pengdaIds.map(() => '?').join(',');
      const [total] = await db.query(`SELECT COUNT(*) as count FROM kejurda_registrations WHERE province_id = ?`, [province_id]);
      const [pending] = await db.query(`SELECT COUNT(*) as count FROM kejurda_registrations WHERE province_id = ? AND status = 'pending'`, [province_id]);
      const [approved] = await db.query(`SELECT COUNT(*) as count FROM kejurda_registrations WHERE province_id = ? AND status = 'approved'`, [province_id]);
      const [categories] = await db.query(`SELECT COUNT(*) as count FROM kejurda_categories WHERE pengda_id IN (${ph})`, pengdaIds);
      const [events] = await db.query(`SELECT COUNT(*) as count FROM kejurda_events WHERE pengda_id IN (${ph})`, pengdaIds);
      totalCount = total[0].count; pendingCount = pending[0].count; approvedCount = approved[0].count;
      catCount = categories[0].count; eventCount = events[0].count;
    }

    res.json({
      success: true,
      data: {
        total_registrations: totalCount,
        pending: pendingCount,
        approved: approvedCount,
        total_categories: catCount,
        total_events: eventCount
      }
    });
  } catch (err) {
    console.error('getKejurdaStats error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil statistik kejurda' });
  }
};
