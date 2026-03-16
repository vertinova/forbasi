const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/regionalRekomendasiController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

/* ── Multer storage ── */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const base = path.join(__dirname, '../../uploads/regional/rekomendasi');
    if (!fs.existsSync(base)) fs.mkdirSync(base, { recursive: true });
    const suratDir = path.join(base, 'surat');
    if (!fs.existsSync(suratDir)) fs.mkdirSync(suratDir, { recursive: true });

    if (file.fieldname === 'surat_rekomendasi') cb(null, suratDir);
    else cb(null, base);
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
  else cb(new Error('Format file tidak didukung. Gunakan JPG, PNG, PDF, atau WebP'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// Pengda = role_id 3
const auth = [authenticate, authorize(3)];

// List & CRUD
router.get   ('/',    auth, ctrl.getRekomendasi);
router.post  ('/',    auth, upload.fields([{ name: 'surat_permohonan', maxCount: 1 }, { name: 'dokumen_pendukung', maxCount: 1 }]), ctrl.createRekomendasi);
router.put   ('/:id', auth, upload.fields([{ name: 'surat_permohonan', maxCount: 1 }, { name: 'dokumen_pendukung', maxCount: 1 }]), ctrl.updateRekomendasi);
router.delete('/:id', auth, ctrl.deleteRekomendasi);

// Approve / Reject
router.put('/:id/approve', auth, upload.single('surat_rekomendasi'), ctrl.approveRekomendasi);
router.put('/:id/reject',  auth, ctrl.rejectRekomendasi);

module.exports = router;
