import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema({
  offerId: { type: String, required: true, index: true },
  partner: { type: String, required: true },
  title: { type: String, required: true },
  price: { type: Number, required: true },
  currency: { type: String, default: 'EUR' },
  destination: { type: String, required: true },
  departure: { type: String, required: true },
  type: { type: String, enum: ['leisure', 'adventure', 'cultural'], required: true },
  imageUrl: String,
  url: { type: String, required: true },
  validUntil: Date,
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

export const PartnerOffer = mongoose.model('PartnerOffer', offerSchema);