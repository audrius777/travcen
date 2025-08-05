import mongoose from 'mongoose';

const PartnerSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  website: { type: String, required: true, unique: true },
  apiEndpoint: String,
  apiKey: { type: String, select: false }, // Jautri info - nesaugoma loguose
  status: { type: String, enum: ['active', 'inactive', 'pending'], default: 'pending' },
  lastSync: Date,
  offersCount: { type: Number, default: 0 }
}, { timestamps: true });

// Automatinis įrašų atnaujinimas
PartnerSchema.post('save', function(partner) {
  console.log(`Partneris ${partner.name} atnaujintas`);
});

export default mongoose.model('Partner', PartnerSchema);
