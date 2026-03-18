/**
 * Regional Landing Proxy Controller
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
        form.append(key, value);
      }
    }
  }
  
  // Add file if exists
  if (req.file) {
    form.append(req.file.fieldname || 'gambar', fs.createReadStream(req.file.path), {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });
  }
  
  // Add multiple files if exist
  if (req.files) {
    for (const [fieldname, files] of Object.entries(req.files)) {
      for (const file of files) {
        form.append(fieldname, fs.createReadStream(file.path), {
          filename: file.originalname,
          contentType: file.mimetype,
        });
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
    for (const files of Object.values(req.files)) {
      for (const file of files) {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }
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
  console.error(`[Proxy] ${action} error:`, err.response?.data || err.message);
  const status = err.response?.status || 500;
  const message = err.response?.data?.message || err.message || `Gagal ${action}`;
  res.status(status).json({ success: false, message });
}

/* ══════════════════════════════════════════════════════════════════════════
   HERO SLIDES
   ══════════════════════════════════════════════════════════════════════════ */
// Wrap Jabar response: Jabar returns array directly, frontend expects { success, data }
function wrapResponse(jabarData, transformer) {
  let data;
  let message;
  if (jabarData && jabarData.success !== undefined) {
    data = jabarData.data || jabarData;
    message = jabarData.message;
  } else if (jabarData && jabarData.message && !Array.isArray(jabarData)) {
    message = jabarData.message;
    data = jabarData;
  } else {
    data = jabarData;
  }
  if (transformer) {
    data = Array.isArray(data) ? data.map(transformer) : transformer(data);
  }
  const result = { success: true, data };
  if (message) result.message = message;
  return result;
}

// Map Jabar hero slide fields to frontend expected fields
function mapHeroSlide(item) {
  if (!item) return item;
  return {
    ...item,
    image_path: item.gambar || item.image_path,
    title: item.caption || item.title || '',
    subtitle: item.subtitle || '',
  };
}

exports.getHeroSlides = async (req, res) => {
  try {
    const response = await forwardJson(req, '/api/external/landing/hero-slides');
    res.json(wrapResponse(response.data, mapHeroSlide));
  } catch (err) { handleError(res, err, 'mengambil hero slides'); }
};

exports.createHeroSlide = async (req, res) => {
  try {
    const response = await forwardMultipart(req, '/api/external/landing/hero-slides', 'post');
    res.json(wrapResponse(response.data));
  } catch (err) { handleError(res, err, 'menambahkan hero slide'); }
};

exports.updateHeroSlide = async (req, res) => {
  try {
    const { id } = req.params;
    const response = await forwardMultipart(req, `/api/external/landing/hero-slides/${id}`, 'put');
    res.json(wrapResponse(response.data));
  } catch (err) { handleError(res, err, 'memperbarui hero slide'); }
};

exports.deleteHeroSlide = async (req, res) => {
  try {
    const { id } = req.params;
    const response = await forwardJson(req, `/api/external/landing/hero-slides/${id}`, 'delete');
    res.json(wrapResponse(response.data));
  } catch (err) { handleError(res, err, 'menghapus hero slide'); }
};

/* ══════════════════════════════════════════════════════════════════════════
   BERITA
   ══════════════════════════════════════════════════════════════════════════ */
exports.getBerita = async (req, res) => {
  try {
    const response = await forwardJson(req, '/api/external/landing/berita');
    res.json(wrapResponse(response.data));
  } catch (err) { handleError(res, err, 'mengambil berita'); }
};

exports.getBeritaById = async (req, res) => {
  try {
    const { id } = req.params;
    const response = await forwardJson(req, `/api/external/landing/berita/${id}`);
    res.json(wrapResponse(response.data));
  } catch (err) { handleError(res, err, 'mengambil detail berita'); }
};

exports.createBerita = async (req, res) => {
  try {
    const response = await forwardMultipart(req, '/api/external/landing/berita', 'post');
    res.json(wrapResponse(response.data));
  } catch (err) { handleError(res, err, 'menambahkan berita'); }
};

