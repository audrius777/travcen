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

// 1. Duomenų bazės konfigūracija
async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
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

// CORS konfigūracija (pakeista)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://travcen.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Saugumo middleware'iai
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://apis.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://*.googleusercontent.com"],
      connectSrc: ["'self'", process.env.MONGODB_URI]
    }
  },
  hsts: {
    maxAge: 63072000,
    includeSubDomains: true,
    preload: true
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Per daug užklausų iš šio IP, bandykite vėliau',
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Kūno parseriai
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 3. Sesijos konfigūracija (pakeista)
const sessionConfig = {
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: true, // Visada secure, nes dirbame su HTTPS
    sameSite: 'none', // Pakeista į 'none'
    maxAge: 24 * 60 * 60 * 1000
  },
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions',
    ttl: 24 * 60 * 60,
    autoRemove: 'native'
  })
};

app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());

// 4. Mongoose modeliai
const userSchema = new mongoose.Schema({
  googleId: { type: String, unique: true },
  email: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now }
});

const partnerSchema = new mongoose.Schema({
  company: { type: String, required: true },
  url: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  description: String,
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  expiresAt: Date,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Partner = mongoose.model('Partner', partnerSchema);

// 5. Passport konfigūracija
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.BASE_URL}/auth/google/callback`,
  passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id });
    
    if (!user) {
      user = await User.create({
        googleId: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
        role: profile.emails[0].value === process.env.ADMIN_EMAIL ? 'admin' : 'user'
      });
    }
    
    done(null, user);
  } catch (err) {
    done(err);
  }
}));

// 6. CSRF apsauga (pakeista)
const csrfProtection = csrf({ 
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: 'none', // Pakeista į 'none'
    signed: true
  }
});

// CSRF middleware (pakeistas)
app.use((req, res, next) => {
  // Praleidžiame CSRF tikrinimą API ir autentifikacijos maršrutams
  if (req.path.startsWith('/api') || req.path.startsWith('/auth')) {
    return next();
  }
  return csrfProtection(req, res, next);
});

// 7. Autentifikacijos maršrutai
app.get('/auth/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })
);

app.get('/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login?error=auth_failed',
    successRedirect: process.env.FRONTEND_URL || '/'
  })
);

// 8. API maršrutai
const router = express.Router();

// Vartotojo duomenų endpoint'as
router.get('/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ 
      loggedIn: true,
      user: {
        email: req.user.email,
        name: req.user.name,
        role: req.user.role
      },
      csrfToken: req.csrfToken()
    });
  } else {
    res.json({ loggedIn: false });
  }
});

// Atsijungimo endpoint'as
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Atsijungimo klaida' });
    }
    req.session.destroy();
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

// Partnerių endpoint'ai
router.get('/partners', async (req, res) => {
  try {
    const partners = await Partner.find({ status: 'active' });
    res.json(partners);
  } catch (err) {
    res.status(500).json({ error: 'Nepavyko gauti partnerių sąrašo' });
  }
});

router.post('/partner', async (req, res) => {
  if (!req.isAuthenticated() || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Nepakankamos teisės' });
  }

  try {
    const partner = await Partner.create(req.body);
    res.status(201).json(partner);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Partneris su tokiu el. paštu jau egzistuoja' });
    }
    res.status(400).json({ error: err.message });
  }
});

app.use('/api', router);

// 9. Klaidų apdorojimas (pakeistas)
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err.name === 'MongoServerError') {
    return res.status(400).json({ 
      error: 'Duomenų bazės operacijos klaida',
      details: err.message 
    });
  }
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      error: 'Validacijos klaida',
      details: err.errors 
    });
  }
  
  if (err.code === 'EBADCSRFTOKEN') {
    console.log('CSRF klaida. Tikrinami slapukai:');
    console.log('CSRF Cookie:', req.cookies._csrf);
    console.log('Session ID:', req.cookies['connect.sid']);
    return res.status(403).json({ 
      error: 'Negaliojanti CSRF sesija',
      solution: 'Prašome atnaujinti puslapį ir bandyti dar kartą'
    });
  }
  
  res.status(500).json({ error: 'Vidinė serverio klaida' });
});

// 10. Serverio paleidimas
async function startServer() {
  await connectToDatabase();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveris paleistas http://localhost:${PORT}`);
    console.log(`API pasiekiamas /api endpoint'uose`);
    console.log(`Google autentifikacija pasiekiama /auth/google`);
  });
}

startServer().catch(err => {
  console.error('Serverio paleidimo klaida:', err);
  process.exit(1);
});
