const router = require('express').Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authenticateApiKey, requirePermission } = require('../middleware/apiKeyAuth');

router.post('/login', authController.login);
router.post('/login-regional', authController.loginRegional);
router.get('/regions', authController.getRegions);
router.post('/refresh-token', authController.refreshToken);
router.get('/me', authenticate, authController.getMe);
router.post('/change-password', authenticate, authController.changePassword);
router.post('/register', authController.registerUser);
router.post('/register-license', authController.registerLicenseUser);
router.post('/register-penyelenggara', authController.registerPenyelenggara);

// SSO endpoints
router.post('/sso-exchange', authenticateApiKey, requirePermission('users:read'), authController.ssoExchange);
router.post('/sso-verify', authController.ssoVerify);

module.exports = router;
