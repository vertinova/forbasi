const EventApplication = require('../models/EventApplication');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

// Helper: build file map from multer req.files
const buildFileMap = (files) => {
  const map = {};
  if (!files) return map;
  for (const f of files) {
    map[f.fieldname] = f.filename;
  }
  return map;
};

// Submit event application (penyelenggara)
exports.submitEvent = async (req, res) => {
  try {
    const userId = req.user.id;
    const fileMap = buildFileMap(req.files);

    const {
      nama_event, jenis_event, tanggal_mulai, tanggal_selesai,
      lokasi, deskripsi, penyelenggara, kontak_person,
      mata_lomba, persyaratan
    } = req.body;

    if (!nama_event || !tanggal_mulai || !tanggal_selesai || !lokasi) {
      return res.status(400).json({ success: false, message: 'Field wajib (nama event, tanggal, lokasi) harus diisi' });
    }

    // Parse JSON fields
    let parsedMataLomba = null;
    let parsedPersyaratan = {};
    try {
      if (mata_lomba) parsedMataLomba = JSON.parse(mata_lomba);
      if (persyaratan) parsedPersyaratan = JSON.parse(persyaratan);
    } catch {
      return res.status(400).json({ success: false, message: 'Format data mata lomba atau persyaratan tidak valid' });
    }

    // Merge uploaded files into persyaratan
    const fileFields = [
      'suratIzinSekolah', 'suratIzinKepolisian', 'suratRekomendasiDinas',
      'suratIzinVenue', 'suratRekomendasiPPI',
      'fotoLapangan', 'fotoTempatIbadah', 'fotoBarak', 'fotoAreaParkir',
      'fotoRuangKesehatan', 'fotoMCK', 'fotoTempatSampah', 'fotoRuangKomisi',
      'faktaIntegritasKomisi', 'faktaIntegritasHonor', 'faktaIntegritasPanitia',
      'desainSertifikat'
    ];
    for (const field of fileFields) {
      if (fileMap[field]) {
        parsedPersyaratan[field] = fileMap[field];
      }
    }

    // Handle juri photos (namaJuri_photo_0, namaJuri_photo_1, etc.)
    for (const key of Object.keys(fileMap)) {
      if (key.startsWith('namaJuri_photo_')) {
        parsedPersyaratan[key] = fileMap[key];
      }
    }

    const appData = {
      user_id: userId,
      jenis_pengajuan: 'event_penyelenggara',
      nama_event,
      jenis_event: jenis_event || null,
      tanggal_mulai: new Date(tanggal_mulai),
      tanggal_selesai: new Date(tanggal_selesai),
      lokasi,
      deskripsi: deskripsi || null,
      penyelenggara: penyelenggara || null,
      kontak_person: kontak_person || null,
      dokumen_surat: fileMap.dokumen_surat || null,
      proposal_kegiatan: fileMap.proposal_kegiatan || null,
      poster: fileMap.poster || null,
      mata_lomba: parsedMataLomba,
      persyaratan: parsedPersyaratan,
      status: 'submitted'
    };

    const id = await EventApplication.create(appData);

    return res.status(201).json({
      success: true,
      message: 'Pengajuan event berhasil disubmit',
      data: { id }
    });
  } catch (err) {
    console.error('Submit event error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Submit kejurcab application (pengcab)
exports.submitKejurcab = async (req, res) => {
  try {
    const userId = req.user.id;
    const fileMap = buildFileMap(req.files);

    const {
      nama_event, tanggal_mulai, tanggal_selesai,
      lokasi, deskripsi,
      mata_lomba, persyaratan
    } = req.body;

    if (!nama_event || !tanggal_mulai || !tanggal_selesai || !lokasi) {
      return res.status(400).json({ success: false, message: 'Field wajib harus diisi' });
    }

    // Check max 1 kejurcab per pengcab per year
    const year = new Date(tanggal_mulai).getFullYear();
    const existing = await EventApplication.countKejurcabByUserAndYear(userId, year);
    if (existing > 0) {
      return res.status(400).json({ success: false, message: `Anda sudah mengajukan Kejurcab untuk tahun ${year}. Maksimal 1 kejurcab per tahun.` });
    }

    // Parse JSON fields
    let parsedMataLomba = null;
    let parsedPersyaratan = {};
    try {
      if (mata_lomba) parsedMataLomba = JSON.parse(mata_lomba);
      if (persyaratan) parsedPersyaratan = JSON.parse(persyaratan);
    } catch {
      return res.status(400).json({ success: false, message: 'Format data tidak valid' });
    }

    // Merge uploaded files into persyaratan
    const fileFields = [
      'suratIzinSekolah', 'suratIzinKepolisian', 'suratRekomendasiDinas',
      'suratIzinVenue', 'suratRekomendasiPPI',
      'fotoLapangan', 'fotoTempatIbadah', 'fotoBarak', 'fotoAreaParkir',
      'fotoRuangKesehatan', 'fotoMCK', 'fotoTempatSampah', 'fotoRuangKomisi',
      'faktaIntegritasKomisi', 'faktaIntegritasHonor', 'faktaIntegritasPanitia',
      'desainSertifikat'
    ];
    for (const field of fileFields) {
      if (fileMap[field]) {
        parsedPersyaratan[field] = fileMap[field];
      }
    }

    for (const key of Object.keys(fileMap)) {
      if (key.startsWith('namaJuri_photo_')) {
        parsedPersyaratan[key] = fileMap[key];
      }
    }

    const appData = {
      user_id: userId,
      jenis_pengajuan: 'kejurcab',
      nama_event,
      jenis_event: null,
      tanggal_mulai: new Date(tanggal_mulai),
      tanggal_selesai: new Date(tanggal_selesai),
      lokasi,
      deskripsi: deskripsi || null,
      penyelenggara: null,
      kontak_person: null,
      dokumen_surat: null,
      proposal_kegiatan: fileMap.proposal_kegiatan || null,
      poster: fileMap.poster || null,
      mata_lomba: parsedMataLomba,
      persyaratan: parsedPersyaratan,
      status: 'submitted'
    };

    const id = await EventApplication.create(appData);

    return res.status(201).json({
      success: true,
      message: 'Pengajuan Kejurcab berhasil disubmit',
      data: { id }
    });
  } catch (err) {
    console.error('Submit kejurcab error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Get my event applications
exports.getMyEvents = async (req, res) => {
  try {
    const userId = req.user.id;
    const { jenis } = req.query;
    const events = await EventApplication.findByUserId(userId, jenis || null);
    return res.json({ success: true, data: events });
  } catch (err) {
    console.error('Get my events error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Get event detail
exports.getEventDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await EventApplication.findById(parseInt(id));
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event tidak ditemukan' });
    }

    // Check ownership or admin access
    const isOwner = event.user_id === req.user.id;
    const isAdmin = [2, 3, 4].includes(req.user.role_id) || req.user.user_type === 'super_admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }

    // Get user info
    const user = await User.findById(event.user_id);

    return res.json({
      success: true,
      data: {
        ...event,
        nama_organisasi: user?.club_name,
        username: user?.username
      }
    });
  } catch (err) {
    console.error('Get event detail error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Get events for pengcab approval
exports.getPendingPengcabApproval = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const events = await EventApplication.findPendingPengcabApproval(user.province_id, user.city_id);
    return res.json({ success: true, data: events });
  } catch (err) {
    console.error('Get pending pengcab error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Pengcab approve event
exports.pengcabApprove = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const event = await EventApplication.findById(parseInt(id));

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event tidak ditemukan' });
    }
    if (event.jenis_pengajuan !== 'event_penyelenggara') {
      return res.status(400).json({ success: false, message: 'Hanya event penyelenggara yang memerlukan approval pengcab' });
    }
    if (event.status !== 'submitted') {
      return res.status(400).json({ success: false, message: 'Event sudah diproses' });
    }

    await EventApplication.update(parseInt(id), {
      status: 'approved_pengcab',
      pengcab_approved_by: req.user.id,
      pengcab_approved_at: new Date(),
      pengcab_notes: notes || null
    });

    return res.json({ success: true, message: 'Event approved oleh Pengcab' });
  } catch (err) {
    console.error('Pengcab approve error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Pengcab reject event
exports.pengcabReject = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const event = await EventApplication.findById(parseInt(id));

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event tidak ditemukan' });
    }
    if (event.status !== 'submitted') {
      return res.status(400).json({ success: false, message: 'Event sudah diproses' });
    }

    await EventApplication.update(parseInt(id), {
      status: 'rejected_pengcab',
      pengcab_approved_by: req.user.id,
      pengcab_approved_at: new Date(),
      rejection_reason: reason || 'Ditolak oleh Pengcab'
    });

    return res.json({ success: true, message: 'Event ditolak oleh Pengcab' });
  } catch (err) {
    console.error('Pengcab reject error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Get events for admin approval
exports.getPendingAdminApproval = async (req, res) => {
  try {
    const events = await EventApplication.findPendingAdminApproval(req.query);
    return res.json({ success: true, data: events });
  } catch (err) {
    console.error('Get pending admin error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Get all events (admin overview)
exports.getAllEvents = async (req, res) => {
  try {
    const events = await EventApplication.findAllWithUser(req.query);
    return res.json({ success: true, data: events });
  } catch (err) {
    console.error('Get all events error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Admin approve event + generate surat rekomendasi
exports.adminApprove = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const event = await EventApplication.findById(parseInt(id));

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event tidak ditemukan' });
    }

    // Validate correct status
    const validStatus = event.jenis_pengajuan === 'kejurcab' ? 'submitted' : 'approved_pengcab';
    if (event.status !== validStatus) {
      return res.status(400).json({ success: false, message: 'Event belum siap untuk approval admin' });
    }

    // Generate surat rekomendasi PDF
    let suratPath = null;
    try {
      suratPath = await generateSuratRekomendasi(event);
    } catch (pdfErr) {
      console.error('PDF generation failed:', pdfErr);
    }

    await EventApplication.update(parseInt(id), {
      status: 'approved_admin',
      admin_approved_by: req.user.id,
      admin_approved_at: new Date(),
      admin_notes: notes || null,
      surat_rekomendasi_path: suratPath
    });

    return res.json({
      success: true,
      message: 'Event approved oleh Admin',
      data: { surat_rekomendasi_path: suratPath }
    });
  } catch (err) {
    console.error('Admin approve error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Admin reject event
exports.adminReject = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const event = await EventApplication.findById(parseInt(id));

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event tidak ditemukan' });
    }

    await EventApplication.update(parseInt(id), {
      status: 'rejected_admin',
      admin_approved_by: req.user.id,
      admin_approved_at: new Date(),
      rejection_reason: reason || 'Ditolak oleh Admin'
    });

    return res.json({ success: true, message: 'Event ditolak oleh Admin' });
  } catch (err) {
    console.error('Admin reject error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Generate surat rekomendasi PDF
async function generateSuratRekomendasi(event) {
  const PDFDocument = require('pdfkit');
  const uploadsDir = path.join(__dirname, '../../uploads/event_surat');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const filename = `surat_rekomendasi_${event.id}_${Date.now()}.pdf`;
  const filepath = path.join(uploadsDir, filename);

  const user = await User.findById(event.user_id);
  const jenisLabel = event.jenis_pengajuan === 'kejurcab' ? 'Kejuaraan Cabang' : 'Event';

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 60 });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // Header
    doc.fontSize(14).font('Helvetica-Bold').text('FORUM BARIS INDONESIA (FORBASI)', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('Sekretariat: Jl. Raya No. 1, Jakarta', { align: 'center' });
    doc.moveDown(0.5);
    doc.moveTo(60, doc.y).lineTo(535, doc.y).stroke();
    doc.moveDown(1);

    // Title
    doc.fontSize(12).font('Helvetica-Bold').text('SURAT REKOMENDASI', { align: 'center', underline: true });
    doc.fontSize(10).font('Helvetica').text(`No: SR/FORBASI/${event.id}/${new Date().getFullYear()}`, { align: 'center' });
    doc.moveDown(1.5);

    // Body
    doc.fontSize(10).font('Helvetica').text('Yang bertanda tangan di bawah ini, Pengurus FORBASI dengan ini memberikan rekomendasi kepada:');
    doc.moveDown(0.5);

    const info = [
      ['Nama Organisasi', user?.club_name || '-'],
      ['Nama Event', event.nama_event],
      ['Jenis', jenisLabel],
      ['Tanggal', `${formatDate(event.tanggal_mulai)} s/d ${formatDate(event.tanggal_selesai)}`],
      ['Lokasi', event.lokasi],
    ];

    for (const [label, value] of info) {
      doc.font('Helvetica-Bold').text(`${label}`, { continued: true, indent: 20 });
      doc.font('Helvetica').text(` : ${value}`);
    }

    doc.moveDown(1);
    doc.font('Helvetica').text(
      'Untuk menyelenggarakan kegiatan tersebut di atas sesuai dengan ketentuan dan peraturan yang berlaku di FORBASI.',
      { indent: 0 }
    );
    doc.moveDown(0.5);
    doc.text('Demikian surat rekomendasi ini dibuat untuk dapat dipergunakan sebagaimana mestinya.');
    doc.moveDown(2);

    // Signature
    const now = new Date();
    doc.text(`Jakarta, ${formatDate(now)}`, { align: 'right' });
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').text('FORBASI', { align: 'right' });
    doc.moveDown(3);
    doc.text('_______________________', { align: 'right' });
    doc.font('Helvetica').text('Pengurus', { align: 'right' });

    doc.end();

    stream.on('finish', () => resolve(`event_surat/${filename}`));
    stream.on('error', reject);
  });
}

function formatDate(d) {
  const date = new Date(d);
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}
