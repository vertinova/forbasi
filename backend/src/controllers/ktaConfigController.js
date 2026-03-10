const KtaConfig = require('../models/KtaConfig');
const path = require('path');
const fs = require('fs');

const ensureDir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };

// Get KTA config for current user's role
exports.getConfig = async (req, res) => {
  try {
    const { id, role_id } = req.user;
    let config = null;
    if (role_id === 2) config = await KtaConfig.getPengcabConfig(id);
    else if (role_id === 3) config = await KtaConfig.getPengdaConfig(id);
    else if (role_id === 4) config = await KtaConfig.getPbConfig(id);
    else return res.status(403).json({ success: false, message: 'Tidak diizinkan' });

    return res.json({ success: true, data: config });
  } catch (err) {
    console.error('Get KTA config error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Save KTA config (ketua_umum_name, signature, stamp)
exports.saveConfig = async (req, res) => {
  try {
    const { id, role_id } = req.user;
    const { ketua_umum_name, bank_account_number } = req.body;
    const updateData = {};

    if (ketua_umum_name) updateData.ketua_umum_name = ketua_umum_name;

    // Handle signature upload
    if (req.files?.signature) {
      const roleDir = role_id === 2 ? 'pengcab_kta_configs' : role_id === 3 ? 'pengda_kta_configs' : 'pb_kta_configs';
      const uploadDir = path.join(__dirname, '../../uploads', roleDir);
      ensureDir(uploadDir);
      updateData.signature_image_path = req.files.signature[0].filename;
    }

    // Handle stamp upload (pengda and pb only)
    if (req.files?.stamp && [3, 4].includes(role_id)) {
      const roleDir = role_id === 3 ? 'pengda_kta_configs' : 'pb_kta_configs';
      const uploadDir = path.join(__dirname, '../../uploads', roleDir);
      ensureDir(uploadDir);
      updateData.stamp_image_path = req.files.stamp[0].filename;
    }

    if (Object.keys(updateData).length === 0 && !bank_account_number) {
      return res.status(400).json({ success: false, message: 'Tidak ada data untuk disimpan' });
    }

    if (Object.keys(updateData).length > 0) {
      if (role_id === 2) await KtaConfig.savePengcabConfig(id, updateData);
      else if (role_id === 3) await KtaConfig.savePengdaConfig(id, updateData);
      else if (role_id === 4) await KtaConfig.savePbConfig(id, updateData);
    }

    // Update bank_account_number in users table
    if (bank_account_number !== undefined) {
      const User = require('../models/User');
      await User.update(id, { bank_account_number });
    }

    return res.json({ success: true, message: 'Konfigurasi KTA berhasil disimpan' });
  } catch (err) {
    console.error('Save KTA config error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Get KTA application history
exports.getApplicationHistory = async (req, res) => {
  try {
    const history = await KtaConfig.getHistory(req.params.applicationId);
    return res.json({ success: true, data: history });
  } catch (err) {
    console.error('Get KTA history error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// In-app notifications
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await KtaConfig.getNotifications(req.user.id);
    return res.json({ success: true, data: notifications });
  } catch (err) {
    console.error('Get notifications error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    await KtaConfig.markNotificationRead(req.params.id, req.user.id);
    return res.json({ success: true, message: 'Notifikasi ditandai telah dibaca' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

exports.markAllNotificationsRead = async (req, res) => {
  try {
    await KtaConfig.markAllRead(req.user.id);
    return res.json({ success: true, message: 'Semua notifikasi ditandai telah dibaca' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Notification templates (for push panel)
exports.getNotificationTemplates = async (req, res) => {
  try {
    const templates = await KtaConfig.getTemplates();
    return res.json({ success: true, data: templates });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Visitor tracking
exports.trackVisitor = async (req, res) => {
  try {
    await KtaConfig.trackVisitor(req.ip);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

exports.getVisitorStats = async (req, res) => {
  try {
    const stats = await KtaConfig.getVisitorStats();
    // Serialize BigInt fields safely
    const safe = JSON.parse(JSON.stringify(stats, (_, v) => (typeof v === 'bigint' ? Number(v) : v)));
    return res.json({ success: true, data: safe });
  } catch (err) {
    console.error('getVisitorStats error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Competition Re-registration
exports.submitReregistration = async (req, res) => {
  try {
    const { kejurnas_registration_id, school_name, school_level, phone, attendees_count, total_cost } = req.body;
    const userId = req.user.id;

    if (!kejurnas_registration_id || !school_name) {
      return res.status(400).json({ success: false, message: 'Data tidak lengkap' });
    }

    const existing = await KtaConfig.getReregistration(userId, kejurnas_registration_id);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Sudah pernah mendaftar ulang' });
    }

    const data = {
      user_id: userId,
      kejurnas_registration_id: parseInt(kejurnas_registration_id),
      school_name,
      school_level: school_level || '',
      phone: phone || '',
      attendance_count: parseInt(attendees_count) || 20,
      total_cost: parseFloat(total_cost) || 600000,
      status: 'submitted',
      submitted_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };

    // Handle document file uploads
    const files = req.files || {};
    if (files.school_permission_letter) data.school_permission_letter = files.school_permission_letter[0].filename;
    if (files.parent_permission_letter) data.parent_permission_letter = files.parent_permission_letter[0].filename;
    if (files.team_photo) data.team_photo = files.team_photo[0].filename;
    if (files.payment_proof) data.payment_proof = files.payment_proof[0].filename;

    // Handle member photo uploads
    const memberPhotoFields = ['komandan_photo', 'manager_photo', 'pelatih_photo', 'cadangan_1_photo', 'cadangan_2_photo'];
    for (let i = 1; i <= 15; i++) memberPhotoFields.push(`pasukan_${i}_photo`);

    for (const field of memberPhotoFields) {
      if (files[field]) data[field] = files[field][0].filename;
    }

    // Handle member name fields from body
    const memberNameFields = ['komandan_nama', 'manager_nama', 'pelatih_nama', 'komandan_sekolah', 'manager_sekolah', 'pelatih_sekolah', 'cadangan_1_nama', 'cadangan_2_nama'];
    for (let i = 1; i <= 15; i++) memberNameFields.push(`pasukan_${i}_nama`);

    for (const field of memberNameFields) {
      if (req.body[field]) data[field] = req.body[field];
    }

    const id = await KtaConfig.createReregistration(data);
    return res.status(201).json({ success: true, message: 'Daftar ulang berhasil', data: { id } });
  } catch (err) {
    console.error('Submit reregistration error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

exports.getReregistrations = async (req, res) => {
  try {
    const reregistrations = await KtaConfig.getReregistrations(req.query);
    return res.json({ success: true, data: reregistrations });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

exports.updateReregistrationStatus = async (req, res) => {
  try {
    const { status, admin_notes } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status tidak valid' });
    }
    await KtaConfig.updateReregistration(req.params.id, {
      status,
      admin_notes: admin_notes || null,
      reviewed_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
    });
    return res.json({ success: true, message: 'Status updated' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Export reregistrations to Excel
exports.exportReregistrations = async (req, res) => {
  try {
    const ExcelJS = require('exceljs');
    const reregistrations = await KtaConfig.getReregistrations(req.query);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Daftar Ulang');

    sheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Nama Klub', key: 'club_name', width: 25 },
      { header: 'Sekolah', key: 'school_name', width: 25 },
      { header: 'Kategori', key: 'category_name', width: 20 },
      { header: 'Provinsi', key: 'province_name', width: 20 },
      { header: 'Total Biaya', key: 'total_cost', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Tanggal', key: 'submitted_at', width: 18 }
    ];

    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D3557' } };

    reregistrations.forEach((row, idx) => {
      sheet.addRow({ no: idx + 1, ...row });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=reregistration_${Date.now()}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Export reregistrations error:', err);
    return res.status(500).json({ success: false, message: 'Gagal export data' });
  }
};
