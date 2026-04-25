const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bloodlink');
    
    const adminExists = await User.findOne({ email: 'admin@bloodlink.com' });
    if (adminExists) {
      console.log('Admin already exists');
      process.exit();
    }

    await User.create({
      role: 'admin',
      name: 'System Admin',
      email: 'admin@bloodlink.com',
      password: 'admin123', // Will be hashed by pre-save hook
      isVerified: true,
      location: { type: 'Point', coordinates: [0, 0] }
    });

    console.log('Admin user created successfully');
    process.exit();
  } catch (error) {
    console.error('Error seeding admin:', error.message);
    process.exit(1);
  }
};

seedAdmin();
