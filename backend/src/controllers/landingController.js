const db = require('../lib/db-compat');
const path = require('path');
const fs = require('fs');

/* ── helper: delete file safely ── */
const deleteFile = (filePath) => {
  if (!filePath) return;
  const full = path.join(__dirname, '../../uploads/landing', filePath);
  if (fs.existsSync(full)) fs.unlinkSync(full);
};

/* ══════════════════════════════════════════
   EVENTS
══════════════════════════════════════════ */
exports.getEvents = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM landing_events ORDER BY urutan ASC, id DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getEvents error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data events' });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const { nama, tanggal, lokasi, status, icon, color, deskripsi, link, urutan, aktif } = req.body;
    const banner = req.file ? `events/${req.file.filename}` : null;
    const [result] = await db.query(
      'INSERT INTO landing_events (nama, tanggal, lokasi, status, icon, color, deskripsi, banner, link, urutan, aktif) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [nama, tanggal, lokasi, status || 'upcoming', icon || 'fa-calendar-alt', color || 'emerald', deskripsi, banner, link || null, parseInt(urutan) || 0, aktif !== undefined ? parseInt(aktif) : 1]
    );
    res.json({ success: true, message: 'Event berhasil ditambahkan', data: { id: result.insertId } });
  } catch (err) {
    console.error('createEvent error:', err);
    res.status(500).json({ success: false, message: 'Gagal menambahkan event' });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, tanggal, lokasi, status, icon, color, deskripsi, link, urutan, aktif } = req.body;

    const [existing] = await db.query('SELECT banner FROM landing_events WHERE id = ?', [id]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Event tidak ditemukan' });

    let banner = existing[0].banner;
    if (req.file) {
      deleteFile(existing[0].banner);
      banner = `events/${req.file.filename}`;
    }

    await db.query(
      'UPDATE landing_events SET nama=?, tanggal=?, lokasi=?, status=?, icon=?, color=?, deskripsi=?, banner=?, link=?, urutan=?, aktif=? WHERE id=?',
      [nama, tanggal, lokasi, status, icon, color, deskripsi, banner, link || null, parseInt(urutan) || 0, parseInt(aktif), id]
    );
    res.json({ success: true, message: 'Event berhasil diperbarui' });
  } catch (err) {
    console.error('updateEvent error:', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui event' });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.query('SELECT banner FROM landing_events WHERE id = ?', [id]);
    if (existing.length) deleteFile(existing[0].banner);
    await db.query('DELETE FROM landing_events WHERE id = ?', [id]);
    res.json({ success: true, message: 'Event berhasil dihapus' });
  } catch (err) {
    console.error('deleteEvent error:', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus event' });
  }
};

/* ══════════════════════════════════════════
   GALLERY
══════════════════════════════════════════ */
exports.getGallery = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM landing_gallery ORDER BY urutan ASC, id DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getGallery error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data galeri' });
  }
};

exports.createGallery = async (req, res) => {
  try {
    const { caption, kategori, urutan, aktif } = req.body;
    if (!req.file) return res.status(400).json({ success: false, message: 'Gambar wajib diupload' });
    const src = `gallery/${req.file.filename}`;
    const [result] = await db.query(
      'INSERT INTO landing_gallery (src, caption, kategori, urutan, aktif) VALUES (?,?,?,?,?)',
      [src, caption, kategori || 'Umum', parseInt(urutan) || 0, aktif !== undefined ? parseInt(aktif) : 1]
    );
    res.json({ success: true, message: 'Galeri berhasil ditambahkan', data: { id: result.insertId } });
  } catch (err) {
    console.error('createGallery error:', err);
    res.status(500).json({ success: false, message: 'Gagal menambahkan galeri' });
  }
};

