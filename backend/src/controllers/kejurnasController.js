const Kejurnas = require('../models/Kejurnas');
const User = require('../models/User');
const ExcelJS = require('exceljs');

// Java provinces
const JAWA_PROVINCES = [31, 32, 33, 34, 35, 36]; // DKI Jakarta, Jabar, Jateng, DIY, Jatim, Banten

const getRegion = (provinceId) => {
  return JAWA_PROVINCES.includes(provinceId) ? 'Jawa' : 'Luar Jawa';
};

// Get kejurnas categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Kejurnas.getCategories();
    return res.json({ success: true, data: categories });
  } catch (err) {
    console.error('Get categories error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Search approved clubs for registration
exports.searchClubs = async (req, res) => {
  try {
    const { search } = req.query;
    const filters = {};

    // Pengda can only see clubs from their province
    if (req.user.role_id === 3) {
      const currentUser = await User.findById(req.user.id);
      filters.province_id = currentUser.province_id;
    }

    if (search) filters.search = search;

    const clubs = await Kejurnas.searchApprovedClubs(filters);
    return res.json({ success: true, data: clubs });
  } catch (err) {
    console.error('Search clubs error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Register team for kejurnas
exports.registerTeam = async (req, res) => {
  try {
    const { club_id, event_id, category_id, level, club_name, coach_name, manager_name, logo_path, province_id } = req.body;

    if (!club_id || !category_id || !club_name) {
      return res.status(400).json({ success: false, message: 'Data pendaftaran tidak lengkap' });
    }

    const regData = {
      pengda_id: req.user.id,
      club_id,
      event_id: event_id || null,
      category_id,
      level: level || null,
      club_name,
      coach_name: coach_name || '',
      manager_name: manager_name || '',
      logo_path: logo_path || null,
      province_id: province_id || null,
      region: getRegion(province_id),
      created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };

    const regId = await Kejurnas.createRegistration(regData);

    return res.status(201).json({
      success: true,
      message: 'Tim berhasil didaftarkan',
      data: { id: regId }
    });
  } catch (err) {
    console.error('Register team error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Get registrations
exports.getRegistrations = async (req, res) => {
  try {
    const { category_id, region, search } = req.query;
    const filters = {};

    if (category_id) filters.category_id = parseInt(category_id);
    if (region) filters.region = region;
    if (search) filters.search = search;

    // Pengda sees only their registrations
    if (req.user.role_id === 3) {
      filters.pengda_id = req.user.id;
    }

    const registrations = await Kejurnas.findRegistrations(filters);
    return res.json({ success: true, data: registrations });
  } catch (err) {
    console.error('Get registrations error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Delete registration
exports.deleteRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const reg = await Kejurnas.findRegistrationById(parseInt(id));

    if (!reg) {
      return res.status(404).json({ success: false, message: 'Pendaftaran tidak ditemukan' });
    }

    // Only pengda who registered or PB can delete
    if (req.user.role_id === 3 && reg.pengda_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }

    await Kejurnas.deleteRegistration(parseInt(id));
    return res.json({ success: true, message: 'Pendaftaran berhasil dihapus' });
  } catch (err) {
    console.error('Delete registration error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Get kejurnas stats
exports.getStats = async (req, res) => {
  try {
    const filters = {};
    if (req.user.role_id === 3) {
      filters.pengda_id = req.user.id;
    }

    const stats = await Kejurnas.getStats(filters);
    return res.json({ success: true, data: stats });
  } catch (err) {
    console.error('Get kejurnas stats error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// PB: Approve registration
exports.approveRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const reg = await Kejurnas.findRegistrationById(parseInt(id));
    if (!reg) {
      return res.status(404).json({ success: false, message: 'Pendaftaran tidak ditemukan' });
    }

    await Kejurnas.updateRegistrationStatus(parseInt(id), {
      status: 'approved',
      approved_by: req.user.id,
      approved_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
    });

    return res.json({ success: true, message: 'Pendaftaran disetujui' });
  } catch (err) {
    console.error('Approve registration error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// PB: Reject registration
exports.rejectRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const reg = await Kejurnas.findRegistrationById(parseInt(id));
    if (!reg) {
      return res.status(404).json({ success: false, message: 'Pendaftaran tidak ditemukan' });
    }

    await Kejurnas.updateRegistrationStatus(parseInt(id), {
      status: 'rejected',
      rejected_by: req.user.id,
      rejection_reason: reason || '',
      rejected_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
    });

    return res.json({ success: true, message: 'Pendaftaran ditolak' });
  } catch (err) {
    console.error('Reject registration error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Events CRUD
exports.getEvents = async (req, res) => {
  try {
    const events = await Kejurnas.getEvents();
    return res.json({ success: true, data: events });
  } catch (err) {
    console.error('Get events error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const { event_name, event_date, location, description } = req.body;
    if (!event_name || !event_date) {
      return res.status(400).json({ success: false, message: 'Nama event dan tanggal wajib diisi' });
    }

    const id = await Kejurnas.createEvent({
      event_name,
      event_date,
      location: location || '',
      description: description || '',
      created_by: req.user.id,
      created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
    });

    return res.status(201).json({ success: true, message: 'Event berhasil dibuat', data: { id } });
  } catch (err) {
    console.error('Create event error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { event_name, event_date, location, description } = req.body;
    const event = await Kejurnas.getEventById(parseInt(id));
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event tidak ditemukan' });
    }

    const updateData = {};
    if (event_name) updateData.event_name = event_name;
    if (event_date) updateData.event_date = event_date;
    if (location !== undefined) updateData.location = location;
    if (description !== undefined) updateData.description = description;

    await Kejurnas.updateEvent(parseInt(id), updateData);
    return res.json({ success: true, message: 'Event berhasil diperbarui' });
  } catch (err) {
    console.error('Update event error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Kejurnas.getEventById(parseInt(id));
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event tidak ditemukan' });
    }

    await Kejurnas.deleteEvent(parseInt(id));
    return res.json({ success: true, message: 'Event berhasil dihapus' });
  } catch (err) {
    console.error('Delete event error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Export registrations to Excel
exports.exportRegistrations = async (req, res) => {
  try {
    const { category_id, region } = req.query;
    const filters = {};
    if (category_id) filters.category_id = parseInt(category_id);
    if (region) filters.region = region;

    const registrations = await Kejurnas.findRegistrations(filters);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Kejurnas Registrations');

    sheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Nama Klub', key: 'club_name', width: 25 },
      { header: 'Kategori', key: 'category_name', width: 20 },
      { header: 'Pelatih', key: 'coach_name', width: 20 },
      { header: 'Manajer', key: 'manager_name', width: 20 },
      { header: 'Provinsi', key: 'province_name', width: 20 },
      { header: 'Region', key: 'region', width: 12 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Tanggal Daftar', key: 'created_at', width: 18 }
    ];

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D3557' } };
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    registrations.forEach((row, idx) => {
      sheet.addRow({ no: idx + 1, ...row });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=kejurnas_${Date.now()}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Export registrations error:', err);
    return res.status(500).json({ success: false, message: 'Gagal export data' });
  }
};

// PB: Get summary statistics (total by category / level / status)
exports.getSummary = async (req, res) => {
  try {
    const db = require('../lib/db-compat');
    const [rows] = await db.query(`
      SELECT
        COUNT(DISTINCT kr.id) as total_registrations,
        COUNT(DISTINCT CASE WHEN kr.status = 'pending' THEN kr.id END) as total_pending,
        COUNT(DISTINCT CASE WHEN kr.status = 'approved' THEN kr.id END) as total_approved,
        COUNT(DISTINCT CASE WHEN kr.status = 'rejected' THEN kr.id END) as total_rejected,
        COALESCE(SUM(CASE WHEN kr.status != 'rejected' THEN kr.total_members ELSE 0 END), 0) as total_participants,
        COALESCE(SUM(CASE WHEN kr.status = 'approved' THEN kr.total_members ELSE 0 END), 0) as total_approved_participants,
        COALESCE(SUM(CASE WHEN kr.status = 'pending' THEN kr.total_members ELSE 0 END), 0) as total_pending_participants
      FROM kejurnas_registrations kr
      LEFT JOIN kejurnas_categories kc ON kr.category_id = kc.id
    `);
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Get kejurnas summary error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// PB: Get list of all Pengda (for filter dropdown)
exports.getPengdaList = async (req, res) => {
  try {
    const db = require('../lib/db-compat');
    const [rows] = await db.query(`
      SELECT u.id, u.username, p.name as province_name, p.id as province_id
      FROM users u
      LEFT JOIN provinces p ON u.province_id = p.id
      WHERE u.role_id = 3
      ORDER BY p.name ASC
    `);
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Get pengda list error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// PB: Get per-pengda statistics with quota tracking
exports.getStatisticsPerPengda = async (req, res) => {
  try {
    const db = require('../lib/db-compat');

    // Get latest event
    const [events] = await db.query('SELECT id FROM kejurnas_events ORDER BY event_date DESC LIMIT 1');
    if (!events.length) {
      return res.json({ success: true, data: [], message: 'Belum ada event kejurnas' });
    }
    const latestEventId = events[0].id;

    const JAWA_PROVINCE_IDS = [11, 12, 13, 14, 15, 16]; // DKI, Jabar, Jateng, DIY, Jatim, Banten
    const KALBAR_ID = 20;

    const [rows] = await db.query(`
      SELECT
        kc.id as category_id, kc.category_name, kc.level,
        kc.quota_per_pengda_jawa, kc.quota_per_pengda_luar_jawa,
        u.id as pengda_id, u.username as pengda_name,
        p.name as province_name, p.id as province_id,
        COUNT(CASE WHEN kr.status != 'rejected' THEN 1 END) as filled,
        COUNT(CASE WHEN kr.status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN kr.status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN kr.status = 'rejected' THEN 1 END) as rejected
      FROM kejurnas_categories kc
      CROSS JOIN users u
      LEFT JOIN provinces p ON u.province_id = p.id
      LEFT JOIN kejurnas_registrations kr ON kc.id = kr.category_id
        AND kr.pengda_id = u.id AND kr.event_id = ?
      WHERE u.role_id = 3
      GROUP BY kc.id, kc.category_name, kc.level, u.id, u.username, p.name, p.id
      ORDER BY p.name, kc.category_name, kc.level
    `, [latestEventId]);

    const statistics = rows.map(row => {
      const isJawa = JAWA_PROVINCE_IDS.includes(row.province_id);
      const isKalbar = row.province_id === KALBAR_ID;
      const quota = isKalbar ? 4 : (isJawa ? row.quota_per_pengda_jawa : row.quota_per_pengda_luar_jawa);
      return {
        ...row,
        is_jawa: isJawa ? 1 : 0,
        is_special: isKalbar ? 1 : 0,
        quota,
        available: quota - row.filled
      };
    });

    return res.json({ success: true, data: statistics });
  } catch (err) {
    console.error('Get kejurnas per-pengda stats error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

