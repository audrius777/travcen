require('dotenv').config(); // Jei naudojamas .env failas

const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const passport = require('passport');
const bcrypt = require('bcrypt');

// Įkeliamos Passport strategijos
require('./config/passport');
// require('./auth'); // pašalinta – failo nėra // <- pridėta GoogleStrategy

// Importuojami auth maršrutai
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== Autorizacijos middleware =====
function ensureAdmin(req, res, next) {
  const user = req.session?.user || req.user?.email;
  if (user === 'admin@travcen.com') return next();
  return res.status(403).send('Prieiga tik administratoriui');
}

// ===== 0. Saugumo middleware'ai =====
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://www.googletagmanager.com", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: [
        "'self'",
        "data:",
        "https://img.icons8.com",
        "https://source.unsplash.com",
        "https://medpoint.ee"
      ],
      connectSrc: [
  "'self'",
  "http://localhost:3000",
  "https://www.google-analytics.com",
  "https://region1.google-analytics.com"
],

      frameSrc: ["'self'", "https://www.facebook.com"]
    }
  }
}));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100 // max 100 užklausų
}));

app.use(cors({
  origin: "http://localhost:8080", // arba tavo frontendo domenas
  credentials: true
}));

app.use(bodyParser.json());

// ===== 1. Sesijos (būtina autentifikacijai) =====
app.use(session({
  secret: 'travcenSecretKey123!',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // true jei naudojamas HTTPS
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// ===== 2. Passport Middleware =====
app.use(passport.initialize());
app.use(passport.session());

// ===== 3. Statiniai failai (frontend) =====
const frontPath = path.join(__dirname, '../frontendas');
app.use(express.static(frontPath));

// ===== 4. Auth maršrutai (/auth/google, /auth/facebook) =====
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: 'https://travcen.vercel.app/login.html',
    session: false
  }),
  function(req, res) {
    res.redirect('https://travcen.vercel.app/index.html');
  }
);

app.use('/auth', authRoutes);
app.use('/api', require('./routes/partnerStatusRoute'));
// app.use('/api', require('./routes/offers')); // komentaruota, nes naudosime partnerLoader.js


// ===== Partnerių pasiūlymų API (dinamiškai) =====
const loadOffers = require('./partnerLoader');
app.get('/api/offers', async (req, res) => {
  try {
    const offers = await loadOffers();
    res.json(offers);
  } catch (err) {
    console.error("❌ Klaida kraunant pasiūlymus:", err.message);
    res.status(500).send("Nepavyko gauti pasiūlymų");
  }
});

// ===== 5. Tradicinis prisijungimas =====
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
console.log('Gautas prisijungimas:', email, password);

  const userFile = path.join(__dirname, 'user.json');

  if (!fs.existsSync(userFile)) {
    return res.status(500).send('user.json nerastas');
  }

  const userData = JSON.parse(fs.readFileSync(userFile, 'utf8'));

  if (email !== userData.email) {
    return res.status(401).send('Neteisingas el. paštas');
  }

  bcrypt.compare(password, userData.passwordHash, (err, result) => {
    if (err || !result) {
      return res.status(401).send('Neteisingas slaptažodis');
    }

    req.session.user = email;
    res.sendStatus(200);
  });
});

// ===== 6. Atsijungimas =====
app.post('/api/logout', (req, res) => {
  req.logout(err => {
    if (err) return res.status(500).send('Logout klaida');
    req.session.destroy(() => res.sendStatus(200));
  });
});

// ===== 7. Vartotojo patikrinimas =====
app.get('/api/user', (req, res) => {
  if (req.session.user || req.user) {
    const email = req.session?.user || req.user?.email;
    return res.json({ loggedIn: true, email });
  } else {
    return res.json({ loggedIn: false });
  }
});

// ===== 8. Partnerio registracija =====
app.post('/api/partner', ensureAdmin, (req, res) => {
  if (!req.session.user && !req.user) {
    return res.status(401).send('Neautorizuota');
  }

  const { company, url, email, description } = req.body;
  if (!company || !url || !email || !description) {
    return res.status(400).send('Trūksta laukų');
  }

  const partnersFile = path.join(__dirname, 'partners.json');
  const backupFile = path.join(__dirname, 'partners_backup.json');

  if (fs.existsSync(partnersFile)) {
    fs.copyFileSync(partnersFile, backupFile);
  }

  let partners = [];
  if (fs.existsSync(partnersFile)) {
    try {
      partners = JSON.parse(fs.readFileSync(partnersFile, 'utf8'));
    } catch {
      return res.status(500).send('Klaida skaitant partnerių failą');
    }
  }

  partners.push({ company, url, email, description });

  fs.writeFile(partnersFile, JSON.stringify(partners, null, 2), err => {
    if (err) return res.status(500).send('Klaida įrašant partnerį');

    // Automatinis partnerio modulio generavimas
    const slug = company.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const modulePath = path.join(__dirname, 'partners', `${slug}.js`);

    if (!fs.existsSync(modulePath)) {
      const boilerplate = `// Autogenerated module for ${company}\n\nmodule.exports = async function () {\n  return [\n    // Įkelkite keliones iš ${url}\n  ];\n};\n`;

      fs.writeFile(modulePath, boilerplate, err => {
        if (err) console.error("❌ Nepavyko sukurti partnerio modulio:", err);
        else console.log(`✅ Sukurtas modulis: partners/${slug}.js`);
      });
    }

    res.status(200).send('OK');
  });
});

// ===== 9. Partnerių sąrašas =====
app.get('/api/partners', (req, res) => {
  const partnersFile = path.join(__dirname, 'partners.json');

  if (!fs.existsSync(partnersFile)) {
    return res.json([]);
  }

  fs.readFile(partnersFile, 'utf8', (err, content) => {
    if (err) return res.status(500).send('Nepavyko nuskaityti partnerių');
    try {
      const all = JSON.parse(content);
      const result = all.map(p => ({ url: p.url }));
      res.json(result);
    } catch (e) {
      res.status(500).send('Neteisingas JSON formatas');
    }
  });
});

// ===== 10. Test endpointas =====
app.get('/test', (req, res) => {
  res.send('Test puslapis veikia!');
});

// ===== 11. 404 fallback =====
app.use((req, res) => {
  res.status(404).send('404 - Puslapis nerastas');
});

// ===== 12. Serverio paleidimas =====
app.listen(PORT, () => {
  console.log(`✅ Serveris veikia: http://localhost:${PORT}`);
});
