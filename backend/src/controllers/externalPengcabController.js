/**
 * External API Controller — Pengcab Management
 * CRUD pengcab data per region
 */
const db = require('../lib/db-compat');
const path = require('path');
const fs = require('fs');

const deleteFile = (filePath) => {
  if (!filePath) return;
  const full = path.join(__dirname, '../../uploads/regional', filePath);
  if (fs.existsSync(full)) fs.unlinkSync(full);
};

exports.getPengcab = async (req, res) => {
  try {
    const region = req.apiKey.region;
    const province_id = req.apiKey.province_id;
    const { city_id, search } = req.query;

    let sql = `SELECT pd.*, c.name as city_name, p.name as province_name
               FROM pengcab_data pd
               LEFT JOIN cities c ON pd.city_id = c.id
               LEFT JOIN provinces p ON pd.province_id = p.id
               WHERE pd.region = ?`;
    const params = [region];

    if (city_id) { sql += ' AND pd.city_id = ?'; params.push(parseInt(city_id)); }
    if (search) { sql += ' AND pd.nama_pengcab LIKE ?'; params.push(`%${search}%`); }

    sql += ' ORDER BY pd.nama_pengcab ASC';
    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getPengcab error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data pengcab' });
  }
};

exports.createPengcab = async (req, res) => {
  try {
    const region = req.apiKey.region;
    const province_id = req.apiKey.province_id;
    const { user_id, city_id, nama_pengcab, ketua, sekretaris, bendahara, alamat, telepon, email, aktif } = req.body;
    const foto = req.file ? `pengcab/${req.file.filename}` : null;

    const [result] = await db.query(
      `INSERT INTO pengcab_data (user_id, region, province_id, city_id, nama_pengcab, ketua, sekretaris, bendahara, alamat, telepon, email, foto, aktif)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [user_id || null, region, province_id, city_id || null, nama_pengcab, ketua || null, sekretaris || null,
       bendahara || null, alamat || null, telepon || null, email || null, foto, aktif !== undefined ? parseInt(aktif) : 1]
    );
    res.json({ success: true, message: 'Pengcab berhasil ditambahkan', data: { id: result.insertId } });
  } catch (err) {
    console.error('createPengcab error:', err);
    res.status(500).json({ success: false, message: 'Gagal menambahkan pengcab' });
  }
};

exports.updatePengcab = async (req, res) => {
  try {
    const { id } = req.params;
    const region = req.apiKey.region;
    const { user_id, city_id, nama_pengcab, ketua, sekretaris, bendahara, alamat, telepon, email, aktif } = req.body;

    const [existing] = await db.query('SELECT * FROM pengcab_data WHERE id = ? AND region = ?', [id, region]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Pengcab tidak ditemukan' });

    let foto = existing[0].foto;
    if (req.file) {
      deleteFile(existing[0].foto);
      foto = `pengcab/${req.file.filename}`;
    }

    await db.query(
      `UPDATE pengcab_data SET user_id=?, city_id=?, nama_pengcab=?, ketua=?, sekretaris=?, bendahara=?,
       alamat=?, telepon=?, email=?, foto=?, aktif=? WHERE id=? AND region=?`,
      [user_id || null, city_id || null, nama_pengcab, ketua || null, sekretaris || null, bendahara || null,
       alamat || null, telepon || null, email || null, foto, parseInt(aktif), id, region]
    );
    res.json({ success: true, message: 'Pengcab berhasil diperbarui' });
  } catch (err) {
    console.error('updatePengcab error:', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui pengcab' });
  }
};

exports.deletePengcab = async (req, res) => {
  try {
    const { id } = req.params;
    const region = req.apiKey.region;
    const [existing] = await db.query('SELECT foto FROM pengcab_data WHERE id = ? AND region = ?', [id, region]);
    if (existing.length) deleteFile(existing[0].foto);
    await db.query('DELETE FROM pengcab_data WHERE id = ? AND region = ?', [id, region]);
    res.json({ success: true, message: 'Pengcab berhasil dihapus' });
  } catch (err) {
    console.error('deletePengcab error:', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus pengcab' });
  }
};
