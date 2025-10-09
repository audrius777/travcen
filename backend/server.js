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

// 2. CORS konfigūracija (PATAISYTA - pridėtas null ir naujas domain)
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

// 8. Pridėti naujus route'us
import offerRoutes from './routes/offers.js';
import formRoutes from './routes/forms.js';
app.use('/api/offers', offerRoutes);
app.use('/api/forms', formRoutes);

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
      console.log(`📝 Nauja pasiūlymų sistema įJUNGTAS`);
    });
  } catch (err) {
    console.error('❌ Serverio paleidimo klaida:', err);
    process.exit(1);
  }
}

startServer();
[file content end]
