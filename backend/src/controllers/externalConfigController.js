/**
 * External API Controller — Site Config + Surat Config
 * Manage site configuration, surat config, signature, stamp per region
 */
const db = require('../lib/db-compat');
const path = require('path');
const fs = require('fs');

const deleteFile = (filePath) => {
  if (!filePath) return;
  const full = path.join(__dirname, '../../uploads/regional', filePath);
  if (fs.existsSync(full)) fs.unlinkSync(full);
};

/* ── SITE CONFIG (key-value pairs) ── */
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
    const configs = req.body;
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

/* ── SURAT CONFIG ── */
exports.getSuratConfig = async (req, res) => {
  try {
    const region = req.apiKey.region;
    const [rows] = await db.query('SELECT * FROM surat_config WHERE region = ?', [region]);
    res.json({ success: true, data: rows[0] || null });
  } catch (err) {
    console.error('getSuratConfig error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil konfigurasi surat' });
  }
};

exports.updateSuratConfig = async (req, res) => {
  try {
    const region = req.apiKey.region;
    const { nama_organisasi, alamat_organisasi, telepon_organisasi, email_organisasi, nama_ketua, nomor_surat_prefix } = req.body;

    const [existing] = await db.query('SELECT * FROM surat_config WHERE region = ?', [region]);

    if (existing.length) {
      await db.query(
        `UPDATE surat_config SET nama_organisasi=?, alamat_organisasi=?, telepon_organisasi=?,
         email_organisasi=?, nama_ketua=?, nomor_surat_prefix=? WHERE region=?`,
        [nama_organisasi || null, alamat_organisasi || null, telepon_organisasi || null,
         email_organisasi || null, nama_ketua || null, nomor_surat_prefix || null, region]
      );
    } else {
      await db.query(
        `INSERT INTO surat_config (region, nama_organisasi, alamat_organisasi, telepon_organisasi, email_organisasi, nama_ketua, nomor_surat_prefix)
         VALUES (?,?,?,?,?,?,?)`,
        [region, nama_organisasi || null, alamat_organisasi || null, telepon_organisasi || null,
         email_organisasi || null, nama_ketua || null, nomor_surat_prefix || null]
      );
    }
    res.json({ success: true, message: 'Konfigurasi surat berhasil diperbarui' });
  } catch (err) {
    console.error('updateSuratConfig error:', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui konfigurasi surat' });
  }
};

/* ── SIGNATURE UPLOAD ── */
exports.uploadSignature = async (req, res) => {
  try {
    const region = req.apiKey.region;
    if (!req.file) return res.status(400).json({ success: false, message: 'File tanda tangan diperlukan' });

    const signaturePath = `surat/${req.file.filename}`;

    // Delete old signature
    const [existing] = await db.query('SELECT signature_path FROM surat_config WHERE region = ?', [region]);
    if (existing.length && existing[0].signature_path) deleteFile(existing[0].signature_path);

    if (existing.length) {
      await db.query('UPDATE surat_config SET signature_path = ? WHERE region = ?', [signaturePath, region]);
    } else {
      await db.query('INSERT INTO surat_config (region, signature_path) VALUES (?, ?)', [region, signaturePath]);
    }

    res.json({ success: true, message: 'Tanda tangan berhasil diupload', data: { path: signaturePath } });
  } catch (err) {
    console.error('uploadSignature error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengupload tanda tangan' });
  }
};

/* ── STAMP UPLOAD ── */
exports.uploadStamp = async (req, res) => {
  try {
    const region = req.apiKey.region;
    if (!req.file) return res.status(400).json({ success: false, message: 'File stempel diperlukan' });

    const stampPath = `surat/${req.file.filename}`;

    const [existing] = await db.query('SELECT stamp_path FROM surat_config WHERE region = ?', [region]);
    if (existing.length && existing[0].stamp_path) deleteFile(existing[0].stamp_path);

    if (existing.length) {
      await db.query('UPDATE surat_config SET stamp_path = ? WHERE region = ?', [stampPath, region]);
    } else {
      await db.query('INSERT INTO surat_config (region, stamp_path) VALUES (?, ?)', [region, stampPath]);
    }

    res.json({ success: true, message: 'Stempel berhasil diupload', data: { path: stampPath } });
  } catch (err) {
    console.error('uploadStamp error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengupload stempel' });
  }
};

/* ── KOP SURAT UPLOAD ── */
exports.uploadKopSurat = async (req, res) => {
  try {
    const region = req.apiKey.region;
    if (!req.file) return res.status(400).json({ success: false, message: 'File kop surat diperlukan' });

    const kopPath = `surat/${req.file.filename}`;

    const [existing] = await db.query('SELECT kop_surat FROM surat_config WHERE region = ?', [region]);
    if (existing.length && existing[0].kop_surat) deleteFile(existing[0].kop_surat);

    if (existing.length) {
      await db.query('UPDATE surat_config SET kop_surat = ? WHERE region = ?', [kopPath, region]);
    } else {
      await db.query('INSERT INTO surat_config (region, kop_surat) VALUES (?, ?)', [region, kopPath]);
    }

    res.json({ success: true, message: 'Kop surat berhasil diupload', data: { path: kopPath } });
  } catch (err) {
    console.error('uploadKopSurat error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengupload kop surat' });
  }
};
