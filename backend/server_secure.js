const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const mongoose = require("mongoose");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const csrf = require("csurf");
const crypto = require("crypto");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

// Duomenų bazės prisijungimas
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("Prisijungta prie MongoDB"))
.catch(err => console.error("DB klaida:", err));

// Express aplikacija
const app = express();
const PORT = process.env.PORT || 3000;

// Saugumo middleware'ai
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "https://travcen.vercel.app",
  credentials: true
}));

// Užklausų limitavimas
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minučių
  max: 100 // 100 užklausų per langą
});
app.use(limiter);

// Kūno parseriai
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Sesijos konfigūracija
app.use(session({
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex"),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000 // 24 valandos
  },
  store: new (require("connect-mongo")(session))({
    mongooseConnection: mongoose.connection,
    ttl: 24 * 60 * 60 // 1 diena
  })
});

// Passport inicializavimas
app.use(passport.initialize());
app.use(passport.session());

// User modelis
const User = mongoose.model("User", new mongoose.Schema({
  googleId: String,
  email: String,
  name: String,
  role: { type: String, default: "user" }
}));

// Passport strategijos
passport.serializeUser((user, done) => done(null, user.id));
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
  callbackURL: `${process.env.BASE_URL}/auth/google/callback`
},
async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id });
    
    if (!user) {
      user = await User.create({
        googleId: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
        role: profile.emails[0].value === process.env.ADMIN_EMAIL ? "admin" : "user"
      });
    }
    
    done(null, user);
  } catch (err) {
    done(err);
  }
}));

// CSRF apsauga (išskyrus API routes)
const csrfProtection = csrf({ cookie: true });
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }
  csrfProtection(req, res, next);
});

// Autentifikacijos maršrutai
app.get("/auth/google",
  passport.authenticate("google", { 
    scope: ["profile", "email"],
    prompt: "select_account"
  })
);

app.get("/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login?error=auth_failed",
    successRedirect: "/"
  })
);

// API maršrutai
const router = express.Router();

router.get("/user", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ 
      loggedIn: true,
      user: {
        email: req.user.email,
        name: req.user.name,
        role: req.user.role
      }
    });
  } else {
    res.json({ loggedIn: false });
  }
});

router.post("/logout", (req, res) => {
  req.logout(() => {
    req.session.destroy();
    res.clearCookie("connect.sid");
    res.sendStatus(200);
  });
});

// Partnerių valdymas
const Partner = mongoose.model("Partner", new mongoose.Schema({
  company: String,
  url: String,
  email: { type: String, unique: true },
  description: String,
  status: { type: String, default: "active" },
  expiresAt: Date,
  createdAt: { type: Date, default: Date.now }
}));

router.get("/partners", async (req, res) => {
  try {
    const partners = await Partner.find({});
    res.json(partners);
  } catch (err) {
    res.status(500).json({ error: "Nepavyko gauti partnerių" });
  }
});

router.post("/partner", async (req, res) => {
  if (!req.isAuthenticated() || req.user.role !== "admin") {
    return res.status(403).json({ error: "Unauthorized" });
  }

  try {
    const partner = await Partner.create(req.body);
    res.status(201).json(partner);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Priskiriame routes prie /api kelio
app.use("/api", router);

// Klaidų apdorojimas
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Kažkas nutiko!" });
});

// Serverio paleidimas
app.listen(PORT, () => {
  console.log(`Serveris paleistas http://localhost:${PORT}`);
});
