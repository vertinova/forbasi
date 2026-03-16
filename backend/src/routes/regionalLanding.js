const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/regionalLandingController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

/* ── Multer storage for regional uploads ── */
const regionalStorage = (subdir) => multer.diskStorage({
  destination: (req, file, cb) => {
    // We use a generic temp dir; the controller handles region-specific paths
    const dir = path.join(__dirname, '../../uploads/regional', subdir);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${subdir}_${Date.now()}_${Math.random().toString(16).slice(2, 10)}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('Hanya file gambar (jpg, png, webp) yang diizinkan'), false);
};

const uploadHero     = multer({ storage: regionalStorage('hero'),     fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadBerita   = multer({ storage: regionalStorage('berita'),   fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadStruktur = multer({ storage: regionalStorage('struktur'), fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadFeedback = multer({ storage: regionalStorage('feedback'), fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// Pengda = role_id 3
const auth = [authenticate, authorize(3)];

// Region info
router.get('/region-info', auth, ctrl.getRegionInfo);

// Hero Slides
router.get   ('/hero-slides',     auth, ctrl.getHeroSlides);
router.post  ('/hero-slides',     auth, uploadHero.single('image'), ctrl.createHeroSlide);
router.put   ('/hero-slides/:id', auth, uploadHero.single('image'), ctrl.updateHeroSlide);
router.delete('/hero-slides/:id', auth, ctrl.deleteHeroSlide);

// Berita
router.get   ('/berita',     auth, ctrl.getBerita);
router.post  ('/berita',     auth, uploadBerita.single('gambar'), ctrl.createBerita);
router.put   ('/berita/:id', auth, uploadBerita.single('gambar'), ctrl.updateBerita);
router.delete('/berita/:id', auth, ctrl.deleteBerita);

// Struktur Organisasi
router.get   ('/struktur',     auth, ctrl.getStruktur);
router.post  ('/struktur',     auth, uploadStruktur.single('foto'), ctrl.createStruktur);
router.put   ('/struktur/:id', auth, uploadStruktur.single('foto'), ctrl.updateStruktur);
router.delete('/struktur/:id', auth, ctrl.deleteStruktur);

// Feedback / Testimoni
router.get   ('/feedback',     auth, ctrl.getFeedback);
router.post  ('/feedback',     auth, uploadFeedback.single('foto'), ctrl.createFeedback);
router.put   ('/feedback/:id', auth, uploadFeedback.single('foto'), ctrl.updateFeedback);
router.delete('/feedback/:id', auth, ctrl.deleteFeedback);

// Site Config
router.get ('/site-config', auth, ctrl.getSiteConfig);
router.put ('/site-config', auth, ctrl.updateSiteConfig);

module.exports = router;
