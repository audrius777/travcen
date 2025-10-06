import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import mongoose from 'mongoose';
import cors from 'cors';
import MongoStore from 'connect-mongo';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import * as cheerio from 'cheerio';

// ES modulių __dirname emuliacija
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

// 1. Trust proxy
app.set('trust proxy', 1);

// 2. CORS konfigūracija (PATAISYTA - pridėtas naujas domain)
app.use(cors({
  origin: [
    'null',
    'https://travcen.com',
    'https://www.travcen.com', 
    'https://travcen.vercel.app',
    'https://travcen-ehyjdij28-audrius-projects-76a4ec92.vercel.app',
    'https://travcen-2x7ahizhc-audrius-projects-76a4ec92.vercel.app',
    'https://travcen-oks0dte9r-audrius-projects-76a4ec92.vercel.app', // PRIDĖTA
    'http://localhost:3000',
    'https://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With']
}));

// 3. JSON parseris
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 4. Statinių failų servinimas
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 5. Sesijos konfigūracija
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'fallback-secret-key',
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

// 6. Health check endpoint'ai (prieš route'us)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/csrf-token', (req, res) => {
  res.json({ 
    csrfToken: 'disabled-temporarily',
    message: 'CSRF išjungtas laikinai'
  });
});

// 7. Partnerių route'ai
import partnerRoutes from './routes/partners.js';
app.use('/api', partnerRoutes);

// 8. TIKRAS Scrapinimo endpoint'as (PATAISYTA - konkretūs selektoriai)
app.post('/api/scrape', async (req, res) => {
  try {
    const { url, criteria } = req.body;
    
    if (!url || !url.startsWith('http')) {
      return res.status(400).json({ error: 'Neteisingas URL formatas' });
    }

    console.log(`Scrapinama: ${url} su kriterijais: ${criteria}`);

    // Tikras scrapinimas su axios ir cheerio
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
      }
    });

    const $ = cheerio.load(response.data);
    const offers = [];

    // KONKRETŪS SCRAPINIMO TAISYKLĖS POPULIARIOMS SVETAINĖMS
    if (url.includes('novaturas.lt')) {
      // Novaturas scrapinimas
      $('.offer-item, .tour-item, .product-item, .trip-card').each((index, element) => {
        const $el = $(element);
        
        const title = $el.find('.title, .name, h2, h3').first().text().trim();
        const priceText = $el.find('.price, .cost, [class*="price"]').first().text().trim();
        const price = parseFloat(priceText.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
        const image = $el.find('img').first().attr('src') || '';
        const link = $el.find('a').first().attr('href') || '';

        if (title && price > 0) {
          offers.push({
            title,
            price,
            image: image.startsWith('http') ? image : new URL(image, url).href,
            link: link.startsWith('http') ? link : new URL(link, url).href,
            source: 'Novaturas'
          });
        }
      });
      
      // Jei nerandame pagal specifinius selektorius, bandome bendresnius
      if (offers.length === 0) {
        $('a[href*="kelione"], a[href*="tour"], .card, .item').each((index, element) => {
          const $el = $(element);
          const title = $el.text().trim();
          const priceMatch = title.match(/(\d+[\.,]\d+)\s*€/);
          const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : 0;
          const link = $el.attr('href') || '';
          
          if (title.length > 10 && price > 0 && criteria && title.toLowerCase().includes(criteria.toLowerCase())) {
            offers.push({
              title,
              price,
              image: `https://source.unsplash.com/featured/300x200/?${criteria}`,
              link: link.startsWith('http') ? link : new URL(link, url).href,
              source: 'Novaturas'
            });
          }
        });
      }
    }
    else if (url.includes('kelioniuplanetas.lt')) {
      // KelioniuPlanetas scrapinimas
      $('.tour, .offer, .package, .product').each((index, element) => {
        const $el = $(element);
        const title = $el.find('.title, h3, h4').first().text().trim();
        const priceText = $el.find('.price, .amount').first().text().trim();
        const price = parseFloat(priceText.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
        const image = $el.find('img').first().attr('src') || '';
        const link = $el.find('a').first().attr('href') || '';

        if (title && price > 0) {
          offers.push({
            title,
            price,
            image: image.startsWith('http') ? image : new URL(image, url).href,
            link: link.startsWith('http') ? link : new URL(link, url).href,
            source: 'KelioniuPlanetas'
          });
        }
      });
    }
    else {
      // Bendras scrapinimas kitoms svetainėms
      $('.product, .item, .card, .offer, .tour').each((index, element) => {
        const $el = $(element);
        const title = $el.find('h1, h2, h3, .title, .name').first().text().trim();
        const priceText = $el.find('.price, .cost, [class*="price"]').first().text().trim();
        const price = parseFloat(priceText.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
        const image = $el.find('img').first().attr('src') || '';
        const link = $el.find('a').first().attr('href') || '';

        if (title && price > 0) {
          offers.push({
            title,
            price,
            image: image.startsWith('http') ? image : new URL(image, url).href,
            link: link.startsWith('http') ? link : new URL(link, url).href,
            source: new URL(url).hostname
          });
        }
      });
    }

    console.log(`Rasta ${offers.length} pasiūlymų iš ${url}`);

    // Jei nerandame pasiūlymų, bandome alternatyvų būdą
    if (offers.length === 0) {
      console.log('Bandome alternatyvų scrapinimo būdą...');
      
      // Ieškome tekste, kuris atitinka paieškos kriterijus
      const bodyText = $('body').text();
      if (criteria && bodyText.toLowerCase().includes(criteria.toLowerCase())) {
        // Jei svetainėje yra paieškos kriterijų, bet negalime išgauti struktūruotų duomenų
        offers.push({
          title: `Rasta pasiūlymų ${criteria} temoje`,
          price: 0,
          source: new URL(url).hostname,
          note: 'Aplankykite svetainę norėdami pamatyti pilną pasiūlymų sąrašą',
          link: url
        });
      }
    }

    res.json(offers);

  } catch (error) {
    console.error('Scrapinimo klaida:', error.message);
    
    // Grąžiname informatyvų klaidos pranešimą
    res.json([{
      title: 'Scrapinimo klaida',
      price: 0,
      source: 'system',
      error: error.message,
      note: 'Svetainė laikinai nepasiekiama arba pakeitė struktūrą'
    }]);
  }
});

