/**
 * Regional Landing Controller (JWT auth for Pengda)
 * Allows Pengda to manage their regional landing page from the main dashboard.
 * Region is derived from user's province_id.
 */
const db = require('../lib/db-compat');
const path = require('path');
const fs = require('fs');
const { REGIONS } = require('../config/regions');

/** Resolve region code from province_id */
function getRegionByProvinceId(province_id) {
  for (const [code, data] of Object.entries(REGIONS)) {
    if (data.province_id === province_id) return { code, ...data };
  }
  return null;
}

const deleteFile = (region, filePath) => {
  if (!filePath) return;
  const full = path.join(__dirname, '../../uploads/regional', region, filePath);
  if (fs.existsSync(full)) fs.unlinkSync(full);
};

/** Middleware-like: extract region from JWT user's province_id (fetched from DB) */
async function resolveRegion(req, res) {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return null; }

  const [users] = await db.query('SELECT province_id FROM users WHERE id = ?', [userId]);
  if (!users.length || !users[0].province_id) {
    res.status(400).json({ success: false, message: 'Province ID tidak ditemukan di akun Anda' });
    return null;
  }

  const region = getRegionByProvinceId(users[0].province_id);
  if (!region) {
    res.status(400).json({ success: false, message: 'Region tidak ditemukan untuk provinsi Anda' });
    return null;
  }
  return region;
}

