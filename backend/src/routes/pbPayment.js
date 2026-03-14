const router = require('express').Router();
const pbPaymentController = require('../controllers/pbPaymentController');
const { authenticate, authorize } = require('../middleware/auth');
const { paymentUpload, handleUploadError } = require('../middleware/upload');

// All routes are PB-only (role_id = 4)
router.get('/saldo-summary', authenticate, authorize(4), pbPaymentController.getSaldoSummary);
router.get('/recipient-details', authenticate, authorize(4), pbPaymentController.getRecipientDetails);
router.get('/unpaid-amounts', authenticate, authorize(4), pbPaymentController.getTotalUnpaidAmounts);
router.get('/issued-kta', authenticate, authorize(4), pbPaymentController.getIssuedKtaList);
router.get('/export-issued-kta', authenticate, authorize(4), pbPaymentController.exportIssuedKta);
router.post('/recap-payment', authenticate, authorize(4), paymentUpload.single('payment_proof_file'), handleUploadError, pbPaymentController.processRecapPayment);
router.get('/history', authenticate, authorize(4), pbPaymentController.getPaymentHistory);
router.get('/export-full-saldo', authenticate, authorize(4), pbPaymentController.exportFullSaldo);

// Pengda balance routes (role_id = 3)
router.get('/pengda/balance-summary', authenticate, authorize(3), pbPaymentController.getPengdaBalanceSummary);
router.get('/pengda/transactions', authenticate, authorize(3), pbPaymentController.getPengdaBalanceTransactions);

// Pengcab balance routes (role_id = 2)
router.get('/pengcab/balance-summary', authenticate, authorize(2), pbPaymentController.getPengcabBalanceSummary);
router.get('/pengcab/transactions', authenticate, authorize(2), pbPaymentController.getPengcabBalanceTransactions);
router.get('/pengcab/pengda-bank-info', authenticate, authorize(2), pbPaymentController.getPengdaBankInfo);

module.exports = router;
