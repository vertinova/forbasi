const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

// Generate unique filename
const generateFilename = (file) => {
  const uniqueId = crypto.randomBytes(8).toString('hex');
  const ext = path.extname(file.originalname).toLowerCase();
  return `${Date.now()}_${uniqueId}${ext}`;
};

// Allowed file types
const allowedMimeTypes = [
  'image/jpeg', 'image/jpg', 'image/png',
  'application/pdf'
];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format file tidak didukung. Gunakan JPG, PNG, atau PDF.'), false);
  }
};

// KTA file upload
const ktaStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/kta_files'));
  },
  filename: (req, file, cb) => {
    cb(null, `kta_${generateFilename(file)}`);
  }
});

const ktaUpload = multer({
  storage: ktaStorage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 2097152 }
});

// License file upload
const licenseStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/lisensi'));
  },
  filename: (req, file, cb) => {
    cb(null, `lisensi_${generateFilename(file)}`);
  }
});

const licenseUpload = multer({
  storage: licenseStorage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 2097152 }
});

// Payment proof upload
const paymentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/payment_proofs'));
  },
  filename: (req, file, cb) => {
    cb(null, `payment_${generateFilename(file)}`);
  }
});

const paymentUpload = multer({
  storage: paymentStorage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 2097152 }
});

// General upload (single file)
const generalStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, generateFilename(file));
  }
});

const generalUpload = multer({
  storage: generalStorage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 2097152 }
});

// Config upload (signatures, stamps) — save to role-specific directory
const configStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const roleId = req.user?.role_id;
    const roleDir = roleId === 2 ? 'pengcab_kta_configs' : roleId === 3 ? 'pengda_kta_configs' : 'pb_kta_configs';
    const dir = path.join(__dirname, '../../uploads', roleDir);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const roleId = req.user?.role_id;
    const prefix = roleId === 2 ? 'pengcab' : roleId === 3 ? 'pengda' : 'pb';
    cb(null, `${prefix}_${file.fieldname}_${req.user.id}_${generateFilename(file)}`);
  }
});

const configUpload = multer({
  storage: configStorage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 2097152 }
});

// Reregistration upload
const reregistrationStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/reregistration'));
  },
  filename: (req, file, cb) => {
    cb(null, `rereg_${generateFilename(file)}`);
  }
});

const reregistrationUpload = multer({
  storage: reregistrationStorage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 2097152 }
});

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'Ukuran file maksimal 2MB' });
    }
    return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
};

module.exports = {
  ktaUpload,
  licenseUpload,
  paymentUpload,
  generalUpload,
  configUpload,
  reregistrationUpload,
  handleUploadError
};
