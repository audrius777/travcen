import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import mongoose from 'mongoose';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import csrf from 'csurf';
import crypto from 'crypto';
import cors from 'cors';
import MongoStore from 'connect-mongo';
import { validationResult } from 'express-validator';
import axios from 'axios';
import partnerRoutes from './routes/partners.js';
import puppeteer from 'puppeteer'; // Pridėta scrapinimui

// 1. Express aplikacijos konfigūracija
const app = express();
const PORT = process.env.PORT || 10000;

// 2. CRITICAL FIX - CORS pataisymas pačioje pradžioje
app.use((req, res, next) => {
  console.log('Užklausa iš:', req.headers.origin);
  console.log('Maršrutas:', req.path);
  
  const allowedOrigins = [
    'https://travcen.com',
    'https://www.travcen.com', 
    'https://travcen.vercel.app',
    'https://www.travcen.vercel.app',
    'http://localhost:3000'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    console.log('Nustatytas CORS origin:', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Vary', 'Origin');
  
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS užklausa - grąžinama 200');
    return res.sendStatus(200);
  }
  
  next();
});

// 3. Duomenų bazės konfigūracija
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

// 4. Middleware, kuris generuoja "nonce" kiekvienam request'ui
app.use((req, res, next) => {
  const nonce = crypto.randomBytes(16).toString('base64');
  res.locals.nonce = nonce;
  next();
});

// 5. Tik API endpointams - išjungti CSP
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${res.locals.nonce}' https://www.googletagmanager.com https://apis.google.com https://www.gstatic.com https://www.google.com/recaptcha/api.js`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://source.unsplash.com https://medpoint.ee",
    "connect-src 'self' https://travcen.onrender.com",
    "frame-src 'self' https://www.google.com"
  ].join('; ');

  res.setHeader('Content-Security-Policy', csp);
  next();
});

// 6. UŽKOMENTUOKITE SENĄ CORS KONFIGŪRACIJĄ
/*
const allowedOrigins = [
  'https://travcen.com',
  'https://www.travcen.com', 
  'https://travcen.vercel.app',
  'https://www.travcen.vercel.app',
  'http://localhost:3000'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['X-CSRF-Token'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
*/

// 7. Saugumo middleware'iai - SU PATAISA
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false, // 👈 PRIDĖTA
  crossOriginEmbedderPolicy: false, // 👈 PRIDĖTA
  crossOriginOpenerPolicy: false, // 👈 PRIDĖTA
  hsts: {
    maxAge: 63072000,
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  frameguard: { action: 'deny' }
}));

// 8. Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Per daug užklausų iš šio IP, bandykite vėliau',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.ip === '::ffff:127.0.0.1'
});

app.use(limiter);

// 9. Kūlo parseriai
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 10. Sesijos konfigūracija
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
    domain: process.env.NODE_ENV === 'production' ? '.travcen.com' : 'localhost',
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
    touchAfter: 24 * 3600
  })
};

app.use(session(sessionConfig));

