const express = require('express');
const router = express.Router();
const { 
  createBloodRequest, 
  getHospitalRequests, 
  getIncomingRequests, 
  getBankRequests,
  stockAvailable,
  acceptRequest, 
  updateRequestStatus,
  getNotifications,
  markAsRead
} = require('../controllers/requestController');
const { protect } = require('../middleware/authMiddleware');


router.use(protect);

router.post('/', createBloodRequest);
router.get('/hospital', getHospitalRequests);
router.get('/incoming', getIncomingRequests);
router.get('/bank', getBankRequests);
router.put('/:id/stock-available', stockAvailable);
router.put('/:id/accept/:bankId', acceptRequest);
router.put('/:id/status', updateRequestStatus);

router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markAsRead);

module.exports = router;
