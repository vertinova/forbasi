/**
 * Regional Landing Routes - Proxy to Jabar API
 * Data stored on Jabar's server, not ours.
 */
const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/regionalLandingProxyController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

/* ── Multer storage to temp dir (files forwarded to Jabar then deleted) ── */
const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(os.tmpdir(), 'forbasi-proxy-uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `proxy_${Date.now()}_${Math.random().toString(16).slice(2, 10)}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('Hanya file gambar (jpg, png, webp) yang diizinkan'), false);
};

const upload = multer({ storage: tempStorage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// Pengda = role_id 3
const auth = [authenticate, authorize(3)];

// Region info
router.get('/region-info', auth, ctrl.getRegionInfo);

// Hero Slides
router.get   ('/hero-slides',     auth, ctrl.getHeroSlides);
router.post  ('/hero-slides',     auth, upload.single('gambar'), ctrl.createHeroSlide);
router.put   ('/hero-slides/:id', auth, upload.single('gambar'), ctrl.updateHeroSlide);
router.delete('/hero-slides/:id', auth, ctrl.deleteHeroSlide);

// Berita
router.get   ('/berita',     auth, ctrl.getBerita);
router.get   ('/berita/:id', auth, ctrl.getBeritaById);
router.post  ('/berita',     auth, upload.single('gambar'), ctrl.createBerita);
router.put   ('/berita/:id', auth, upload.single('gambar'), ctrl.updateBerita);
router.delete('/berita/:id', auth, ctrl.deleteBerita);

// Struktur Organisasi
router.get   ('/struktur',     auth, ctrl.getStruktur);
router.post  ('/struktur',     auth, upload.single('foto'), ctrl.createStruktur);
router.put   ('/struktur/:id', auth, upload.single('foto'), ctrl.updateStruktur);
router.delete('/struktur/:id', auth, ctrl.deleteStruktur);

// Feedback / Testimoni
router.get   ('/feedback',        auth, ctrl.getFeedback);
router.put   ('/feedback/:id/read', auth, ctrl.markFeedbackRead);
router.delete('/feedback/:id',    auth, ctrl.deleteFeedback);

// Site Config
router.get ('/site-config', auth, ctrl.getSiteConfig);
router.put ('/site-config', auth, ctrl.updateSiteConfig);

module.exports = router;
