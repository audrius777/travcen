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

// 1. Database Configuration
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

// Enhanced CORS Configuration with dynamic origin checking
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://travcen.com',
  'https://www.travcen.com',
  'https://travcen.vercel.app',
  'http://localhost:3000'
].filter(Boolean);

const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.some(allowedOrigin => 
      origin === allowedOrigin || 
      origin.replace(/^https?:\/\//, '') === allowedOrigin.replace(/^https?:\/\//, '')
    )) {
      return callback(null, true);
    }
    
    const msg = 'CORS policy: this origin is not allowed';
    return callback(new Error(msg), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With'],
  exposedHeaders: ['X-CSRF-Token', 'X-Request-ID'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://apis.google.com", "https://www.googletagmanager.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https://*.googleusercontent.com", "https://*.facebook.com"],
      connectSrc: ["'self'", process.env.MONGODB_URI, ...allowedOrigins, "https://travcen-backendas.onrender.com"],
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

// Rate Limiting Configuration
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.ip === '::ffff:127.0.0.1' || req.path === '/health'
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true
});

app.use('/api', apiLimiter);
app.use('/auth', authLimiter);

// Body Parsers with enhanced security
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

// 3. Session Configuration with enhanced security
const sessionConfig = {
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  name: 'travcen.sid',
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    domain: process.env.COOKIE_DOMAIN || '.travcen-backendas.onrender.com',
    path: '/',
    signed: true
  },
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions',
    ttl: 24 * 60 * 60, // 24 hours
    autoRemove: 'native',
    crypto: {
      secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex')
    },
    touchAfter: 12 * 3600 // 12 hours
  }),
  rolling: true
};

// Initialize Session and Passport
app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());

// 4. Mongoose Models with enhanced validation
const userSchema = new mongoose.Schema({
  googleId: { type: String, unique: true, sparse: true },
  facebookId: { type: String, unique: true, sparse: true },
  email: { 
    type: String, 
    unique: true, 
    required: true,
    validate: {
      validator: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      message: props => `${props.value} is not a valid email`
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

// 5. Enhanced Passport Configuration
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

// Google Strategy with enhanced error handling
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
    console.error('Google authentication error:', err);
    done(err, null, {
      message: 'Authentication failed',
      provider: 'google',
      error: err.message
    });
  }
}));

// Facebook Strategy
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
    if (!email) throw new Error('No email found in Facebook profile');

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
    console.error('Facebook authentication error:', err);
    done(err, null, {
      message: 'Authentication failed',
      provider: 'facebook',
      error: err.message
    });
  }
}));

// 6. CSRF Protection with exclusions
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

// Apply CSRF protection selectively
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

// 7. Route Configuration
app.use('/auth', authRoutes);
app.use('/api/offers', offerRoutes);

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memoryUsage: process.memoryUsage(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Main API Route
app.get('/api', (req, res) => {
  res.json({
    service: 'Travcen Backend API',
    version: '1.1.0',
    status: 'operational',
    environment: process.env.NODE_ENV || 'development',
    availableEndpoints: {
      auth: {
        google: '/auth/google',
        facebook: '/auth/facebook',
        guest: '/api/auth/guest'
      },
      api: {
        health: '/health',
        user: '/api/user',
        offers: '/api/offers',
        partners: '/api/partners'
      }
    },
    documentation: process.env.API_DOCS_URL || 'https://docs.travcen.com'
  });
});

// 8. Enhanced Error Handling
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error:`, {
    path: req.path,
    method: req.method,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  const errorResponse = {
    error: err.message || 'Internal Server Error',
    status: err.status || 500,
    timestamp: new Date().toISOString()
  };

  if (err.name === 'ValidationError') {
    errorResponse.details = {};
    Object.keys(err.errors).forEach(key => {
      errorResponse.details[key] = err.errors[key].message;
    });
    return res.status(400).json(errorResponse);
  }

  if (err.name === 'MongoServerError') {
    errorResponse.type = 'database_error';
    if (err.code === 11000) {
      errorResponse.details = 'Duplicate key error';
    }
    return res.status(400).json(errorResponse);
  }

  if (err.code === 'EBADCSRFTOKEN') {
    errorResponse.solution = 'Refresh the page and try again';
    return res.status(403).json(errorResponse);
  }

  res.status(errorResponse.status).json(errorResponse);
});

// 9. Server Startup with graceful shutdown
async function startServer() {
  try {
    await connectToDatabase();
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Database: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        mongoose.connection.close(false, () => {
          console.log('MongoDB connection closed');
          process.exit(0);
        });
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received. Shutting down gracefully...');
      server.close(() => {
        mongoose.connection.close(false, () => {
          console.log('MongoDB connection closed');
          process.exit(0);
        });
      });
    });

  } catch (err) {
    console.error('Server startup error:', err);
    process.exit(1);
  }
}

startServer();
