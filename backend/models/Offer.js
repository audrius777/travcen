import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema({
  partnerId: {
    type: String,
    required: true
  },
  companyName: {
    type: String,
    required: true
  },
  offerUrl: {
    type: String,
    required: true
  },
  departureLocation: {
    type: String,
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  tripType: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    enum: ['USD', 'EUR', 'GBP'],
    default: 'USD'
  },
  hotelRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  tripDate: {
    type: Date,
    required: true
  },
  validUntil: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexai optimizavimui
offerSchema.index({ partnerId: 1 });
offerSchema.index({ status: 1 });
offerSchema.index({ validUntil: 1 });
offerSchema.index({ tripType: 1 });
offerSchema.index({ destination: 1 });

export default mongoose.model('Offer', offerSchema);
