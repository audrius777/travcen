require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const csrf = require('csurf');
const crypto = require('crypto');
const cors = require('cors');
const MongoStore = require('connect-mongo');
const { validationResult } = require('express-validator');
const authRoutes = require('./routes/auth');
const offerRoutes = require('./routes/offers');

// 1. Duomenų bazės konfigūracija
async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority',
      maxPoolSize: 10,
      minPoolSize: 2,
      connectTimeoutMS: 30000
    });
    console.log('Prisijungta prie MongoDB Atlas');
    
    mongoose.connection.on('connected', () => {
      console.log('Mongoose ryšys aktyvus');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('Mongoose ryšio klaida:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('Mongoose atsijungė');
    });
    
  } catch (err) {
    console.error('Kritinė duomenų bazės klaida:', err);
    process.exit(1);
  }
}

// 2. Express aplikacijos konfigūracija
const app = express();
const PORT = process.env.PORT || 10000;

// Patobulinta CORS konfigūracija
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://travcen.com',
  'https://www.travcen.com',
  'https://travcen.vercel.app',
  'http://localhost:3000'
].filter(Boolean);

const corsOptions = {
  origin: function(origin, callback) {
    // Leidžiame užklausas be origin (mobilioms programoms, POSTMAN)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.some(allowed => 
      origin === allowed || origin.startsWith(allowed))
    ) {
      return callback(null, true);
    }
    
    const error = 'CORS politika neleidžia pasiekti šio resurso iš nurodyto šaltinio';
    return callback(new Error(error), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With'],
  exposedHeaders: ['X-CSRF-Token', 'X-Request-ID'],
  optionsSuccessStatus: 200,
  maxAge: 86400,
  preflightContinue: false
};

app.use(cors(corsOptions));

// Saugumo priemonės
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://apis.google.com", "https://www.googletagmanager.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https://*.googleusercontent.com", "https://*.facebook.com"],
      connectSrc: ["'self'", process.env.MONGODB_URI, ...allowedOrigins],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      frameSrc: ["'self'", "https://accounts.google.com", "https://www.facebook.com"],
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
  frameguard: { action: 'deny' },
  xssFilter: true,
  noSniff: true,
  hidePoweredBy: true
}));

// Užklausų limitavimas
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minučių
  max: 200,
  message: 'Per daug užklausų iš šio IP, bandykite vėliau',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.ip === '::ffff:127.0.0.1' || req.path === '/health'
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 valanda
  max: 50,
  message: 'Per daug autentifikacijos bandymų, bandykite vėliau',
  standardHeaders: true
});

app.use('/api', apiLimiter);
app.use('/auth', authLimiter);

// Įvesties duomenų apdorojimas
app.use(express.json({
  limit: '10kb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));
app.use(express.urlencoded({
  extended: true,
  limit: '10kb',
  parameterLimit: 10
}));

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
    maxAge: 24 * 60 * 60 * 1000, // 24 valandos
    domain: process.env.COOKIE_DOMAIN || '.travcen-backendas.onrender.com',
    path: '/',
    signed: true
  },
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions',
    ttl: 24 * 60 * 60, // 24 valandos
    autoRemove: 'native',
    crypto: {
      secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex')
    },
    touchAfter: 12 * 3600 // 12 valandų
  }),
  rolling: true
};

app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());

// 4. Mongoose modeliai
const userSchema = new mongoose.Schema({
  googleId: { type: String, unique: true, sparse: true },
  facebookId: { type: String, unique: true, sparse: true },
  email: { 
    type: String, 
    unique: true, 
    required: true,
    validate: {
      validator: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      message: props => `${props.value} nėra tinkamas el. pašto adresas`
    }
  },
  name: { type: String, required: true, trim: true, minlength: 2 },
  avatar: { type: String },
  role: { type: String, enum: ['user', 'admin', 'partner'], default: 'user' },
  lastLogin: { type: Date },
  loginCount: { type: Number, default: 0 }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const partnerSchema = new mongoose.Schema({
  company: { type: String, required: true, trim: true, minlength: 2 },
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
  status: { type: String, enum: ['active', 'inactive', 'pending'], default: 'pending' },
  expiresAt: { type: Date, index: { expires: 0 } },
  apiKey: { type: String, unique: true, sparse: true },
  contactPerson: { type: String }
}, { 
  timestamps: true,
  toJSON: { virtuals: true }
});

const User = mongoose.model('User', userSchema);
const Partner = mongoose.model('Partner', partnerSchema);

// 5. Passport konfigūracija
passport.serializeUser((user, done) => {
  done(null, {
    id: user.id,
    role: user.role,
    lastLogin: user.lastLogin
  });
});

passport.deserializeUser(async (serializedUser, done) => {
  try {
    const user = await User.findById(serializedUser.id)
      .select('-__v -loginCount')
      .lean();
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Google autentifikacija
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || "https://travcen-backendas.onrender.com/auth/google/callback",
  passReqToCallback: true,
  proxy: true,
  state: true,
  scope: ['profile', 'email'],
  prompt: 'select_account',
  accessType: 'offline',
  userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value?.toLowerCase();
    if (!email) throw new Error('Google profilyje nerastas el. paštas');

    let user = await User.findOne({ 
      $or: [
        { googleId: profile.id },
        { email: email }
      ]
    });
    
    if (!user) {
      user = await User.create({
        googleId: profile.id,
        email,
        name: profile.displayName,
        avatar: profile.photos?.[0]?.value,
        role: email === process.env.ADMIN_EMAIL ? 'admin' : 'user',
        lastLogin: new Date()
      });
    } else {
      if (!user.googleId) user.googleId = profile.id;
      if (!user.avatar) user.avatar = profile.photos?.[0]?.value;
      user.lastLogin = new Date();
      user.loginCount = (user.loginCount || 0) + 1;
      await user.save();
    }
    
    done(null, user);
  } catch (err) {
    console.error('Google autentifikacijos klaida:', err);
    done(err, null, {
      message: 'Autentifikacija nepavyko',
      provider: 'google',
      error: err.message
    });
  }
}));

// Facebook autentifikacija
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: process.env.FACEBOOK_CALLBACK_URL || "https://travcen-backendas.onrender.com/auth/facebook/callback",
  profileFields: ['id', 'emails', 'name', 'displayName', 'photos'],
  enableProof: true,
  passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value?.toLowerCase();
    if (!email) throw new Error('Facebook profilyje nerastas el. paštas');

    let user = await User.findOne({ 
      $or: [
        { facebookId: profile.id },
        { email: email }
      ]
    });
    
    if (!user) {
      user = await User.create({
        facebookId: profile.id,
        email,
        name: profile.displayName || `${profile.name?.givenName} ${profile.name?.familyName}`,
        avatar: profile.photos?.[0]?.value,
        role: 'user',
        lastLogin: new Date()
      });
    } else {
      if (!user.facebookId) user.facebookId = profile.id;
      if (!user.avatar) user.avatar = profile.photos?.[0]?.value;
      user.lastLogin = new Date();
      user.loginCount = (user.loginCount || 0) + 1;
      await user.save();
    }
    
    done(null, user);
  } catch (err) {
    console.error('Facebook autentifikacijos klaida:', err);
    done(err, null, {
      message: 'Autentifikacija nepavyko',
      provider: 'facebook',
      error: err.message
    });
  }
}));

