const { LicenseApplication, LicenseConfig, LicenseUser } = require('../models/License');
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

    const validTypes = ['pelatih_muda', 'pelatih_madya', 'pelatih_utama', 'juri_muda', 'juri_madya'];
    if (!validTypes.includes(jenis_lisensi)) {
      return res.status(400).json({ success: false, message: 'Jenis lisensi tidak valid' });
    }

    // Prevent duplicate: only allow if no active application exists (pending/proses/approved/issued)
    const existingApps = await LicenseApplication.findByUserId(userId);
    const hasActive = existingApps.some(app => ['pending', 'proses', 'approved', 'issued'].includes(app.status));
    if (hasActive) {
      return res.status(400).json({ success: false, message: 'Anda sudah memiliki pengajuan lisensi aktif. Hanya dapat mengajukan satu kali.' });
    }

    const isPelatih = jenis_lisensi.startsWith('pelatih_');
    const isJuri = jenis_lisensi.startsWith('juri_');

    // Validate required files - common for both
    if (!files.pas_foto || !files.pas_foto[0]) {
      return res.status(400).json({ success: false, message: 'Pas Foto wajib diupload' });
    }
    if (!files.bukti_transfer || !files.bukti_transfer[0]) {
      return res.status(400).json({ success: false, message: 'Bukti Transfer wajib diupload' });
    }
    if (!files.kartu_identitas || !files.kartu_identitas[0]) {
      return res.status(400).json({ success: false, message: 'Kartu Identitas wajib diupload' });
    }
    if (!files.ijazah || !files.ijazah[0]) {
      return res.status(400).json({ success: false, message: 'Ijazah Pendidikan wajib diupload' });
    }
    if (!files.surat_kesediaan || !files.surat_kesediaan[0]) {
      return res.status(400).json({ success: false, message: 'Surat Kesediaan wajib diupload' });
    }
    if (!files.pakta_integritas || !files.pakta_integritas[0]) {
      return res.status(400).json({ success: false, message: 'Pakta Integritas wajib diupload' });
    }
    if (!files.surat_keterangan_sehat || !files.surat_keterangan_sehat[0]) {
      return res.status(400).json({ success: false, message: 'Surat Keterangan Sehat wajib diupload' });
    }
    if (!files.daftar_riwayat_hidup || !files.daftar_riwayat_hidup[0]) {
      return res.status(400).json({ success: false, message: 'Daftar Riwayat Hidup wajib diupload' });
    }

    // Pelatih-specific validation
    if (isPelatih) {
      if (!files.surat_pengalaman || !files.surat_pengalaman[0]) {
        return res.status(400).json({ success: false, message: 'Surat Keterangan Pengalaman wajib diupload untuk Pelatih' });
      }
      if (!files.surat_tugas || !files.surat_tugas[0]) {
        return res.status(400).json({ success: false, message: 'Surat Tugas dari Satuan/Klub wajib diupload untuk Pelatih' });
      }
    }

    // Juri-specific validation
    if (isJuri) {
      if (!files.surat_pengalaman || !files.surat_pengalaman[0]) {
        return res.status(400).json({ success: false, message: 'Sertifikat/Surat Tugas/Referensi Juri wajib diupload' });
      }
      if (!files.surat_rekomendasi || !files.surat_rekomendasi[0]) {
        return res.status(400).json({ success: false, message: 'Surat Rekomendasi Pengda wajib diupload untuk Juri' });
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
      if (isPelatih) return denganKamar ? 1000000 : 750000;
      return denganKamar ? 2250000 : 2000000;
    };

    // Get user's full_name for nama_lengkap
    const licenseUser = await LicenseUser.findById(userId);

    const appData = {
      user_id: userId,
      nama_lengkap: licenseUser?.full_name || null,
      jenis_lisensi,
      akomodasi: akomodasi || 'tanpa_kamar',
      biaya_lisensi: hitungBiaya(),
      notes: notes || null,
      status: 'pending',
      submitted_at: new Date()
    };

    // Add file paths - common documents
    const fileFields = [
      'pas_foto', 'bukti_transfer', 'surat_pengalaman', 'sertifikat_tot',
      'surat_rekomendasi', 'kartu_identitas', 'ijazah', 'surat_kesediaan',
      'pakta_integritas', 'surat_keterangan_sehat', 'daftar_riwayat_hidup', 'surat_tugas'
    ];
    for (const field of fileFields) {
      if (files[field] && files[field][0]) {
        appData[field] = `lisensi/${field}/${files[field][0].filename}`;
      }
    }

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

    await LicenseApplication.update(parseInt(id), updateData);

    return res.json({ success: true, message: 'Status berhasil diperbarui' });
  } catch (err) {
    console.error('Update license status error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Issue license (PB Admin) - generates QR code, license number, and sets 3-year validity
exports.issueLicense = async (req, res) => {
  try {
    const { id } = req.params;
    const app = await LicenseApplication.findById(parseInt(id));

    if (!app) {
      return res.status(404).json({ success: false, message: 'Pengajuan tidak ditemukan' });
    }

    if (app.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Hanya pengajuan yang sudah approved yang dapat diterbitkan' });
    }

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setFullYear(expiresAt.getFullYear() + 3);

    // Generate license number: LIC-{JENIS}-{YYYY}{MM}-{ID}-{RANDOM}
    const jenisCode = (app.jenis_lisensi || app.license_type || '').toUpperCase().replace('_', '');
    const nomorLisensi = `LIC-${jenisCode}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(app.id).padStart(5, '0')}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    // Generate QR code
    const qrDir = path.join(__dirname, '../../uploads/qrcodes');
    if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });
    const qrFilename = `license_qr_${app.id}_${Date.now()}.png`;
    const qrPath = path.join(qrDir, qrFilename);
    await QRCode.toFile(qrPath, nomorLisensi, { width: 400, margin: 2, color: { dark: '#000000', light: '#ffffff' } });

    const updateData = {
      status: 'issued',
      nomor_lisensi: nomorLisensi,
      issued_at: now,
      expires_at: expiresAt,
      qr_code_path: `qrcodes/${qrFilename}`,
    };

    await LicenseApplication.update(parseInt(id), updateData);

    return res.json({
      success: true,
      message: 'Lisensi berhasil diterbitkan',
      data: { nomor_lisensi: nomorLisensi, issued_at: now, expires_at: expiresAt }
    });
  } catch (err) {
    console.error('Issue license error:', err);
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

// Toggle show_on_landing (PB Admin)
exports.toggleShowOnLanding = async (req, res) => {
  try {
    const { id } = req.params;
    const app = await LicenseApplication.findById(parseInt(id));
    if (!app) {
      return res.status(404).json({ success: false, message: 'Pengajuan tidak ditemukan' });
    }
    if (app.status !== 'approved' && app.status !== 'issued') {
      return res.status(400).json({ success: false, message: 'Hanya pengajuan yang sudah approved/issued bisa ditampilkan di landing page' });
    }
    const newValue = !app.show_on_landing;
    await LicenseApplication.update(parseInt(id), { show_on_landing: newValue });
    return res.json({ success: true, message: newValue ? 'Ditampilkan di landing page' : 'Dihapus dari landing page', data: { show_on_landing: newValue } });
  } catch (err) {
    console.error('Toggle show on landing error:', err);
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
