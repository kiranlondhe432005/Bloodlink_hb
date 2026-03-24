const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  role: { type: String, enum: ['admin', 'hospital', 'bloodbank'], required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },

  licenseUrl: { type: String },
  licenseExpiry: { type: Date },

  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  isSuperAdmin: { type: Boolean, default: false },

  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true, default: [0, 0] }
  },

  bloodStock: {
    'A+': { type: Number, default: 10 },
    'A-': { type: Number, default: 5 },
    'B+': { type: Number, default: 8 },
    'B-': { type: Number, default: 3 },
    'O+': { type: Number, default: 12 },
    'O-': { type: Number, default: 4 },
    'AB+': { type: Number, default: 6 },
    'AB-': { type: Number, default: 2 }
  }
}, { timestamps: true });

// index
userSchema.index({ location: '2dsphere' });

// ✅ SINGLE CLEAN PRE-SAVE HOOK
userSchema.pre('save', async function () {
  // role normalize
  if (this.role) {
    this.role = this.role.toLowerCase();
  }

  // password hash only if changed
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// password compare
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);