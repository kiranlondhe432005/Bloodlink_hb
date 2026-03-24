const express = require('express');
const router = express.Router();
const { requestLocationChange, getAllVerifiedUsers, updateBloodStock } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.post('/request-location', protect, requestLocationChange);
router.get('/verified', protect, getAllVerifiedUsers);
router.put('/stock', protect, updateBloodStock);

module.exports = router;


