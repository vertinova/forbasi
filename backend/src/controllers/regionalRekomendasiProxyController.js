/**
 * Regional Rekomendasi Proxy Controller
 * Proxies requests to Jabar's backend API.
 * Data is stored on Jabar's server, not ours.
 */
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const JABAR_API_BASE = 'https://jabar.forbasi.or.id';
const JABAR_API_KEY = 'fbsi_0801e38ed9268caed09d634ab0d91270bb8ac66b139c7af91d62dfe96122b44d';

// Helper to create axios instance with API key + user context
function createJabarApi(req) {
  const headers = { 'X-API-Key': JABAR_API_KEY };
  if (req && req.user) {
    headers['X-User-Id'] = String(req.user.id);
    headers['X-User-Role'] = String(req.user.role || '');
    headers['X-User-Role-Id'] = String(req.user.role_id || '');
    headers['X-User-Username'] = String(req.user.username || '');
    headers['X-User-Type'] = String(req.user.user_type || '');
  }
  return axios.create({
    baseURL: JABAR_API_BASE,
    headers,
    timeout: 30000,
  });
}

// Helper to forward multipart/form-data
async function forwardMultipart(req, jabarPath, method = 'post') {
  const form = new FormData();
  
  // Add text fields
  if (req.body) {
    for (const [key, value] of Object.entries(req.body)) {
      if (value !== undefined && value !== null) {
        form.append(key, String(value));
      }
    }
  }
  
  // Add single file if exists
  if (req.file) {
    form.append(req.file.fieldname || 'file', fs.createReadStream(req.file.path), {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });
  }
  
  // Add multiple files if exist (from multer .fields())
  if (req.files) {
    if (Array.isArray(req.files)) {
      // multer.array()
      for (const file of req.files) {
        form.append(file.fieldname, fs.createReadStream(file.path), {
          filename: file.originalname,
          contentType: file.mimetype,
        });
      }
    } else {
      // multer.fields()
      for (const [fieldname, files] of Object.entries(req.files)) {
        for (const file of files) {
          form.append(fieldname, fs.createReadStream(file.path), {
            filename: file.originalname,
            contentType: file.mimetype,
          });
        }
      }
    }
  }
  
  const jabarApi = createJabarApi(req);
  const userHeaders = {};
  if (req && req.user) {
    userHeaders['X-User-Id'] = String(req.user.id);
    userHeaders['X-User-Role'] = String(req.user.role || '');
    userHeaders['X-User-Role-Id'] = String(req.user.role_id || '');
    userHeaders['X-User-Username'] = String(req.user.username || '');
    userHeaders['X-User-Type'] = String(req.user.user_type || '');
  }
  const response = await jabarApi({
    method,
    url: jabarPath,
    data: form,
    headers: { ...form.getHeaders(), 'X-API-Key': JABAR_API_KEY, ...userHeaders },
  });
  
  // Cleanup temp files
  if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
  if (req.files) {
    const fileList = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
    for (const file of fileList) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    }
  }
  
  return response;
}

// Helper to forward JSON requests
async function forwardJson(req, jabarPath, method = 'get') {
  const config = { method, url: jabarPath };
  if (req.body && Object.keys(req.body).length > 0) {
    config.data = req.body;
  }
  if (req.query && Object.keys(req.query).length > 0) {
    config.params = req.query;
  }
  return createJabarApi(req)(config);
}

// Generic error handler
function handleError(res, err, action) {
  console.error(`[Proxy Rekomendasi] ${action} error:`, err.response?.data || err.message);
  const status = err.response?.status || 500;
  const message = err.response?.data?.message || err.message || `Gagal ${action}`;
  res.status(status).json({ success: false, message });
}

