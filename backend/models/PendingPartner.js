import mongoose from 'mongoose';

const PendingPartnerSchema = new mongoose.Schema({
  company: { type: String, required: true, index: true },
  website: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  requestDate: { type: Date, default: Date.now },
  adminNotes: String
}, { timestamps: true });

export default mongoose.model('PendingPartner', PendingPartnerSchema);
