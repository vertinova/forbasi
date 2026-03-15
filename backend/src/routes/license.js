const router = require('express').Router();
const licenseController = require('../controllers/licenseController');
const { authenticate, authorize, authorizeUserType } = require('../middleware/auth');
const { licenseUpload, handleUploadError } = require('../middleware/upload');

// License user endpoints
router.post(
  '/submit',
  authenticate,
  authorizeUserType('license_user'),
  licenseUpload.fields([
    { name: 'pas_foto', maxCount: 1 },
    { name: 'bukti_transfer', maxCount: 1 },
    { name: 'surat_pengalaman', maxCount: 1 },
    { name: 'sertifikat_tot', maxCount: 1 },
    { name: 'surat_rekomendasi', maxCount: 1 }
  ]),
  handleUploadError,
  licenseController.submitApplication
);

// Alias for frontend compatibility
router.post(
  '/applications',
  authenticate,
  authorizeUserType('license_user'),
  licenseUpload.fields([
    { name: 'pas_foto', maxCount: 1 },
    { name: 'bukti_transfer', maxCount: 1 },
    { name: 'surat_pengalaman', maxCount: 1 },
    { name: 'sertifikat_tot', maxCount: 1 },
    { name: 'surat_rekomendasi', maxCount: 1 }
  ]),
  handleUploadError,
  licenseController.submitApplication
);

router.get('/my-applications', authenticate, authorizeUserType('license_user'), licenseController.getMyApplications);
router.get('/events', authenticate, licenseController.getEvents);

// PB Admin endpoints
router.get('/applications', authenticate, authorize(4), licenseController.getAllApplications);
router.get('/applications/:id', authenticate, licenseController.getApplicationDetail);
router.patch('/applications/:id/status', authenticate, authorize(4), licenseController.updateStatus);
router.get('/stats', authenticate, authorize(4), licenseController.getStats);

// License config endpoints
router.get('/configs', authenticate, licenseController.getConfigs);
router.get('/configs/:jenis', authenticate, licenseController.getConfigByJenis);
router.post('/configs', authenticate, authorize(4), licenseController.saveConfig);

module.exports = router;
