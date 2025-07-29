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

// 1. Database Configuration
async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority',
      maxPoolSize: 10,
      minPoolSize: 2
    });
    console.log('Connected to MongoDB Atlas');
    
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connection active');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('Mongoose connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('Mongoose disconnected');
    });
    
  } catch (err) {
    console.error('Critical database error:', err);
    process.exit(1);
  }
}

// 2. Express App Configuration
const app = express();
const PORT = process.env.PORT || 10000;

// CORS Configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'https://travcen.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['X-CSRF-Token'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Security Middleware
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

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.ip === '::ffff:127.0.0.1'
});

app.use(limiter);

// Body Parsers
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 3. Session Configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  name: 'travcen.sid',
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 24 * 60 * 60 * 1000,
    domain: process.env.COOKIE_DOMAIN || '.travcen-backendas.onrender.com',
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
    }
  })
};

// Initialize Session and Passport
app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());

// 4. Mongoose Models
const userSchema = new mongoose.Schema({
  googleId: { type: String, unique: true, sparse: true },
  email: { 
    type: String, 
    unique: true, 
    required: true,
    validate: {
      validator: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      message: props => `${props.value} is not a valid email`
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
      message: props => `${props.value} is not a valid URL`
    }
  },
  email: { 
    type: String, 
    required: true, 
    validate: {
      validator: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      message: props => `${props.value} is not a valid email`
    }
  },
  description: { type: String, maxlength: 500, trim: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  expiresAt: { type: Date, index: { expires: 0 } },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Partner = mongoose.model('Partner', partnerSchema);

// 5. Passport Configuration
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
  callbackURL: "https://travcen-backendas.onrender.com/auth/google/callback",
  passReqToCallback: true,
  proxy: true,
  state: true,
  scope: ['profile', 'email'],
  prompt: 'select_account',
  accessType: 'offline'
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    console.log('Received Google profile:', profile.id);
    
    const email = profile.emails?.[0]?.value;
    if (!email) throw new Error('No email found in Google profile');

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
        role: email === process.env.ADMIN_EMAIL ? 'admin' : 'user'
      });
    } else if (!user.googleId) {
      user.googleId = profile.id;
      await user.save();
    }
    
    console.log('Authenticated user:', user.email);
    done(null, user);
  } catch (err) {
    console.error('Google authentication error:', err);
    done(err);
  }
}));

// 6. CSRF Protection
const csrfProtection = csrf({ 
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    signed: true,
    domain: process.env.COOKIE_DOMAIN || '.travcen-backendas.onrender.com',
    path: '/'
  }
});

// CSRF Middleware
app.use((req, res, next) => {
  if (req.path.startsWith('/auth') || 
      req.path.startsWith('/api') || 
      req.path === '/health' || 
      req.path === '/' ||
      req.path === '/favicon.ico') {
    return next();
  }
  return csrfProtection(req, res, next);
});

// 7. Authentication Routes
app.get('/auth/google', (req, res, next) => {
  console.log('Initiating Google OAuth flow');
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })(req, res, next);
});

app.get('/auth/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth_failed`,
    successRedirect: process.env.FRONTEND_URL
  }),
  (req, res) => {
    console.log('Successfully logged in:', req.user?.email);
  }
);

// 8. API Routes
const router = express.Router();

// Health Check
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// CSRF Token
router.get('/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// User Data
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

// Logout
router.post('/logout', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout error' });
    }
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
      }
      res.clearCookie('travcen.sid', {
        domain: process.env.COOKIE_DOMAIN || '.travcen-backendas.onrender.com',
        path: '/'
      });
      res.json({ success: true });
    });
  });
});

// Partners Management
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
    console.error('Partners retrieval error:', err);
    res.status(500).json({ error: 'Failed to get partners list' });
  }
});

router.post('/partner', csrfProtection, async (req, res) => {
  if (!req.isAuthenticated() || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Insufficient permissions' });
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
    console.error('Partner creation error:', err);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Partner with this email already exists' });
    }
    res.status(400).json({ error: err.message });
  }
});

app.use('/api', router);

// 9. Main Route
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

// 10. Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err.name === 'MongoServerError') {
    return res.status(400).json({ 
      error: 'Database operation error',
      details: err.message 
    });
  }
  
  if (err.name === 'ValidationError') {
    const errors = {};
    Object.keys(err.errors).forEach(key => {
      errors[key] = err.errors[key].message;
    });
    return res.status(400).json({ 
      error: 'Validation error',
      details: errors 
    });
  }
  
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ 
      error: 'Invalid CSRF token',
      solution: 'Please refresh the page and try again'
    });
  }
  
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 11. Server Startup
async function startServer() {
  await connectToDatabase();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`API available at /api endpoints`);
    console.log(`Google authentication available at /auth/google`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer().catch(err => {
  console.error('Server startup error:', err);
  process.exit(1);
});
