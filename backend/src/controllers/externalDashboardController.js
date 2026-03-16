/**
 * External API Controller — Dashboard Stats
 * Aggregated statistics for regional dashboard
 */
const db = require('../lib/db-compat');

exports.getDashboardStats = async (req, res) => {
  try {
    const province_id = req.apiKey.province_id;
    const region = req.apiKey.region;

    // Users stats
    const [totalUsers] = await db.query('SELECT COUNT(*) as count FROM users WHERE province_id = ?', [province_id]);
    const [anggota] = await db.query('SELECT COUNT(*) as count FROM users WHERE province_id = ? AND role_id = 1', [province_id]);
    const [pengcabCount] = await db.query('SELECT COUNT(*) as count FROM users WHERE province_id = ? AND role_id = 2', [province_id]);

    // KTA stats
    const [ktaTotal] = await db.query(
      'SELECT COUNT(*) as count FROM kta_applications ka JOIN users u ON ka.user_id = u.id WHERE u.province_id = ?',
      [province_id]
    );
    const [ktaIssued] = await db.query(
      "SELECT COUNT(*) as count FROM kta_applications ka JOIN users u ON ka.user_id = u.id WHERE u.province_id = ? AND ka.status = 'kta_issued'",
      [province_id]
    );
    const [ktaPending] = await db.query(
      "SELECT COUNT(*) as count FROM kta_applications ka JOIN users u ON ka.user_id = u.id WHERE u.province_id = ? AND ka.status IN ('pending','approved_pengcab','approved_pengda')",
      [province_id]
    );

    // Kejurda stats (kejurda tables use pengda_id, not province_id directly for some tables)
    const [kejurdaRegs] = await db.query('SELECT COUNT(*) as count FROM kejurda_registrations WHERE province_id = ?', [province_id]);
    const [pengdaUsers] = await db.query('SELECT id FROM users WHERE province_id = ? AND role_id = 3', [province_id]);
    const pengdaIds = pengdaUsers.map(u => u.id);
    let kejurdaEventCount = 0;
    if (pengdaIds.length) {
      const ph = pengdaIds.map(() => '?').join(',');
      const [kejurdaEvents] = await db.query(`SELECT COUNT(*) as count FROM kejurda_events WHERE pengda_id IN (${ph})`, pengdaIds);
      kejurdaEventCount = kejurdaEvents[0].count;
    }

    // Rekomendasi stats
    const [rekoPending] = await db.query("SELECT COUNT(*) as count FROM rekomendasi WHERE region = ? AND status = 'pending'", [region]);
    const [rekoTotal] = await db.query('SELECT COUNT(*) as count FROM rekomendasi WHERE region = ?', [region]);

    // Event applications
    const [eventApps] = await db.query(
      'SELECT COUNT(*) as count FROM event_applications ea JOIN users u ON ea.user_id = u.id WHERE u.province_id = ?',
      [province_id]
    );

    res.json({
      success: true,
      data: {
        users: { total: totalUsers[0].count, anggota: anggota[0].count, pengcab: pengcabCount[0].count },
        kta: { total: ktaTotal[0].count, issued: ktaIssued[0].count, pending: ktaPending[0].count },
        kejurda: { registrations: kejurdaRegs[0].count, events: kejurdaEventCount },
        rekomendasi: { total: rekoTotal[0].count, pending: rekoPending[0].count },
        events: { total: eventApps[0].count }
      }
    });
  } catch (err) {
    console.error('getDashboardStats error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil statistik dashboard' });
  }
};

exports.getLandingStats = async (req, res) => {
  try {
    const region = req.apiKey.region;

    const [heroSlides] = await db.query('SELECT COUNT(*) as count FROM regional_hero_slides WHERE region = ?', [region]);
    const [berita] = await db.query('SELECT COUNT(*) as count FROM regional_berita WHERE region = ?', [region]);
    const [struktur] = await db.query('SELECT COUNT(*) as count FROM regional_struktur WHERE region = ?', [region]);
    const [feedback] = await db.query('SELECT COUNT(*) as count FROM regional_feedback WHERE region = ?', [region]);

    res.json({
      success: true,
      data: {
        hero_slides: heroSlides[0].count,
        berita: berita[0].count,
        struktur: struktur[0].count,
        feedback: feedback[0].count
      }
    });
  } catch (err) {
    console.error('getLandingStats error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil statistik landing' });
  }
};

exports.getAnggotaStats = async (req, res) => {
  try {
    const province_id = req.apiKey.province_id;

    // Per-city breakdown
    const [perCity] = await db.query(
      `SELECT c.name as city_name, c.id as city_id, COUNT(u.id) as total_anggota
       FROM cities c
       LEFT JOIN users u ON c.id = u.city_id AND u.role_id = 1
       WHERE c.province_id = ?
       GROUP BY c.id, c.name
       ORDER BY total_anggota DESC`,
      [province_id]
    );

    // Monthly registrations (last 12 months)
    const [monthly] = await db.query(
      `SELECT DATE_FORMAT(u.created_at, '%Y-%m') as month, COUNT(*) as count
       FROM users u WHERE u.province_id = ? AND u.role_id = 1
       AND u.created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
       GROUP BY month ORDER BY month ASC`,
      [province_id]
    );

    res.json({
      success: true,
      data: { per_city: perCity, monthly_registrations: monthly }
    });
  } catch (err) {
    console.error('getAnggotaStats error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil statistik anggota' });
  }
};
