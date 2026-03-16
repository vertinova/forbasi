/**
 * External API Routes — /api/external/*
 * All endpoints authenticated via X-API-Key header
 * Permissions checked per endpoint
 */
const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const { authenticateApiKey, requirePermission, generateApiKey } = require('../middleware/apiKeyAuth');
const db = require('../lib/db-compat');

// Controllers
const landingCtrl = require('../controllers/externalLandingController');
const pengcabCtrl = require('../controllers/externalPengcabController');
const rekomendasiCtrl = require('../controllers/externalRekomendasiController');
const kejurdaCtrl = require('../controllers/externalKejurdaController');
const pendaftaranCtrl = require('../controllers/externalPendaftaranController');
const usersCtrl = require('../controllers/externalUsersController');
const dashboardCtrl = require('../controllers/externalDashboardController');
const dokumenCtrl = require('../controllers/externalDokumenController');
const configCtrl = require('../controllers/externalConfigController');

/* ── Multer setup for regional uploads ── */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const region = req.apiKey?.region || 'global';
    const dir = path.join(__dirname, '../../uploads/regional', region);
    // Create subdirectories as needed
    const subDirs = ['hero', 'berita', 'struktur', 'feedback', 'pengcab', 'rekomendasi', 'rekomendasi/surat', 'dokumen', 'surat'];
    for (const sub of subDirs) {
      const subPath = path.join(dir, sub);
      if (!fs.existsSync(subPath)) fs.mkdirSync(subPath, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.pdf', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('Format file tidak didukung. Gunakan JPG, PNG, PDF, atau WebP.'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

/* ═══════════════════════════════════════════
   PUBLIC ROUTES (no API key needed)
═══════════════════════════════════════════ */
router.get('/landing/public/:region', landingCtrl.getPublicLanding);

/* ═══════════════════════════════════════════
   ALL ROUTES BELOW REQUIRE API KEY
═══════════════════════════════════════════ */
router.use(authenticateApiKey);

/* ── LANDING (hero-slides, berita, struktur, feedback, config) ── */
router.get('/landing/hero-slides', requirePermission('landing:read'), landingCtrl.getHeroSlides);
router.post('/landing/hero-slides', requirePermission('landing:write'), upload.single('image'), landingCtrl.createHeroSlide);
router.put('/landing/hero-slides/:id', requirePermission('landing:write'), upload.single('image'), landingCtrl.updateHeroSlide);
router.delete('/landing/hero-slides/:id', requirePermission('landing:delete'), landingCtrl.deleteHeroSlide);

router.get('/landing/berita', requirePermission('landing:read'), landingCtrl.getBerita);
router.post('/landing/berita', requirePermission('landing:write'), upload.single('gambar'), landingCtrl.createBerita);
router.put('/landing/berita/:id', requirePermission('landing:write'), upload.single('gambar'), landingCtrl.updateBerita);
router.delete('/landing/berita/:id', requirePermission('landing:delete'), landingCtrl.deleteBerita);

router.get('/landing/struktur', requirePermission('landing:read'), landingCtrl.getStruktur);
router.post('/landing/struktur', requirePermission('landing:write'), upload.single('foto'), landingCtrl.createStruktur);
router.put('/landing/struktur/:id', requirePermission('landing:write'), upload.single('foto'), landingCtrl.updateStruktur);
router.delete('/landing/struktur/:id', requirePermission('landing:delete'), landingCtrl.deleteStruktur);

router.get('/landing/feedback', requirePermission('landing:read'), landingCtrl.getFeedback);
router.post('/landing/feedback', requirePermission('landing:write'), upload.single('foto'), landingCtrl.createFeedback);
router.put('/landing/feedback/:id', requirePermission('landing:write'), upload.single('foto'), landingCtrl.updateFeedback);
router.delete('/landing/feedback/:id', requirePermission('landing:delete'), landingCtrl.deleteFeedback);

router.get('/landing/config', requirePermission('landing:read'), landingCtrl.getSiteConfig);
router.put('/landing/config', requirePermission('landing:write'), landingCtrl.updateSiteConfig);

/* ── PENGCAB ── */
router.get('/pengcab', requirePermission('pengcab:read'), pengcabCtrl.getPengcab);
router.post('/pengcab', requirePermission('pengcab:write'), upload.single('foto'), pengcabCtrl.createPengcab);
router.put('/pengcab/:id', requirePermission('pengcab:write'), upload.single('foto'), pengcabCtrl.updatePengcab);
router.delete('/pengcab/:id', requirePermission('pengcab:delete'), pengcabCtrl.deletePengcab);

/* ── REKOMENDASI ── */
router.get('/rekomendasi', requirePermission('rekomendasi:read'), rekomendasiCtrl.getRekomendasi);
router.post('/rekomendasi', requirePermission('rekomendasi:write'), upload.fields([
  { name: 'surat_permohonan', maxCount: 1 },
  { name: 'dokumen_pendukung', maxCount: 1 }
]), rekomendasiCtrl.createRekomendasi);
router.put('/rekomendasi/:id', requirePermission('rekomendasi:write'), upload.fields([
  { name: 'surat_permohonan', maxCount: 1 },
  { name: 'dokumen_pendukung', maxCount: 1 }
]), rekomendasiCtrl.updateRekomendasi);
router.put('/rekomendasi/:id/approve', requirePermission('rekomendasi:write'), upload.single('surat_rekomendasi'), rekomendasiCtrl.approveRekomendasi);
router.put('/rekomendasi/:id/reject', requirePermission('rekomendasi:write'), rekomendasiCtrl.rejectRekomendasi);
router.delete('/rekomendasi/:id', requirePermission('rekomendasi:delete'), rekomendasiCtrl.deleteRekomendasi);

/* ── KEJURDA ── */
router.get('/kejurda', requirePermission('kejurda:read'), kejurdaCtrl.getKejurdaRegistrations);
router.get('/kejurda/categories', requirePermission('kejurda:read'), kejurdaCtrl.getKejurdaCategories);
router.post('/kejurda/categories', requirePermission('kejurda:write'), kejurdaCtrl.createKejurdaCategory);
router.delete('/kejurda/categories/:id', requirePermission('kejurda:delete'), kejurdaCtrl.deleteKejurdaCategory);
router.put('/kejurda/registrations/:id/approve', requirePermission('kejurda:write'), kejurdaCtrl.approveKejurdaRegistration);
router.put('/kejurda/registrations/:id/reject', requirePermission('kejurda:write'), kejurdaCtrl.rejectKejurdaRegistration);
router.get('/kejurda/events', requirePermission('kejurda:read'), kejurdaCtrl.getKejurdaEvents);
router.post('/kejurda/events', requirePermission('kejurda:write'), kejurdaCtrl.createKejurdaEvent);
router.put('/kejurda/events/:id', requirePermission('kejurda:write'), kejurdaCtrl.updateKejurdaEvent);
router.delete('/kejurda/events/:id', requirePermission('kejurda:delete'), kejurdaCtrl.deleteKejurdaEvent);
router.get('/kejurda/stats', requirePermission('kejurda:read'), kejurdaCtrl.getKejurdaStats);
router.get('/kategori-event', requirePermission('kejurda:read'), kejurdaCtrl.getKategoriEvent);

/* ── PENDAFTARAN ── */
router.get('/pendaftaran', requirePermission('pendaftaran:read'), pendaftaranCtrl.getPendaftaran);
router.get('/pendaftaran/stats', requirePermission('pendaftaran:read'), pendaftaranCtrl.getPendaftaranStats);
router.get('/pendaftaran/:id', requirePermission('pendaftaran:read'), pendaftaranCtrl.getPendaftaranDetail);

/* ── USERS ── */
router.get('/users', requirePermission('users:read'), usersCtrl.getUsers);
router.get('/users/stats', requirePermission('users:read'), usersCtrl.getUserStats);
router.get('/users/anggota-kta', requirePermission('users:read'), usersCtrl.getAnggotaKta);
router.get('/users/:id', requirePermission('users:read'), usersCtrl.getUserDetail);
router.put('/users/:id', requirePermission('users:write'), usersCtrl.updateUser);

/* ── DASHBOARD ── */
router.get('/dashboard/stats', requirePermission('dashboard:read'), dashboardCtrl.getDashboardStats);
router.get('/dashboard/landing', requirePermission('dashboard:read'), dashboardCtrl.getLandingStats);
router.get('/dashboard/anggota', requirePermission('dashboard:read'), dashboardCtrl.getAnggotaStats);

/* ── FORMAT DOKUMEN ── */
router.get('/format-dokumen', requirePermission('dokumen:read'), dokumenCtrl.getFormatDokumen);
router.post('/format-dokumen', requirePermission('dokumen:write'), upload.single('file'), dokumenCtrl.createFormatDokumen);
router.put('/format-dokumen/:id', requirePermission('dokumen:write'), upload.single('file'), dokumenCtrl.updateFormatDokumen);
router.delete('/format-dokumen/:id', requirePermission('dokumen:delete'), dokumenCtrl.deleteFormatDokumen);

/* ── SITE CONFIG + SURAT CONFIG ── */
router.get('/site-config', requirePermission('config:read'), configCtrl.getSiteConfig);
router.put('/site-config', requirePermission('config:write'), configCtrl.updateSiteConfig);
router.get('/site-config/surat-config', requirePermission('config:read'), configCtrl.getSuratConfig);
router.put('/site-config/surat-config', requirePermission('config:write'), configCtrl.updateSuratConfig);
router.post('/site-config/signature', requirePermission('config:write'), upload.single('file'), configCtrl.uploadSignature);
router.post('/site-config/stamp', requirePermission('config:write'), upload.single('file'), configCtrl.uploadStamp);
router.post('/site-config/kop-surat', requirePermission('config:write'), upload.single('file'), configCtrl.uploadKopSurat);

/* ═══════════════════════════════════════════
   API KEY MANAGEMENT (self-service info)
═══════════════════════════════════════════ */
router.get('/api-key/info', (req, res) => {
  res.json({
    success: true,
    data: {
      key_name: req.apiKey.key_name,
      region: req.apiKey.region,
      province_id: req.apiKey.province_id,
      permissions: req.apiKey.permissions
    }
  });
});

/* ═══════════════════════════════════════════
   API KEY MANAGEMENT (admin - requires config:write)
═══════════════════════════════════════════ */
router.get('/api-keys', requirePermission('config:write'), async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, key_name, CONCAT(LEFT(api_key, 8), "...", RIGHT(api_key, 4)) as api_key_masked, region, province_id, permissions, is_active, last_used_at, expires_at, created_at FROM external_api_keys ORDER BY created_at DESC'
    );
    // Parse permissions for each row
    rows.forEach(r => {
      try { r.permissions = typeof r.permissions === 'string' ? JSON.parse(r.permissions) : r.permissions; }
      catch { r.permissions = []; }
    });
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getApiKeys error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data API keys' });
  }
});

