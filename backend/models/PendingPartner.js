import mongoose from 'mongoose';

const PendingPartnerSchema = new mongoose.Schema({
  company: { 
    type: String, 
    required: true, 
    trim: true,
    index: true 
  },
  website: { 
    type: String, 
    required: true, 
    unique: true,
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
    unique: true,
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
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  ipAddress: {
    type: String,
    required: true,
    index: true
  },
  attempts: {
    type: Number,
    default: 1
  },
  requestDate: { 
    type: Date, 
    default: Date.now 
  },
  adminNotes: String,
  captchaToken: {
    type: String,
    required: true,
    select: false
  }
}, { timestamps: true });

// Dublikatų ir bandymų limito tikrinimas
PendingPartnerSchema.pre('save', async function(next) {
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

export default mongoose.model('PendingPartner', PendingPartnerSchema);
