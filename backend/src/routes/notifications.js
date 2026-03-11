const router = require('express').Router();
const notifController = require('../controllers/notificationController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/subscribe', authenticate, notifController.subscribe);
router.post('/send', authenticate, authorize(4), notifController.sendNotification);
router.post('/track-click', notifController.trackClick);
router.get('/vapid-key', notifController.getVapidKey);
router.get('/stats', authenticate, authorize(4), notifController.getStats);

module.exports = router;
