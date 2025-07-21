import mongoose from 'mongoose';

const partnerSchema = new mongoose.Schema({
  company: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  url: { type: String, required: true },
  email: { type: String, required: true },
  apiKey: { type: String, select: false },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  lastSync: Date
}, { timestamps: true });

// Automatinis slug generavimas
partnerSchema.pre('save', function(next) {
  if (!this.slug) {
    this.slug = this.company
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

export const Partner = mongoose.model('Partner', partnerSchema);