// 11. Mongoose modeliai
const userSchema = new mongoose.Schema({
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

const pendingPartnerSchema = new mongoose.Schema({
  company: { type: String, required: true, trim: true },
  website: { 
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
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  ipAddress: { type: String, required: true },
  attempts: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Partner = mongoose.model('Partner', partnerSchema);
const PendingPartner = mongoose.model('PendingPartner', pendingPartnerSchema);

// 12. CSRF apsauga
const csrfProtection = csrf({ 
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    signed: true,
    domain: process.env.NODE_ENV === 'production' ? '.travcen.com' : 'localhost',
    path: '/'
  }
});

// CSRF middleware
app.use((req, res, next) => {
  if (req.path.startsWith('/api/partners/register') || 
      req.path === '/api/health' ||
      req.path === '/' || 
      req.path === '/favicon.ico' ||
      req.path.startsWith('/static')) {
    return next();
  }
  return csrfProtection(req, res, next);
});

// 13. Scrapinimo endpoint'as - PRIDĖTA NAUJA FUNKCIJA
app.post('/api/scrape', async (req, res) => {
  try {
    const { url, criteria, rules } = req.body;
    
    // Patikriname, ar vartotojas yra admin
    if (!req.session.user || req.session.user.role !== 'admin') {
      return res.status(403).json({ error: 'Nepakankamos teisės. Tik administratoriai.' });
    }
    
    // Čia būtų tikras scrapinimo kodas su Puppeteer
    // Dabar imituojame scrapinimą
    console.log(`Scrapinama: ${url} su kriterijais: ${criteria}`);
    
    // Imituojame scrapinimo vėlavimą
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Imituojami scrapinti duomenys
    const mockData = generateMockScrapingData(url, criteria);
    
    res.json(mockData);
  } catch (error) {
    console.error('Scrapinimo klaida:', error);
    res.status(500).json({ error: 'Scrapinimo klaida: ' + error.message });
  }
});

// Pagalbinė funkcija scrapinimo duomenims generuoti
function generateMockScrapingData(url, criteria) {
  const destinations = ['Ispanija', 'Graikija', 'Turkija', 'Egiptas', 'Italija', 'Prancūzija'];
  const tripTypes = ['Pajūrio poilsis', 'Ekskursijos', 'Kalnų turizmas', 'Miesto kelionė'];
  
  const results = [];
  const resultCount = Math.floor(Math.random() * 5) + 3;
  
  for (let i = 0; i < resultCount; i++) {
    const destination = destinations[Math.floor(Math.random() * destinations.length)];
    const duration = Math.floor(Math.random() * 7) + 4;
    const price = Math.floor(Math.random() * 400) + 199;
    
    results.push({
      id: Date.now() + i,
      title: `${destination} - ${tripTypes[Math.floor(Math.random() * tripTypes.length)]}`,
      price: price,
      duration: `${duration} dienos`,
      image: `https://source.unsplash.com/300x200/?${destination.toLowerCase()},vacation`,
      link: `https://${url}/offer-${i}`,
      source: url,
      criteria: criteria
    });
  }
  
  return results;
}

// 14. Pagrindiniai API maršrutai
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
  if (req.session.user) {
    res.json({ 
      loggedIn: true,
      user: req.session.user
    });
  } else {
    res.status(401).json({ loggedIn: false });
  }
});

// Atsijungimas
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Sesijos sunaikinimo klaida:', err);
      return res.status(500).json({ error: 'Atsijungimo klaida' });
    }
    res.clearCookie('travcen.sid', {
      domain: process.env.NODE_ENV === 'production' ? '.travcen.com' : 'localhost',
      path: '/'
    });
    res.json({ success: true });
  });
});

// Partnerių valdymas (admin)
router.post('/partner', csrfProtection, async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
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

// 15. Partnerių maršrutų integracija
app.use('/api', router);
app.use('/api/partners', partnerRoutes);

// 16. Pagrindinis maršrutas
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Travcen Backend API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    documentation: 'https://github.com/your-repo/docs',
    availableEndpoints: {
      api: {
        health: '/api/health',
        user: '/api/user',
        partners: '/api/partners',
        logout: '/api/logout',
        partnerRegister: '/api/partners/register',
        scrape: '/api/scrape' // Pridėtas naujas endpoint'as
      }
    },
    serverTime: new Date().toISOString()
  });
});

// 17. Klaidų apdorojimas
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

// 18. Serverio paleidimas
async function startServer() {
  await connectToDatabase();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveris paleistas http://localhost:${PORT}`);
    console.log(`API pasiekiamas /api endpoint'uose`);
    console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Naujas scrapinimo endpoint'as: /api/scrape`);
  });
}

startServer().catch(err => {
  console.error('Serverio paleidimo klaida:', err);
  process.exit(1);
});
