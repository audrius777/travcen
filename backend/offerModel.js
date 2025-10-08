import mongoose from 'mongoose';
import validator from 'validator';
import { currencyConverter } from '../config/currencyConverter.js';

const offerSchema = new mongoose.Schema({
  // Būtini laukai
  offerId: { 
    type: String, 
    required: true, 
    index: true,
    validate: {
      validator: v => validator.isAlphanumeric(v),
      message: 'Netinkamas pasiūlymo ID'
    }
  },
  partner: { 
    type: String, 
    required: true,
    trim: true
  },
  title: { 
    type: String, 
    required: true,
    minlength: 3, // SUMAŽINTA: iš 10 į 3
    maxlength: 100,
    trim: true
  },
  price: { 
    type: Number, 
    required: true,
    min: 0,
    max: 10000
  },
  currency: { 
    type: String, 
    default: 'EUR',
    enum: ['EUR', 'USD', 'GBP'],
    uppercase: true,
    trim: true
  },
  destination: { 
    type: String, 
    required: false, // PAKEISTA: iš required true į false
    minlength: 3,
    maxlength: 50,
    trim: true
  },
  departure: { 
    type: String, 
    required: false, // PAKEISTA: iš required true į false
    minlength: 3,
    maxlength: 50,
    trim: true
  },
  type: { 
    type: String, 
    enum: ['leisure', 'adventure', 'cultural', 'beach', 'city', 'cruise', 'ski'],
    required: false, // PAKEISTA: iš required true į false
    lowercase: true,
    trim: true
  },

  // Pasirinktiniai laukai
  imageUrl: {
    type: String,
    validate: {
      validator: v => validator.isURL(v, { protocols: ['http','https'], require_protocol: true }),
      message: 'Netinkamas nuotraukos URL'
    },
    trim: true
  },
  url: {
    type: String,
    required: true,
    validate: {
      validator: v => validator.isURL(v, { protocols: ['http','https'], require_protocol: true }),
      message: 'Netinkamas pasiūlymo URL'
    },
    trim: true
  },
  validUntil: {
    type: Date,
    validate: {
      validator: v => v > Date.now(),
      message: 'Galiojimo data turi būti ateityje'
    }
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  isTest: {
    type: Boolean,
    default: false,
    select: false
  },
  source: { 
    type: String, 
    enum: ['manual', 'partner_api'], 
    default: 'partner_api' 
  },

  // Automatiniai laukai
  priceEUR: {
    type: Number,
    required: true,
    set: function(v) {
      return parseFloat(v.toFixed(2));
    }
  },
  originalPrice: Number,
  originalCurrency: String,
  conversionRate: Number,
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Automatinis kainos konvertavimas į EUR prieš išsaugojimą
offerSchema.pre('save', async function(next) {
  if (this.isModified('price') || this.isModified('currency')) {
    try {
      const conversion = await currencyConverter.convertToEur(this.price, this.currency);
      this.priceEUR = conversion.value;
      this.originalPrice = this.price;
      this.originalCurrency = this.currency;
      this.conversionRate = conversion.rate;
    } catch (err) {
      // Jei konvertavimas nepavyksta, naudojame originalią kainą
      this.priceEUR = this.currency === 'EUR' ? this.price : 0;
      this.conversionRate = 0;
    }
  }
  next();
});

// Virtualus laukas su konvertavimo informacija
offerSchema.virtual('priceInfo').get(function() {
  if (this.currency === 'EUR') {
    return { price: this.price, currency: 'EUR' };
  }
  return {
    originalPrice: this.originalPrice,
    originalCurrency: this.originalCurrency,
    convertedPrice: this.priceEUR,
    conversionRate: this.conversionRate,
    lastUpdated: this.lastUpdated
  };
});

// Statiniai metodai
offerSchema.statics.validateOffer = function(offer) {
  const requiredFields = ['offerId', 'title', 'price', 'url']; // SUMAŽINTI PRIVALOMI LAUKAI
  const missingFields = requiredFields.filter(field => !offer[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Trūksta privalomų laukų: ${missingFields.join(', ')}`);
  }

  return offer;
};

// Užklausų optimizavimas
offerSchema.index({ partner: 1, type: 1 });
offerSchema.index({ destination: 1, priceEUR: 1 });
offerSchema.index({ validUntil: 1 }, { expireAfterSeconds: 0 });

export const PartnerOffer = mongoose.model('PartnerOffer', offerSchema);