exports.updateGallery = async (req, res) => {
  try {
    const { id } = req.params;
    const { caption, kategori, urutan, aktif } = req.body;
    const [existing] = await db.query('SELECT src FROM landing_gallery WHERE id = ?', [id]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Galeri tidak ditemukan' });

    let src = existing[0].src;
    if (req.file) {
      deleteFile(existing[0].src);
      src = `gallery/${req.file.filename}`;
    }

    await db.query(
      'UPDATE landing_gallery SET src=?, caption=?, kategori=?, urutan=?, aktif=? WHERE id=?',
      [src, caption, kategori, parseInt(urutan) || 0, parseInt(aktif), id]
    );
    res.json({ success: true, message: 'Galeri berhasil diperbarui' });
  } catch (err) {
    console.error('updateGallery error:', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui galeri' });
  }
};

exports.deleteGallery = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.query('SELECT src FROM landing_gallery WHERE id = ?', [id]);
    if (existing.length) deleteFile(existing[0].src);
    await db.query('DELETE FROM landing_gallery WHERE id = ?', [id]);
    res.json({ success: true, message: 'Galeri berhasil dihapus' });
  } catch (err) {
    console.error('deleteGallery error:', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus galeri' });
  }
};

/* ══════════════════════════════════════════
   BERITA
══════════════════════════════════════════ */
exports.getBerita = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM landing_berita ORDER BY id DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getBerita error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data berita' });
  }
};

exports.createBerita = async (req, res) => {
  try {
    const { judul, ringkasan, tanggal, kategori, icon, link, aktif } = req.body;
    const [result] = await db.query(
      'INSERT INTO landing_berita (judul, ringkasan, tanggal, kategori, icon, link, aktif) VALUES (?,?,?,?,?,?,?)',
      [judul, ringkasan, tanggal, kategori || 'Umum', icon || 'fa-newspaper', link || null, aktif !== undefined ? parseInt(aktif) : 1]
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
    const { judul, ringkasan, tanggal, kategori, icon, link, aktif } = req.body;
    await db.query(
      'UPDATE landing_berita SET judul=?, ringkasan=?, tanggal=?, kategori=?, icon=?, link=?, aktif=? WHERE id=?',
      [judul, ringkasan, tanggal, kategori, icon, link || null, parseInt(aktif), id]
    );
    res.json({ success: true, message: 'Berita berhasil diperbarui' });
  } catch (err) {
    console.error('updateBerita error:', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui berita' });
  }
};

exports.deleteBerita = async (req, res) => {
  try {
    await db.query('DELETE FROM landing_berita WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Berita berhasil dihapus' });
  } catch (err) {
    console.error('deleteBerita error:', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus berita' });
  }
};

/* ══════════════════════════════════════════
   MARKETPLACE
══════════════════════════════════════════ */
exports.getMarketplace = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM landing_marketplace ORDER BY urutan ASC, id DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getMarketplace error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data marketplace' });
  }
};

exports.createMarketplace = async (req, res) => {
  try {
    const { nama, harga, warna, link, urutan, aktif } = req.body;
    const img = req.file ? `marketplace/${req.file.filename}` : null;
    const [result] = await db.query(
      'INSERT INTO landing_marketplace (nama, harga, img, warna, link, urutan, aktif) VALUES (?,?,?,?,?,?,?)',
      [nama, harga, img, warna || 'emerald', link || null, parseInt(urutan) || 0, aktif !== undefined ? parseInt(aktif) : 1]
    );
    res.json({ success: true, message: 'Produk berhasil ditambahkan', data: { id: result.insertId } });
  } catch (err) {
    console.error('createMarketplace error:', err);
    res.status(500).json({ success: false, message: 'Gagal menambahkan produk' });
  }
};

exports.updateMarketplace = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, harga, warna, link, urutan, aktif } = req.body;
    const [existing] = await db.query('SELECT img FROM landing_marketplace WHERE id = ?', [id]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });

    let img = existing[0].img;
    if (req.file) {
      deleteFile(existing[0].img);
      img = `marketplace/${req.file.filename}`;
    }

    await db.query(
      'UPDATE landing_marketplace SET nama=?, harga=?, img=?, warna=?, link=?, urutan=?, aktif=? WHERE id=?',
      [nama, harga, img, warna, link || null, parseInt(urutan) || 0, parseInt(aktif), id]
    );
    res.json({ success: true, message: 'Produk berhasil diperbarui' });
  } catch (err) {
    console.error('updateMarketplace error:', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui produk' });
  }
};

