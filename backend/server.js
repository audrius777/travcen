require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const csrf = require('csurf');
const crypto = require('crypto');
const cors = require('cors');
const MongoStore = require('connect-mongo');
const { validationResult } = require('express-validator');

// 1. Duomenų bazės konfigūracija
async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority',
      maxPoolSize: 10, // Maksimalus ryšių skaičius
      minPoolSize: 2   // Minimalus ryšių skaičius
    });
    console.log('Prisijungta prie MongoDB Atlas');
    
    mongoose.connection.on('connected', () => {
      console.log('Mongoose ryšys su DB aktyvus');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('Mongoose ryšio klaida:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('Mongoose atsijungė nuo DB');
    });
    
  } catch (err) {
    console.error('Kritinė duomenų bazės klaida:', err);
    process.exit(1);
  }
}

// 2. Express aplikacijos konfigūracija
const app = express();
const PORT = process.env.PORT || 10000;

// CORS konfigūracija
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'https://travcen.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['X-CSRF-Token'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Saugumo middleware'iai
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://apis.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https://*.googleusercontent.com"],
      connectSrc: ["'self'", process.env.MONGODB_URI, process.env.FRONTEND_URL],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      frameSrc: ["'self'", "https://accounts.google.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  hsts: {
    maxAge: 63072000,
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  frameguard: { action: 'deny' }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Per daug užklausų iš šio IP, bandykite vėliau',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.ip === '::ffff:127.0.0.1' // Praleisti localhost
});

app.use(limiter);

// Kūno parseriai
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 3. Sesijos konfigūracija
const sessionConfig = {
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  name: 'travcen.sid',
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000,
    domain: process.env.COOKIE_DOMAIN,
    path: '/',
    signed: true
  },
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions',
    ttl: 24 * 60 * 60,
    autoRemove: 'native',
    crypto: {
      secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex')
    },
    touchAfter: 24 * 3600 // Atnaujinti tik kartą per dieną
  })
};

app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());

// 4. Mongoose modeliai
const userSchema = new mongoose.Schema({
  googleId: { type: String, unique: true, sparse: true },
  email: { 
    type: String, 
    unique: true, 
    required: true,
    validate: {
      validator: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      message: props => `${props.value} nėra tinkamas el. pašto adresas`
    }
  },
  name: { type: String, required: true, trim: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const partnerSchema = new mongoose.Schema({
  company: { type: String, required: true, trim: true },
  url: { 
    type: String, 
    required: true, 
    validate: {
      validator: (v) => /^(https?:\/\/)?([\da-z.-]+)\.([a-z]{2,6})([\/\w .-]*)*\/?$/.test(v),
      message: props => `${props.value} nėra tinkamas URL`
    }
  },
  email: { 
    type: String, 
    required: true, 
    validate: {
      validator: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      message: props => `${props.value} nėra tinkamas el. pašto adresas`
    }
  },
  description: { type: String, maxlength: 500, trim: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  expiresAt: { type: Date, index: { expires: 0 } },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Partner = mongoose.model('Partner', partnerSchema);

// 5. Passport konfigūracija
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-__v');
    done(null, user);
  } catch (err) {
    done(err);
  }
});

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.BASE_URL}/auth/google/callback`,
  passReqToCallback: true,
  proxy: true,
  state: true
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      return done(new Error('Google paskyboje nerastas el. paštas'));
    }

    let user = await User.findOne({ 
      $or: [
        { googleId: profile.id },
        { email }
      ]
    });
    
    if (!user) {
      user = await User.create({
        googleId: profile.id,
        email,
        name: profile.displayName,
        role: email === process.env.ADMIN_EMAIL ? 'admin' : 'user'
      });
    } else if (!user.googleId) {
      user.googleId = profile.id;
      await user.save();
    }
    
    done(null, user);
  } catch (err) {
    done(err);
  }
}));

// 6. CSRF apsauga
const csrfProtection = csrf({ 
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    signed: true,
    domain: process.env.COOKIE_DOMAIN,
    path: '/'
  }
});

// CSRF middleware
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || 
      req.path.startsWith('/auth') || 
      req.path === '/' || 
      req.path === '/favicon.ico' ||
      req.path.startsWith('/static')) {
    return next();
  }
  return csrfProtection(req, res, next);
});

// 7. Autentifikacijos maršrutai
app.get('/auth/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account',
    accessType: 'offline',
    session: true
  })
);

app.get('/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth_failed`,
    successRedirect: process.env.FRONTEND_URL || '/'
  })
);

// 8. API maršrutai
const router = express.Router();

// Sveikatos patikrinimas
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// CSRF token gavimas
router.get('/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Vartotojo duomenys
router.get('/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ 
      loggedIn: true,
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role
      }
    });
  } else {
    res.status(401).json({ loggedIn: false });
  }
});

// Atsijungimas
router.post('/logout', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Neprisijungęs vartotojas' });
  }

  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Atsijungimo klaida' });
    }
    req.session.destroy((err) => {
      if (err) {
        console.error('Sesijos sunaikinimo klaida:', err);
      }
      res.clearCookie('travcen.sid', {
        domain: process.env.COOKIE_DOMAIN,
        path: '/'
      });
      res.json({ success: true });
    });
  });
});

// Partnerių valdymas
router.get('/partners', async (req, res) => {
  try {
    const partners = await Partner.find({ 
      status: 'active',
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } }
      ]
    }).select('-__v').lean();
    res.json(partners);
  } catch (err) {
    console.error('Partnerių gavimo klaida:', err);
    res.status(500).json({ error: 'Nepavyko gauti partnerių sąrašo' });
  }
});

router.post('/partner', csrfProtection, async (req, res) => {
  if (!req.isAuthenticated() || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Nepakankamos teisės' });
  }

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const partnerData = {
      ...req.body,
      expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined
    };

    const partner = await Partner.create(partnerData);
    res.status(201).json(partner);
  } catch (err) {
    console.error('Partnerio sukūrimo klaida:', err);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Partneris su tokiu el. paštu jau egzistuoja' });
    }
    res.status(400).json({ error: err.message });
  }
});

app.use('/api', router);

// 9. Pagrindinis maršrutas
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Travcen Backend API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    documentation: 'https://github.com/your-repo/docs',
    availableEndpoints: {
      auth: {
        google: '/auth/google',
        callback: '/auth/google/callback'
      },
      api: {
        health: '/api/health',
        user: '/api/user',
        partners: '/api/partners',
        logout: '/api/logout'
      }
    },
    serverTime: new Date().toISOString()
  });
});

// 10. Klaidų apdorojimas
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err.name === 'MongoServerError') {
    return res.status(400).json({ 
      error: 'Duomenų bazės operacijos klaida',
      details: err.message 
    });
  }
  
  if (err.name === 'ValidationError') {
    const errors = {};
    Object.keys(err.errors).forEach(key => {
      errors[key] = err.errors[key].message;
    });
    return res.status(400).json({ 
      error: 'Validacijos klaida',
      details: errors 
    });
  }
  
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ 
      error: 'Negaliojanti CSRF sesija',
      solution: 'Prašome atnaujinti puslapį ir bandyti dar kartą'
    });
  }
  
  res.status(err.status || 500).json({ 
    error: err.message || 'Vidinė serverio klaida',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 11. Serverio paleidimas
async function startServer() {
  await connectToDatabase();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveris paleistas http://localhost:${PORT}`);
    console.log(`API pasiekiamas /api endpoint'uose`);
    console.log(`Google autentifikacija pasiekiama /auth/google`);
    console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer().catch(err => {
  console.error('Serverio paleidimo klaida:', err);
  process.exit(1);
});
