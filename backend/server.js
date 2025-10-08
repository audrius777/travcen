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

// 2. CORS konfigūracija
app.use(cors({
  origin: [
    'null',
    'https://travcen.com',
    'https://www.travcen.com', 
    'https://travcen.vercel.app',
    'https://travcen-ehyjdij28-audrius-projects-76a4ec92.vercel.app',
    'https://travcen-2x7ahizhc-audrius-projects-76a4ec92.vercel.app',
    'https://travcen-oks0dte9r-audrius-projects-76a4ec92.vercel.app',
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

// 8. TIKRAS Scrapinimo endpoint'as (PATAISYTA SCRAPINIMO LOGIKA)
app.post('/api/scrape', async (req, res) => {
  try {
    const { url, criteria } = req.body;
    
    if (!url || !url.startsWith('http')) {
      return res.status(400).json({ error: 'Neteisingas URL formatas' });
    }

    console.log(`🔍 Scrapinama: ${url} su kriterijais: ${criteria || 'visi'}`);

    // Tikras scrapinimas su axios ir cheerio
    const response = await axios.get(url, {
      timeout: 20000, // Padidintas timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/avif,*/*;q=0.8',
        'Accept-Language': 'lt-LT,lt;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none'
      }
    });

    const $ = cheerio.load(response.data);
    const offers = [];

    // ATNAUJINTOS SCRAPINIMO TAISYKLĖS - MAŽESNI FILTRAI
    if (url.includes('novaturas.lt')) {
      console.log('🔄 Taikomos Novaturas scrapinimo taisyklės');
      
      // Novaturas - IŠPLĖSTI SELEKTORIAI
      const selectors = [
        '.tour-item', '.offer-item', '.product-item', '.trip-card',
        '.card', '.item', '[class*="tour"]', '[class*="offer"]',
        '.product', '.package', '.vacation-item', '.hotel-item',
        '.js-product-card', '.c-product-card', '.b-tour', '.b-offer'
      ];

      for (const selector of selectors) {
        const elements = $(selector);
        console.log(`📊 Novaturas ${selector}: ${elements.length} elementų`);
        
        elements.each((index, element) => {
          try {
            const $el = $(element);
            const title = $el.find('.title, .name, h2, h3, h4, [class*="title"], [class*="name"]').first().text().trim();
            const priceText = $el.find('.price, .cost, [class*="price"], [class*="cost"], .amount').first().text().trim();
            const price = parseFloat(priceText.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
            const image = $el.find('img').first().attr('src') || '';
            const link = $el.find('a').first().attr('href') || '';

            // SUMUŽINTAS FILTRAS: title.length > 3 vietoj > 5
            if (title && title.length > 3 && !title.includes('undefined')) {
              const fullImage = image.startsWith('http') ? image : 
                               image.startsWith('//') ? `https:${image}` : 
                               image ? new URL(image, url).href : 
                               `https://source.unsplash.com/featured/300x200/?travel,${criteria || 'vacation'}`;
              
              const fullLink = link.startsWith('http') ? link : 
                              link.startsWith('//') ? `https:${link}` : 
                              link ? new URL(link, url).href : url;

              // Tikriname ar atitinka kriterijus
              const matchesCriteria = !criteria || 
                title.toLowerCase().includes(criteria.toLowerCase()) ||
                (criteria === 'last-minute' && title.toLowerCase().includes('last minute')) ||
                (criteria === 'cultural' && title.toLowerCase().includes('culture'));

              if (matchesCriteria) {
                offers.push({
                  title: title.substring(0, 100),
                  price,
                  image: fullImage,
                  link: fullLink,
                  source: 'Novaturas',
                  criteria: criteria || 'all'
                });
              }
            }
          } catch (err) {
            console.log('Nepavyko apdoroti Novaturas elemento:', err.message);
          }
        });

        // PADIDINTAS LIMITAS: 15 vietoj 5
        if (offers.length > 15) break;
      }
    }
    else if (url.includes('teztour.lt')) {
      console.log('🔄 Taikomos TezTour scrapinimo taisyklės');
      
      // TezTour - IŠPLĖSTI SELEKTORIAI
      const selectors = [
        '.tour-item', '.offer-item', '.product-item', 
        '.card', '.item', '[class*="tour"]', '[class*="offer"]',
        '.product', '.package', '.vacation-item', '.hotel-item',
        '.js-tour-item', '.b-tour', '.b-offer', '.c-tour'
      ];

      for (const selector of selectors) {
        const elements = $(selector);
        console.log(`📊 TezTour ${selector}: ${elements.length} elementų`);
        
        elements.each((index, element) => {
          try {
            const $el = $(element);
            const title = $el.find('.title, .name, h2, h3, h4, [class*="title"], [class*="name"]').first().text().trim();
            const priceText = $el.find('.price, .cost, [class*="price"], [class*="cost"], .amount').first().text().trim();
            const price = parseFloat(priceText.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
            const image = $el.find('img').first().attr('src') || '';
            const link = $el.find('a').first().attr('href') || '';

            // SUMUŽINTAS FILTRAS: title.length > 3 vietoj > 5
            if (title && title.length > 3 && !title.includes('undefined')) {
              const fullImage = image.startsWith('http') ? image : 
                               image.startsWith('//') ? `https:${image}` : 
                               image ? new URL(image, url).href : 
                               `https://source.unsplash.com/featured/300x200/?travel,${criteria || 'vacation'}`;
              
              const fullLink = link.startsWith('http') ? link : 
                              link.startsWith('//') ? `https:${link}` : 
                              link ? new URL(link, url).href : url;

              // Tikriname ar atitinka kriterijus
              const matchesCriteria = !criteria || 
                title.toLowerCase().includes(criteria.toLowerCase()) ||
                (criteria === 'last-minute' && title.toLowerCase().includes('last minute')) ||
                (criteria === 'cultural' && title.toLowerCase().includes('culture'));

              if (matchesCriteria) {
                offers.push({
                  title: title.substring(0, 100),
                  price,
                  image: fullImage,
                  link: fullLink,
                  source: 'TezTour',
                  criteria: criteria || 'all'
                });
              }
            }
          } catch (err) {
            console.log('Nepavyko apdoroti TezTour elemento:', err.message);
          }
        });

        // PADIDINTAS LIMITAS: 15 vietoj 5
        if (offers.length > 15) break;
      }
    }

    console.log(`✅ Rasta ${offers.length} pasiūlymų iš ${url}`);

    res.json(offers);

  } catch (error) {
    console.error('❌ Scrapinimo klaida:', error.message);
    
    res.status(500).json([{
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

// 10. Pagrindinis route'as
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Travcen Backend API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// 11. Klaidų apdorojimas
app.use((err, req, res, next) => {
  console.error('Serverio klaida:', err.message);
  res.status(500).json({ error: 'Vidinė serverio klaida' });
});

// 12. 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint nerastas' });
});

// 13. Serverio paleidimas
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
    });
  } catch (err) {
    console.error('❌ Serverio paleidimo klaida:', err);
    process.exit(1);
  }
}

startServer();
