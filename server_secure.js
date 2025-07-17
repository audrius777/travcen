const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const fs = require("fs/promises");
const path = require("path");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.static("public"));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback"
},
(accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get("/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login.html",
    successRedirect: "/"
  })
);

app.get("/api/user", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ loggedIn: true, email: req.user.emails[0].value });
  } else {
    res.json({ loggedIn: false });
  }
});

app.post("/api/logout", (req, res) => {
  req.logout(() => {
    res.sendStatus(200);
  });
});

function isAdmin(req) {
  return req.isAuthenticated() && req.user?.emails?.[0]?.value === process.env.ADMIN_EMAIL;
}

app.get("/api/admin/check", (req, res) => {
  if (isAdmin(req)) {
    res.json({ isAdmin: true });
  } else {
    res.status(403).json({ isAdmin: false });
  }
});

app.get("/api/partners", async (req, res) => {
  try {
    const data = await fs.readFile("./partners.json", "utf-8");
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(500).json({ error: "Nepavyko nuskaityti partnerių." });
  }
});

app.post("/api/partner", async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ error: "Tik administratorius gali registruoti partnerius." });
  }

  try {
    const { company, url, email, description } = req.body;
    const data = await fs.readFile("./partners.json", "utf-8");
    const partners = JSON.parse(data);

    if (partners.some(p => p.email === email)) {
      return res.status(400).json({ error: "Toks el. pašto adresas jau egzistuoja." });
    }

    partners.push({ company, url, email, description });
    await fs.writeFile("./partners.json", JSON.stringify(partners, null, 2));
    res.json({ message: "Partneris sėkmingai įregistruotas." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Klaida įrašant partnerį." });
  }
});

app.listen(PORT, () => {
  console.log(`Serveris paleistas http://localhost:${PORT}`);
});
