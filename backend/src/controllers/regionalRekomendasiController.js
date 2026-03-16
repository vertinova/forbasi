/**
 * Regional Rekomendasi Controller (JWT auth for Pengda)
 * Allows Pengda to manage recommendation letters from the main dashboard.
 * Region is derived from user's province_id.
 */
const db = require('../lib/db-compat');
const path = require('path');
const fs = require('fs');
const { REGIONS } = require('../config/regions');

function getRegionByProvinceId(province_id) {
  for (const [code, data] of Object.entries(REGIONS)) {
    if (data.province_id === province_id) return { code, ...data };
  }
  return null;
}

const deleteFile = (filePath) => {
  if (!filePath) return;
  const full = path.join(__dirname, '../../uploads/regional', filePath);
  if (fs.existsSync(full)) fs.unlinkSync(full);
};

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

/* ── LIST ── */
exports.getRekomendasi = async (req, res) => {
  try {
    const region = await resolveRegion(req, res); if (!region) return;
    const { status, jenis_rekomendasi, page = 1, per_page = 50 } = req.query;
    let sql = 'SELECT * FROM rekomendasi WHERE region = ?';
    const params = [region.code];
    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (jenis_rekomendasi) { sql += ' AND jenis_rekomendasi = ?'; params.push(jenis_rekomendasi); }
    sql += ' ORDER BY created_at DESC';
    const offset = (parseInt(page) - 1) * parseInt(per_page);
    sql += ` LIMIT ${parseInt(per_page)} OFFSET ${offset}`;
    const [rows] = await db.query(sql, params);

    // Count total
    let countSql = 'SELECT COUNT(*) as total FROM rekomendasi WHERE region = ?';
    const countParams = [region.code];
    if (status) { countSql += ' AND status = ?'; countParams.push(status); }
    if (jenis_rekomendasi) { countSql += ' AND jenis_rekomendasi = ?'; countParams.push(jenis_rekomendasi); }
    const [countResult] = await db.query(countSql, countParams);

    res.json({ success: true, data: rows, total: countResult[0]?.total || 0 });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Gagal mengambil data' }); }
};

/* ── CREATE ── */
exports.createRekomendasi = async (req, res) => {
  try {
    const region = await resolveRegion(req, res); if (!region) return;
    const { pemohon_nama, pemohon_jabatan, pemohon_club, jenis_rekomendasi, perihal } = req.body;
    if (!pemohon_nama || !jenis_rekomendasi || !perihal) {
      return res.status(400).json({ success: false, message: 'pemohon_nama, jenis_rekomendasi, dan perihal wajib diisi' });
    }
    const surat_permohonan = req.files?.surat_permohonan?.[0] ? `rekomendasi/${req.files.surat_permohonan[0].filename}` : null;
    const dokumen_pendukung = req.files?.dokumen_pendukung?.[0] ? `rekomendasi/${req.files.dokumen_pendukung[0].filename}` : null;

    const [result] = await db.query(
      `INSERT INTO rekomendasi (region, province_id, pemohon_nama, pemohon_jabatan, pemohon_club, jenis_rekomendasi, perihal, surat_permohonan, dokumen_pendukung, status)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [region.code, region.province_id, pemohon_nama, pemohon_jabatan || null, pemohon_club || null, jenis_rekomendasi, perihal, surat_permohonan, dokumen_pendukung, 'pending']
    );
    res.json({ success: true, message: 'Rekomendasi berhasil ditambahkan', data: { id: result.insertId } });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Gagal menambahkan' }); }
};

/* ── UPDATE (only pending) ── */
exports.updateRekomendasi = async (req, res) => {
  try {
    const region = await resolveRegion(req, res); if (!region) return;
    const { id } = req.params;
    const [existing] = await db.query('SELECT * FROM rekomendasi WHERE id = ? AND region = ?', [id, region.code]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Tidak ditemukan' });
    if (existing[0].status !== 'pending') return res.status(400).json({ success: false, message: 'Hanya rekomendasi pending yang bisa diedit' });

    const { pemohon_nama, pemohon_jabatan, pemohon_club, jenis_rekomendasi, perihal } = req.body;
    let surat_permohonan = existing[0].surat_permohonan;
    let dokumen_pendukung = existing[0].dokumen_pendukung;
    if (req.files?.surat_permohonan?.[0]) { deleteFile(existing[0].surat_permohonan); surat_permohonan = `rekomendasi/${req.files.surat_permohonan[0].filename}`; }
    if (req.files?.dokumen_pendukung?.[0]) { deleteFile(existing[0].dokumen_pendukung); dokumen_pendukung = `rekomendasi/${req.files.dokumen_pendukung[0].filename}`; }

    await db.query(
      `UPDATE rekomendasi SET pemohon_nama=?, pemohon_jabatan=?, pemohon_club=?, jenis_rekomendasi=?, perihal=?, surat_permohonan=?, dokumen_pendukung=? WHERE id=? AND region=?`,
      [pemohon_nama || existing[0].pemohon_nama, pemohon_jabatan || null, pemohon_club || null, jenis_rekomendasi || existing[0].jenis_rekomendasi, perihal || existing[0].perihal, surat_permohonan, dokumen_pendukung, id, region.code]
    );
    res.json({ success: true, message: 'Rekomendasi berhasil diperbarui' });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Gagal memperbarui' }); }
};

/* ── APPROVE ── */
exports.approveRekomendasi = async (req, res) => {
  try {
    const region = await resolveRegion(req, res); if (!region) return;
    const { id } = req.params;
    const { catatan_pengda } = req.body;
    const [existing] = await db.query('SELECT * FROM rekomendasi WHERE id = ? AND region = ?', [id, region.code]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Tidak ditemukan' });

    const surat_rekomendasi_path = req.file ? `rekomendasi/surat/${req.file.filename}` : null;
    await db.query(
      `UPDATE rekomendasi SET status='approved', catatan_pengda=?, approved_by=?, approved_at=NOW(), surat_rekomendasi_path=? WHERE id=? AND region=?`,
      [catatan_pengda || null, req.user.id, surat_rekomendasi_path, id, region.code]
    );
    res.json({ success: true, message: 'Rekomendasi disetujui' });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Gagal menyetujui' }); }
};

/* ── REJECT ── */
exports.rejectRekomendasi = async (req, res) => {
  try {
    const region = await resolveRegion(req, res); if (!region) return;
    const { id } = req.params;
    const { catatan_pengda } = req.body;
    const [existing] = await db.query('SELECT * FROM rekomendasi WHERE id = ? AND region = ?', [id, region.code]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Tidak ditemukan' });

    await db.query(
      `UPDATE rekomendasi SET status='rejected', catatan_pengda=? WHERE id=? AND region=?`,
      [catatan_pengda || 'Ditolak', id, region.code]
    );
    res.json({ success: true, message: 'Rekomendasi ditolak' });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Gagal menolak' }); }
};

/* ── DELETE ── */
exports.deleteRekomendasi = async (req, res) => {
  try {
    const region = await resolveRegion(req, res); if (!region) return;
    const { id } = req.params;
    const [existing] = await db.query('SELECT * FROM rekomendasi WHERE id = ? AND region = ?', [id, region.code]);
    if (existing.length) {
      deleteFile(existing[0].surat_permohonan);
      deleteFile(existing[0].dokumen_pendukung);
      deleteFile(existing[0].surat_rekomendasi_path);
    }
    await db.query('DELETE FROM rekomendasi WHERE id = ? AND region = ?', [id, region.code]);
    res.json({ success: true, message: 'Rekomendasi berhasil dihapus' });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Gagal menghapus' }); }
};
