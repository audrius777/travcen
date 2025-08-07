import mongoose from 'mongoose';

const partnerSchema = new mongoose.Schema({
  company: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true // Pridėtas trim
  },
  slug: { 
    type: String, 
    required: true, 
    unique: true 
  },
  website: { // Pakeista iš 'url' į 'website' pagal formą
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
  description: { // Pridėtas naujas laukas pagal formą
    type: String,
    required: true,
    trim: true
  },
  apiKey: { 
    type: String, 
    select: false 
  },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'pending'], // Pridėtas 'pending' statusas
    default: 'pending' // Pakeistas į 'pending'
  },
  lastSync: Date,
  ipAddress: { // Pridėtas IP adreso laukas
    type: String,
    required: true
  },
  attempts: { // Pridėtas bandymų skaičius
    type: Number,
    default: 1
  }
}, { timestamps: true });

// Automatinis slug generavimas (liko nepakeista)
partnerSchema.pre('save', function(next) {
  if (!this.slug) {
    this.slug = this.company
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
