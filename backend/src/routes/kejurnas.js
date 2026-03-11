const router = require('express').Router();
const kejurnasController = require('../controllers/kejurnasController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/categories', authenticate, kejurnasController.getCategories);
router.get('/search-clubs', authenticate, authorize(3, 4), kejurnasController.searchClubs);
router.post('/register', authenticate, authorize(3, 4), kejurnasController.registerTeam);
router.get('/registrations', authenticate, authorize(3, 4), kejurnasController.getRegistrations);
router.delete('/registrations/:id', authenticate, authorize(3, 4), kejurnasController.deleteRegistration);
router.get('/stats', authenticate, authorize(3, 4), kejurnasController.getStats);

// PB-only: Approve/Reject
router.put('/registrations/:id/approve', authenticate, authorize(4), kejurnasController.approveRegistration);
router.put('/registrations/:id/reject', authenticate, authorize(4), kejurnasController.rejectRegistration);

// Events CRUD (PB only)
router.get('/events', authenticate, authorize(4), kejurnasController.getEvents);
router.post('/events', authenticate, authorize(4), kejurnasController.createEvent);
router.put('/events/:id', authenticate, authorize(4), kejurnasController.updateEvent);
router.delete('/events/:id', authenticate, authorize(4), kejurnasController.deleteEvent);

// Export (PB only)
router.get('/export', authenticate, authorize(4), kejurnasController.exportRegistrations);

// PB advanced: summary, pengda list, per-pengda statistics
router.get('/summary', authenticate, authorize(4), kejurnasController.getSummary);
router.get('/pengda-list', authenticate, authorize(4), kejurnasController.getPengdaList);
router.get('/statistics-per-pengda', authenticate, authorize(4), kejurnasController.getStatisticsPerPengda);

module.exports = router;
