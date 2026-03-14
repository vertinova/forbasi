const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/landingController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

/* ── Multer storage for landing uploads ── */
const landingStorage = (subdir) => multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/landing', subdir);
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

const uploadEvent       = multer({ storage: landingStorage('events'),      fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadGallery     = multer({ storage: landingStorage('gallery'),     fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadMarketplace = multer({ storage: landingStorage('marketplace'), fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadBanner      = multer({ storage: landingStorage('banners'),     fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

/* ── Public route (no auth) ── */
router.get('/public', ctrl.getPublicLanding);

/* ── Admin routes (PB only, role_id 4) ── */
const auth = [authenticate, authorize(4)];

// Events
router.get   ('/events',     auth, ctrl.getEvents);
router.post  ('/events',     auth, uploadEvent.single('banner'), ctrl.createEvent);
router.put   ('/events/:id', auth, uploadEvent.single('banner'), ctrl.updateEvent);
router.delete('/events/:id', auth, ctrl.deleteEvent);

// Gallery
router.get   ('/gallery',     auth, ctrl.getGallery);
router.post  ('/gallery',     auth, uploadGallery.single('image'), ctrl.createGallery);
router.put   ('/gallery/:id', auth, uploadGallery.single('image'), ctrl.updateGallery);
router.delete('/gallery/:id', auth, ctrl.deleteGallery);

// Berita
router.get   ('/berita',     auth, ctrl.getBerita);
router.post  ('/berita',     auth, ctrl.createBerita);
router.put   ('/berita/:id', auth, ctrl.updateBerita);
router.delete('/berita/:id', auth, ctrl.deleteBerita);

// Marketplace
router.get   ('/marketplace',     auth, ctrl.getMarketplace);
router.post  ('/marketplace',     auth, uploadMarketplace.single('image'), ctrl.createMarketplace);
router.put   ('/marketplace/:id', auth, uploadMarketplace.single('image'), ctrl.updateMarketplace);
router.delete('/marketplace/:id', auth, ctrl.deleteMarketplace);

// Banners
router.get   ('/banners',     auth, ctrl.getBanners);
router.post  ('/banners',     auth, uploadBanner.single('image'), ctrl.createBanner);
router.put   ('/banners/:id', auth, uploadBanner.single('image'), ctrl.updateBanner);
router.delete('/banners/:id', auth, ctrl.deleteBanner);

module.exports = router;