exports.updateBerita = async (req, res) => {
  try {
    const { id } = req.params;
    const response = await forwardMultipart(req, `/api/external/landing/berita/${id}`, 'put');
    res.json(wrapResponse(response.data));
  } catch (err) { handleError(res, err, 'memperbarui berita'); }
};

exports.deleteBerita = async (req, res) => {
  try {
    const { id } = req.params;
    const response = await forwardJson(req, `/api/external/landing/berita/${id}`, 'delete');
    res.json(wrapResponse(response.data));
  } catch (err) { handleError(res, err, 'menghapus berita'); }
};

/* ══════════════════════════════════════════════════════════════════════════
   STRUKTUR ORGANISASI
   ══════════════════════════════════════════════════════════════════════════ */
exports.getStruktur = async (req, res) => {
  try {
    const response = await forwardJson(req, '/api/external/landing/struktur');
    res.json(wrapResponse(response.data));
  } catch (err) { handleError(res, err, 'mengambil struktur'); }
};

exports.createStruktur = async (req, res) => {
  try {
    const response = await forwardMultipart(req, '/api/external/landing/struktur', 'post');
    res.json(wrapResponse(response.data));
  } catch (err) { handleError(res, err, 'menambahkan struktur'); }
};

exports.updateStruktur = async (req, res) => {
  try {
    const { id } = req.params;
    const response = await forwardMultipart(req, `/api/external/landing/struktur/${id}`, 'put');
    res.json(wrapResponse(response.data));
  } catch (err) { handleError(res, err, 'memperbarui struktur'); }
};

exports.deleteStruktur = async (req, res) => {
  try {
    const { id } = req.params;
    const response = await forwardJson(req, `/api/external/landing/struktur/${id}`, 'delete');
    res.json(wrapResponse(response.data));
  } catch (err) { handleError(res, err, 'menghapus struktur'); }
};

/* ══════════════════════════════════════════════════════════════════════════
   FEEDBACK
   ══════════════════════════════════════════════════════════════════════════ */
exports.getFeedback = async (req, res) => {
  try {
    const response = await forwardJson(req, '/api/external/landing/feedback');
    res.json(wrapResponse(response.data));
  } catch (err) { handleError(res, err, 'mengambil feedback'); }
};

exports.markFeedbackRead = async (req, res) => {
  try {
    const { id } = req.params;
    const response = await forwardJson(req, `/api/external/landing/feedback/${id}/read`, 'put');
    res.json(wrapResponse(response.data));
  } catch (err) { handleError(res, err, 'menandai feedback dibaca'); }
};

exports.deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const response = await forwardJson(req, `/api/external/landing/feedback/${id}`, 'delete');
    res.json(wrapResponse(response.data));
  } catch (err) { handleError(res, err, 'menghapus feedback'); }
};

/* ══════════════════════════════════════════════════════════════════════════
   SITE CONFIG (Footer, Sponsor, Merchandise, Konfigurasi)
   ══════════════════════════════════════════════════════════════════════════ */
exports.getSiteConfig = async (req, res) => {
  try {
    const response = await forwardJson(req, '/api/external/landing/config');
    res.json(wrapResponse(response.data));
  } catch (err) { handleError(res, err, 'mengambil konfigurasi'); }
};

exports.updateSiteConfig = async (req, res) => {
  try {
    const response = await forwardJson(req, '/api/external/landing/config', 'put');
    res.json(wrapResponse(response.data));
  } catch (err) { handleError(res, err, 'memperbarui konfigurasi'); }
};

/* ══════════════════════════════════════════════════════════════════════════
   REGION INFO (for frontend to know which region)
   ══════════════════════════════════════════════════════════════════════════ */
exports.getRegionInfo = async (req, res) => {
  // Since this proxies to Jabar only, return Jabar info
  res.json({
    success: true,
    data: {
      code: 'jabar',
      name: 'Jawa Barat',
      province_id: 12,
      apiBase: JABAR_API_BASE,
    }
  });
};
