import mongoose from 'mongoose';

const PartnerSchema = new mongoose.Schema({
    companyName: { 
        type: String, 
        required: [true, 'Įmonės pavadinimas privalomas'], 
        trim: true,
        minlength: [2, 'Įmonės pavadinimas per trumpas'],
        maxlength: [100, 'Įmonės pavadinimas per ilgas']
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
        enum: ['active', 'inactive'], 
        default: 'active' 
    },
    ipAddress: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        unique: true,
        sparse: true,
        default: function() {
            const baseSlug = this.companyName
                .toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, '-');
            return `${baseSlug}-${Date.now()}`;
        }
    }
}, { 
    timestamps: true 
});

// Indexai optimizavimui
PartnerSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('Partner', PartnerSchema);
