const User = require('../models/User');
const LocationChangeRequest = require('../models/LocationChangeRequest');

// @desc    Request location change
// @route   POST /api/users/request-location
// @access  Private (Hospitals/BloodBanks)
const requestLocationChange = async (req, res) => {
  const { longitude, latitude } = req.body;
  if (longitude === undefined || latitude === undefined) {
    return res.status(400).json({ message: 'Invalid coordinates' });


  }

  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  try {
    const existing = await LocationChangeRequest.findOne({ user: req.user._id, status: { $in: ['Pending', 'pending'] } });
    if (existing) return res.status(400).json({ message: 'A location change request is already pending' });

    await LocationChangeRequest.create({
      user: req.user._id,
      newLocation: {
        type: 'Point',
        coordinates: [Number(longitude), Number(latitude)]
      }
    });

    res.status(201).json({ message: 'Location change request submitted for admin approval' });
  } catch (error) {
    console.error('LOCATION REQUEST ERROR:', error); // ✅ FIX
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get all verified users for the universal map
// @route   GET /api/users/verified
// @access  Private
const getAllVerifiedUsers = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const verifiedUsers = await User.find({
      isVerified: true,
      role: { $in: ['hospital', 'bloodbank'] }
    }).select('name role location bloodGroup');

    return res.json(verifiedUsers);

  } catch (error) {
    console.error('verified users ERROR:', error);
    res.status(500).json({ message: error.message });
  }
};

const updateBloodStock = async (req, res) => {
  try {
    const { group, units } = req.body;
    if (!['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].includes(group)) {
      return res.status(400).json({ message: 'Invalid blood group' });
    }

    const user = await User.findById(req.user._id);
    if (!user || user.role !== 'bloodbank') {
      return res.status(403).json({ message: 'Only blood banks can update stock' });
    }

    user.bloodStock[group] = units;
    await user.save();

    res.json({ message: 'Stock updated', bloodStock: user.bloodStock });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { requestLocationChange, getAllVerifiedUsers, updateBloodStock };
