/**
 * External API Controller — Pendaftaran (Registration viewing)
 * View competition registrations, reregistrations scoped by region
 */
const db = require('../lib/db-compat');

exports.getPendaftaran = async (req, res) => {
  try {
    const province_id = req.apiKey.province_id;
    const { type = 'all', status, page = 1, per_page = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(per_page);
    const results = {};

    if (type === 'all' || type === 'kejurnas') {
      let sql = `SELECT kr.*, ke.event_name, kc.category_name, p.name as province_name
                 FROM kejurnas_registrations kr
                 LEFT JOIN kejurnas_events ke ON kr.event_id = ke.id
                 LEFT JOIN kejurnas_categories kc ON kr.category_id = kc.id
                 LEFT JOIN provinces p ON kr.province_id = p.id
                 WHERE kr.province_id = ?`;
      const params = [province_id];
      if (status) { sql += ' AND kr.status = ?'; params.push(status); }
      sql += ` ORDER BY kr.registered_at DESC LIMIT ${parseInt(per_page)} OFFSET ${offset}`;
      const [rows] = await db.query(sql, params);
      results.kejurnas = rows;
    }

    if (type === 'all' || type === 'kejurda') {
      let sql = `SELECT kr.*, kc.category_name
                 FROM kejurda_registrations kr
                 LEFT JOIN kejurda_categories kc ON kr.category_id = kc.id
                 WHERE kr.province_id = ?`;
      const params = [province_id];
      if (status) { sql += ' AND kr.status = ?'; params.push(status); }
      sql += ` ORDER BY kr.created_at DESC LIMIT ${parseInt(per_page)} OFFSET ${offset}`;
      const [rows] = await db.query(sql, params);
      results.kejurda = rows;
    }

    if (type === 'all' || type === 'reregistration') {
      let sql = `SELECT cr.*, kr.club_name, ke.event_name
                 FROM competition_reregistrations cr
                 LEFT JOIN kejurnas_registrations kr ON cr.kejurnas_registration_id = kr.id
                 LEFT JOIN kejurnas_events ke ON kr.event_id = ke.id
                 WHERE kr.province_id = ?`;
      const params = [province_id];
      if (status) { sql += ' AND cr.status = ?'; params.push(status); }
      sql += ` ORDER BY cr.created_at DESC LIMIT ${parseInt(per_page)} OFFSET ${offset}`;
      const [rows] = await db.query(sql, params);
      results.reregistration = rows;
    }

    res.json({ success: true, data: results });
  } catch (err) {
    console.error('getPendaftaran error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data pendaftaran' });
  }
};

exports.getPendaftaranDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query; // kejurnas, kejurda, reregistration
    const province_id = req.apiKey.province_id;

    let row = null;
    if (type === 'kejurnas') {
      const [rows] = await db.query(
        `SELECT kr.*, ke.event_name, kc.category_name, p.name as province_name
         FROM kejurnas_registrations kr
         LEFT JOIN kejurnas_events ke ON kr.event_id = ke.id
         LEFT JOIN kejurnas_categories kc ON kr.category_id = kc.id
         LEFT JOIN provinces p ON kr.province_id = p.id
         WHERE kr.id = ? AND kr.province_id = ?`,
        [id, province_id]
      );
      row = rows[0] || null;
    } else if (type === 'kejurda') {
      const [rows] = await db.query(
        'SELECT * FROM kejurda_registrations WHERE id = ? AND province_id = ?',
        [id, province_id]
      );
      row = rows[0] || null;
    } else if (type === 'reregistration') {
      const [rows] = await db.query(
        `SELECT cr.*, kr.club_name, kr.province_id
         FROM competition_reregistrations cr
         LEFT JOIN kejurnas_registrations kr ON cr.kejurnas_registration_id = kr.id
         WHERE cr.id = ? AND kr.province_id = ?`,
        [id, province_id]
      );
      row = rows[0] || null;
    }

    if (!row) return res.status(404).json({ success: false, message: 'Data pendaftaran tidak ditemukan' });
    res.json({ success: true, data: row });
  } catch (err) {
    console.error('getPendaftaranDetail error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil detail pendaftaran' });
  }
};

exports.getPendaftaranStats = async (req, res) => {
  try {
    const province_id = req.apiKey.province_id;

    const [kejurnas] = await db.query('SELECT COUNT(*) as total FROM kejurnas_registrations WHERE province_id = ?', [province_id]);
    const [kejurda] = await db.query('SELECT COUNT(*) as total FROM kejurda_registrations WHERE province_id = ?', [province_id]);
    const [rereg] = await db.query(
      `SELECT COUNT(*) as total FROM competition_reregistrations cr
       LEFT JOIN kejurnas_registrations kr ON cr.kejurnas_registration_id = kr.id
       WHERE kr.province_id = ?`,
      [province_id]
    );

    res.json({
      success: true,
      data: {
        kejurnas: kejurnas[0].total,
        kejurda: kejurda[0].total,
        reregistration: rereg[0].total
      }
    });
  } catch (err) {
    console.error('getPendaftaranStats error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil statistik pendaftaran' });
  }
};