/* ── HERO SLIDES ── */
exports.getHeroSlides = async (req, res) => {
  try {
    const region = await resolveRegion(req, res); if (!region) return;
    const [rows] = await db.query('SELECT * FROM regional_hero_slides WHERE region = ? ORDER BY urutan ASC, id DESC', [region.code]);
    res.json({ success: true, data: rows });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Gagal mengambil data' }); }
};

exports.createHeroSlide = async (req, res) => {
  try {
    const region = await resolveRegion(req, res); if (!region) return;
    const { title, subtitle, link, urutan, aktif } = req.body;
    const image_path = req.file ? `hero/${req.file.filename}` : null;
    const [result] = await db.query(
      'INSERT INTO regional_hero_slides (region, title, subtitle, image_path, link, urutan, aktif) VALUES (?,?,?,?,?,?,?)',
      [region.code, title || null, subtitle || null, image_path, link || null, parseInt(urutan) || 0, aktif !== undefined ? parseInt(aktif) : 1]
    );
    res.json({ success: true, message: 'Hero slide berhasil ditambahkan', data: { id: result.insertId } });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Gagal menambahkan' }); }
};

exports.updateHeroSlide = async (req, res) => {
  try {
    const region = await resolveRegion(req, res); if (!region) return;
    const { id } = req.params;
    const { title, subtitle, link, urutan, aktif } = req.body;
    const [existing] = await db.query('SELECT * FROM regional_hero_slides WHERE id = ? AND region = ?', [id, region.code]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Tidak ditemukan' });
    let image_path = existing[0].image_path;
    if (req.file) { deleteFile(region.code, existing[0].image_path); image_path = `hero/${req.file.filename}`; }
    await db.query(
      'UPDATE regional_hero_slides SET title=?, subtitle=?, image_path=?, link=?, urutan=?, aktif=? WHERE id=? AND region=?',
      [title || null, subtitle || null, image_path, link || null, parseInt(urutan) || 0, parseInt(aktif), id, region.code]
    );
    res.json({ success: true, message: 'Hero slide berhasil diperbarui' });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Gagal memperbarui' }); }
};

exports.deleteHeroSlide = async (req, res) => {
  try {
    const region = await resolveRegion(req, res); if (!region) return;
    const { id } = req.params;
    const [existing] = await db.query('SELECT image_path FROM regional_hero_slides WHERE id = ? AND region = ?', [id, region.code]);
    if (existing.length) deleteFile(region.code, existing[0].image_path);
    await db.query('DELETE FROM regional_hero_slides WHERE id = ? AND region = ?', [id, region.code]);
    res.json({ success: true, message: 'Hero slide berhasil dihapus' });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Gagal menghapus' }); }
};

/* ── BERITA ── */
exports.getBerita = async (req, res) => {
  try {
    const region = await resolveRegion(req, res); if (!region) return;
    const [rows] = await db.query('SELECT * FROM regional_berita WHERE region = ? ORDER BY tanggal DESC, id DESC', [region.code]);
    res.json({ success: true, data: rows });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Gagal mengambil data' }); }
};

exports.createBerita = async (req, res) => {
  try {
    const region = await resolveRegion(req, res); if (!region) return;
    const { judul, ringkasan, konten, kategori, tanggal, link, aktif } = req.body;
    const gambar = req.file ? `berita/${req.file.filename}` : null;
    const [result] = await db.query(
      'INSERT INTO regional_berita (region, judul, ringkasan, konten, gambar, kategori, tanggal, link, aktif) VALUES (?,?,?,?,?,?,?,?,?)',
      [region.code, judul, ringkasan || null, konten || null, gambar, kategori || 'Umum', tanggal || null, link || null, aktif !== undefined ? parseInt(aktif) : 1]
    );
    res.json({ success: true, message: 'Berita berhasil ditambahkan', data: { id: result.insertId } });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Gagal menambahkan' }); }
};

exports.updateBerita = async (req, res) => {
  try {
    const region = await resolveRegion(req, res); if (!region) return;
    const { id } = req.params;
    const { judul, ringkasan, konten, kategori, tanggal, link, aktif } = req.body;
    const [existing] = await db.query('SELECT * FROM regional_berita WHERE id = ? AND region = ?', [id, region.code]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Tidak ditemukan' });
    let gambar = existing[0].gambar;
    if (req.file) { deleteFile(region.code, existing[0].gambar); gambar = `berita/${req.file.filename}`; }
    await db.query(
      'UPDATE regional_berita SET judul=?, ringkasan=?, konten=?, gambar=?, kategori=?, tanggal=?, link=?, aktif=? WHERE id=? AND region=?',
      [judul, ringkasan || null, konten || null, gambar, kategori || 'Umum', tanggal || null, link || null, parseInt(aktif), id, region.code]
    );
    res.json({ success: true, message: 'Berita berhasil diperbarui' });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Gagal memperbarui' }); }
};

exports.deleteBerita = async (req, res) => {
  try {
    const region = await resolveRegion(req, res); if (!region) return;
    const { id } = req.params;
    const [existing] = await db.query('SELECT gambar FROM regional_berita WHERE id = ? AND region = ?', [id, region.code]);
    if (existing.length) deleteFile(region.code, existing[0].gambar);
    await db.query('DELETE FROM regional_berita WHERE id = ? AND region = ?', [id, region.code]);
    res.json({ success: true, message: 'Berita berhasil dihapus' });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Gagal menghapus' }); }
};

/* ── STRUKTUR ORGANISASI ── */
exports.getStruktur = async (req, res) => {
  try {
    const region = await resolveRegion(req, res); if (!region) return;
    const [rows] = await db.query('SELECT * FROM regional_struktur WHERE region = ? ORDER BY urutan ASC', [region.code]);
    res.json({ success: true, data: rows });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Gagal mengambil data' }); }
};

exports.createStruktur = async (req, res) => {
  try {
    const region = await resolveRegion(req, res); if (!region) return;
    const { nama, jabatan, urutan, aktif } = req.body;
    const foto = req.file ? `struktur/${req.file.filename}` : null;
    const [result] = await db.query(
      'INSERT INTO regional_struktur (region, nama, jabatan, foto, urutan, aktif) VALUES (?,?,?,?,?,?)',
      [region.code, nama, jabatan, foto, parseInt(urutan) || 0, aktif !== undefined ? parseInt(aktif) : 1]
    );
    res.json({ success: true, message: 'Struktur berhasil ditambahkan', data: { id: result.insertId } });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Gagal menambahkan' }); }
};

exports.updateStruktur = async (req, res) => {
  try {
    const region = await resolveRegion(req, res); if (!region) return;
    const { id } = req.params;
    const { nama, jabatan, urutan, aktif } = req.body;
    const [existing] = await db.query('SELECT * FROM regional_struktur WHERE id = ? AND region = ?', [id, region.code]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Tidak ditemukan' });
    let foto = existing[0].foto;
    if (req.file) { deleteFile(region.code, existing[0].foto); foto = `struktur/${req.file.filename}`; }
    await db.query(
      'UPDATE regional_struktur SET nama=?, jabatan=?, foto=?, urutan=?, aktif=? WHERE id=? AND region=?',
      [nama, jabatan, foto, parseInt(urutan) || 0, parseInt(aktif), id, region.code]
    );
    res.json({ success: true, message: 'Struktur berhasil diperbarui' });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Gagal memperbarui' }); }
};

exports.deleteStruktur = async (req, res) => {
  try {
    const region = await resolveRegion(req, res); if (!region) return;
    const { id } = req.params;
    const [existing] = await db.query('SELECT foto FROM regional_struktur WHERE id = ? AND region = ?', [id, region.code]);
    if (existing.length) deleteFile(region.code, existing[0].foto);
    await db.query('DELETE FROM regional_struktur WHERE id = ? AND region = ?', [id, region.code]);
    res.json({ success: true, message: 'Struktur berhasil dihapus' });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Gagal menghapus' }); }
};

/* ── FEEDBACK ── */
exports.getFeedback = async (req, res) => {
  try {
    const region = await resolveRegion(req, res); if (!region) return;
    const [rows] = await db.query('SELECT * FROM regional_feedback WHERE region = ? ORDER BY id DESC', [region.code]);
    res.json({ success: true, data: rows });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Gagal mengambil data' }); }
};

exports.createFeedback = async (req, res) => {
  try {
    const region = await resolveRegion(req, res); if (!region) return;
    const { nama, pesan, rating, aktif } = req.body;
    const foto = req.file ? `feedback/${req.file.filename}` : null;
    const [result] = await db.query(
      'INSERT INTO regional_feedback (region, nama, pesan, rating, foto, aktif) VALUES (?,?,?,?,?,?)',
      [region.code, nama, pesan, parseInt(rating) || 5, foto, aktif !== undefined ? parseInt(aktif) : 1]
    );
    res.json({ success: true, message: 'Feedback berhasil ditambahkan', data: { id: result.insertId } });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Gagal menambahkan' }); }
};

exports.updateFeedback = async (req, res) => {
  try {
    const region = await resolveRegion(req, res); if (!region) return;
    const { id } = req.params;
    const { nama, pesan, rating, aktif } = req.body;
    const [existing] = await db.query('SELECT * FROM regional_feedback WHERE id = ? AND region = ?', [id, region.code]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Tidak ditemukan' });
    let foto = existing[0].foto;
    if (req.file) { deleteFile(region.code, existing[0].foto); foto = `feedback/${req.file.filename}`; }
    await db.query(
      'UPDATE regional_feedback SET nama=?, pesan=?, rating=?, foto=?, aktif=? WHERE id=? AND region=?',
      [nama, pesan, parseInt(rating) || 5, foto, parseInt(aktif), id, region.code]
    );
    res.json({ success: true, message: 'Feedback berhasil diperbarui' });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Gagal memperbarui' }); }
};

exports.deleteFeedback = async (req, res) => {
  try {
    const region = await resolveRegion(req, res); if (!region) return;
    const { id } = req.params;
    const [existing] = await db.query('SELECT foto FROM regional_feedback WHERE id = ? AND region = ?', [id, region.code]);
    if (existing.length) deleteFile(region.code, existing[0].foto);
    await db.query('DELETE FROM regional_feedback WHERE id = ? AND region = ?', [id, region.code]);
    res.json({ success: true, message: 'Feedback berhasil dihapus' });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Gagal menghapus' }); }
};

/* ── SITE CONFIG ── */
exports.getSiteConfig = async (req, res) => {
  try {
    const region = await resolveRegion(req, res); if (!region) return;
    const [rows] = await db.query('SELECT config_key, config_value FROM regional_site_config WHERE region = ?', [region.code]);
    const config = {};
    rows.forEach(r => { config[r.config_key] = r.config_value; });
    res.json({ success: true, data: config, region: region.code, region_name: region.name });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Gagal mengambil konfigurasi' }); }
};

exports.updateSiteConfig = async (req, res) => {
  try {
    const region = await resolveRegion(req, res); if (!region) return;
    const configs = req.body;
    if (!configs || typeof configs !== 'object') return res.status(400).json({ success: false, message: 'Body harus berisi object key-value' });
    for (const [key, value] of Object.entries(configs)) {
      await db.query(
        'INSERT INTO regional_site_config (region, config_key, config_value) VALUES (?,?,?) ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)',
        [region.code, key, value]
      );
    }
    res.json({ success: true, message: 'Konfigurasi berhasil diperbarui' });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Gagal memperbarui konfigurasi' }); }
};

/* ── REGION INFO ── */
exports.getRegionInfo = async (req, res) => {
  try {
    const region = await resolveRegion(req, res); if (!region) return;
    res.json({ success: true, data: { code: region.code, name: region.name, province_id: region.province_id } });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Gagal mengambil info region' }); }
};
