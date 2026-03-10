const router = require('express').Router();
const pbPaymentController = require('../controllers/pbPaymentController');
const { authenticate, authorize } = require('../middleware/auth');
const { paymentUpload, handleUploadError } = require('../middleware/upload');

// All routes are PB-only (role_id = 4)
router.get('/saldo-summary', authenticate, authorize(4), pbPaymentController.getSaldoSummary);
router.get('/recipient-details', authenticate, authorize(4), pbPaymentController.getRecipientDetails);
router.post('/recap-payment', authenticate, authorize(4), paymentUpload.single('payment_proof_file'), handleUploadError, pbPaymentController.processRecapPayment);
router.get('/history', authenticate, authorize(4), pbPaymentController.getPaymentHistory);
router.get('/export-full-saldo', authenticate, authorize(4), pbPaymentController.exportFullSaldo);

module.exports = router;
