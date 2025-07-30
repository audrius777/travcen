const express = require("express");
const passport = require("passport");
const router = express.Router();
const jwt = require('jsonwebtoken');
const { logAuthEvent } = require("../utils/logger");
const { validateSession } = require("../middleware/auth");
const { verifyGoogleToken } = require("../passport");
const User = require("../models/user");

// Optimizuota konfigūracija
const AUTH_CONFIG = {
  google: {
    scope: ["email"],
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
  },
  guest: {
    sessionDuration: '24h' // Svečio sesijos trukmė
  }
};

// Naujas svečio prisijungimo endpoint'as
router.post("/auth/guest", async (req, res) => {
  try {
    logAuthEvent("guest_session_created", { ip: req.ip });
    
    // Sukuriame laikiną JWT tokeną svečiui
    const guestToken = jwt.sign(
      { 
        role: 'guest',
        createdAt: new Date(),
        sessionType: 'guest'
      },
      process.env.JWT_SECRET,
      { expiresIn: AUTH_CONFIG.guest.sessionDuration }
    );

    // Nustatome saugų cookie
    res.cookie('authToken', guestToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 valandos
    });

    return res.json({ 
      success: true,
      redirectUrl: AUTH_CONFIG.google.successRedirect // Naudojame tą patį redirect URL kaip ir Google
    });

  } catch (error) {
    logAuthEvent("guest_session_failed", { 
      error: error.message,
      ip: req.ip
    });
    return res.status(500).json({ 
      success: false, 
      error: 'Nepavyko sukurti svečio sesijos' 
    });
  }
});

// Patobulintas Google token-based endpoint'as (liko nepakitęs)
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

// Likusi autentifikacijos logika (Google OAuth, Facebook) lieka nepakita
// ... (visas kitas kodas iš originalaus auth.js failo)

module.exports = router;
