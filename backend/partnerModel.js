import mongoose from 'mongoose';

const partnerSchema = new mongoose.Schema({
    companyName: { 
        type: String, 
        required: [true, 'Įmonės pavadinimas privalomas'], 
        unique: true,
        trim: true,
        minlength: [2, 'Įmonės pavadinimas per trumpas'],
        maxlength: [100, 'Įmonės pavadinimas per ilgas'],
        index: true
    },
    slug: { 
        type: String, 
        required: true, 
        unique: true,
        lowercase: true,
        trim: true
    },
    website: { 
        type: String, 
        required: [true, 'Svetainės adresas privalomas'],
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
        default: 'Nenurodyta',
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
    apiKey: { 
        type: String, 
        select: false,
        default: function() {
            return require('crypto').randomBytes(32).toString('hex');
        }
    },
    status: { 
        type: String, 
        enum: ['active', 'inactive', 'pending'],
        default: 'pending'
    },
    lastSync: {
        type: Date,
        default: null
    },
    ipAddress: {
        type: String,
        required: true
    },
    syncStatus: {
        type: String,
        enum: ['success', 'failed', 'never'],
        default: 'never'
    },
    lastSyncError: {
        type: String,
        default: ''
    },
    offersCount: {
        type: Number,
        default: 0
    }
}, { 
    timestamps: true 
});

// Automatinis slug generavimas
partnerSchema.pre('save', function(next) {
    if (this.isModified('companyName') || !this.slug) {
        this.slug = this.companyName
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .substring(0, 50);
    }
    next();
});

// Automatinis contactPerson užpildymas jei tuščias
partnerSchema.pre('save', function(next) {
    if (!this.contactPerson || this.contactPerson.trim() === '') {
        this.contactPerson = 'Nenurodyta';
    }
    next();
});

// Dublikatų tikrinimas
partnerSchema.pre('save', async function(next) {
    if (this.isModified('email') || this.isModified('website')) {
        const existing = await this.constructor.findOne({ 
            $or: [
                { email: this.email },
                { website: this.website }
            ],
            _id: { $ne: this._id }
        });
        
        if (existing) {
            if (existing.email === this.email) {
                throw new Error('Partneris su tokiu el. paštu jau egzistuoja');
            }
            if (existing.website === this.website) {
                throw new Error('Partneris su tokia svetaine jau egzistuoja');
            }
        }
    }
    next();
});

// Virtualus laukas - ar reikia sinchronizuoti
partnerSchema.virtual('needsSync').get(function() {
    if (!this.lastSync) return true;
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.lastSync < twentyFourHoursAgo;
});

// Statinis metodas - gauti aktyvius partnerius
partnerSchema.statics.getActivePartners = function() {
    return this.find({ status: 'active' })
        .select('-apiKey')
        .sort({ companyName: 1 });
};

// Statinis metodas - gauti partnerius reikalaujančius sinchronizacijos
partnerSchema.statics.getPartnersNeedingSync = function() {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.find({ 
        status: 'active',
        $or: [
            { lastSync: { $lt: twentyFourHoursAgo } },
            { lastSync: null }
        ]
    });
};

// Metodas - atnaujinti sinchronizacijos statusą
partnerSchema.methods.updateSyncStatus = function(success, errorMessage = '', offersCount = 0) {
    this.lastSync = new Date();
    this.syncStatus = success ? 'success' : 'failed';
    this.lastSyncError = errorMessage;
    this.offersCount = offersCount;
    return this.save();
};

// Metodas - generuoti naują API raktą
partnerSchema.methods.generateNewApiKey = function() {
    this.apiKey = require('crypto').randomBytes(32).toString('hex');
    return this.save();
};

// Metodas - patikrinti API raktą
partnerSchema.statics.verifyApiKey = async function(apiKey) {
    const partner = await this.findOne({ apiKey }).select('+apiKey');
    return partner && partner.status === 'active' ? partner : null;
};

// Indexai optimizavimui
partnerSchema.index({ slug: 1 }, { unique: true });
partnerSchema.index({ status: 1, lastSync: 1 });
partnerSchema.index({ email: 1 }, { unique: true });
partnerSchema.index({ website: 1 });
partnerSchema.index({ 'syncStatus': 1 });

export const Partner = mongoose.model('Partner', partnerSchema);
