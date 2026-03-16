/**
 * External API Controller — Landing Page (Regional)
 * Manages hero slides, berita, struktur, feedback, site config per region
 */
const db = require('../lib/db-compat');
const path = require('path');
const fs = require('fs');

const deleteFile = (filePath) => {
  if (!filePath) return;
  const full = path.join(__dirname, '../../uploads/regional', filePath);
  if (fs.existsSync(full)) fs.unlinkSync(full);
};

/* ── HERO SLIDES ── */
exports.getHeroSlides = async (req, res) => {
  try {
    const region = req.apiKey.region;
    const [rows] = await db.query(
      'SELECT * FROM regional_hero_slides WHERE region = ? ORDER BY urutan ASC, id DESC',
      [region]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getHeroSlides error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data hero slides' });
  }
};

exports.createHeroSlide = async (req, res) => {
  try {
    const region = req.apiKey.region;
    const { title, subtitle, link, urutan, aktif } = req.body;
    const image_path = req.file ? `hero/${req.file.filename}` : null;
    const [result] = await db.query(
      'INSERT INTO regional_hero_slides (region, title, subtitle, image_path, link, urutan, aktif) VALUES (?,?,?,?,?,?,?)',
      [region, title || null, subtitle || null, image_path, link || null, parseInt(urutan) || 0, aktif !== undefined ? parseInt(aktif) : 1]
    );
    res.json({ success: true, message: 'Hero slide berhasil ditambahkan', data: { id: result.insertId } });
  } catch (err) {
    console.error('createHeroSlide error:', err);
    res.status(500).json({ success: false, message: 'Gagal menambahkan hero slide' });
  }
};

exports.updateHeroSlide = async (req, res) => {
  try {
    const { id } = req.params;
    const region = req.apiKey.region;
    const { title, subtitle, link, urutan, aktif } = req.body;

    const [existing] = await db.query('SELECT * FROM regional_hero_slides WHERE id = ? AND region = ?', [id, region]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Hero slide tidak ditemukan' });

    let image_path = existing[0].image_path;
    if (req.file) {
      deleteFile(existing[0].image_path);
      image_path = `hero/${req.file.filename}`;
    }

    await db.query(
      'UPDATE regional_hero_slides SET title=?, subtitle=?, image_path=?, link=?, urutan=?, aktif=? WHERE id=? AND region=?',
      [title || null, subtitle || null, image_path, link || null, parseInt(urutan) || 0, parseInt(aktif), id, region]
    );
    res.json({ success: true, message: 'Hero slide berhasil diperbarui' });
  } catch (err) {
    console.error('updateHeroSlide error:', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui hero slide' });
  }
};

exports.deleteHeroSlide = async (req, res) => {
  try {
    const { id } = req.params;
    const region = req.apiKey.region;
    const [existing] = await db.query('SELECT image_path FROM regional_hero_slides WHERE id = ? AND region = ?', [id, region]);
    if (existing.length) deleteFile(existing[0].image_path);
    await db.query('DELETE FROM regional_hero_slides WHERE id = ? AND region = ?', [id, region]);
    res.json({ success: true, message: 'Hero slide berhasil dihapus' });
  } catch (err) {
    console.error('deleteHeroSlide error:', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus hero slide' });
  }
};

/* ── BERITA ── */
exports.getBerita = async (req, res) => {
  try {
    const region = req.apiKey.region;
    const [rows] = await db.query(
      'SELECT * FROM regional_berita WHERE region = ? ORDER BY tanggal DESC, id DESC',
      [region]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getBerita error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data berita' });
  }
};

exports.createBerita = async (req, res) => {
  try {
    const region = req.apiKey.region;
    const { judul, ringkasan, konten, kategori, tanggal, link, aktif } = req.body;
    const gambar = req.file ? `berita/${req.file.filename}` : null;
    const [result] = await db.query(
      'INSERT INTO regional_berita (region, judul, ringkasan, konten, gambar, kategori, tanggal, link, aktif) VALUES (?,?,?,?,?,?,?,?,?)',
      [region, judul, ringkasan || null, konten || null, gambar, kategori || 'Umum', tanggal || null, link || null, aktif !== undefined ? parseInt(aktif) : 1]
    );
    res.json({ success: true, message: 'Berita berhasil ditambahkan', data: { id: result.insertId } });
  } catch (err) {
    console.error('createBerita error:', err);
    res.status(500).json({ success: false, message: 'Gagal menambahkan berita' });
  }
};

exports.updateBerita = async (req, res) => {
  try {
    const { id } = req.params;
    const region = req.apiKey.region;
    const { judul, ringkasan, konten, kategori, tanggal, link, aktif } = req.body;

    const [existing] = await db.query('SELECT * FROM regional_berita WHERE id = ? AND region = ?', [id, region]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Berita tidak ditemukan' });

    let gambar = existing[0].gambar;
    if (req.file) {
      deleteFile(existing[0].gambar);
      gambar = `berita/${req.file.filename}`;
    }

    await db.query(
      'UPDATE regional_berita SET judul=?, ringkasan=?, konten=?, gambar=?, kategori=?, tanggal=?, link=?, aktif=? WHERE id=? AND region=?',
      [judul, ringkasan || null, konten || null, gambar, kategori || 'Umum', tanggal || null, link || null, parseInt(aktif), id, region]
    );
    res.json({ success: true, message: 'Berita berhasil diperbarui' });
  } catch (err) {
    console.error('updateBerita error:', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui berita' });
  }
};

exports.deleteBerita = async (req, res) => {
  try {
    const { id } = req.params;
    const region = req.apiKey.region;
    const [existing] = await db.query('SELECT gambar FROM regional_berita WHERE id = ? AND region = ?', [id, region]);
    if (existing.length) deleteFile(existing[0].gambar);
    await db.query('DELETE FROM regional_berita WHERE id = ? AND region = ?', [id, region]);
    res.json({ success: true, message: 'Berita berhasil dihapus' });
  } catch (err) {
    console.error('deleteBerita error:', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus berita' });
  }
};

/* ── STRUKTUR ORGANISASI ── */
exports.getStruktur = async (req, res) => {
  try {
    const region = req.apiKey.region;
    const [rows] = await db.query(
      'SELECT * FROM regional_struktur WHERE region = ? ORDER BY urutan ASC, id ASC',
      [region]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getStruktur error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data struktur' });
  }
};

exports.createStruktur = async (req, res) => {
  try {
    const region = req.apiKey.region;
    const { nama, jabatan, urutan, aktif } = req.body;
    const foto = req.file ? `struktur/${req.file.filename}` : null;
    const [result] = await db.query(
      'INSERT INTO regional_struktur (region, nama, jabatan, foto, urutan, aktif) VALUES (?,?,?,?,?,?)',
      [region, nama, jabatan, foto, parseInt(urutan) || 0, aktif !== undefined ? parseInt(aktif) : 1]
    );
    res.json({ success: true, message: 'Struktur berhasil ditambahkan', data: { id: result.insertId } });
  } catch (err) {
    console.error('createStruktur error:', err);
    res.status(500).json({ success: false, message: 'Gagal menambahkan struktur' });
  }
};

exports.updateStruktur = async (req, res) => {
  try {
    const { id } = req.params;
    const region = req.apiKey.region;
    const { nama, jabatan, urutan, aktif } = req.body;

    const [existing] = await db.query('SELECT * FROM regional_struktur WHERE id = ? AND region = ?', [id, region]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });

    let foto = existing[0].foto;
    if (req.file) {
      deleteFile(existing[0].foto);
      foto = `struktur/${req.file.filename}`;
    }

    await db.query(
      'UPDATE regional_struktur SET nama=?, jabatan=?, foto=?, urutan=?, aktif=? WHERE id=? AND region=?',
      [nama, jabatan, foto, parseInt(urutan) || 0, parseInt(aktif), id, region]
    );
    res.json({ success: true, message: 'Struktur berhasil diperbarui' });
  } catch (err) {
    console.error('updateStruktur error:', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui struktur' });
  }
};

exports.deleteStruktur = async (req, res) => {
  try {
    const { id } = req.params;
    const region = req.apiKey.region;
    const [existing] = await db.query('SELECT foto FROM regional_struktur WHERE id = ? AND region = ?', [id, region]);
    if (existing.length) deleteFile(existing[0].foto);
    await db.query('DELETE FROM regional_struktur WHERE id = ? AND region = ?', [id, region]);
    res.json({ success: true, message: 'Struktur berhasil dihapus' });
  } catch (err) {
    console.error('deleteStruktur error:', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus struktur' });
  }
};

/* ── FEEDBACK ── */
exports.getFeedback = async (req, res) => {
  try {
    const region = req.apiKey.region;
    const [rows] = await db.query(
      'SELECT * FROM regional_feedback WHERE region = ? ORDER BY id DESC',
      [region]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getFeedback error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data feedback' });
  }
};

exports.createFeedback = async (req, res) => {
  try {
    const region = req.apiKey.region;
    const { nama, pesan, rating, aktif } = req.body;
    const foto = req.file ? `feedback/${req.file.filename}` : null;
    const [result] = await db.query(
      'INSERT INTO regional_feedback (region, nama, pesan, rating, foto, aktif) VALUES (?,?,?,?,?,?)',
      [region, nama, pesan, parseInt(rating) || 5, foto, aktif !== undefined ? parseInt(aktif) : 1]
    );
    res.json({ success: true, message: 'Feedback berhasil ditambahkan', data: { id: result.insertId } });
  } catch (err) {
    console.error('createFeedback error:', err);
    res.status(500).json({ success: false, message: 'Gagal menambahkan feedback' });
  }
};

exports.updateFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const region = req.apiKey.region;
    const { nama, pesan, rating, aktif } = req.body;

    const [existing] = await db.query('SELECT * FROM regional_feedback WHERE id = ? AND region = ?', [id, region]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Feedback tidak ditemukan' });

    let foto = existing[0].foto;
    if (req.file) {
      deleteFile(existing[0].foto);
      foto = `feedback/${req.file.filename}`;
    }

    await db.query(
      'UPDATE regional_feedback SET nama=?, pesan=?, rating=?, foto=?, aktif=? WHERE id=? AND region=?',
      [nama, pesan, parseInt(rating) || 5, foto, parseInt(aktif), id, region]
    );
    res.json({ success: true, message: 'Feedback berhasil diperbarui' });
  } catch (err) {
    console.error('updateFeedback error:', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui feedback' });
  }
};

exports.deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const region = req.apiKey.region;
    const [existing] = await db.query('SELECT foto FROM regional_feedback WHERE id = ? AND region = ?', [id, region]);
    if (existing.length) deleteFile(existing[0].foto);
    await db.query('DELETE FROM regional_feedback WHERE id = ? AND region = ?', [id, region]);
    res.json({ success: true, message: 'Feedback berhasil dihapus' });
  } catch (err) {
    console.error('deleteFeedback error:', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus feedback' });
  }
};

/* ── SITE CONFIG ── */
exports.getSiteConfig = async (req, res) => {
  try {
    const region = req.apiKey.region;
    const [rows] = await db.query('SELECT config_key, config_value FROM regional_site_config WHERE region = ?', [region]);
    const config = {};
    rows.forEach(r => { config[r.config_key] = r.config_value; });
    res.json({ success: true, data: config });
  } catch (err) {
    console.error('getSiteConfig error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil konfigurasi' });
  }
};

exports.updateSiteConfig = async (req, res) => {
  try {
    const region = req.apiKey.region;
    const configs = req.body; // { key1: value1, key2: value2 }
    if (!configs || typeof configs !== 'object') {
      return res.status(400).json({ success: false, message: 'Body harus berisi object key-value' });
    }
    for (const [key, value] of Object.entries(configs)) {
      await db.query(
        'INSERT INTO regional_site_config (region, config_key, config_value) VALUES (?,?,?) ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)',
        [region, key, value]
      );
    }
    res.json({ success: true, message: 'Konfigurasi berhasil diperbarui' });
  } catch (err) {
    console.error('updateSiteConfig error:', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui konfigurasi' });
  }
};

/* ── PUBLIC LANDING (no auth needed, served by region param) ── */
exports.getPublicLanding = async (req, res) => {
  try {
    const { region } = req.params;
    if (!region) return res.status(400).json({ success: false, message: 'Region diperlukan' });

    // Resolve province_id from region code
    const { REGIONS } = require('../config/regions');
    const regionData = REGIONS[region];
    if (!regionData) return res.status(404).json({ success: false, message: 'Region tidak ditemukan' });
    const provinceId = regionData.province_id;

    // Core landing data (parallel)
    const [
      [heroSlides], [berita], [struktur], [feedback], [configRows],
      [pengcab], [rekomendasi],
    ] = await Promise.all([
      db.query('SELECT * FROM regional_hero_slides WHERE region = ? AND aktif = 1 ORDER BY urutan ASC', [region]),
      db.query('SELECT * FROM regional_berita WHERE region = ? AND aktif = 1 ORDER BY tanggal DESC LIMIT 10', [region]),
      db.query('SELECT * FROM regional_struktur WHERE region = ? AND aktif = 1 ORDER BY urutan ASC', [region]),
      db.query('SELECT * FROM regional_feedback WHERE region = ? AND aktif = 1 ORDER BY id DESC', [region]),
      db.query('SELECT config_key, config_value FROM regional_site_config WHERE region = ?', [region]),
      db.query('SELECT id, nama_pengcab, ketua, alamat, telepon, email, foto, city_id FROM pengcab_data WHERE region = ? AND aktif = 1 ORDER BY nama_pengcab ASC', [region]),
      db.query('SELECT id, pemohon_nama, pemohon_club, jenis_rekomendasi, perihal, approved_at FROM rekomendasi WHERE region = ? AND status = ? ORDER BY approved_at DESC LIMIT 20', [region, 'approved']),
    ]);

    const config = {};
    configRows.forEach(r => { config[r.config_key] = r.config_value; });

    // Kejurda: find pengda user for this province to get pengda_id
    let kejurdaOpen = [];
    try {
      const [pengdaUsers] = await db.query('SELECT id FROM users WHERE role_id = 3 AND province_id = ? LIMIT 1', [provinceId]);
      if (pengdaUsers.length) {
        const pengdaId = pengdaUsers[0].id;
        const [events] = await db.query(
          "SELECT id, event_name, event_date, location, description, status FROM kejurda_events WHERE pengda_id = ? AND status IN ('upcoming','ongoing') ORDER BY event_date ASC",
          [pengdaId]
        );
        kejurdaOpen = events;
      }
    } catch { /* kejurda tables may not exist */ }

    // Stats
    const [[pengcabCount]] = await db.query('SELECT COUNT(*) as c FROM pengcab_data WHERE region = ? AND aktif = 1', [region]);
    const [[rekomCount]] = await db.query('SELECT COUNT(*) as c FROM rekomendasi WHERE region = ? AND status = ?', [region, 'approved']);
    const [[userCount]] = await db.query('SELECT COUNT(*) as c FROM users WHERE province_id = ?', [provinceId]);

    res.json({
      success: true,
      data: {
        region,
        heroSlides,
        berita,
        struktur,
        feedback,
        config,
        pengcab,
        rekomendasi,
        kejurdaOpen,
        stats: {
          pengcab: pengcabCount?.c || 0,
          rekomendasi: rekomCount?.c || 0,
          kejurda: kejurdaOpen.length,
          users: userCount?.c || 0,
        },
      },
    });
  } catch (err) {
    console.error('getPublicLanding error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data landing' });
  }
};
