const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const BloodRequest = require('./models/BloodRequest');

dotenv.config();

const checkDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bloodlink');
    
    const users = await User.find({});
    console.log('Total Users:', users.length);
    users.forEach(u => console.log(`- ${u.name} (${u.role}), Verified: ${u.isVerified}, Email: ${u.email}`));
    
    const pending = await User.find({ isVerified: false, role: { $ne: 'Admin' } });
    console.log('Pending Users:', pending.length);

    const requests = await BloodRequest.find({});
    console.log('Total Blood Requests:', requests.length);

    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

checkDB();
