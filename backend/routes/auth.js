const express = require("express");
const passport = require("passport");
const router = express.Router();
const { logAuthEvent } = require("../utils/logger");
const { validateSession } = require("../middleware/auth");
const { verifyGoogleToken } = require("../passport");
const User = require("../models/user");

// Atnaujinta konfigūracija su tiksliu callbackURL
const AUTH_CONFIG = {
  google: {
    scope: ["profile", "email"],
    failureRedirect: `${process.env.FRONTEND_URL}/prisijungimas?klaida=autentifikacija`,
    successRedirect: process.env.FRONTEND_URL,
    callbackURL: process.env.GOOGLE_CALLBACK_URL, // Įtrauktas callbackURL
    prompt: "select_account"
  },
  facebook: {
    scope: ["email"],
    failureRedirect: `${process.env.FRONTEND_URL}/prisijungimas?klaida=autentifikacija`,
    successRedirect: process.env.FRONTEND_URL
  }
};

// Patobulintas Google prisijungimo endpoint'as (token-based)
router.post("/auth/google/token", async (req, res) => {
  try {
    logAuthEvent("google_token_autentifikacija_pradeta", { ip: req.ip });
    
    if (!req.body.token) {
      throw new Error("Trūksta autentifikacijos tokeno");
    }

    const payload = await verifyGoogleToken(req.body.token);
    const email = payload.email;
    
    if (!email) {
      throw new Error("Google paskyboje nerastas el. paštas");
    }

    let user = await User.findOne({ 
      $or: [
        { googleId: payload.sub },
        { email: email.toLowerCase() }
      ]
    });

    if (!user) {
      user = await User.create({
        googleId: payload.sub,
        email: email.toLowerCase(),
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

// Atnaujinti Google maršrutai su tiksliu callbackURL
router.get("/auth/google", (req, res, next) => {
  logAuthEvent("google_oauth_pradeta", { ip: req.ip });
  passport.authenticate("google", {
    ...AUTH_CONFIG.google,
    callbackURL: AUTH_CONFIG.google.callbackURL // Užtikrinamas tinkamas callbackURL
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
  // ... (likusi implementacija)
});

// Atsijungimo maršrutas (nepakeistas)
router.get("/atsijungti", validateSession, (req, res) => {
  // ... (likusi implementacija)
});

module.exports = router;