// Map Jabar rekomendasi fields to frontend expected fields
function mapRekomendasi(item) {
  if (!item) return item;
  return {
    ...item,
    pemohon_nama: item.pemohon_nama || item.penyelenggara || item.user?.name || item.namaEvent || '',
    pemohon_jabatan: item.pemohon_jabatan || item.kontakPerson || '',
    pemohon_club: item.pemohon_club || item.pengcab?.nama || '',
    jenis_rekomendasi: item.jenis_rekomendasi || item.jenisEvent || '',
    perihal: item.perihal || item.namaEvent || item.deskripsi || '',
    surat_permohonan: item.surat_permohonan || item.dokumenSurat || item.proposal || null,
    dokumen_pendukung: item.dokumen_pendukung || item.poster || null,
    surat_rekomendasi_path: item.surat_rekomendasi_path || item.suratRekomendasi || null,
    catatan_pengda: item.catatan_pengda || item.catatanAdmin || item.catatanPengcab || null,
    created_at: item.created_at || item.createdAt || null,
    updated_at: item.updated_at || item.updatedAt || null,
  };
}

// Wrap response with optional transform
function wrapRekomendasi(jabarData, transformer) {
  let data;
  if (jabarData && jabarData.success !== undefined) {
    data = jabarData.data || jabarData;
  } else {
    data = jabarData;
  }
  if (transformer) {
    data = Array.isArray(data) ? data.map(transformer) : transformer(data);
  }
  return { success: true, data };
}

/* ══════════════════════════════════════════════════════════════════════════
   REKOMENDASI CRUD
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * Get all rekomendasi (with optional filters)
 * Query params: status, jenis_rekomendasi, page, limit, search
 */
exports.getRekomendasi = async (req, res) => {
  try {
    const response = await forwardJson(req, '/api/external/rekomendasi');
    res.json(wrapRekomendasi(response.data, mapRekomendasi));
  } catch (err) { handleError(res, err, 'mengambil daftar rekomendasi'); }
};

/**
 * Get single rekomendasi by ID
 */
exports.getRekomendasiById = async (req, res) => {
  try {
    const { id } = req.params;
    const response = await forwardJson(req, `/api/external/rekomendasi/${id}`);
    res.json(wrapRekomendasi(response.data, mapRekomendasi));
  } catch (err) { handleError(res, err, 'mengambil detail rekomendasi'); }
};

/**
 * Create new rekomendasi
 * Body: pemohon_nama, pemohon_jabatan, pemohon_club, jenis_rekomendasi, perihal
 * Files: surat_permohonan, dokumen_pendukung (optional)
 */
exports.createRekomendasi = async (req, res) => {
  try {
    const response = await forwardMultipart(req, '/api/external/rekomendasi', 'post');
    const d = response.data;
    res.json({ success: true, message: d?.message || 'Rekomendasi berhasil dibuat', data: d?.event || d });
  } catch (err) { handleError(res, err, 'membuat rekomendasi'); }
};

/**
 * Update rekomendasi (only if status is pending)
 */
exports.updateRekomendasi = async (req, res) => {
  try {
    const { id } = req.params;
    const response = await forwardMultipart(req, `/api/external/rekomendasi/${id}`, 'put');
    const d = response.data;
    res.json({ success: true, message: d?.message || 'Rekomendasi berhasil diperbarui', data: d?.event || d });
  } catch (err) { handleError(res, err, 'memperbarui rekomendasi'); }
};

/**
 * Approve rekomendasi
 * Frontend sends: catatan_pengda (via FormData or JSON)
 * Jabar API: PATCH /api/external/rekomendasi/:id/status { status: "DISETUJUI", catatanAdmin }
 */
exports.approveRekomendasi = async (req, res) => {
  try {
    const { id } = req.params;
    const catatan = req.body.catatan_pengda || req.body.catatan || '';
    const nomorSurat = req.body.nomorSurat || '';
    
    const data = { status: 'DISETUJUI', catatanAdmin: catatan };
    if (nomorSurat.trim()) data.nomorSurat = nomorSurat.trim();
    
    const response = await createJabarApi(req)({
      method: 'patch',
      url: `/api/external/rekomendasi/${id}/status`,
      data,
    });
    
    const d = response.data;
    res.json({ success: true, message: d?.message || 'Rekomendasi berhasil disetujui', data: d?.event || d });
  } catch (err) { handleError(res, err, 'menyetujui rekomendasi'); }
};

