/**
 * External API Controller — Format Dokumen (Document Templates)
 * CRUD document templates per region
 */
const db = require('../lib/db-compat');
const path = require('path');
const fs = require('fs');

const deleteFile = (filePath) => {
  if (!filePath) return;
  const full = path.join(__dirname, '../../uploads/regional', filePath);
  if (fs.existsSync(full)) fs.unlinkSync(full);
};

exports.getFormatDokumen = async (req, res) => {
  try {
    const region = req.apiKey.region;
    const { jenis } = req.query;

    let sql = 'SELECT * FROM format_dokumen WHERE (region = ? OR region IS NULL)';
    const params = [region];
    if (jenis) { sql += ' AND jenis = ?'; params.push(jenis); }
    sql += ' ORDER BY region DESC, nama ASC'; // region-specific first, then global

    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getFormatDokumen error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil format dokumen' });
  }
};

exports.createFormatDokumen = async (req, res) => {
  try {
    const region = req.apiKey.region;
    const { nama, jenis, template_html, variables, aktif } = req.body;
    const file_path = req.file ? `dokumen/${req.file.filename}` : null;

    let parsedVariables = null;
    if (variables) {
      try { parsedVariables = typeof variables === 'string' ? variables : JSON.stringify(variables); } catch { parsedVariables = null; }
    }

    const [result] = await db.query(
      'INSERT INTO format_dokumen (region, nama, jenis, template_html, file_path, variables, aktif) VALUES (?,?,?,?,?,?,?)',
      [region, nama, jenis, template_html || null, file_path, parsedVariables, aktif !== undefined ? parseInt(aktif) : 1]
    );
    res.json({ success: true, message: 'Format dokumen berhasil ditambahkan', data: { id: result.insertId } });
  } catch (err) {
    console.error('createFormatDokumen error:', err);
    res.status(500).json({ success: false, message: 'Gagal menambahkan format dokumen' });
  }
};

exports.updateFormatDokumen = async (req, res) => {
  try {
    const { id } = req.params;
    const region = req.apiKey.region;
    const { nama, jenis, template_html, variables, aktif } = req.body;

    const [existing] = await db.query('SELECT * FROM format_dokumen WHERE id = ? AND region = ?', [id, region]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Format dokumen tidak ditemukan' });

    let file_path = existing[0].file_path;
    if (req.file) {
      deleteFile(existing[0].file_path);
      file_path = `dokumen/${req.file.filename}`;
    }

    let parsedVariables = existing[0].variables;
    if (variables !== undefined) {
      try { parsedVariables = typeof variables === 'string' ? variables : JSON.stringify(variables); } catch { /* keep existing */ }
    }

    await db.query(
      'UPDATE format_dokumen SET nama=?, jenis=?, template_html=?, file_path=?, variables=?, aktif=? WHERE id=? AND region=?',
      [nama, jenis, template_html || null, file_path, parsedVariables, parseInt(aktif), id, region]
    );
    res.json({ success: true, message: 'Format dokumen berhasil diperbarui' });
  } catch (err) {
    console.error('updateFormatDokumen error:', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui format dokumen' });
  }
};

exports.deleteFormatDokumen = async (req, res) => {
  try {
    const { id } = req.params;
    const region = req.apiKey.region;
    const [existing] = await db.query('SELECT file_path FROM format_dokumen WHERE id = ? AND region = ?', [id, region]);
    if (existing.length) deleteFile(existing[0].file_path);
    await db.query('DELETE FROM format_dokumen WHERE id = ? AND region = ?', [id, region]);
    res.json({ success: true, message: 'Format dokumen berhasil dihapus' });
  } catch (err) {
    console.error('deleteFormatDokumen error:', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus format dokumen' });
  }
};
