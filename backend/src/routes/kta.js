const router = require('express').Router();
const ktaController = require('../controllers/ktaController');
const { authenticate, authorize } = require('../middleware/auth');
const { ktaUpload, paymentUpload, handleUploadError } = require('../middleware/upload');

// KTA application CRUD
router.post(
  '/submit',
  authenticate,
  authorize(1),
  ktaUpload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'ad_file', maxCount: 1 },
    { name: 'art_file', maxCount: 1 },
    { name: 'sk_file', maxCount: 1 },
    { name: 'payment_proof', maxCount: 1 },
    { name: 'member_photos', maxCount: 20 }
  ]),
  handleUploadError,
  ktaController.submitApplication
);

router.get('/applications', authenticate, ktaController.getApplications);
router.get('/applications/:id', authenticate, ktaController.getApplicationDetail);

// Status update (with optional payment proof upload)
router.patch(
  '/applications/:id/status',
  authenticate,
  authorize(2, 3, 4),
  paymentUpload.single('payment_proof'),
  handleUploadError,
  ktaController.updateStatus
);

router.get('/stats', authenticate, authorize(2, 3, 4), ktaController.getStats);
router.get('/activity-logs', authenticate, authorize(2, 3, 4), ktaController.getActivityLogs);

// KTA PDF generation & download
router.post('/applications/:id/generate-pdf', authenticate, authorize(4), ktaController.generateKtaPdf);
router.get('/applications/:id/download-pdf', authenticate, authorize(2, 3, 4), ktaController.downloadKtaPdf);
router.post('/batch-regenerate', authenticate, authorize(4), ktaController.batchRegenerateKta);

// Public barcode verification
router.get('/verify/:barcode_id', ktaController.getByBarcode);

module.exports = router;
