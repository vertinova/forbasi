const router = require('express').Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/login-regional', authController.loginRegional);
router.get('/regions', authController.getRegions);
router.post('/refresh-token', authController.refreshToken);
router.get('/me', authenticate, authController.getMe);
router.post('/change-password', authenticate, authController.changePassword);
router.post('/register', authController.registerUser);
router.post('/register-license', authController.registerLicenseUser);
router.post('/register-penyelenggara', authController.registerPenyelenggara);

// SSO login — dipanggil oleh frontend Pusat saat user datang dari regional
router.post('/sso-login', authController.ssoLogin);

module.exports = router;
