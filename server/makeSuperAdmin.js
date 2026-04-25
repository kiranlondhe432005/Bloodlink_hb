const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const makeSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bloodlink');
    
    const admin = await User.findOne({ email: 'admin@bloodlink.com' });
    if (admin) {
      admin.isSuperAdmin = true;
      await admin.save();
      console.log('admin@bloodlink.com is now a Super Admin!');
    } else {
      console.log('Admin not found');
    }
    
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

makeSuperAdmin();
