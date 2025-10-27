import mongoose from 'mongoose';

const statisticsSchema = new mongoose.Schema({
  partnerId: {
    type: String,
    required: true,
    index: true
  },
  companyName: {
    type: String,
    required: true
  },
  period: {
    type: String,
    required: true,
    index: true
  }, // Formatas: "2024-01", "2024-02"
  totalOffers: {
    type: Number,
    default: 0
  },
  totalViews: {
    type: Number,
    default: 0
  },
  totalClicks: {
    type: Number,
    default: 0
  },
  clickThroughRate: {
    type: Number,
    default: 0
  }, // (clicks/views)*100
  offers: [{
    offerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Offer'
    },
    offerTitle: String,
    tripType: String,
    destination: String,
    views: {
      type: Number,
      default: 0
    },
    clicks: {
      type: Number,
      default: 0
    },
    clickThroughRate: {
      type: Number,
      default: 0
    }
  }],
  // Papildomi rodikliai
  activeOffers: {
    type: Number,
    default: 0
  },
  expiredOffers: {
    type: Number,
    default: 0
  },
  averagePrice: {
    type: Number,
    default: 0
  },
  mostPopularDestination: String,
  bestPerformingOffer: {
    offerId: mongoose.Schema.Types.ObjectId,
    title: String,
    clicks: Number
  },
  // Datos
  periodStart: Date,
  periodEnd: Date,
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Sudėtinis indeksas greitesnėms užklausoms
statisticsSchema.index({ partnerId: 1, period: 1 });
statisticsSchema.index({ period: 1, totalClicks: -1 });

// Virtualus laukas periodui formatuoti
statisticsSchema.virtual('periodFormatted').get(function() {
  const [year, month] = this.period.split('-');
  const monthNames = [
    'Sausis', 'Vasaris', 'Kovas', 'Balandis', 'Gegužė', 'Birželis',
    'Liepa', 'Rugpjūtis', 'Rugsėjis', 'Spalis', 'Lapkritis', 'Gruodis'
  ];
  return `${monthNames[parseInt(month) - 1]} ${year}`;
});

// Metodas statistikos atnaujinimui
statisticsSchema.methods.updateStatistics = async function(offers) {
  this.totalOffers = offers.length;
  this.totalViews = offers.reduce((sum, offer) => sum + (offer.viewCount || 0), 0);
  this.totalClicks = offers.reduce((sum, offer) => sum + (offer.clickCount || 0), 0);
  this.clickThroughRate = this.totalViews > 0 ? 
    Number(((this.totalClicks / this.totalViews) * 100).toFixed(2)) : 0;
  
  this.activeOffers = offers.filter(offer => offer.status === 'active').length;
  this.expiredOffers = offers.filter(offer => offer.status === 'expired').length;
  
  // Apskaičiuoti vidutinę kainą
  const activeOffersWithPrice = offers.filter(offer => offer.status === 'active' && offer.price);
  this.averagePrice = activeOffersWithPrice.length > 0 ? 
    Number((activeOffersWithPrice.reduce((sum, offer) => sum + offer.price, 0) / activeOffersWithPrice.length).toFixed(2)) : 0;
  
  // Rasti populiariausią destinaciją
  const destinationCounts = {};
  offers.forEach(offer => {
    if (offer.destination) {
      destinationCounts[offer.destination] = (destinationCounts[offer.destination] || 0) + (offer.viewCount || 0);
    }
  });
  
  this.mostPopularDestination = Object.keys(destinationCounts).reduce((a, b) => 
    destinationCounts[a] > destinationCounts[b] ? a : b, 'Nėra duomenų'
  );
  
  // Rasti geriausiai sekantisį pasiūlymą
  const bestOffer = offers.reduce((best, current) => {
    return (!best || (current.clickCount || 0) > (best.clickCount || 0)) ? current : best;
  }, null);
  
  if (bestOffer) {
    this.bestPerformingOffer = {
      offerId: bestOffer._id,
      title: bestOffer.tripType,
      clicks: bestOffer.clickCount || 0
    };
  }
  
  // Atnaujinti pasiūlymų sąrašą
  this.offers = offers.map(offer => ({
    offerId: offer._id,
    offerTitle: offer.tripType,
    tripType: offer.tripType,
    destination: offer.destination,
    views: offer.viewCount || 0,
    clicks: offer.clickCount || 0,
    clickThroughRate: offer.viewCount > 0 ? 
      Number(((offer.clickCount / offer.viewCount) * 100).toFixed(2)) : 0
  }));
  
  this.lastUpdated = new Date();
  await this.save();
};

// Statinis metodas mėnesio statistikos gavimui arba sukūrimui
statisticsSchema.statics.getOrCreateMonthlyStats = async function(partnerId, companyName, year, month) {
  const period = `${year}-${month.toString().padStart(2, '0')}`;
  
  // Apskaičiuoti periodo pradžią ir pabaigą
  const periodStart = new Date(year, month - 1, 1);
  const periodEnd = new Date(year, month, 0, 23, 59, 59);
  
  let stats = await this.findOne({ partnerId, period });
  
  if (!stats) {
    stats = new this({
      partnerId,
      companyName,
      period,
      periodStart,
      periodEnd
    });
  }
  
  return stats;
};

// Statinis metodas visų partnerių statistikos gavimui pagal periodą
statisticsSchema.statics.getPeriodStats = async function(period) {
  return await this.find({ period })
    .sort({ totalClicks: -1, totalViews: -1 })
    .exec();
};

// Statinis metodas partnerio visų periodų statistikai
statisticsSchema.statics.getPartnerHistory = async function(partnerId, limit = 12) {
  return await this.find({ partnerId })
    .sort({ period: -1 })
    .limit(limit)
    .exec();
};

export default mongoose.model('Statistics', statisticsSchema);
