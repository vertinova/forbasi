const router = require('express').Router();
const db = require('../lib/db-compat');

// Public: List approved clubs (for homepage)
router.get('/clubs', async (req, res) => {
  try {
    const { search, province_id, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT ka.id, u.club_name, ka.coach_name, ka.manager_name, ka.logo_path,
             p.name as province_name, c.name as city_name, ka.kta_issued_at
      FROM kta_applications ka
      JOIN users u ON ka.user_id = u.id
      LEFT JOIN provinces p ON ka.province_id = p.id
      LEFT JOIN cities c ON ka.city_id = c.id
      WHERE ka.status = 'kta_issued'
    `;
    const params = [];

    if (search) {
      query += ' AND u.club_name LIKE ?';
      params.push(`%${search}%`);
    }
    if (province_id) {
      query += ' AND ka.province_id = ?';
      params.push(parseInt(province_id));
    }

    query += ' ORDER BY u.club_name ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [rows] = await db.query(query, params);

    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM kta_applications WHERE status = ?',
      ['kta_issued']
    );

    return res.json({
      success: true,
      data: {
        clubs: rows,
        total: countResult[0].total
      }
    });
  } catch (err) {
    console.error('Public clubs error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
});

// Public: Approved Kejurnas teams
router.get('/approved-teams', async (req, res) => {
  try {
    const { category_id, search, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT kr.id, kr.club_name, kr.coach_name, kr.manager_name, kr.logo_path,
             kr.level, kr.is_jawa, kc.category_name,
             p.name as province_name
      FROM kejurnas_registrations kr
      LEFT JOIN kejurnas_categories kc ON kr.category_id = kc.id
      LEFT JOIN provinces p ON kr.province_id = p.id
      WHERE kr.approval_status = 'approved'
    `;
    const params = [];

    if (category_id) {
      query += ' AND kr.category_id = ?';
      params.push(parseInt(category_id));
    }
    if (search) {
      query += ' AND (kr.club_name LIKE ? OR p.name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY kr.club_name ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [rows] = await db.query(query, params);

    // Get categories for filters
    const [categories] = await db.query('SELECT id, category_name FROM kejurnas_categories ORDER BY category_name');

    return res.json({
      success: true,
      data: { teams: rows, categories }
    });
  } catch (err) {
    console.error('Public approved teams error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
});

// Public: Visitor stats (totals only, no sensitive data)
router.get('/visitor-stats', async (req, res) => {
  try {
    const [totalsRows] = await db.query(
      'SELECT total_visits, total_unique_visitors FROM total_visitors WHERE id = 1'
    );
    const [daily] = await db.query(
      `SELECT visit_date as date, visit_count
       FROM visitor_stats
       ORDER BY visit_date DESC
       LIMIT 7`
    );
    const totals = totalsRows[0] || { total_visits: 0, total_unique_visitors: 0 };
    return res.json({ success: true, data: { totals, daily } });
  } catch (err) {
    console.error('Public visitor stats error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
});

// Public: KTA verification
router.get('/verify-kta/:barcode_id', async (req, res) => {
  try {
    const { barcode_id } = req.params;
    const [rows] = await db.query(
      `SELECT ka.club_name, ka.coach_name, ka.manager_name,
              p.name as province_name, c.name as city_name,
              ka.kta_issued_at, ka.kta_barcode_unique_id
       FROM kta_applications ka
       LEFT JOIN provinces p ON ka.province_id = p.id
       LEFT JOIN cities c ON ka.city_id = c.id
       WHERE ka.kta_barcode_unique_id = ? AND ka.status = 'kta_issued'`,
      [barcode_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'KTA tidak ditemukan atau belum aktif' });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Verify KTA error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
});

module.exports = router;

