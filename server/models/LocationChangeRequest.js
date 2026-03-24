const mongoose = require('mongoose');

const locationChangeRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  newLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, { timestamps: true });

locationChangeRequestSchema.index({ user: 1 });
locationChangeRequestSchema.index({ status: 1 });

module.exports = mongoose.model('LocationChangeRequest', locationChangeRequestSchema);
