const express = require('express');
const router = express.Router();
const { requestLocationChange, getAllVerifiedUsers, updateBloodStock } = require('../controllers/userController');
const { protect, verifiedOnly } = require('../middleware/authMiddleware');

router.post('/request-location', protect, verifiedOnly, requestLocationChange);
router.get('/verified', protect, getAllVerifiedUsers);
router.put('/stock', protect, verifiedOnly, updateBloodStock);

module.exports = router;


