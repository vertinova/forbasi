const { LicenseApplication } = require('../models/License');
const { LicenseEvent } = require('../models/Common');

// Submit license application (Pelatih/Juri)
exports.submitApplication = async (req, res) => {
  try {
    const userId = req.user.id;
    const { nama_lengkap, alamat, email, no_telepon, jenis_lisensi, biaya_lisensi, akomodasi } = req.body;
    const files = req.files || {};

    if (!nama_lengkap || !alamat || !email || !no_telepon || !jenis_lisensi) {
      return res.status(400).json({ success: false, message: 'Semua field wajib diisi' });
    }

    if (!['pelatih', 'juri_muda', 'juri_madya'].includes(jenis_lisensi)) {
      return res.status(400).json({ success: false, message: 'Jenis lisensi tidak valid' });
    }

    const denganKamar = akomodasi === 'dengan_kamar';
    const hitungBiaya = () => {
      if (jenis_lisensi === 'pelatih') return denganKamar ? 1000000 : 750000;
      return denganKamar ? 2250000 : 2000000;
    };

    const appData = {
      user_id: userId,
      nama_lengkap,
      alamat,
      email,
      no_telepon,
      jenis_lisensi,
      akomodasi: akomodasi || 'tanpa_kamar',
      biaya_lisensi: biaya_lisensi || hitungBiaya(),
      status: 'pending',
      submitted_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };

    if (files.pas_foto) appData.pas_foto = `lisensi/${files.pas_foto[0].filename}`;
    if (files.bukti_transfer) appData.bukti_transfer = `lisensi/${files.bukti_transfer[0].filename}`;
    if (files.surat_pengalaman) appData.surat_pengalaman = `lisensi/${files.surat_pengalaman[0].filename}`;
    if (files.surat_rekomendasi_pengda) appData.surat_rekomendasi_pengda = `lisensi/${files.surat_rekomendasi_pengda[0].filename}`;

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
      approved_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };

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
