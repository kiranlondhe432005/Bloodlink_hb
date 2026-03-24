const mongoose = require('mongoose');

const bloodRequestSchema = new mongoose.Schema({
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bloodGroup: { type: String, required: true },
  units: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'on_the_way', 'delivered'],
    default: 'pending'
  },
  responses: [{
    bloodBank: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    distance: Number,
    status: { type: String, enum: ['available'], default: 'available' },
    respondedAt: { type: Date, default: Date.now }
  }],
  acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // The blood bank

  // Timestamps for history tracking
  acceptedAt: { type: Date },
  onTheWayAt: { type: Date },
  deliveredAt: { type: Date }
}, { timestamps: true });

// ✅ PERFORMANCE INDEXES
bloodRequestSchema.index({ hospital: 1 });
bloodRequestSchema.index({ status: 1 });
bloodRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('BloodRequest', bloodRequestSchema);