exports.deleteMarketplace = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.query('SELECT img FROM landing_marketplace WHERE id = ?', [id]);
    if (existing.length) deleteFile(existing[0].img);
    await db.query('DELETE FROM landing_marketplace WHERE id = ?', [id]);
    res.json({ success: true, message: 'Produk berhasil dihapus' });
  } catch (err) {
    console.error('deleteMarketplace error:', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus produk' });
  }
};

/* ══════════════════════════════════════════
   BANNERS (Info Terkini di Navbar)
══════════════════════════════════════════ */
exports.getBanners = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM landing_banners ORDER BY urutan ASC, id DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getBanners error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data banner' });
  }
};

exports.createBanner = async (req, res) => {
  try {
    const { text, link, section_index, urutan, aktif } = req.body;
    const img = req.file ? `banners/${req.file.filename}` : null;
    const [result] = await db.query(
      'INSERT INTO landing_banners (img, text, link, section_index, urutan, aktif) VALUES (?,?,?,?,?,?)',
      [img, text, link || null, section_index != null ? parseInt(section_index) : null, parseInt(urutan) || 0, aktif !== undefined ? parseInt(aktif) : 1]
    );
    res.json({ success: true, message: 'Banner berhasil ditambahkan', data: { id: result.insertId } });
  } catch (err) {
    console.error('createBanner error:', err);
    res.status(500).json({ success: false, message: 'Gagal menambahkan banner' });
  }
};

exports.updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, link, section_index, urutan, aktif } = req.body;
    const [existing] = await db.query('SELECT img FROM landing_banners WHERE id = ?', [id]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Banner tidak ditemukan' });

    let img = existing[0].img;
    if (req.file) {
      deleteFile(existing[0].img);
      img = `banners/${req.file.filename}`;
    }

    await db.query(
      'UPDATE landing_banners SET img=?, text=?, link=?, section_index=?, urutan=?, aktif=? WHERE id=?',
      [img, text, link || null, section_index != null ? parseInt(section_index) : null, parseInt(urutan) || 0, parseInt(aktif), id]
    );
    res.json({ success: true, message: 'Banner berhasil diperbarui' });
  } catch (err) {
    console.error('updateBanner error:', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui banner' });
  }
};

exports.deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.query('SELECT img FROM landing_banners WHERE id = ?', [id]);
    if (existing.length) deleteFile(existing[0].img);
    await db.query('DELETE FROM landing_banners WHERE id = ?', [id]);
    res.json({ success: true, message: 'Banner berhasil dihapus' });
  } catch (err) {
    console.error('deleteBanner error:', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus banner' });
  }
};

/* ══════════════════════════════════════════
   PUBLIC — active items only (for Homepage)
══════════════════════════════════════════ */
exports.getPublicLanding = async (req, res) => {
  try {
    const [events]      = await db.query('SELECT * FROM landing_events WHERE aktif=1 ORDER BY urutan ASC, id DESC');
    const [gallery]     = await db.query('SELECT * FROM landing_gallery WHERE aktif=1 ORDER BY urutan ASC, id DESC');
    const [berita]      = await db.query('SELECT * FROM landing_berita WHERE aktif=1 ORDER BY id DESC');
    const [marketplace] = await db.query('SELECT * FROM landing_marketplace WHERE aktif=1 ORDER BY urutan ASC, id DESC');
    const [banners]     = await db.query('SELECT * FROM landing_banners WHERE aktif=1 ORDER BY urutan ASC, id DESC');

    res.json({ success: true, data: { events, gallery, berita, marketplace, banners } });
  } catch (err) {
    console.error('getPublicLanding error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data landing page' });
  }
};