// 9. Autentifikacijos endpoint'ai
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === 'admin' && password === 'admin123') {
    req.session.user = {
      id: 1,
      username: 'admin',
      role: 'admin',
      loggedIn: true
    };
    return res.json({ success: true, user: req.session.user });
  }
  
  res.status(401).json({ success: false, error: 'Netinkami prisijungimo duomenys' });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Atsijungimo klaida' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true, message: 'Sėkmingai atsijungta' });
  });
});

// 10. Testinis endpoint'as demo duomenims (tik development)
app.get('/api/demo/partners', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Demo duomenys nepasiekiami production' });
  }
  
  const demoPartners = [
    {
      id: 1,
      companyName: "Novaturas",
      website: "https://www.novaturas.lt",
      email: "info@novaturas.lt",
      description: "Didžiausia kelionių operatorė Baltijos šalyse"
    },
    {
      id: 2, 
      companyName: "KelioniuPlanetas",
      website: "https://kelioniuplanetas.lt",
      email: "info@kelioniuplanetas.lt",
      description: "Kelionių organizavimo platforma"
    }
  ];
  
  res.json(demoPartners);
});

// 11. Pagrindinis route'as
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Travcen Backend API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    cors: {
      enabled: true,
      domains: [
        'travcen.com',
        'travcen.vercel.app',
        'travcen-oks0dte9r-audrius-projects-76a4ec92.vercel.app'
      ]
    }
  });
});

// 12. Klaidų apdorojimas
app.use((err, req, res, next) => {
  console.error('Serverio klaida:', err.message);
  res.status(500).json({ error: 'Vidinė serverio klaida' });
});

// 13. 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint nerastas' });
});

// 14. Serverio paleidimas
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Prisijungta prie MongoDB');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Serveris paleistas porte: ${PORT}`);
      console.log(`🔗 Health check: /api/health`);
      console.log(`🌍 CORS įjungtas Vercel domain'ams`);
      console.log(`🔍 Tikras scrapinimas įJUNGTAS`);
      console.log(`📡 CORS leidžiamos svetainės:`);
      console.log(`   - https://travcen-oks0dte9r-audrius-projects-76a4ec92.vercel.app`);
      console.log(`   - https://travcen.vercel.app`);
      console.log(`   - https://travcen.com`);
    });
  } catch (err) {
    console.error('❌ Serverio paleidimo klaida:', err);
    process.exit(1);
  }
}

startServer();
