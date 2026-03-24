const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // recipient
  title: { type: String, required: true },
  message: { type: String, required: true },
  bloodRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'BloodRequest' },
  isRead: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'handled', 'expired'], default: 'active' },
  distance: { type: Number, default: 0 } // Distance in KM
}, { timestamps: true });

notificationSchema.index({ user: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 }); // 24-hours TTL

module.exports = mongoose.model('Notification', notificationSchema);
