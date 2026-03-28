/**
 * Generic Regional Proxy Controller
 * Proxies ANY request to regional backend's External API.
 * Supports JSON and multipart/form-data (file upload forwarding).
 * 
 * Covers: pengcab, kejurda, pendaftaran, users, dashboard,
 *         kategori-event, format-dokumen, site-config, etc.
 */
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// Regional backend configs
const REGIONAL_CONFIGS = {
  jabar: {
    baseUrl: 'https://jabar.forbasi.or.id',
    apiKey: 'fbsi_0801e38ed9268caed09d634ab0d91270bb8ac66b139c7af91d62dfe96122b44d',
    provinceId: 12,
  },
};

function getRegionalApi(region) {
  const config = REGIONAL_CONFIGS[region];
  if (!config) return null;
  return {
    config,
    client: axios.create({
      baseURL: config.baseUrl,
      headers: { 'X-API-Key': config.apiKey },
      timeout: 30000,
    }),
  };
}

/**
 * Generic proxy handler — forwards request to regional external API.
 * Mounted as: /api/regional-proxy/:region/*
 * Maps to:    https://{region}.forbasi.or.id/api/external/*
 */
exports.proxyRequest = async (req, res) => {
  try {
    const region = req.params.region;
    const regional = getRegionalApi(region);
    if (!regional) {
      return res.status(400).json({ success: false, message: `Region "${region}" tidak dikenali.` });
    }

    // Validate user has access to this region
    if (req.user.province_id && req.user.province_id !== regional.config.provinceId) {
      return res.status(403).json({ success: false, message: 'Anda tidak memiliki akses ke region ini.' });
    }

    // Build target path: everything after /api/regional-proxy/:region/
    const targetPath = '/api/external/' + req.params[0];
    const method = req.method.toLowerCase();

    let response;

    // Check if request has files (multipart)
    const hasFiles = req.file || (req.files && (Array.isArray(req.files) ? req.files.length > 0 : Object.keys(req.files).length > 0));

    if (hasFiles) {
      const form = new FormData();

      // Add text fields
      if (req.body) {
        for (const [key, value] of Object.entries(req.body)) {
          if (value !== undefined && value !== null) {
            form.append(key, String(value));
          }
        }
      }

      // Add single file
      if (req.file) {
        form.append(req.file.fieldname, fs.createReadStream(req.file.path), {
          filename: req.file.originalname,
          contentType: req.file.mimetype,
        });
      }

      // Add multiple files (multer .fields() or .array())
      if (req.files) {
        if (Array.isArray(req.files)) {
          for (const file of req.files) {
            form.append(file.fieldname, fs.createReadStream(file.path), {
              filename: file.originalname,
              contentType: file.mimetype,
            });
          }
        } else {
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

      response = await regional.client({
        method,
        url: targetPath,
        data: form,
        headers: { ...form.getHeaders(), 'X-API-Key': regional.config.apiKey },
      });

      // Cleanup temp files
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      if (req.files) {
        const fileList = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
        for (const file of fileList) {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        }
      }
    } else {
      // JSON request
      const axiosConfig = { method, url: targetPath };
      if (req.body && Object.keys(req.body).length > 0) {
        axiosConfig.data = req.body;
      }
      if (req.query && Object.keys(req.query).length > 0) {
        axiosConfig.params = req.query;
      }
      response = await regional.client(axiosConfig);
    }

    // Wrap raw Jabar responses into { success, data } format expected by frontend
    const jabarData = response.data;
    if (jabarData && typeof jabarData === 'object' && 'success' in jabarData) {
      res.status(response.status).json(jabarData);
    } else {
      res.status(response.status).json({ success: true, data: jabarData });
    }
  } catch (err) {
    const status = err.response?.status || 500;
    const data = err.response?.data || { success: false, message: err.message };
    console.error(`[Regional Proxy] ${req.method} ${req.params[0]} error:`, data.message || err.message);
    res.status(status).json(data);
  }
};
