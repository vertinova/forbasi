const router = require('express').Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/dashboard', authenticate, authorize(4), adminController.getDashboardStats);
router.get('/balance-report', authenticate, authorize(3, 4), adminController.getBalanceReport);
router.get('/balance-pengcab', authenticate, authorize(2), adminController.getBalancePengcab);
router.get('/balance-pengda', authenticate, authorize(3), adminController.getBalancePengda);
router.get('/approved-generated-kta', authenticate, authorize(2, 3, 4), adminController.getApprovedGeneratedKTA);
router.get('/export-members', authenticate, authorize(2, 3, 4), adminController.exportMembers);
router.get('/export-saldo', authenticate, authorize(4), adminController.exportSaldo);
router.get('/export-rekening', authenticate, authorize(4), adminController.exportRekening);
router.get('/activity', authenticate, authorize(2, 3, 4), adminController.getRecentActivity);

module.exports = router;
