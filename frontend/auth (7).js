const express = require("express");
const passport = require("passport");
const router = express.Router();
const { logAuthEvent } = require("../utils/logger");
const { validateSession } = require("../middleware/auth");
const { verifyGoogleToken } = require("../passport");
const User = require("../models/user");

// Optimizuota konfigūracija
const AUTH_CONFIG = {
  google: {
    scope: ["email"], // Sumažinta scope'ų sąrašą
    failureRedirect: `${process.env.FRONTEND_URL}/prisijungimas?klaida=autentifikacija`,
    successRedirect: process.env.FRONTEND_URL,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    prompt: "select_account",
    accessType: "online"
  },
  facebook: {
    scope: ["email"],
    failureRedirect: `${process.env.FRONTEND_URL}/prisijungimas?klaida=autentifikacija`,
    successRedirect: process.env.FRONTEND_URL
  }
};

// Patobulintas Google token-based endpoint'as
router.post("/auth/google/token", async (req, res) => {
  try {
    logAuthEvent("google_token_autentifikacija_pradeta", { ip: req.ip });
    
    if (!req.body.token) {
      throw new Error("Trūksta autentifikacijos tokeno");
    }

    const payload = await verifyGoogleToken(req.body.token);
    
    if (!payload.email_verified) {
      throw new Error("Google el. paštas nepatvirtintas");
    }

    const email = payload.email.toLowerCase();
    let user = await User.findOne({ 
      $or: [
        { googleId: payload.sub },
        { email: email }
      ]
    });

    if (!user) {
      user = await User.create({
        googleId: payload.sub,
        email: email,
        name: payload.name || email.split('@')[0],
        avatar: payload.picture || null,
        provider: "google",
        role: email === process.env.ADMIN_EMAIL ? "admin" : "user"
      });
    } else if (!user.googleId) {
      user.googleId = payload.sub;
      user.avatar = payload.picture || user.avatar;
      await user.save();
    }

    req.login(user, (err) => {
      if (err) {
        logAuthEvent("google_token_autentifikacija_klaida", { 
          error: err.message,
          email: email
        });
        return res.status(401).json({ 
          success: false, 
          error: "Vartotojo sesijos klaida" 
        });
      }
      
      logAuthEvent("google_token_autentifikacija_pavyko", { userId: user.id });
      res.json({ 
        success: true, 
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role
        }
      });
    });
  } catch (error) {
    logAuthEvent("google_token_autentifikacija_klaida", { 
      error: error.message,
      token: req.body.token ? "provided" : "missing"
    });
    res.status(401).json({ 
      success: false, 
      error: "Autentifikacija nepavyko",
      details: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
});

// Atnaujinti Google OAuth maršrutai
router.get("/auth/google", (req, res, next) => {
  logAuthEvent("google_oauth_pradeta", { ip: req.ip });
  passport.authenticate("google", {
    scope: AUTH_CONFIG.google.scope,
    prompt: AUTH_CONFIG.google.prompt,
    accessType: AUTH_CONFIG.google.accessType,
    callbackURL: AUTH_CONFIG.google.callbackURL
  })(req, res, next);
});

router.get("/auth/google/callback", 
  passport.authenticate("google", { 
    failureRedirect: AUTH_CONFIG.google.failureRedirect,
    session: true
  }),
  (req, res) => {
    logAuthEvent("google_oauth_pavyko", { userId: req.user.id });
    res.redirect(AUTH_CONFIG.google.successRedirect);
  }
);

// Facebook maršrutai (nepakeisti)
router.get("/facebook", (req, res, next) => {
  logAuthEvent("facebook_autentifikacija_pradeta", { ip: req.ip });
  passport.authenticate("facebook", {
    scope: AUTH_CONFIG.facebook.scope,
    callbackURL: process.env.FACEBOOK_CALLBACK_URL
  })(req, res, next);
});

router.get("/facebook/callback", 
  passport.authenticate("facebook", { 
    failureRedirect: AUTH_CONFIG.facebook.failureRedirect,
    session: true
  }),
  (req, res) => {
    logAuthEvent("facebook_autentifikacija_pavyko", { userId: req.user.id });
    res.redirect(AUTH_CONFIG.facebook.successRedirect);
  }
);

// Atsijungimo maršrutas
router.get("/atsijungti", validateSession, (req, res) => {
  req.logout((err) => {
    if (err) {
      logAuthEvent("atsijungimo_klaida", { 
        userId: req.user?.id,
        error: err.message 
      });
      return res.status(500).json({ success: false });
    }
    logAuthEvent("atsijungimas_pavyko", { userId: req.user?.id });
    res.redirect(process.env.FRONTEND_URL);
  });
});

module.exports = router;
