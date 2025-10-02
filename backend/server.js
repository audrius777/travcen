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
import axios from 'axios';
import * as cheerio from 'cheerio';
import NodeCache from 'node-cache';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

// ES modulių __dirname emuliacija
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inicializuoti talpyklą
const scrapeCache = new NodeCache({ stdTTL: 3600 });

// Express aplikacijos konfigūracija
const app = express();
const PORT = process.env.PORT || 10000;

// Trust proxy - PRIDĖTA
app.set('trust proxy', 1);

// CORS konfigūracija
app.use((req, res, next) => {
  console.log('Užklausa iš:', req.headers.origin);
  
  const allowedOrigins = [
    'https://travcen.com',
    'https://www.travcen.com', 
    'https://travcen.vercel.app',
    'https://travcen-ehyjdij28-audrius-projects-76a4ec92.vercel.app',
    'http://localhost:3000',
    'https://travcen-backendas.onrender.com',
    'null'
  ];
  
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Atnaujinti CSP nustatymus
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://www.googletagmanager.com", "https://apis.google.com", "https://www.gstatic.com", "https://www.google.com/recaptcha/api.js"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "https://travcen-backendas.onrender.com"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Statinių failų servinimas
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Sesijos konfigūracija
const sessionConfig = {
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions'
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
};

app.use(session(sessionConfig));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Per daug užklausų iš šio IP',
  trustProxy: 1
});
app.use(limiter);

// CSRF apsauga
const csrfProtection = csrf({
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    httpOnly: true
  }
});

// CSRF token middleware
app.use((req, res, next) => {
  if (req.csrfToken) {
    res.locals.csrfToken = req.csrfToken();
  }
  next();
});

// CSRF middleware su išimtimis
app.use((req, res, next) => {
  if (req.path === '/api/health' || 
      req.path === '/api/scrape' ||
      req.path === '/api/csrf-token' ||
      req.path.startsWith('/uploads/') ||
      req.method === 'OPTIONS') {
    return next();
  }
  
  if (typeof req.csrfToken === 'function') {
    csrfProtection(req, res, next);
  } else {
    next();
  }
});

// Partnerių endpoint'ai
import partnerRoutes from './routes/partners.js';
app.use('/api', partnerRoutes);

// Scrapinimo funkcija
async function scrapeWebsite(url, searchCriteria = '') {
  const cacheKey = `scrape:${url}:${searchCriteria}`;
  const cachedData = scrapeCache.get(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }

  try {
    console.log(`Scrapinama: ${url}`);
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    const results = [];
    
    $('.offer, .product, .item, .card').each((i, element) => {
      const title = $(element).find('h1, h2, h3, .title').first().text().trim();
      const priceText = $(element).find('.price, .cost').first().text().trim();
      const image = $(element).find('img').first().attr('src');
      const link = $(element).find('a').first().attr('href');
      
      if (title && priceText) {
        const priceMatch = priceText.match(/(\d+[\d,.]*)/);
        const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : 0;
        
        if (!searchCriteria || title.toLowerCase().includes(searchCriteria.toLowerCase())) {
          results.push({
            title,
            price,
            image: image ? new URL(image, url).href : '',
            link: link ? new URL(link, url).href : '',
            source: new URL(url).hostname
          });
        }
      }
    });
    
    console.log(`Rasta ${results.length} rezultatų iš ${url}`);
    scrapeCache.set(cacheKey, results);
    return results;
    
  } catch (error) {
    console.error(`Scrapinimo klaida ${url}:`, error.message);
    return [];
  }
}

// Scrapinimo endpoint'as
app.post('/api/scrape', async (req, res) => {
  try {
    const { url, criteria } = req.body;
    
    if (!req.session.user || req.session.user.role !== 'admin') {
      return res.status(403).json({ error: 'Nepakankamos teisės' });
    }
    
    if (!url || !url.startsWith('http')) {
      return res.status(400).json({ error: 'Neteisingas URL formatas' });
    }

    const scrapedData = await scrapeWebsite(url, criteria);
    res.json(scrapedData);

  } catch (error) {
    console.error('Scrapinimo klaida:', error);
    res.status(500).json({ error: 'Scrapinimo klaida' });
  }
});

// Pagrindiniai API endpoint'ai
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/csrf-token', (req, res) => {
  if (typeof req.csrfToken === 'function') {
    res.json({ csrfToken: req.csrfToken() });
  } else {
    res.status(500).json({ error: 'CSRF not configured properly' });
  }
});

app.get('/api/user', (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.status(401).json({ loggedIn: false });
  }
});

// Pagrindinis maršrutas
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Travcen Backend API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Klaidų apdorojimas
app.use((err, req, res, next) => {
  console.error('Klaida:', err.message);
  
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ 
      error: 'Negaliojanti CSRF sesija',
      solution: 'Gaukite naują CSRF tokeną iš /api/csrf-token'
    });
  }
  
  res.status(500).json({ error: 'Vidinė serverio klaida' });
});

// Serverio paleidimas
async function startServer() {
  await connectToDatabase();
  
  const fs = await import('fs');
  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveris paleistas http://localhost:${PORT}`);
    console.log(`Scrapinimo funkcija aktyvuota`);
    console.log(`CSRF apsauga įjungta`);
    console.log(`Partnerių endpoint'ai aktyvuoti`);
  });
}

// Duomenų bazės konfigūracija
async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('Prisijungta prie MongoDB Atlas');
  } catch (err) {
    console.error('Kritinė duomenų bazės klaida:', err);
    process.exit(1);
  }
}

startServer().catch(err => {
  console.error('Serverio paleidimo klaida:', err);
  process.exit(1);
});
