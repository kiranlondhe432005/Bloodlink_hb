const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, renewLicense } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/renew-license', renewLicense);
router.get('/me', protect, getMe);

module.exports = router;
