const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getPendingUsers,
  approveUser,
  rejectUser,
  getLocationRequests,
  resolveLocationRequest,
  createAdmin,
  removeAdmin,
  getAllAdmins,
  toggleAccess,
  getAllHospitals,
  getAllBloodBanks,
  getAllRequests
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect, adminOnly);

router.get('/stats', getDashboardStats);
router.get('/users/pending', getPendingUsers);
router.put('/users/:id/approve', approveUser);
router.delete('/users/:id/reject', rejectUser);
router.get('/locations/pending', getLocationRequests);
router.put('/locations/:id', resolveLocationRequest);
router.post('/create-admin', createAdmin);
router.delete('/remove-admin/:id', removeAdmin);
router.get('/admins', getAllAdmins);
router.put('/users/:id/toggle-access', toggleAccess);
router.get('/hospitals', getAllHospitals);
router.get('/bloodbanks', getAllBloodBanks);
router.get('/requests', getAllRequests);

module.exports = router;
