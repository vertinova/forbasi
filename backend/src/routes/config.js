const router = require('express').Router();
const ktaConfigController = require('../controllers/ktaConfigController');
const { authenticate, authorize } = require('../middleware/auth');
const { configUpload, reregistrationUpload, handleUploadError } = require('../middleware/upload');

// KTA Config (pengcab/pengda/pb)
router.get('/kta-config', authenticate, authorize(2, 3, 4), ktaConfigController.getConfig);
router.post('/kta-config', authenticate, authorize(2, 3, 4), configUpload.fields([
  { name: 'signature', maxCount: 1 },
  { name: 'stamp', maxCount: 1 }
]), handleUploadError, ktaConfigController.saveConfig);

// KTA Application History
router.get('/kta-history/:applicationId', authenticate, authorize(2, 3, 4), ktaConfigController.getApplicationHistory);

// In-app Notifications
router.get('/notifications', authenticate, ktaConfigController.getNotifications);
router.put('/notifications/:id/read', authenticate, ktaConfigController.markNotificationRead);
router.put('/notifications/read-all', authenticate, ktaConfigController.markAllNotificationsRead);

// Notification Templates
router.get('/notification-templates', authenticate, authorize(4), ktaConfigController.getNotificationTemplates);

// Visitor Tracking
router.post('/track-visitor', ktaConfigController.trackVisitor);
router.get('/visitor-stats', authenticate, authorize(4), ktaConfigController.getVisitorStats);

// Competition Re-registration (multi-file upload)
router.post('/reregistration', authenticate, authorize(1), reregistrationUpload.fields([
  { name: 'school_permission_letter', maxCount: 1 },
  { name: 'parent_permission_letter', maxCount: 1 },
  { name: 'team_photo', maxCount: 1 },
  { name: 'payment_proof', maxCount: 1 },
  { name: 'komandan_photo', maxCount: 1 },
  { name: 'manager_photo', maxCount: 1 },
  { name: 'pelatih_photo', maxCount: 1 },
  { name: 'cadangan_1_photo', maxCount: 1 },
  { name: 'cadangan_2_photo', maxCount: 1 },
  ...Array.from({ length: 15 }, (_, i) => ({ name: `pasukan_${i + 1}_photo`, maxCount: 1 }))
]), handleUploadError, ktaConfigController.submitReregistration);
router.get('/reregistrations', authenticate, authorize(2, 3, 4), ktaConfigController.getReregistrations);
router.put('/reregistrations/:id/status', authenticate, authorize(2, 3, 4), ktaConfigController.updateReregistrationStatus);
router.get('/reregistrations/export', authenticate, authorize(2, 3, 4), ktaConfigController.exportReregistrations);

module.exports = router;
