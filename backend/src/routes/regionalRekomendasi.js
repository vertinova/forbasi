/**
 * Regional Rekomendasi Routes - Proxy to Jabar API
 * Data stored on Jabar's server, not ours.
 */
const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/regionalRekomendasiProxyController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

/* ── Multer storage to temp dir (files forwarded to Jabar then deleted) ── */
const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(os.tmpdir(), 'forbasi-proxy-rekomendasi');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `proxy_${Date.now()}_${Math.random().toString(16).slice(2, 10)}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.pdf', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('Format file tidak didukung. Gunakan JPG, PNG, PDF, atau WebP'), false);
};

const upload = multer({ storage: tempStorage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// Pengda = role_id 3
const auth = [authenticate, authorize(3)];

// Surat Config (must be before /:id routes)
router.get('/surat-config',            auth, ctrl.getSuratConfig);
router.post('/surat-config/signature', auth, ctrl.saveSignature);
router.post('/surat-config/stamp',     auth, upload.single('stamp'), ctrl.saveStamp);

// List & CRUD
router.get   ('/',    auth, ctrl.getRekomendasi);
router.get   ('/:id', auth, ctrl.getRekomendasiById);
router.post  ('/',    auth, upload.fields([
  { name: 'surat_permohonan', maxCount: 1 },
  { name: 'dokumen_pendukung', maxCount: 1 }
]), ctrl.createRekomendasi);
router.put   ('/:id', auth, upload.fields([
  { name: 'surat_permohonan', maxCount: 1 },
  { name: 'dokumen_pendukung', maxCount: 1 }
]), ctrl.updateRekomendasi);
router.delete('/:id', auth, ctrl.deleteRekomendasi);

// Approve / Reject / Regenerate
router.put('/:id/approve', auth, ctrl.approveRekomendasi);
router.put('/:id/reject',  auth, ctrl.rejectRekomendasi);
router.post('/:id/regenerate-surat', auth, ctrl.regenerateSurat);

module.exports = router;
