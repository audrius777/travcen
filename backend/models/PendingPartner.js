import mongoose from 'mongoose';

const PendingPartnerSchema = new mongoose.Schema({
    companyName: { 
        type: String, 
        required: [true, 'Įmonės pavadinimas privalomas'], 
        trim: true,
        minlength: [2, 'Įmonės pavadinimas per trumpas'],
        maxlength: [100, 'Įmonės pavadinimas per ilgas'],
        index: true 
    },
    website: { 
        type: String, 
        required: [true, 'Svetainės adresas privalomas'], 
        unique: true,
        validate: {
            validator: function(v) {
                return /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/.test(v);
            },
            message: props => `${props.value} nėra tinkamas svetainės URL`
        },
        trim: true
    },
    email: { 
        type: String, 
        required: [true, 'El. paštas privalomas'], 
        unique: true,
        validate: {
            validator: function(v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: props => `${props.value} nėra tinkamas el. pašto adresas`
        },
        lowercase: true,
        trim: true
    },
    contactPerson: { 
        type: String, 
        required: [true, 'Kontaktinis asmuo privalomas'],
        minlength: [2, 'Kontaktinio asmens vardas per trumpas'],
        maxlength: [50, 'Kontaktinio asmens vardas per ilgas'],
        trim: true
    },
    description: {
        type: String,
        default: '',
        maxlength: [500, 'Aprašymas per ilgas (maks. 500 simbolių)'],
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
    adminNotes: {
        type: String,
        default: '',
        maxlength: [200, 'Admin pastabos per ilgos (maks. 200 simbolių)']
    }
}, { 
    timestamps: true 
});

// Dublikatų ir bandymų limito tikrinimas
PendingPartnerSchema.pre('save', async function(next) {
    // Tikriname ar neviršytas bandymų limitas per 24h
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const existing = await this.constructor.findOne({ 
        $or: [
            { email: this.email },
            { ipAddress: this.ipAddress },
            { website: this.website }
        ],
        requestDate: { $gte: twentyFourHoursAgo }
    });
    
    if (existing) {
        if (existing.attempts >= 3) {
            throw new Error('Viršytas bandymų limitas (3 kartus per 24h)');
        }
        
        // Atnaujiname bandymų skaičių
        existing.attempts += 1;
        await existing.save();
        throw new Error('Užklausa jau vykdoma. Bandykite vėliau.');
    }
    
    next();
});

// Virtualus laukas - dienų skaičius nuo užklausos
PendingPartnerSchema.virtual('daysSinceRequest').get(function() {
    const now = new Date();
    const diffTime = Math.abs(now - this.requestDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Statinis metodas - gauti visus laukiančius partnerius
PendingPartnerSchema.statics.getPendingPartners = function() {
    return this.find({ status: 'pending' })
        .sort({ requestDate: -1 });
};

// Statinis metodas - gauti partnerius pagal el. paštą
PendingPartnerSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase() });
};

// Metodas - patikrinti ar partneris gali siųsti naują užklausą
PendingPartnerSchema.methods.canSubmitNewRequest = function() {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.requestDate < twentyFourHoursAgo || this.attempts < 3;
};

// Indexai optimizavimui
PendingPartnerSchema.index({ status: 1, requestDate: -1 });
PendingPartnerSchema.index({ email: 1 }, { unique: true });
PendingPartnerSchema.index({ website: 1 }, { unique: true });
PendingPartnerSchema.index({ ipAddress: 1, requestDate: -1 });

export default mongoose.model('PendingPartner', PendingPartnerSchema);