/**
 * Reject rekomendasi
 * Frontend sends: catatan_pengda
 * Jabar API: PATCH /api/external/rekomendasi/:id/status { status: "DITOLAK", catatanAdmin }
 */
exports.rejectRekomendasi = async (req, res) => {
  try {
    const { id } = req.params;
    const alasan = req.body.catatan_pengda || req.body.alasan || req.body.catatan;
    
    if (!alasan) {
      return res.status(400).json({ success: false, message: 'Alasan penolakan wajib diisi' });
    }
    
    const response = await createJabarApi(req)({
      method: 'patch',
      url: `/api/external/rekomendasi/${id}/status`,
      data: { status: 'DITOLAK', catatanAdmin: alasan },
    });
    
    const d = response.data;
    res.json({ success: true, message: d?.message || 'Rekomendasi berhasil ditolak', data: d?.event || d });
  } catch (err) { handleError(res, err, 'menolak rekomendasi'); }
};

/**
 * Regenerate surat rekomendasi PDF
 * Body: { nomorSurat } (optional - to update nomor surat before regenerating)
 */
exports.regenerateSurat = async (req, res) => {
  try {
    const { id } = req.params;
    const data = {};
    if (req.body.nomorSurat?.trim()) data.nomorSurat = req.body.nomorSurat.trim();
    
    const response = await createJabarApi(req)({
      method: 'post',
      url: `/api/external/rekomendasi/${id}/regenerate-surat`,
      data,
    });
    
    const d = response.data;
    res.json({ success: true, message: d?.message || 'Surat rekomendasi berhasil di-generate ulang', data: d?.event || d });
  } catch (err) { handleError(res, err, 'generate ulang surat rekomendasi'); }
};

/**
 * Delete rekomendasi
 */
exports.deleteRekomendasi = async (req, res) => {
  try {
    const { id } = req.params;
    const response = await forwardJson(req, `/api/external/rekomendasi/${id}`, 'delete');
    const d = response.data;
    res.json({ success: true, message: d?.message || 'Rekomendasi berhasil dihapus' });
  } catch (err) { handleError(res, err, 'menghapus rekomendasi'); }
};

/* ══════════════════════════════════════════════════════════════════════════
   SURAT CONFIG (signature, stamp for auto-generated surat rekomendasi)
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * Get surat config (tanda_tangan_ketua, tanda_tangan_sekretaris, stempel)
 */
exports.getSuratConfig = async (req, res) => {
  try {
    const response = await forwardJson(req, '/api/external/site-config/surat-config');
    res.json({ success: true, data: response.data });
  } catch (err) { handleError(res, err, 'mengambil konfigurasi surat'); }
};

/**
 * Save signature (base64 from canvas)
 * Body: { signatureData: "data:image/png;base64,...", signerName: "Nama", role: "ketua"|"sekretaris" }
 */
exports.saveSignature = async (req, res) => {
  try {
    const { signatureData, signerName, role } = req.body;
    if (!signatureData) return res.status(400).json({ success: false, message: 'Data tanda tangan wajib diisi' });
    if (!signerName) return res.status(400).json({ success: false, message: 'Nama penandatangan wajib diisi' });

    const response = await createJabarApi(req)({
      method: 'post',
      url: '/api/external/site-config/signature',
      data: { signatureData, signerName, role: role || 'ketua' },
    });
    const d = response.data;
    res.json({ success: true, message: d?.message || 'Tanda tangan berhasil disimpan', data: d?.value || d });
  } catch (err) { handleError(res, err, 'menyimpan tanda tangan'); }
};

/**
 * Save stamp (file upload)
 */
exports.saveStamp = async (req, res) => {
  try {
    const response = await forwardMultipart(req, '/api/external/site-config/stamp', 'post');
    const d = response.data;
    res.json({ success: true, message: d?.message || 'Stempel berhasil disimpan', data: d?.value || d });
  } catch (err) { handleError(res, err, 'menyimpan stempel'); }
};
