const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedMockData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bloodlink');
    
    // Clear existing non-admin users if necessary, or just add new ones. 
    // We will just add them if they don't exist by email to avoid duplicate key errors.

    const mockUsers = [
      {
        role: 'hospital',
        name: 'City Central Hospital',
        email: 'hospital1@bloodlink.com',
        password: 'password123',
        isVerified: true,
        location: { type: 'Point', coordinates: [73.8567, 18.5204] }, // Pune
      },
      {
        role: 'hospital',
        name: 'Sunrise Medical Center',
        email: 'hospital2@bloodlink.com',
        password: 'password123',
        isVerified: true,
        location: { type: 'Point', coordinates: [72.8777, 19.0760] }, // Mumbai
      },
      {
        role: 'bloodbank',
        name: 'Red Cross Blood Bank',
        email: 'bloodbank1@bloodlink.com',
        password: 'password123',
        isVerified: true,
        location: { type: 'Point', coordinates: [73.8550, 18.5200] }, // Pune nearby
      },
      {
        role: 'bloodbank',
        name: 'LifeLine Blood Center',
        email: 'bloodbank2@bloodlink.com',
        password: 'password123',
        isVerified: true,
        location: { type: 'Point', coordinates: [72.8800, 19.0800] }, // Mumbai nearby
      },
      {
         role: 'admin',
         name: 'Secondary Admin',
         email: 'admin2@bloodlink.com',
         password: 'admin123',
         isVerified: true,
         location: { type: 'Point', coordinates: [0, 0] }
      }
    ];

    for (const data of mockUsers) {
      const exists = await User.findOne({ email: data.email });
      if (!exists) {
        await User.create(data);
        console.log(`Created ${data.role}: ${data.name}`);
      } else {
        console.log(`User already exists: ${data.name}`);
      }
    }

    console.log('Mock users seeded successfully');
    process.exit();
  } catch (error) {
    console.error('Error seeding mock data:', error.message);
    process.exit(1);
  }
};

seedMockData();