router.post('/api-keys', requirePermission('config:write'), async (req, res) => {
  try {
    const { key_name, region, province_id, permissions, expires_at } = req.body;
    if (!key_name) return res.status(400).json({ success: false, message: 'key_name diperlukan' });
    if (!permissions || !Array.isArray(permissions)) {
      return res.status(400).json({ success: false, message: 'permissions harus berupa array' });
    }

    const apiKey = generateApiKey();
    const [result] = await db.query(
      'INSERT INTO external_api_keys (key_name, api_key, region, province_id, permissions, expires_at, created_by) VALUES (?,?,?,?,?,?,?)',
      [key_name, apiKey, region || null, province_id || null, JSON.stringify(permissions), expires_at || null, req.apiKey.id]
    );

    res.json({
      success: true,
      message: 'API key berhasil dibuat',
      data: { id: result.insertId, api_key: apiKey, key_name, region, permissions }
    });
  } catch (err) {
    console.error('createApiKey error:', err);
    res.status(500).json({ success: false, message: 'Gagal membuat API key' });
  }
});

router.put('/api-keys/:id', requirePermission('config:write'), async (req, res) => {
  try {
    const { id } = req.params;
    const { key_name, permissions, is_active, expires_at } = req.body;

    const updates = [];
    const params = [];
    if (key_name !== undefined) { updates.push('key_name = ?'); params.push(key_name); }
    if (permissions !== undefined) { updates.push('permissions = ?'); params.push(JSON.stringify(permissions)); }
    if (is_active !== undefined) { updates.push('is_active = ?'); params.push(parseInt(is_active)); }
    if (expires_at !== undefined) { updates.push('expires_at = ?'); params.push(expires_at); }

    if (!updates.length) return res.status(400).json({ success: false, message: 'Tidak ada data yang diubah' });

    params.push(id);
    await db.query(`UPDATE external_api_keys SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ success: true, message: 'API key berhasil diperbarui' });
  } catch (err) {
    console.error('updateApiKey error:', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui API key' });
  }
});

router.delete('/api-keys/:id', requirePermission('config:write'), async (req, res) => {
  try {
    await db.query('DELETE FROM external_api_keys WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'API key berhasil dihapus' });
  } catch (err) {
    console.error('deleteApiKey error:', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus API key' });
  }
});

/* ── Available permissions list ── */
router.get('/api-keys/permissions', requirePermission('config:read'), (req, res) => {
  res.json({
    success: true,
    data: {
      modules: [
        { module: 'landing', permissions: ['landing:read', 'landing:write', 'landing:delete'] },
        { module: 'pengcab', permissions: ['pengcab:read', 'pengcab:write', 'pengcab:delete'] },
        { module: 'rekomendasi', permissions: ['rekomendasi:read', 'rekomendasi:write', 'rekomendasi:delete'] },
        { module: 'kejurda', permissions: ['kejurda:read', 'kejurda:write', 'kejurda:delete'] },
        { module: 'pendaftaran', permissions: ['pendaftaran:read', 'pendaftaran:write', 'pendaftaran:delete'] },
        { module: 'users', permissions: ['users:read', 'users:write'] },
        { module: 'dashboard', permissions: ['dashboard:read', 'dashboard:write'] },
        { module: 'dokumen', permissions: ['dokumen:read', 'dokumen:write', 'dokumen:delete'] },
        { module: 'config', permissions: ['config:read', 'config:write'] },
      ],
      wildcard: '*'
    }
  });
});

module.exports = router;
