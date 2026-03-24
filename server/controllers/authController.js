const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { role, name, email, password, licenseUrl, licenseExpiry, longitude, latitude } = req.body;

  if (!role || !name || !email || !password || longitude === undefined || latitude === undefined) {
    return res.status(400).json({ message: 'Please add all required fields including location' });
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Creating initial Admin bypasses verification
    const isAdmin = role === 'admin';
    // Let's assume the first admin needs to be created or admins create admins
    // For MVP registration we allow it or the UI hides admin reg from public

    const user = await User.create({
      role: role.toLowerCase(),
      name,
      email,
      password,
      licenseUrl,
      licenseExpiry,
      isVerified: false, // All users need verification, even if they claim to be Admin (which they shouldn't be able to do from here)
      location: {
        type: 'Point',
        coordinates: [longitude, latitude] // GeoJSON [lng, lat]
      }
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      // Logic: block if not verified
      if (!user.isVerified) {
        return res.status(401).json({ message: 'Account not verified by Admin yet.' });
      }

      // Logic: block if suspended
      if (user.isActive === false) {
        return res.status(403).json({ message: 'Account suspended by Admin' });
      }

      // Logic: block if license expired
      if (user.role !== 'admin' && user.licenseExpiry && new Date(user.licenseExpiry) < new Date()) {
        return res.status(401).json({ message: 'License expired. Please renew.' });
      }

      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile/check auth
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  res.status(200).json(req.user);
};

const renewLicense = async (req, res) => {
  const { email, password, licenseUrl, licenseExpiry } = req.body;
  
  if (!email || !password || !licenseUrl || !licenseExpiry) {
    return res.status(400).json({ message: 'All fields are required for renewal' });
  }

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      user.licenseUrl = licenseUrl;
      user.licenseExpiry = licenseExpiry;
      user.isVerified = false; // Push back to pending verifications for admin review
      await user.save();
      
      res.json({ message: 'License renewal submitted. Please wait for Admin approval.' });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  renewLicense
};
