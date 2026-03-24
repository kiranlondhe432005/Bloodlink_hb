const BloodRequest = require('../models/BloodRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Create Blood Request and broadcast
// @route   POST /api/requests
// @access  Private/Hospital
const createBloodRequest = async (req, res) => {
  const { bloodGroup, units } = req.body;
  const hospitalId = req.user._id;

  try {
    const hospital = await User.findById(hospitalId);
    if (!hospital || hospital.role !== 'hospital' || !hospital.isVerified) {
      return res.status(403).json({ message: 'Only verified hospitals can create requests' });
    }

    let radiusKm = 20;
    let bloodBanksFound = [];
    const maxRadius = 100;

    // Expand search radius until 20 banks found or maxRadius hit
    while (radiusKm <= maxRadius && bloodBanksFound.length < 20) {
      bloodBanksFound = await User.find({
        role: 'bloodbank',
        isVerified: true,
        location: {
          $near: {
            $geometry: hospital.location,
            $maxDistance: radiusKm * 1000 // In meters
          }
        }
      });
      if (bloodBanksFound.length < 20) {
        radiusKm += 10;
      }
    }

    if (bloodBanksFound.length === 0) {
      return res.status(404).json({ message: 'No verified blood banks found nearby' });
    }

    const bloodRequest = await BloodRequest.create({
      hospital: hospital._id,
      bloodGroup,
      units,
      status: 'pending'
    });

    const io = req.app.get('io');
    const notificationsToInsert = [];

    for (let bank of bloodBanksFound) {
      let distance = 0;
      if (hospital.location && bank.location) {
         const [hLng, hLat] = hospital.location.coordinates;
         const [bLng, bLat] = bank.location.coordinates;
         const R = 6371; 
         const dLat = (bLat - hLat) * Math.PI / 180;
         const dLng = (bLng - hLng) * Math.PI / 180;
         const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                   Math.cos(hLat * Math.PI / 180) * Math.cos(bLat * Math.PI / 180) *
                   Math.sin(dLng/2) * Math.sin(dLng/2);
         const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
         distance = R * c; 
      }

      notificationsToInsert.push({
        user: bank._id,
        title: 'Emergency Blood Request',
        message: `${hospital.name} needs ${units} units of ${bloodGroup}`,
        bloodRequest: bloodRequest._id,
        distance
      });
      // Broadcast live event to bank's room
      io.to(bank._id.toString()).emit('request_received', {
        hospitalName: hospital.name,
        bloodGroup,
        units,
        requestId: bloodRequest._id,
      });
    }

    await Notification.insertMany(notificationsToInsert);

    return res.status(201).json({ message: 'Broadcast successful', request: bloodRequest, targetsFound: bloodBanksFound.length });
  } catch (error) {
    console.error("CREATE REQUEST ERROR:", error);
    res.status(500).json({ message: error.message });
  }

};

// @desc    Get Hospital's own requests
// @route   GET /api/requests/hospital
// @access  Private/Hospital
const getHospitalRequests = async (req, res) => {
  try {
    const requests = await BloodRequest.find({ hospital: req.user._id })
      .populate('acceptedBy', 'name email location')
      .populate('responses.bloodBank', 'name location')
      .sort('-createdAt');
    res.json(requests);
  } catch (error) {
    console.error("HOSPITAL REQUEST ERROR:", error); // ✅ FIX
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Incoming requests for Blood Bank
// @route   GET /api/requests/incoming
// @access  Private/BloodBank
const getIncomingRequests = async (req, res) => {
  try {
    // Find notifications linked to active pending requests
    const notifications = await Notification.find({ user: req.user._id, status: 'active' })
      .populate({
        path: 'bloodRequest',
        match: { status: 'pending' },
        populate: { path: 'hospital', select: 'name location' }
      })
      .sort('-createdAt');

    // Filter out notifications where the request might have been fulfilled/nullified
    const validIncoming = notifications.filter(n => n.bloodRequest !== null);

    res.json(validIncoming);
  } catch (error) {
    console.error("INCOMING REQUEST ERROR:", error); // ✅ FIX
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Blood Bank's accepted/handled requests
// @route   GET /api/requests/bank
// @access  Private/BloodBank
const getBankRequests = async (req, res) => {
  try {
    const requests = await BloodRequest.find({ acceptedBy: req.user._id })
      .populate('hospital', 'name location')
      .sort('-createdAt');
    res.json(requests);
  } catch (error) {
    console.error("bank REQUEST ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Register stock availability for a blood request
// @route   PUT /api/requests/:id/stock-available
// @access  Private/BloodBank
const stockAvailable = async (req, res) => {
  try {
    const bloodRequest = await BloodRequest.findById(req.params.id).populate('hospital', 'location');
    if (!bloodRequest) return res.status(404).json({ message: 'Request not found' });
    if (bloodRequest.status !== 'pending') return res.status(400).json({ message: 'Request is already accepted' });
    if (req.user.role !== 'bloodbank') return res.status(403).json({ message: 'Only blood banks can respond' });

    // Check if already responded
    const alreadyResponded = bloodRequest.responses.find(r => r.bloodBank.toString() === req.user._id.toString());
    if (alreadyResponded) {
      return res.status(400).json({ message: 'Already marked as available' });
    }

    // Calculate approx distance (since we don't have MongoDB's raw output here, we'll estimate or just query)
    let distance = 0;
    if (bloodRequest.hospital && req.user.location && req.user.location.coordinates) {
       const [hLng, hLat] = bloodRequest.hospital.location.coordinates;
       const [bLng, bLat] = req.user.location.coordinates;
       // Very simple approx distance in km (not perfect, but works for UI)
       const R = 6371; 
       const dLat = (bLat - hLat) * Math.PI / 180;
       const dLng = (bLng - hLng) * Math.PI / 180;
       const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                 Math.cos(hLat * Math.PI / 180) * Math.cos(bLat * Math.PI / 180) *
                 Math.sin(dLng/2) * Math.sin(dLng/2);
       const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
       distance = R * c; 
    }

    bloodRequest.responses.push({
      bloodBank: req.user._id,
      distance: distance.toFixed(1)
    });

    await bloodRequest.save();

    const io = req.app.get('io');
    io.to(bloodRequest.hospital._id.toString()).emit('stock_available', {
      requestId: bloodRequest._id,
      bloodBankId: req.user._id,
      bloodBankName: req.user.name,
      distance: distance.toFixed(1),
      status: 'available'
    });

    await Notification.create({
      user: bloodRequest.hospital._id,
      title: 'Stock Available',
      message: `${req.user.name} has the requested blood stock available.`,
      bloodRequest: bloodRequest._id,
      distance: distance.toFixed(1)
    });

    res.json({ message: 'Marked as available' });
  } catch (error) {
    console.error("stockAvailable ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Hospital accepts a blood bank's response
// @route   PUT /api/requests/:id/accept/:bankId
// @access  Private/Hospital
const acceptRequest = async (req, res) => {
  try {
    const bloodRequest = await BloodRequest.findById(req.params.id);
    if (!bloodRequest) return res.status(404).json({ message: 'Request not found' });
    if (bloodRequest.status !== 'pending') return res.status(400).json({ message: 'Request is already accepted' });
    if (req.user._id.toString() !== bloodRequest.hospital.toString()) {
       return res.status(403).json({ message: 'Only the requesting hospital can accept' });
    }

    const { bankId } = req.params;

    bloodRequest.acceptedBy = bankId;
    bloodRequest.status = 'accepted';
    bloodRequest.acceptedAt = new Date();
    await bloodRequest.save();

    const io = req.app.get('io');
    
    // Notify the accepted blood bank
    io.to(bankId).emit('request_locked', {
      requestId: bloodRequest._id,
      status: 'accepted',
      acceptedAt: bloodRequest.acceptedAt
    });

    await Notification.create({
      user: bankId,
      title: 'Request Accepted',
      message: `Your resource offer was accepted. Please prepare dispatch immediately.`,
      bloodRequest: bloodRequest._id
    });

    // Mark other bank's notifications as Expired/Handled
    await Notification.updateMany(
      { bloodRequest: bloodRequest._id, user: { $ne: bankId } },
      { $set: { status: 'handled' } }
    );

    // Mark this bank's notification as handled
    await Notification.updateOne(
      { bloodRequest: bloodRequest._id, user: bankId },
      { $set: { status: 'handled' } }
    );

    res.json(bloodRequest);
  } catch (error) {
    console.error("accept  REQUEST ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update request status
// @route   PUT /api/requests/:id/status
// @access  Private/BloodBank
const updateRequestStatus = async (req, res) => {
  const { status } = req.body; // 'On the Way' or 'Delivered'
  try {
    const bloodRequest = await BloodRequest.findById(req.params.id);
    if (!bloodRequest) return res.status(404).json({ message: 'Request not found' });
    if (bloodRequest.acceptedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized for this request' });
    }

    // Enforce sequence: Accepted -> On the Way -> Delivered
    if (status === 'on_the_way' && bloodRequest.status !== 'accepted') {
      return res.status(400).json({ message: 'Request must be Accepted before being Dispatched' });
    }
    if (status === 'delivered' && bloodRequest.status !== 'on_the_way') {
      return res.status(400).json({ message: 'Request must be "On the Way" before being marked as Delivered' });
    }

    bloodRequest.status = status;
    if (status === 'on_the_way') bloodRequest.onTheWayAt = new Date();
    if (status === 'delivered') bloodRequest.deliveredAt = new Date();
    await bloodRequest.save();

    const io = req.app.get('io');
    io.to(bloodRequest.hospital.toString()).emit('status_updated', {
      requestId: bloodRequest._id,
      status,
      timestamp: new Date()
    });

    await Notification.create({
      user: bloodRequest.hospital.toString(),
      title: `Status: ${status === 'on_the_way' ? 'On The Way' : 'Delivered'}`,
      message: status === 'on_the_way' 
         ? `${req.user.name} has dispatched your request.` 
         : `${req.user.name} has delivered your request.`,
      bloodRequest: bloodRequest._id
    });

    res.json(bloodRequest);
  } catch (error) {
    console.error("status update REQUEST ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's notifications
// @route   GET /api/requests/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const notifications = await Notification.find({ 
      user: req.user._id,
      createdAt: { $gte: twentyFourHoursAgo }
    })
      .populate({
        path: 'bloodRequest',
        populate: { path: 'hospital', select: 'name' }
      })
      .sort('-createdAt');
    res.json(notifications);
  } catch (error) {
    console.error("notification REQUEST ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/requests/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    if (notification.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    notification.isRead = true;
    await notification.save();
    res.json(notification);
  } catch (error) {
    console.error("mark read error", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createBloodRequest,
  getHospitalRequests,
  getIncomingRequests,
  getBankRequests,
  stockAvailable,
  acceptRequest,
  updateRequestStatus,
  getNotifications,
  markAsRead
};
