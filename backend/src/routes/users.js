const router = require('express').Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, userController.updateProfile);
router.put('/bank-account', authenticate, userController.updateBankAccount);
router.put('/change-password', authenticate, userController.changePassword);
router.get('/list', authenticate, authorize(2, 3, 4), userController.getAllUsers);
router.get('/provinces', userController.getProvinces);
router.get('/cities/:province_id', userController.getCities);
router.get('/:id/download-logo', authenticate, authorize(2, 3, 4), userController.downloadLogo);
router.put('/:id/suspend', authenticate, authorize(2, 3, 4), userController.toggleSuspend);
router.put('/:id/reset-password', authenticate, authorize(4), userController.resetUserPassword);
router.delete('/:id', authenticate, authorize(4), userController.deleteUser);

module.exports = router;
