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

// Helper to create axios instance with API key
const jabarApi = axios.create({
  baseURL: JABAR_API_BASE,
  headers: { 'X-API-Key': JABAR_API_KEY },
  timeout: 30000,
});

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
  
  const response = await jabarApi({
    method,
    url: jabarPath,
    data: form,
    headers: { ...form.getHeaders(), 'X-API-Key': JABAR_API_KEY },
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
  return jabarApi(config);
}

// Generic error handler
function handleError(res, err, action) {
  console.error(`[Proxy Rekomendasi] ${action} error:`, err.response?.data || err.message);
  const status = err.response?.status || 500;
  const message = err.response?.data?.message || err.message || `Gagal ${action}`;
  res.status(status).json({ success: false, message });
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
    res.json(response.data);
  } catch (err) { handleError(res, err, 'mengambil daftar rekomendasi'); }
};

/**
 * Get single rekomendasi by ID
 */
exports.getRekomendasiById = async (req, res) => {
  try {
    const { id } = req.params;
    const response = await forwardJson(req, `/api/external/rekomendasi/${id}`);
    res.json(response.data);
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
    res.json(response.data);
  } catch (err) { handleError(res, err, 'membuat rekomendasi'); }
};

/**
 * Update rekomendasi (only if status is pending)
 */
exports.updateRekomendasi = async (req, res) => {
  try {
    const { id } = req.params;
    const response = await forwardMultipart(req, `/api/external/rekomendasi/${id}`, 'put');
    res.json(response.data);
  } catch (err) { handleError(res, err, 'memperbarui rekomendasi'); }
};

/**
 * Approve rekomendasi
 * Body: catatan (optional)
 * Jabar API: PATCH /api/external/rekomendasi/:id/status { status: "DISETUJUI", catatan }
 */
exports.approveRekomendasi = async (req, res) => {
  try {
    const { id } = req.params;
    const { catatan } = req.body;
    
    const response = await jabarApi({
      method: 'patch',
      url: `/api/external/rekomendasi/${id}/status`,
      data: { status: 'DISETUJUI', catatan: catatan || '' },
    });
    
    res.json(response.data);
  } catch (err) { handleError(res, err, 'menyetujui rekomendasi'); }
};

/**
 * Reject rekomendasi
 * Body: alasan
 * Jabar API: PATCH /api/external/rekomendasi/:id/status { status: "DITOLAK", catatan }
 */
exports.rejectRekomendasi = async (req, res) => {
  try {
    const { id } = req.params;
    const { alasan } = req.body;
    
    if (!alasan) {
      return res.status(400).json({ success: false, message: 'Alasan penolakan wajib diisi' });
    }
    
    const response = await jabarApi({
      method: 'patch',
      url: `/api/external/rekomendasi/${id}/status`,
      data: { status: 'DITOLAK', catatan: alasan },
    });
    
    res.json(response.data);
  } catch (err) { handleError(res, err, 'menolak rekomendasi'); }
};

/**
 * Delete rekomendasi
 */
exports.deleteRekomendasi = async (req, res) => {
  try {
    const { id } = req.params;
    const response = await forwardJson(req, `/api/external/rekomendasi/${id}`, 'delete');
    res.json(response.data);
  } catch (err) { handleError(res, err, 'menghapus rekomendasi'); }
};
