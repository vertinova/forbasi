const router = require('express').Router();
const eventController = require('../controllers/eventController');
const { authenticate, authorize } = require('../middleware/auth');
const { eventUpload, handleUploadError } = require('../middleware/upload');

// All routes require authentication
router.use(authenticate);

// Penyelenggara: submit event
router.post('/submit-event', eventUpload.any(), handleUploadError, eventController.submitEvent);

// Pengcab: submit kejurcab
router.post('/submit-kejurcab', authorize(2), eventUpload.any(), handleUploadError, eventController.submitKejurcab);

// Get own events
router.get('/my-events', eventController.getMyEvents);

// Get event detail
router.get('/:id', eventController.getEventDetail);

// Pengcab: review penyelenggara events
router.get('/pengcab/pending', authorize(2), eventController.getPendingPengcabApproval);
router.post('/pengcab/:id/approve', authorize(2), eventController.pengcabApprove);
router.post('/pengcab/:id/reject', authorize(2), eventController.pengcabReject);

// Admin (Pengda/PB): review events
router.get('/admin/pending', authorize(3, 4), eventController.getPendingAdminApproval);
router.get('/admin/all', authorize(2, 3, 4), eventController.getAllEvents);
router.post('/admin/:id/approve', authorize(3, 4), eventController.adminApprove);
router.post('/admin/:id/reject', authorize(3, 4), eventController.adminReject);

module.exports = router;
