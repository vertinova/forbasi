const { LicenseApplication, LicenseConfig } = require('../models/License');
const { LicenseEvent } = require('../models/Common');
const QRCode = require('qrcode');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// Submit license application (Pelatih/Juri)
exports.submitApplication = async (req, res) => {
  try {
    const userId = req.user.id;
    const { license_type, akomodasi, notes } = req.body;
    const files = req.files || {};

    // Map frontend field to backend field
    const jenis_lisensi = license_type;

    if (!jenis_lisensi) {
      return res.status(400).json({ success: false, message: 'Jenis lisensi wajib dipilih' });
    }

    if (!['pelatih', 'juri_muda', 'juri_madya'].includes(jenis_lisensi)) {
      return res.status(400).json({ success: false, message: 'Jenis lisensi tidak valid' });
    }

    // Validate required files based on license type
    if (!files.pas_foto || !files.pas_foto[0]) {
      return res.status(400).json({ success: false, message: 'Pas Foto wajib diupload' });
    }
    if (!files.bukti_transfer || !files.bukti_transfer[0]) {
      return res.status(400).json({ success: false, message: 'Bukti Transfer wajib diupload' });
    }

    // Additional validation for Pelatih
    if (jenis_lisensi === 'pelatih') {
      if (!files.surat_pengalaman || !files.surat_pengalaman[0]) {
        return res.status(400).json({ success: false, message: 'Surat Keterangan Pengalaman wajib diupload untuk Pelatih' });
      }
      if (!files.surat_rekomendasi || !files.surat_rekomendasi[0]) {
        return res.status(400).json({ success: false, message: 'Surat Rekomendasi Pengda wajib diupload untuk Pelatih' });
      }
    }

    const denganKamar = akomodasi === 'dengan_kamar';
    
    // Get dynamic pricing from config
    const config = await LicenseConfig.findByJenis(jenis_lisensi);
    const hitungBiaya = () => {
      if (config) {
        return denganKamar ? Number(config.harga_dengan_kamar) : Number(config.harga_tanpa_kamar);
      }
      // Fallback defaults
      if (jenis_lisensi === 'pelatih') return denganKamar ? 1000000 : 750000;
      return denganKamar ? 2250000 : 2000000;
    };

    const appData = {
      user_id: userId,
      jenis_lisensi,
      akomodasi: akomodasi || 'tanpa_kamar',
      biaya_lisensi: hitungBiaya(),
      notes: notes || null,
      status: 'pending',
      submitted_at: new Date()
    };

    // Add file paths
    if (files.pas_foto && files.pas_foto[0]) appData.pas_foto = `lisensi/pas_foto/${files.pas_foto[0].filename}`;
    if (files.bukti_transfer && files.bukti_transfer[0]) appData.bukti_transfer = `lisensi/bukti_transfer/${files.bukti_transfer[0].filename}`;
    if (files.surat_pengalaman && files.surat_pengalaman[0]) appData.surat_pengalaman = `lisensi/surat_pengalaman/${files.surat_pengalaman[0].filename}`;
    if (files.sertifikat_tot && files.sertifikat_tot[0]) appData.sertifikat_tot = `lisensi/sertifikat_tot/${files.sertifikat_tot[0].filename}`;
    if (files.surat_rekomendasi && files.surat_rekomendasi[0]) appData.surat_rekomendasi = `lisensi/surat_rekomendasi/${files.surat_rekomendasi[0].filename}`;

    const appId = await LicenseApplication.create(appData);

    return res.status(201).json({
      success: true,
      message: 'Pengajuan lisensi berhasil dikirim',
      data: { id: appId }
    });
  } catch (err) {
    console.error('Submit license error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Get my license applications (Pelatih/Juri)
exports.getMyApplications = async (req, res) => {
  try {
    const apps = await LicenseApplication.findByUserId(req.user.id);
    return res.json({ success: true, data: apps });
  } catch (err) {
    console.error('Get my license apps error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Get all license applications (PB Admin)
exports.getAllApplications = async (req, res) => {
  try {
    const { status, jenis_lisensi, search } = req.query;
    const filters = {};
    if (status) filters.status = status;
    if (jenis_lisensi) filters.jenis_lisensi = jenis_lisensi;
    if (search) filters.search = search;

    const applications = await LicenseApplication.findAll(filters);
    return res.json({ success: true, data: applications });
  } catch (err) {
    console.error('Get all license apps error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Get application detail
exports.getApplicationDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const app = await LicenseApplication.findById(parseInt(id));

    if (!app) {
      return res.status(404).json({ success: false, message: 'Pengajuan tidak ditemukan' });
    }

    // License users can only see their own
    if (req.user.user_type === 'license_user' && app.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }

    return res.json({ success: true, data: app });
  } catch (err) {
    console.error('Get license detail error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Update license status (PB Admin)
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, alasan } = req.body;

    if (!['pending', 'proses', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status tidak valid' });
    }

    if (status === 'rejected' && !alasan) {
      return res.status(400).json({ success: false, message: 'Alasan penolakan wajib diisi' });
    }

    const updateData = {
      status,
      alasan_penolakan: status === 'rejected' ? alasan : null,
      approved_by: req.user.id,
      approved_at: new Date()
    };

    // Generate QR code on approval
    if (status === 'approved') {
      const app = await LicenseApplication.findById(parseInt(id));
      if (app) {
        const uniqueId = `LIC${new Date().toISOString().replace(/\D/g, '').slice(0, 14)}${String(app.id).padStart(5, '0')}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
        const qrDir = path.join(__dirname, '../../uploads/qrcodes');
        if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });
        const qrFilename = `license_qr_${app.id}_${Date.now()}.png`;
        const qrPath = path.join(qrDir, qrFilename);
        await QRCode.toFile(qrPath, uniqueId, { width: 400, margin: 2, color: { dark: '#000000', light: '#ffffff' } });
        updateData.qr_code_path = `qrcodes/${qrFilename}`;
      }
    }

    await LicenseApplication.update(parseInt(id), updateData);

    return res.json({ success: true, message: 'Status berhasil diperbarui' });
  } catch (err) {
    console.error('Update license status error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Get license statistics
exports.getStats = async (req, res) => {
  try {
    const stats = await LicenseApplication.getStats();
    return res.json({ success: true, data: stats });
  } catch (err) {
    console.error('Get license stats error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Get license events
exports.getEvents = async (req, res) => {
  try {
    const events = await LicenseEvent.findAll();
    return res.json({ success: true, data: events });
  } catch (err) {
    console.error('Get events error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// ─── License Config CRUD ────────────────────────────────────────

// Get all license configs (PB Admin)
exports.getConfigs = async (req, res) => {
  try {
    const configs = await LicenseConfig.findAll();
    return res.json({ success: true, data: configs });
  } catch (err) {
    console.error('Get license configs error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Get config for specific license type (public for license users)
exports.getConfigByJenis = async (req, res) => {
  try {
    const { jenis } = req.params;
    const config = await LicenseConfig.findByJenis(jenis);
    return res.json({ success: true, data: config });
  } catch (err) {
    console.error('Get license config error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Save/update license config (PB Admin)
exports.saveConfig = async (req, res) => {
  try {
    const { jenis_lisensi, nama_kegiatan, tempat, tanggal_mulai, tanggal_selesai, harga_tanpa_kamar, harga_dengan_kamar, deskripsi } = req.body;

    if (!jenis_lisensi || !['pelatih', 'juri_muda', 'juri_madya'].includes(jenis_lisensi)) {
      return res.status(400).json({ success: false, message: 'Jenis lisensi tidak valid' });
    }

    const data = {
      nama_kegiatan: nama_kegiatan || '',
      tempat: tempat || '',
      tanggal_mulai: tanggal_mulai ? new Date(tanggal_mulai) : null,
      tanggal_selesai: tanggal_selesai ? new Date(tanggal_selesai) : null,
      harga_tanpa_kamar: parseFloat(harga_tanpa_kamar) || 0,
      harga_dengan_kamar: parseFloat(harga_dengan_kamar) || 0,
      deskripsi: deskripsi || null,
      created_by: req.user.id,
    };

    const result = await LicenseConfig.upsert(jenis_lisensi, data);
    return res.json({ success: true, message: 'Konfigurasi berhasil disimpan', data: result });
  } catch (err) {
    console.error('Save license config error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};
