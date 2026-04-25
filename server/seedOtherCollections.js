const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const BloodRequest = require('./models/BloodRequest');
const LocationChangeRequest = require('./models/LocationChangeRequest');
const Notification = require('./models/Notification');

dotenv.config();

const seedOtherCollections = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bloodlink');
    
    // Find a hospital and blood bank
    const hospital = await User.findOne({ role: 'hospital' });
    const bloodBank = await User.findOne({ role: 'bloodbank' });
    const admin = await User.findOne({ role: 'admin' });

    if (!hospital || !bloodBank) {
      console.log('Ensure hospital and bloodbank exist before running this script.');
      process.exit(1);
    }

    // 1. Seed BloodRequest
    const existingReq = await BloodRequest.findOne({ hospital: hospital._id });
    let bloodReq;
    if (!existingReq) {
      bloodReq = await BloodRequest.create({
        hospital: hospital._id,
        bloodGroup: 'O+',
        units: 2,
        status: 'pending',
      });
      console.log('Created BloodRequest sample');
    } else {
      bloodReq = existingReq;
      console.log('BloodRequest already exists');
    }

    // 2. Seed LocationChangeRequest
    const existingLocReq = await LocationChangeRequest.findOne({ user: bloodBank._id });
    if (!existingLocReq) {
      await LocationChangeRequest.create({
        user: bloodBank._id,
        newLocation: {
          type: 'Point',
          coordinates: [73.8560, 18.5201]
        },
        status: 'pending'
      });
      console.log('Created LocationChangeRequest sample');
    } else {
      console.log('LocationChangeRequest already exists');
    }

    // 3. Seed Notification
    const existingNotif = await Notification.findOne({ user: admin._id });
    if (!existingNotif) {
      await Notification.create({
        user: admin._id,
        title: 'System Alert',
        message: 'A new hospital joined the network.',
        isRead: false
      });
      console.log('Created Notification sample');
    } else {
      console.log('Notification already exists');
    }

    console.log('Finished seeding other collections.');
    process.exit();
  } catch (error) {
    console.error('Error seeding other collections:', error);
    process.exit(1);
  }
};

seedOtherCollections();
