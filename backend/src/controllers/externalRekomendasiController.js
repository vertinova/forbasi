/**
 * External API Controller — Rekomendasi (Surat Rekomendasi)
 * CRUD + approval for recommendation letters per region
 */
const db = require('../lib/db-compat');
const path = require('path');
const fs = require('fs');

const deleteFile = (filePath) => {
  if (!filePath) return;
  const full = path.join(__dirname, '../../uploads/regional', filePath);
  if (fs.existsSync(full)) fs.unlinkSync(full);
};

exports.getRekomendasi = async (req, res) => {
  try {
    const region = req.apiKey.region;
    const { status, jenis_rekomendasi, page = 1, per_page = 20 } = req.query;

    let sql = 'SELECT r.*, u.club_name as pemohon_club_name FROM rekomendasi r LEFT JOIN users u ON r.pemohon_user_id = u.id WHERE r.region = ?';
    const params = [region];

    if (status) { sql += ' AND r.status = ?'; params.push(status); }
    if (jenis_rekomendasi) { sql += ' AND r.jenis_rekomendasi = ?'; params.push(jenis_rekomendasi); }

    sql += ' ORDER BY r.created_at DESC';

    const offset = (parseInt(page) - 1) * parseInt(per_page);
    sql += ` LIMIT ${parseInt(per_page)} OFFSET ${offset}`;

    const [rows] = await db.query(sql, params);

    // Count total
    let countSql = 'SELECT COUNT(*) as total FROM rekomendasi WHERE region = ?';
    const countParams = [region];
    if (status) { countSql += ' AND status = ?'; countParams.push(status); }
    if (jenis_rekomendasi) { countSql += ' AND jenis_rekomendasi = ?'; countParams.push(jenis_rekomendasi); }
    const [countResult] = await db.query(countSql, countParams);

    res.json({
      success: true,
      data: rows,
      pagination: { total: countResult[0].total, page: parseInt(page), per_page: parseInt(per_page) }
    });
  } catch (err) {
    console.error('getRekomendasi error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data rekomendasi' });
  }
};

exports.createRekomendasi = async (req, res) => {
  try {
    const region = req.apiKey.region;
    const province_id = req.apiKey.province_id;
    const { pemohon_nama, pemohon_jabatan, pemohon_club, pemohon_user_id, jenis_rekomendasi, perihal } = req.body;

    const files = req.files || {};
    const surat_permohonan = files.surat_permohonan ? `rekomendasi/${files.surat_permohonan[0].filename}` : null;
    const dokumen_pendukung = files.dokumen_pendukung ? `rekomendasi/${files.dokumen_pendukung[0].filename}` : null;

    const [result] = await db.query(
      `INSERT INTO rekomendasi (region, province_id, pemohon_nama, pemohon_jabatan, pemohon_club, pemohon_user_id,
       jenis_rekomendasi, perihal, surat_permohonan, dokumen_pendukung)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [region, province_id, pemohon_nama, pemohon_jabatan || null, pemohon_club || null,
       pemohon_user_id || null, jenis_rekomendasi, perihal, surat_permohonan, dokumen_pendukung]
    );
    res.json({ success: true, message: 'Rekomendasi berhasil diajukan', data: { id: result.insertId } });
  } catch (err) {
    console.error('createRekomendasi error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengajukan rekomendasi' });
  }
};

exports.updateRekomendasi = async (req, res) => {
  try {
    const { id } = req.params;
    const region = req.apiKey.region;
    const { pemohon_nama, pemohon_jabatan, pemohon_club, jenis_rekomendasi, perihal } = req.body;

    const [existing] = await db.query('SELECT * FROM rekomendasi WHERE id = ? AND region = ?', [id, region]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Rekomendasi tidak ditemukan' });
    if (existing[0].status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Hanya rekomendasi berstatus pending yang bisa diedit' });
    }

    const files = req.files || {};
    let surat_permohonan = existing[0].surat_permohonan;
    let dokumen_pendukung = existing[0].dokumen_pendukung;
    if (files.surat_permohonan) {
      deleteFile(existing[0].surat_permohonan);
      surat_permohonan = `rekomendasi/${files.surat_permohonan[0].filename}`;
    }
    if (files.dokumen_pendukung) {
      deleteFile(existing[0].dokumen_pendukung);
      dokumen_pendukung = `rekomendasi/${files.dokumen_pendukung[0].filename}`;
    }

    await db.query(
      `UPDATE rekomendasi SET pemohon_nama=?, pemohon_jabatan=?, pemohon_club=?, jenis_rekomendasi=?,
       perihal=?, surat_permohonan=?, dokumen_pendukung=? WHERE id=? AND region=?`,
      [pemohon_nama, pemohon_jabatan || null, pemohon_club || null, jenis_rekomendasi,
       perihal, surat_permohonan, dokumen_pendukung, id, region]
    );
    res.json({ success: true, message: 'Rekomendasi berhasil diperbarui' });
  } catch (err) {
    console.error('updateRekomendasi error:', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui rekomendasi' });
  }
};

exports.approveRekomendasi = async (req, res) => {
  try {
    const { id } = req.params;
    const region = req.apiKey.region;
    const { catatan_pengda } = req.body;

    const [existing] = await db.query('SELECT * FROM rekomendasi WHERE id = ? AND region = ?', [id, region]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Rekomendasi tidak ditemukan' });

    // Handle uploaded surat rekomendasi PDF
    const surat_path = req.file ? `rekomendasi/surat/${req.file.filename}` : null;

    await db.query(
      `UPDATE rekomendasi SET status='approved', catatan_pengda=?, approved_at=NOW(), surat_rekomendasi_path=? WHERE id=? AND region=?`,
      [catatan_pengda || null, surat_path, id, region]
    );
    res.json({ success: true, message: 'Rekomendasi berhasil disetujui' });
  } catch (err) {
    console.error('approveRekomendasi error:', err);
    res.status(500).json({ success: false, message: 'Gagal menyetujui rekomendasi' });
  }
};

exports.rejectRekomendasi = async (req, res) => {
  try {
    const { id } = req.params;
    const region = req.apiKey.region;
    const { catatan_pengda } = req.body;

    const [existing] = await db.query('SELECT * FROM rekomendasi WHERE id = ? AND region = ?', [id, region]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Rekomendasi tidak ditemukan' });

    await db.query(
      `UPDATE rekomendasi SET status='rejected', catatan_pengda=? WHERE id=? AND region=?`,
      [catatan_pengda || 'Ditolak', id, region]
    );
    res.json({ success: true, message: 'Rekomendasi berhasil ditolak' });
  } catch (err) {
    console.error('rejectRekomendasi error:', err);
    res.status(500).json({ success: false, message: 'Gagal menolak rekomendasi' });
  }
};

exports.deleteRekomendasi = async (req, res) => {
  try {
    const { id } = req.params;
    const region = req.apiKey.region;
    const [existing] = await db.query('SELECT surat_permohonan, dokumen_pendukung, surat_rekomendasi_path FROM rekomendasi WHERE id = ? AND region = ?', [id, region]);
    if (existing.length) {
      deleteFile(existing[0].surat_permohonan);
      deleteFile(existing[0].dokumen_pendukung);
      deleteFile(existing[0].surat_rekomendasi_path);
    }
    await db.query('DELETE FROM rekomendasi WHERE id = ? AND region = ?', [id, region]);
    res.json({ success: true, message: 'Rekomendasi berhasil dihapus' });
  } catch (err) {
    console.error('deleteRekomendasi error:', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus rekomendasi' });
  }
};
