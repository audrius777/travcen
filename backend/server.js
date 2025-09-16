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
import * as cheerio from 'cheerio';
import NodeCache from 'node-cache';

// Inicializuoti talpyklą
const scrapeCache = new NodeCache({ stdTTL: 3600 });

// Express aplikacijos konfigūracija
const app = express();
const PORT = process.env.PORT || 10000;

// CORS konfigūracija
app.use((req, res, next) => {
  console.log('Užklausa iš:', req.headers.origin);
  
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
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Vary', 'Origin');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

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

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

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
    httpOnly: true
  }
};

app.use(session(sessionConfig));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Per daug užklausų iš šio IP',
});
app.use(limiter);

// CSRF apsauga - SU TAIKYMO IŠIMTIMIS
const csrfProtection = csrf({ 
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    httpOnly: true
  }
});

// CSRF middleware su išimtimis
app.use((req, res, next) => {
  if (req.path === '/api/health' || 
      req.path === '/api/scrape' || 
      req.method === 'OPTIONS') {
    return next();
  }
  return csrfProtection(req, res, next);
});

// Scrapinimo funkcija su axios ir cheerio
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
    
    // Bendri selektoriai daugumai svetainių
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

app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

app.get('/api/user', (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.status(401).json({ loggedIn: false });
  }
});

// Atsijungimas
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Atsijungimo klaida' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
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
  console.error(err.stack);
  
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ 
      error: 'Negaliojanti CSRF sesija',
      solution: 'Gaukite naują CSRF tokeną'
    });
  }
  
  res.status(500).json({ error: 'Vidinė serverio klaida' });
});

// Serverio paleidimas
async function startServer() {
  await connectToDatabase();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveris paleistas http://localhost:${PORT}`);
    console.log(`Scrapinimo funkcija aktyvuota (axios + cheerio)`);
  });
}

startServer().catch(err => {
  console.error('Serverio paleidimo klaida:', err);
  process.exit(1);
});
