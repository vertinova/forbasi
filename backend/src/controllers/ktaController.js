const KtaApplication = require('../models/KtaApplication');
const User = require('../models/User');
const { ActivityLog } = require('../models/Common');
const KtaConfig = require('../models/KtaConfig');
const path = require('path');
const fs = require('fs');

const getRoleName = (roleId) => {
  const roles = { 1: 'anggota', 2: 'pengcab', 3: 'pengda', 4: 'pb' };
  return roles[roleId] || 'unknown';
};

// Submit KTA application (User/Anggota)
exports.submitApplication = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    const db = require('../lib/db-compat');

    const { coach_name, manager_name, school_name, leader_name, club_address, nominal_paid, phone } = req.body;

    if (club_address && club_address.length > 45) {
      return res.status(400).json({ success: false, message: 'Alamat sekretariat tidak boleh lebih dari 45 karakter.' });
    }
    if (phone && !/^[0-9]+$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'No. HP hanya boleh berisi angka.' });
    }

    const files = req.files || {};

    // Resolve province and regency text names from IDs
    let provinceName = '';
    let regencyName = '';
    if (user.province_id) {
      const [provRows] = await db.query('SELECT name FROM provinces WHERE id = ?', [user.province_id]);
      if (provRows.length > 0) provinceName = provRows[0].name;
    }
    if (user.city_id) {
      const [cityRows] = await db.query('SELECT name FROM cities WHERE id = ?', [user.city_id]);
      if (cityRows.length > 0) regencyName = cityRows[0].name;
    }

    // Build file paths
    const filePaths = {};
    if (files.logo) filePaths.logo_path = `kta_files/${files.logo[0].filename}`;
    if (files.ad_file) filePaths.ad_file_path = `kta_files/${files.ad_file[0].filename}`;
    if (files.art_file) filePaths.art_file_path = `kta_files/${files.art_file[0].filename}`;
    if (files.sk_file) filePaths.sk_file_path = `kta_files/${files.sk_file[0].filename}`;
    if (files.payment_proof) filePaths.payment_proof_path = `kta_files/${files.payment_proof[0].filename}`;
    if (files.member_photos && files.member_photos.length > 0) {
      filePaths.member_photos_json = JSON.stringify(files.member_photos.map(f => `kta_files/${f.filename}`));
    }

    // Check if user has existing application that can be resubmitted
    const [existing] = await db.query(
      `SELECT id, status, kta_issued_at FROM kta_applications WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );

    const isExpired = existing.length > 0 && existing[0].status === 'kta_issued' && existing[0].kta_issued_at
      ? new Date() > new Date(`${new Date(existing[0].kta_issued_at).getFullYear()}-12-31T23:59:59`)
      : false;

    const canResubmit = existing.length > 0 && (existing[0].status === 'rejected_pengcab' || isExpired);

    // Block new submission if user has an active/in-progress application
    const ACTIVE_STATUSES = ['pending', 'approved_pengcab', 'approved_pengda', 'approved_pb', 'rejected_pengda', 'rejected_pb', 'resubmit_to_pengda', 'pending_pengda_resubmit'];
    if (existing.length > 0 && !canResubmit && ACTIVE_STATUSES.includes(existing[0].status)) {
      return res.status(400).json({ success: false, message: 'Anda sudah memiliki pengajuan KTA yang sedang aktif. Tidak dapat mengajukan KTA baru.' });
    }

    if (canResubmit) {
      // RESUBMISSION MODE: Update existing application, clear all higher approvals
      const updateData = {
        club_name: user.club_name,
        school_name: school_name || '',
        leader_name: leader_name || '',
        coach_name: coach_name || '',
        manager_name: manager_name || '',
        club_address: club_address || '',
        province_id: user.province_id,
        city_id: user.city_id,
        province: provinceName,
        regency: regencyName,
        nominal_paid: nominal_paid || 0,
        status: 'pending',
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        last_resubmitted_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        rejection_reason: null,
        approved_by_pengcab_id: null, approved_at_pengcab: null, notes_pengcab: null,
        rejected_by_pengcab_id: null, rejected_at_pengcab: null,
        approved_by_pengda_id: null, approved_at_pengda: null, notes_pengda: null,
        rejected_by_pengda_id: null, rejected_at_pengda: null,
        approved_by_pb_id: null, approved_at_pb: null, notes_pb: null,
        rejected_by_pb_id: null, rejected_at_pb: null,
        generated_kta_file_path: null, generated_kta_file_path_pengda: null,
        generated_kta_file_path_pb: null, kta_issued_at: null,
        ...filePaths
      };

      await KtaApplication.update(existing[0].id, updateData);

      await ActivityLog.create({
        user_id: userId,
        role_name: 'anggota',
        activity_type: 'kta_resubmit',
        description: `Pengajuan ulang KTA oleh ${user.club_name}`,
        application_id: existing[0].id,
        old_status: existing[0].status,
        new_status: 'pending'
      });

      return res.status(200).json({
        success: true,
        message: 'Pengajuan ulang KTA berhasil dikirim',
        data: { id: existing[0].id }
      });
    }

    // NEW APPLICATION MODE
    const appData = {
      user_id: userId,
      club_name: user.club_name,
      school_name: school_name || '',
      leader_name: leader_name || '',
      coach_name: coach_name || '',
      manager_name: manager_name || '',
      club_address: club_address || '',
      province_id: user.province_id,
      city_id: user.city_id,
      province: provinceName,
      regency: regencyName,
      nominal_paid: nominal_paid || 0,
      status: 'pending',
      created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      ...filePaths
    };

    const appId = await KtaApplication.create(appData);

    await ActivityLog.create({
      user_id: userId,
      role_name: 'anggota',
      activity_type: 'kta_submit',
      description: `Pengajuan KTA baru oleh ${user.club_name}`,
      application_id: appId,
      new_status: 'pending'
    });

    return res.status(201).json({
      success: true,
      message: 'Pengajuan KTA berhasil dikirim',
      data: { id: appId }
    });
  } catch (err) {
    console.error('Submit KTA error:', err);
    const message = err.message || 'Terjadi kesalahan server';
    return res.status(500).json({ success: false, message: `Gagal mengirim pengajuan: ${message}` });
  }
};

// Get applications (filtered by role)
exports.getApplications = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20, province_id, city_id } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const filters = { limit: parseInt(limit), offset };
    if (status) filters.status = status;
    if (search) filters.search = search;

    // Role-based filtering
    if (req.user.role_id === 1) {
      // Anggota sees own applications only
      const apps = await KtaApplication.findByUserId(req.user.id);
      return res.json({ success: true, data: { applications: apps } });
    } else if (req.user.role_id === 2) {
      // Pengcab: filter by city
      const currentUser = await User.findById(req.user.id);
      filters.city_id = currentUser.city_id;
    } else if (req.user.role_id === 3) {
      // Pengda: filter by province
      const currentUser = await User.findById(req.user.id);
      filters.province_id = currentUser.province_id;
    } else if (req.user.role_id === 4) {
      // PB can filter by province/city optionally
      if (province_id) filters.province_id = parseInt(province_id);
      if (city_id) filters.city_id = parseInt(city_id);
    }
    // super_admin sees all

    const applications = await KtaApplication.findAll(filters);
    const total = await KtaApplication.count(filters);

    return res.json({
      success: true,
      data: {
        applications,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (err) {
    console.error('Get KTA applications error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Get single application detail
exports.getApplicationDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const app = await KtaApplication.findById(parseInt(id));

    if (!app) {
      return res.status(404).json({ success: false, message: 'Pengajuan tidak ditemukan' });
    }

    // Check access
    if (req.user.role_id === 1 && app.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }

    return res.json({ success: true, data: app });
  } catch (err) {
    console.error('Get KTA detail error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Update KTA status (approve/reject)
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, rejection_reason, nominal_paid } = req.body;
    const dbPool = require('../lib/db-compat');

    const app = await KtaApplication.findById(parseInt(id));
    if (!app) {
      return res.status(404).json({ success: false, message: 'Pengajuan tidak ditemukan' });
    }

    const validTransitions = {
      2: {
        from: ['pending', 'rejected_pengcab', 'rejected_pengda', 'rejected_pb'],
        to: ['approved_pengcab', 'rejected_pengcab', 'resubmit_to_pengda']
      },
      3: {
        from: ['approved_pengcab', 'resubmit_to_pengda', 'rejected_pb', 'pending_pengda_resubmit'],
        to: ['approved_pengda', 'rejected_pengda', 'pending_pengda_resubmit']
      },
      4: {
        from: ['approved_pengda', 'pending_pengda_resubmit', 'rejected_pb', 'approved_pb'],
        to: ['approved_pb', 'kta_issued', 'rejected_pb']
      }
    };

    const roleTransition = validTransitions[req.user.role_id];
    if (!roleTransition) {
      return res.status(403).json({ success: false, message: 'Tidak memiliki hak akses' });
    }

    if (!roleTransition.from.includes(app.status) || !roleTransition.to.includes(status)) {
      return res.status(400).json({ success: false, message: 'Transisi status tidak valid' });
    }

    const currentUser = await User.findById(req.user.id);
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // Pengcab (role 2) auth: verify province_id AND city_id match the application
    if (req.user.role_id === 2) {
      if (currentUser.province_id !== app.province_id || currentUser.city_id !== app.city_id) {
        return res.status(403).json({ success: false, message: 'Pengajuan ini bukan wilayah Pengcab Anda' });
      }
    }

    // Pengcab (role 2) must have complete KTA config before approving
    if (req.user.role_id === 2 && status === 'approved_pengcab') {
      const config = await KtaConfig.getPengcabConfig(req.user.id);
      if (!config || !config.ketua_umum_name || !config.signature_image_path) {
        return res.status(400).json({ success: false, message: 'Konfigurasi KTA Pengcab belum lengkap (nama ketua umum & tanda tangan)' });
      }
    }

    // PB (role 4) must have complete KTA config before approving
    if (req.user.role_id === 4 && status === 'approved_pb') {
      const config = await KtaConfig.getPbConfig(req.user.id);
      if (!config || !config.ketua_umum_name || !config.signature_image_path) {
        return res.status(400).json({ success: false, message: 'Konfigurasi KTA PB belum lengkap (nama ketua umum & tanda tangan). Silakan lengkapi di menu Konfigurasi KTA.' });
      }
    }

    // Pengda (role 3) must have complete KTA config + bank account before approving
    if (req.user.role_id === 3 && status === 'approved_pengda') {
      const config = await KtaConfig.getPengdaConfig(req.user.id);
      if (!config || !config.ketua_umum_name || !config.signature_image_path) {
        return res.status(400).json({ success: false, message: 'Konfigurasi KTA Pengda belum lengkap (nama ketua umum & tanda tangan)' });
      }
      if (!currentUser.bank_account_number) {
        return res.status(400).json({ success: false, message: 'Nomor rekening bank belum diisi di profil' });
      }
    }

    const updateData = { status };
    const roleName = getRoleName(req.user.role_id);

    // === PENGCAB (role 2) actions ===
    if (req.user.role_id === 2) {
      if (status === 'approved_pengcab') {
        updateData.approved_by_pengcab_id = req.user.id;
        updateData.approved_at_pengcab = now;
        if (notes) updateData.notes_pengcab = notes;
        // Clear all higher-level approvals (pengda + PB)
        updateData.approved_by_pengda_id = null;
        updateData.approved_at_pengda = null;
        updateData.notes_pengda = null;
        updateData.rejected_by_pengda_id = null;
        updateData.rejected_at_pengda = null;
        updateData.generated_kta_file_path_pengda = null;
        updateData.approved_by_pb_id = null;
        updateData.approved_at_pb = null;
        updateData.notes_pb = null;
        updateData.rejected_by_pb_id = null;
        updateData.rejected_at_pb = null;
        updateData.generated_kta_file_path_pb = null;
        updateData.kta_issued_at = null;
        updateData.rejection_reason = null;
      } else if (status === 'rejected_pengcab') {
        updateData.rejected_by_pengcab_id = req.user.id;
        updateData.rejected_at_pengcab = now;
        updateData.rejection_reason = rejection_reason || notes || '';
      } else if (status === 'resubmit_to_pengda') {
        // Pengcab forwards to pengda (after pengda/pb rejection)
        if (notes) updateData.notes_pengcab = notes;
      }
    }

    // === PENGDA (role 3) actions ===
    if (req.user.role_id === 3) {
      if (status === 'approved_pengda') {
        updateData.approved_by_pengda_id = req.user.id;
        updateData.approved_at_pengda = now;
        if (notes) updateData.notes_pengda = notes;
        // Clear PB-level approvals
        updateData.approved_by_pb_id = null;
        updateData.approved_at_pb = null;
        updateData.notes_pb = null;
        updateData.rejected_by_pb_id = null;
        updateData.rejected_at_pb = null;
        updateData.generated_kta_file_path_pb = null;
        updateData.kta_issued_at = null;
        updateData.rejection_reason = null;
      } else if (status === 'rejected_pengda') {
        updateData.rejected_by_pengda_id = req.user.id;
        updateData.rejected_at_pengda = now;
        updateData.rejection_reason = rejection_reason || notes || '';
      } else if (status === 'pending_pengda_resubmit') {
        if (notes) updateData.notes_pengda = notes;
      }
    }

    // === PB (role 4) actions ===
    if (req.user.role_id === 4) {
      if (status === 'approved_pb' || status === 'kta_issued') {
        updateData.approved_by_pb_id = req.user.id;
        updateData.approved_at_pb = now;
        if (notes) updateData.notes_pb = notes;
        if (nominal_paid) updateData.nominal_paid = nominal_paid;
        if (status === 'kta_issued') {
          updateData.kta_issued_at = now;
        }
      } else if (status === 'rejected_pb') {
        updateData.rejected_by_pb_id = req.user.id;
        updateData.rejected_at_pb = now;
        updateData.rejection_reason = rejection_reason || notes || '';
      }
    }

    // Payment proof upload
    if (req.file) {
      if (req.user.role_id === 2) {
        updateData.pengcab_payment_proof_path = `payment_proofs/${req.file.filename}`;
      } else if (req.user.role_id === 3) {
        updateData.pengda_payment_proof_path = `payment_proofs/${req.file.filename}`;
      }
    }

    await KtaApplication.update(parseInt(id), updateData);

    // === Per-level PDF generation on approval (mirrors PHP generate_kta_pdf.php) ===
    try {
      const needsPdf = ['approved_pengcab', 'approved_pengda', 'approved_pb', 'kta_issued'].includes(status);
      if (needsPdf) {
        const { generateKtaPdf } = require('../utils/pdfGenerator');
        const [rows] = await dbPool.query(
          `SELECT ka.*, u.club_name, u.username, p.name as province_name, c.name as city_name
           FROM kta_applications ka
           JOIN users u ON ka.user_id = u.id
           LEFT JOIN provinces p ON ka.province_id = p.id
           LEFT JOIN cities c ON ka.city_id = c.id
           WHERE ka.id = ?`,
          [parseInt(id)]
        );
        if (rows.length > 0) {
          // Pass role and adminId so pdfGenerator uses the correct config table
          const pdfRole = status === 'approved_pengcab' ? 'pengcab'
            : status === 'approved_pengda' ? 'pengda'
            : 'pb';
          const result = await generateKtaPdf(rows[0], { role: pdfRole, adminId: req.user.id });

          // Store PDF path in the correct level column
          const pdfColumn = status === 'approved_pengcab' ? 'generated_kta_file_path'
            : status === 'approved_pengda' ? 'generated_kta_file_path_pengda'
            : 'generated_kta_file_path_pb';

          const pdfUpdate = { [pdfColumn]: result.filepath };
          if (result.barcode_id) pdfUpdate.kta_barcode_unique_id = result.barcode_id;
          await KtaApplication.update(parseInt(id), pdfUpdate);
        }
      }
    } catch (pdfErr) {
      console.error('PDF generation after status update failed (non-blocking):', pdfErr);
    }

    await ActivityLog.create({
      user_id: req.user.id,
      role_name: roleName,
      activity_type: 'kta_status_update',
      description: `Status KTA diubah dari ${app.status} ke ${status}`,
      application_id: parseInt(id),
      old_status: app.status,
      new_status: status
    });

    await KtaConfig.addHistory(parseInt(id), status, notes || `Status diubah oleh ${roleName}`);

    return res.json({ success: true, message: 'Status berhasil diperbarui' });
  } catch (err) {
    console.error('Update KTA status error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Get KTA statistics
exports.getStats = async (req, res) => {
  try {
    const filters = {};

    if (req.user.role_id === 2) {
      const currentUser = await User.findById(req.user.id);
      filters.city_id = currentUser.city_id;
    } else if (req.user.role_id === 3) {
      const currentUser = await User.findById(req.user.id);
      filters.province_id = currentUser.province_id;
    }

    const stats = await KtaApplication.getStats(filters);
    return res.json({ success: true, data: stats });
  } catch (err) {
    console.error('Get KTA stats error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Get KTA data by barcode (public API for verification)
exports.getByBarcode = async (req, res) => {
  try {
    const { barcode_id } = req.params;
    const db = require('../lib/db-compat');
    const [rows] = await db.query(
      `SELECT ka.*, u.club_name, u.email, u.phone,
              p.name as province_name, c.name as city_name
       FROM kta_applications ka
       JOIN users u ON ka.user_id = u.id
       LEFT JOIN provinces p ON ka.province_id = p.id
       LEFT JOIN cities c ON ka.city_id = c.id
       WHERE ka.kta_barcode_unique_id = ? AND ka.status = 'kta_issued'`,
      [barcode_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'KTA tidak ditemukan' });
    }

    const kta = rows[0];
    return res.json({
      success: true,
      data: {
        club_name: kta.club_name,
        coach_name: kta.coach_name,
        manager_name: kta.manager_name,
        province: kta.province_name,
        city: kta.city_name,
        kta_issued_at: kta.kta_issued_at,
        barcode_id: kta.kta_barcode_unique_id
      }
    });
  } catch (err) {
    console.error('Get KTA by barcode error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Get activity logs
exports.getActivityLogs = async (req, res) => {
  try {
    const { application_id, limit = 50 } = req.query;
    const filters = { limit: parseInt(limit) };

    if (application_id) filters.application_id = parseInt(application_id);

    // Role-based filtering
    if (req.user.role_id === 2 || req.user.role_id === 3) {
      filters.user_id = req.user.id;
    }

    const logs = await ActivityLog.findAll(filters);
    return res.json({ success: true, data: logs });
  } catch (err) {
    console.error('Get activity logs error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Generate KTA PDF (PB triggers after issuing KTA)
exports.generateKtaPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const db = require('../lib/db-compat');
    const { generateKtaPdf } = require('../utils/pdfGenerator');

    const app = await KtaApplication.findById(parseInt(id));
    if (!app) {
      return res.status(404).json({ success: false, message: 'Pengajuan tidak ditemukan' });
    }

    if (!['approved_pb', 'kta_issued'].includes(app.status)) {
      return res.status(400).json({ success: false, message: 'KTA belum disetujui PB' });
    }

    // Get full data with joins
    const [rows] = await db.query(
      `SELECT ka.*, u.club_name, u.username, p.name as province_name, c.name as city_name
       FROM kta_applications ka
       JOIN users u ON ka.user_id = u.id
       LEFT JOIN provinces p ON ka.province_id = p.id
       LEFT JOIN cities c ON ka.city_id = c.id
       WHERE ka.id = ?`,
      [parseInt(id)]
    );

    const result = await generateKtaPdf(rows[0]);

    await db.query(
      'UPDATE kta_applications SET generated_kta_file_path_pb = ?, kta_barcode_unique_id = ? WHERE id = ?',
      [result.filepath, result.barcode_id, parseInt(id)]
    );

    return res.json({
      success: true,
      message: 'KTA PDF berhasil di-generate',
      data: { filepath: result.filepath, barcode_id: result.barcode_id }
    });
  } catch (err) {
    console.error('Generate KTA PDF error:', err);
    return res.status(500).json({ success: false, message: 'Gagal generate KTA PDF' });
  }
};

// Download KTA PDF (auto-regenerate if missing)
exports.downloadKtaPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const db = require('../lib/db-compat');
    const app = await KtaApplication.findById(parseInt(id));
    if (!app) {
      return res.status(404).json({ success: false, message: 'Pengajuan tidak ditemukan' });
    }
    if (!['approved_pb', 'kta_issued'].includes(app.status)) {
      return res.status(404).json({ success: false, message: 'KTA belum disetujui PB' });
    }

    let filePath = app.generated_kta_file_path_pb
      ? path.join(__dirname, '../../uploads', app.generated_kta_file_path_pb)
      : null;

    // Auto-regenerate if file missing on disk
    if (!filePath || !fs.existsSync(filePath)) {
      const { generateKtaPdf } = require('../utils/pdfGenerator');
      const [rows] = await db.query(
        `SELECT ka.*, u.club_name, u.username, p.name as province_name, c.name as city_name
         FROM kta_applications ka
         JOIN users u ON ka.user_id = u.id
         LEFT JOIN provinces p ON ka.province_id = p.id
         LEFT JOIN cities c ON ka.city_id = c.id
         WHERE ka.id = ?`,
        [parseInt(id)]
      );
      if (!rows.length) {
        return res.status(404).json({ success: false, message: 'Data pengajuan tidak ditemukan' });
      }
      const result = await generateKtaPdf(rows[0], { role: 'pb' });
      await KtaApplication.update(parseInt(id), { generated_kta_file_path_pb: result.filepath });
      if (result.barcode_id) {
        await KtaApplication.update(parseInt(id), { kta_barcode_unique_id: result.barcode_id });
      }
      filePath = path.join(__dirname, '../../uploads', result.filepath);
    }

    res.download(filePath, `KTA_${app.club_name || app.id}.pdf`);
  } catch (err) {
    console.error('Download KTA PDF error:', err);
    return res.status(500).json({ success: false, message: 'Gagal download KTA' });
  }
};

// Batch regenerate KTA PDFs
exports.batchRegenerateKta = async (req, res) => {
  try {
    const { year } = req.body;
    if (!year) {
      return res.status(400).json({ success: false, message: 'Tahun wajib diisi' });
    }
    const { batchRegenerateKta } = require('../utils/pdfGenerator');
    const results = await batchRegenerateKta(parseInt(year));
    return res.json({ success: true, data: results });
  } catch (err) {
    console.error('Batch regenerate error:', err);
    return res.status(500).json({ success: false, message: 'Gagal regenerasi KTA batch' });
  }
};

// Regenerate all 3 role KTA PDFs for a single application (PB only)
exports.regenerateAllPdfs = async (req, res) => {
  try {
    const { id } = req.params;
    const dbPool = require('../lib/db-compat');
    const { generateKtaPdf } = require('../utils/pdfGenerator');

    const [rows] = await dbPool.query(
      `SELECT ka.*, u.club_name, u.username, p.name as province_name, c.name as city_name
       FROM kta_applications ka
       JOIN users u ON ka.user_id = u.id
       LEFT JOIN provinces p ON ka.province_id = p.id
       LEFT JOIN cities c ON ka.city_id = c.id
       WHERE ka.id = ?`,
      [parseInt(id)]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Pengajuan tidak ditemukan' });
    }

    const app = rows[0];
    if (!['approved_pb', 'kta_issued'].includes(app.status)) {
      return res.status(400).json({ success: false, message: 'KTA belum disetujui PB' });
    }

    const results = {};
    const updateData = {};

    // Regenerate pengcab PDF if pengcab approved
    if (app.approved_by_pengcab_id) {
      const r = await generateKtaPdf(app, { role: 'pengcab', adminId: app.approved_by_pengcab_id });
      updateData.generated_kta_file_path = r.filepath;
      results.pengcab = r.filepath;
    }

    // Regenerate pengda PDF if pengda approved
    if (app.approved_by_pengda_id) {
      const r = await generateKtaPdf(app, { role: 'pengda', adminId: app.approved_by_pengda_id });
      updateData.generated_kta_file_path_pengda = r.filepath;
      results.pengda = r.filepath;
    }

    // Regenerate pb PDF
    if (app.approved_by_pb_id) {
      const r = await generateKtaPdf(app, { role: 'pb', adminId: app.approved_by_pb_id });
      updateData.generated_kta_file_path_pb = r.filepath;
      if (r.barcode_id) updateData.kta_barcode_unique_id = r.barcode_id;
      results.pb = r.filepath;
    }

    if (Object.keys(updateData).length > 0) {
      await KtaApplication.update(parseInt(id), updateData);
    }

    return res.json({
      success: true,
      message: 'Semua KTA PDF berhasil di-generate ulang',
      data: results
    });
  } catch (err) {
    console.error('Regenerate all PDFs error:', err);
    return res.status(500).json({ success: false, message: 'Gagal generate ulang KTA PDF' });
  }
};

exports.deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const app = await KtaApplication.findById(parseInt(id));
    if (!app) {
      return res.status(404).json({ success: false, message: 'Pengajuan KTA tidak ditemukan' });
    }

    const UPLOADS = path.join(__dirname, '../../uploads');
    const fileFields = [
      'logo_path', 'ad_file_path', 'art_file_path', 'sk_file_path',
      'payment_proof_path', 'generated_kta_file_path',
      'generated_kta_file_path_pengda', 'generated_kta_file_path_pb',
      'pengcab_payment_proof_path', 'pengda_payment_proof_path'
    ];
    for (const field of fileFields) {
      if (app[field]) {
        const filePath = path.join(UPLOADS, app[field]);
        if (fs.existsSync(filePath)) {
          try { fs.unlinkSync(filePath); } catch {}
        }
      }
    }

    const db = require('../lib/db-compat');
    await db.query('DELETE FROM kta_applications WHERE id = ?', [parseInt(id)]);

    await ActivityLog.create({
      user_id: req.user.id,
      role_name: getRoleName(req.user.role_id),
      activity_type: 'delete_kta',
      description: `Menghapus pengajuan KTA #${id} (${app.club_name || ''})`,
      application_id: parseInt(id),
    });

    return res.json({ success: true, message: 'Pengajuan KTA berhasil dihapus' });
  } catch (err) {
    console.error('Delete KTA error:', err);
    return res.status(500).json({ success: false, message: 'Gagal menghapus pengajuan KTA' });
  }
};

