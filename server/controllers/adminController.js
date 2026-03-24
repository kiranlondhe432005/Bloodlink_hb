const User = require('../models/User');
const BloodRequest = require('../models/BloodRequest');
const LocationChangeRequest = require('../models/LocationChangeRequest');
const mongoose = require('mongoose');

const getDashboardStats = async (req, res) => {
  try {
    const totalHospitals = await User.countDocuments({ role: 'hospital', isVerified: true });
    const totalBloodBanks = await User.countDocuments({ role: 'bloodbank', isVerified: true });
    const activeRequests = await BloodRequest.countDocuments({ status: { $ne: 'delivered' } });

    res.json({ totalHospitals, totalBloodBanks, activeRequests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const getAllHospitals = async (req, res) => {
  try {
    const hospitals = await User.find({
      role: 'hospital'
    }).select('-password');

    res.json(hospitals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllBloodBanks = async (req, res) => {
  try {
    const bloodBanks = await User.find({ role: 'bloodbank' }).select('-password');
    res.json(bloodBanks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllRequests = async (req, res) => {
  try {
    const requests = await BloodRequest.find()
      .populate('hospital', 'name email location')
      .populate('acceptedBy', 'name email location')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const getPendingUsers = async (req, res) => {
  try {
    const users = await User.find({ isVerified: false, role: { $ne: 'admin' } }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const rejectUser = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User rejected and removed' });
  } catch (error) {
    console.error("reject user ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};



const approveUser = async (req, res) => {
  try {
    console.log("APPROVE REQUEST ID:", req.params.id); // 🔥 debug
    console.log("👉 REQ USER:", req.user);


    // ✅ FIX 1: ID validation
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await User.findById(req.params.id);

    console.log("USER FOUND:", user); // 🔥 debug

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isVerified = true;

    await user.save();

    res.json({ message: 'User verified successfully', user });


  } catch (error) {
    console.error("verification ERROR:", error); // 🔥 MOST IMPORTANT
    res.status(500).json({ message: error.message });
  }
};


const getLocationRequests = async (req, res) => {
  try {
    const requests = await LocationChangeRequest.find({ status: 'pending' }).populate('user', 'name role email');
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const resolveLocationRequest = async (req, res) => {
  const { status } = req.body;
  try {
    const locationRequest = await LocationChangeRequest.findById(req.params.id);
    if (!locationRequest) return res.status(404).json({ message: 'Request not found' });

    locationRequest.status = status.toLowerCase(); // ✅ FIX;
    await locationRequest.save();

    if (status.toLowerCase() === 'approved') {
      const user = await User.findById(locationRequest.user);
      if (user) {
        user.location = locationRequest.newLocation;
        await user.save();
      }
    }

    res.json({ message: `Location request ${status}`, request: locationRequest });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createAdmin = async (req, res) => {
  if (!req.user.isSuperAdmin) return res.status(403).json({ message: 'Only Super Admins can create new admins' });
  const { name, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({
      role: 'admin',
      name,
      email,
      password,
      isVerified: true,
      location: { type: 'Point', coordinates: [0, 0] } // Admins don't strictly need a location but schema requires it
    });

    res.status(201).json({ message: 'New admin created successfully', user: { name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const toggleAccess = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });
    if (targetUser.role === 'admin') return res.status(403).json({ message: 'Cannot modify another admin access here' });

    targetUser.isActive = targetUser.isActive === false ? true : false;
    await targetUser.save();

    res.json({ 
      message: `Access ${targetUser.isActive ? 'Enabled' : 'Stopped'} for ${targetUser.name}`, 
      isActive: targetUser.isActive 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const removeAdmin = async (req, res) => {
  if (!req.user.isSuperAdmin) return res.status(403).json({ message: 'Only Super Admins can remove admins' });
  try {
    const adminToRemove = await User.findById(req.params.id);
    if (!adminToRemove || adminToRemove.role !== 'admin') return res.status(404).json({ message: 'Admin not found' });
    if (adminToRemove.isSuperAdmin) return res.status(403).json({ message: 'Cannot remove a Super Admin' });
    
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Admin removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllAdmins = async (req, res) => {
  if (!req.user.isSuperAdmin) return res.status(403).json({ message: 'Not authorized' });
  try {
    const admins = await User.find({ role: 'admin' }).select('-password');
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
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
};
