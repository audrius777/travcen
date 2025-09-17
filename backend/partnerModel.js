import mongoose from 'mongoose';

const partnerSchema = new mongoose.Schema({
  companyName: { // Pakeista iš 'company'
    type: String, 
    required: true, 
    unique: true,
    trim: true
  },
  slug: { 
    type: String, 
    required: true, 
    unique: true 
  },
  website: { 
    type: String, 
    required: true,
    validate: {
      validator: function(v) {
        return /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/.test(v);
      },
      message: props => `${props.value} nėra tinkamas svetainės URL`
    }
  },
  email: { 
    type: String, 
    required: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: props => `${props.value} nėra tinkamas el. pašto adresas`
    }
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  contactPerson: { // Pridėtas naujas laukas
    type: String,
    required: true,
    trim: true
  },
  phone: { // Pridėtas naujas laukas
    type: String,
    required: true,
    trim: true
  },
  address: { // Pridėtas naujas laukas
    type: String,
    required: true,
    trim: true
  },
  city: { // Pridėtas naujas laukas
    type: String,
    required: true,
    trim: true
  },
  country: { // Pridėtas naujas laukas
    type: String,
    required: true,
    trim: true
  },
  services: [{ // Pridėtas naujas laukas
    type: String
  }],
  specialization: { // Pridėtas naujas laukas
    type: String,
    default: ''
  },
  targetAudience: [{ // Pridėtas naujas laukas
    type: String
  }],
  logo: { // Pridėtas naujas laukas
    type: String,
    default: ''
  },
  apiKey: { 
    type: String, 
    select: false 
  },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'pending'],
    default: 'pending'
  },
  lastSync: Date,
  ipAddress: {
    type: String,
    required: true
  },
  attempts: {
    type: Number,
    default: 1
  }
}, { timestamps: true });

// Automatinis slug generavimas
partnerSchema.pre('save', function(next) {
  if (!this.slug) {
    this.slug = this.companyName // Pakeista iš this.company
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

// Dublikatų ir bandymų limito tikrinimas
partnerSchema.pre('save', async function(next) {
  const existing = await this.constructor.findOne({ 
    $or: [
      { email: this.email },
      { ipAddress: this.ipAddress },
      { website: this.website }
    ] 
  });
  
  if (existing && existing.attempts >= 3) {
    throw new Error('Viršytas bandymų limitas (3 kartus per 24h)');
  }
  
  if (existing) {
    existing.attempts += 1;
    await existing.save();
    throw new Error('Užklausa jau vykdoma');
  }
  
  next();
});

export const Partner = mongoose.model('Partner', partnerSchema);