// 6. CSRF apsauga
const csrfProtection = csrf({ 
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    signed: true,
    domain: process.env.COOKIE_DOMAIN || '.travcen-backendas.onrender.com',
    path: '/'
  },
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
  value: (req) => {
    return req.headers['x-csrf-token'] || req.body._csrf;
  }
});

app.use((req, res, next) => {
  const excludedPaths = [
    '/auth',
    '/api/health',
    '/api/auth/guest',
    '/favicon.ico'
  ];
  
  if (excludedPaths.some(path => req.path.startsWith(path))) {
    return next();
  }
  return csrfProtection(req, res, next);
});

// 7. Maršrutai
app.use('/auth', authRoutes);
app.use('/api/offers', offerRoutes);

// Sistemos būklės endpoint'as
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    duomenųBazė: mongoose.connection.readyState === 1 ? 'prisijungta' : 'atsijungusi',
    veikimoLaikas: process.uptime(),
    laikoŽymė: new Date().toISOString(),
    atmintiesNaudojimas: process.memoryUsage(),
    aplinka: process.env.NODE_ENV || 'development'
  });
});

// Pagrindinis API maršrutas
app.get('/api', (req, res) => {
  res.json({
    paslauga: 'Travcen Backend API',
    versija: '1.1.0',
    būsena: 'veikia',
    aplinka: process.env.NODE_ENV || 'development',
    galimiEndpoint'ai: {
      autentifikacija: {
        google: '/auth/google',
        facebook: '/auth/facebook',
        svečias: '/api/auth/guest'
      },
      api: {
        būsena: '/health',
        vartotojas: '/api/user',
        pasiūlymai: '/api/offers',
        partneriai: '/api/partners'
      }
    },
    dokumentacija: process.env.API_DOCS_URL || 'https://docs.travcen.com'
  });
});

// 8. Klaidų apdorojimas
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Klaida:`, {
    maršrutas: req.path,
    metodas: req.method,
    klaida: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  const klaidosResponse = {
    klaida: err.message || 'Vidinė serverio klaida',
    statusas: err.status || 500,
    laikoŽymė: new Date().toISOString()
  };

  if (err.name === 'ValidationError') {
    klaidosResponse.detalės = {};
    Object.keys(err.errors).forEach(key => {
      klaidosResponse.detalės[key] = err.errors[key].message;
    });
    return res.status(400).json(klaidosResponse);
  }

  if (err.name === 'MongoServerError') {
    klaidosResponse.tipas = 'duomenų_bazės_klaida';
    if (err.code === 11000) {
      klaidosResponse.detalės = 'Dublikatas';
    }
    return res.status(400).json(klaidosResponse);
  }

  if (err.code === 'EBADCSRFTOKEN') {
    klaidosResponse.sprendimas = 'Atnaujinkite puslapį ir bandykite dar kartą';
    return res.status(403).json(klaidosResponse);
  }

  res.status(klaidosResponse.statusas).json(klaidosResponse);
});

// 9. Serverio paleidimas
async function startServer() {
  try {
    await connectToDatabase();
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Serveris veikia portu ${PORT}`);
      console.log(`Aplinka: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Duomenų bazė: ${mongoose.connection.readyState === 1 ? 'Prisijungta' : 'Atsijungusi'}`);
    });

    // Gražus išjungimas
    process.on('SIGTERM', () => {
      console.log('Gautas SIGTERM. Išjungiama...');
      server.close(() => {
        mongoose.connection.close(false, () => {
          console.log('MongoDB ryšys uždarytas');
          process.exit(0);
        });
      });
    });

    process.on('SIGINT', () => {
      console.log('Gautas SIGINT. Išjungiama...');
      server.close(() => {
        mongoose.connection.close(false, () => {
          console.log('MongoDB ryšys uždarytas');
          process.exit(0);
        });
      });
    });

  } catch (err) {
    console.error('Serverio paleidimo klaida:', err);
    process.exit(1);
  }
}

startServer();
