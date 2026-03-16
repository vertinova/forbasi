const router = require('express').Router();
const kejurdaController = require('../controllers/kejurdaController');
const { authenticate, authorize } = require('../middleware/auth');

// Categories (Pengcab & Pengda can view)
router.get('/categories', authenticate, authorize(2, 3), kejurdaController.getCategories);
router.post('/categories', authenticate, authorize(3), kejurdaController.createCategory);
router.delete('/categories/:id', authenticate, authorize(3), kejurdaController.deleteCategory);

// Club search & registration (Pengcab registers, Pengda can also register)
router.get('/search-clubs', authenticate, authorize(2, 3), kejurdaController.searchClubs);
router.post('/register', authenticate, authorize(2, 3), kejurdaController.registerTeam);
router.get('/registrations', authenticate, authorize(2, 3), kejurdaController.getRegistrations);
router.delete('/registrations/:id', authenticate, authorize(2, 3), kejurdaController.deleteRegistration);
router.get('/stats', authenticate, authorize(2, 3), kejurdaController.getStats);

// Pengda-only: Approve/Reject
router.put('/registrations/:id/approve', authenticate, authorize(3), kejurdaController.approveRegistration);
router.put('/registrations/:id/reject', authenticate, authorize(3), kejurdaController.rejectRegistration);

// Events CRUD (Pengda only, Pengcab can view)
router.get('/events', authenticate, authorize(2, 3), kejurdaController.getEvents);
router.post('/events', authenticate, authorize(3), kejurdaController.createEvent);
router.put('/events/:id', authenticate, authorize(3), kejurdaController.updateEvent);
router.delete('/events/:id', authenticate, authorize(3), kejurdaController.deleteEvent);

// Export (Pengda only)
router.get('/export', authenticate, authorize(3), kejurdaController.exportRegistrations);

// Pengcab list (Pengda only)
router.get('/pengcab-list', authenticate, authorize(3), kejurdaController.getPengcabList);

module.exports = router;
