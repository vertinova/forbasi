const Kejurda = require('../models/Kejurda');
const User = require('../models/User');
const ExcelJS = require('exceljs');

// Get kejurda categories (scoped to pengda)
exports.getCategories = async (req, res) => {
  try {
    const pengdaId = req.user.role_id === 3 ? req.user.id : null;
    // Pengcab: get categories from their pengda
    let effectivePengdaId = pengdaId;
    if (req.user.role_id === 2) {
      const currentUser = await User.findById(req.user.id);
      // Find pengda for this pengcab's province
      const db = require('../lib/db-compat');
      const [pengdaRows] = await db.query(
        'SELECT id FROM users WHERE role_id = 3 AND province_id = ?',
        [currentUser.province_id]
      );
      effectivePengdaId = pengdaRows.length ? pengdaRows[0].id : null;
    }
    const categories = await Kejurda.getCategories(effectivePengdaId);
    return res.json({ success: true, data: categories });
  } catch (err) {
    console.error('Get kejurda categories error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Create category (Pengda only)
exports.createCategory = async (req, res) => {
  try {
    const { category_name, level, quota_per_pengcab } = req.body;
    if (!category_name) {
      return res.status(400).json({ success: false, message: 'Nama kategori wajib diisi' });
    }
    const id = await Kejurda.createCategory({
      category_name,
      level: level || '',
      quota_per_pengcab: quota_per_pengcab || 5,
      pengda_id: req.user.id,
      created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
    });
    return res.status(201).json({ success: true, message: 'Kategori berhasil dibuat', data: { id } });
  } catch (err) {
    console.error('Create kejurda category error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Delete category (Pengda only)
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const ok = await Kejurda.deleteCategory(parseInt(id));
    if (!ok) return res.status(400).json({ success: false, message: 'Gagal menghapus kategori (mungkin masih ada pendaftaran)' });
    return res.json({ success: true, message: 'Kategori berhasil dihapus' });
  } catch (err) {
    console.error('Delete kejurda category error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Search approved clubs
exports.searchClubs = async (req, res) => {
  try {
    const { search } = req.query;
    const currentUser = await User.findById(req.user.id);
    const filters = { province_id: currentUser.province_id };
    if (req.user.role_id === 2) {
      filters.city_id = currentUser.city_id;
    }
    if (search) filters.search = search;

    const clubs = await Kejurda.searchApprovedClubs(filters);
    return res.json({ success: true, data: clubs });
  } catch (err) {
    console.error('Search clubs error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Register team (Pengcab registers, scoped to their pengda)
exports.registerTeam = async (req, res) => {
  try {
    const { club_id, event_id, category_id, team_name, club_name, coach_name, manager_name, logo_path } = req.body;

    if (!club_id || !category_id || !club_name) {
      return res.status(400).json({ success: false, message: 'Data pendaftaran tidak lengkap' });
    }

    const currentUser = await User.findById(req.user.id);

    // Find pengda for this province
    const db = require('../lib/db-compat');
    const [pengdaRows] = await db.query(
      'SELECT id FROM users WHERE role_id = 3 AND province_id = ?',
      [currentUser.province_id]
    );
    if (!pengdaRows.length) {
      return res.status(400).json({ success: false, message: 'Tidak ditemukan Pengda untuk provinsi ini' });
    }

    const regData = {
      pengcab_id: req.user.id,
      pengda_id: pengdaRows[0].id,
      club_id,
      event_id: event_id || null,
      category_id: parseInt(category_id),
      team_name: team_name || '',
      club_name,
      coach_name: coach_name || '',
      manager_name: manager_name || '',
      logo_path: logo_path || null,
      province_id: currentUser.province_id || null,
      city_id: currentUser.city_id || null,
      created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };

    const regId = await Kejurda.createRegistration(regData);

    return res.status(201).json({
      success: true,
      message: 'Tim berhasil didaftarkan untuk Kejurda',
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
    const { category_id, status, search } = req.query;
    const filters = {};

    if (category_id) filters.category_id = parseInt(category_id);
    if (status) filters.status = status;
    if (search) filters.search = search;

    // Pengcab sees only their registrations
    if (req.user.role_id === 2) {
      filters.pengcab_id = req.user.id;
    }
    // Pengda sees registrations for their province
    if (req.user.role_id === 3) {
      filters.pengda_id = req.user.id;
    }

    const registrations = await Kejurda.findRegistrations(filters);
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
    const reg = await Kejurda.findRegistrationById(parseInt(id));

    if (!reg) {
      return res.status(404).json({ success: false, message: 'Pendaftaran tidak ditemukan' });
    }

    // Only pengcab who registered or pengda can delete
    if (req.user.role_id === 2 && reg.pengcab_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }
    if (req.user.role_id === 3 && reg.pengda_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }

    await Kejurda.deleteRegistration(parseInt(id));
    return res.json({ success: true, message: 'Pendaftaran berhasil dihapus' });
  } catch (err) {
    console.error('Delete registration error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Get stats
exports.getStats = async (req, res) => {
  try {
    const filters = {};
    if (req.user.role_id === 2) {
      filters.pengcab_id = req.user.id;
    }
    if (req.user.role_id === 3) {
      filters.pengda_id = req.user.id;
    }

    const stats = await Kejurda.getStats(filters);
    return res.json({ success: true, data: stats });
  } catch (err) {
    console.error('Get kejurda stats error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Pengda: Approve registration
exports.approveRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const reg = await Kejurda.findRegistrationById(parseInt(id));
    if (!reg) {
      return res.status(404).json({ success: false, message: 'Pendaftaran tidak ditemukan' });
    }
    if (reg.pengda_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }

    await Kejurda.updateRegistrationStatus(parseInt(id), {
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

// Pengda: Reject registration
exports.rejectRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const reg = await Kejurda.findRegistrationById(parseInt(id));
    if (!reg) {
      return res.status(404).json({ success: false, message: 'Pendaftaran tidak ditemukan' });
    }
    if (reg.pengda_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }

    await Kejurda.updateRegistrationStatus(parseInt(id), {
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

// Events CRUD (Pengda only)
exports.getEvents = async (req, res) => {
  try {
    const pengdaId = req.user.role_id === 3 ? req.user.id : null;
    // Pengcab: find events from their pengda
    let effectivePengdaId = pengdaId;
    if (req.user.role_id === 2) {
      const currentUser = await User.findById(req.user.id);
      const db = require('../lib/db-compat');
      const [pengdaRows] = await db.query(
        'SELECT id FROM users WHERE role_id = 3 AND province_id = ?',
        [currentUser.province_id]
      );
      effectivePengdaId = pengdaRows.length ? pengdaRows[0].id : null;
    }
    const events = await Kejurda.getEvents(effectivePengdaId);
    return res.json({ success: true, data: events });
  } catch (err) {
    console.error('Get events error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const { event_name, event_year, event_date, location, description } = req.body;
    if (!event_name || !event_date) {
      return res.status(400).json({ success: false, message: 'Nama event dan tanggal wajib diisi' });
    }

    const id = await Kejurda.createEvent({
      event_name,
      event_year: event_year || new Date().getFullYear(),
      event_date,
      location: location || '',
      description: description || '',
      pengda_id: req.user.id,
      created_by: req.user.id,
      created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
    });

    return res.status(201).json({ success: true, message: 'Event Kejurda berhasil dibuat', data: { id } });
  } catch (err) {
    console.error('Create event error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { event_name, event_date, location, description, status } = req.body;
    const event = await Kejurda.getEventById(parseInt(id));
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event tidak ditemukan' });
    }
    if (event.pengda_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }

    const updateData = {};
    if (event_name) updateData.event_name = event_name;
    if (event_date) updateData.event_date = event_date;
    if (location !== undefined) updateData.location = location;
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;

    await Kejurda.updateEvent(parseInt(id), updateData);
    return res.json({ success: true, message: 'Event berhasil diperbarui' });
  } catch (err) {
    console.error('Update event error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Kejurda.getEventById(parseInt(id));
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event tidak ditemukan' });
    }
    if (event.pengda_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }

    await Kejurda.deleteEvent(parseInt(id));
    return res.json({ success: true, message: 'Event berhasil dihapus' });
  } catch (err) {
    console.error('Delete event error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Export registrations to Excel (Pengda only)
exports.exportRegistrations = async (req, res) => {
  try {
    const { category_id, status } = req.query;
    const filters = { pengda_id: req.user.id };
    if (category_id) filters.category_id = parseInt(category_id);
    if (status) filters.status = status;

    const registrations = await Kejurda.findRegistrations(filters);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Kejurda Registrations');

    sheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Nama Tim', key: 'team_name', width: 20 },
      { header: 'Nama Klub', key: 'club_name', width: 25 },
      { header: 'Kategori', key: 'category_name', width: 20 },
      { header: 'Pelatih', key: 'coach_name', width: 20 },
      { header: 'Manajer', key: 'manager_name', width: 20 },
      { header: 'Kota', key: 'city_name', width: 20 },
      { header: 'Pengcab', key: 'pengcab_name', width: 20 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Tanggal Daftar', key: 'created_at', width: 18 }
    ];

    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D3557' } };
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    registrations.forEach((row, idx) => {
      sheet.addRow({ no: idx + 1, ...row });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=kejurda_${Date.now()}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Export registrations error:', err);
    return res.status(500).json({ success: false, message: 'Gagal export data' });
  }
};

// Pengda: Get pengcab list for filters
exports.getPengcabList = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const pengcabs = await Kejurda.getPengcabList(currentUser.province_id);
    return res.json({ success: true, data: pengcabs });
  } catch (err) {
    console.error('Get pengcab list error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};
