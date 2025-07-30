const express = require("express");
const passport = require("passport");
const router = express.Router();
const { logAuthEvent } = require("../utils/logger");
const { validateSession } = require("../middleware/auth");
const { verifyGoogleToken } = require("../passport");

// Atnaujinta konfigūracija su env kintamaisiais
const AUTH_CONFIG = {
  google: {
    scope: ["profile", "email"],
    failureRedirect: `${process.env.FRONTEND_URL}/prisijungimas?klaida=autentifikacija`,
    successRedirect: process.env.FRONTEND_URL,
    prompt: "select_account"
  },
  facebook: {
    scope: ["email"],
    failureRedirect: `${process.env.FRONTEND_URL}/prisijungimas?klaida=autentifikacija`,
    successRedirect: process.env.FRONTEND_URL
  }
};

// Naujas Google prisijungimo endpoint'as (token-based)
router.post("/auth/google/token", async (req, res) => {
  try {
    logAuthEvent("google_token_autentifikacija_pradeta", { ip: req.ip });
    
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
        name: payload.name,
        avatar: payload.picture,
        provider: "google",
        role: email === process.env.ADMIN_EMAIL ? "admin" : "user"
      });
    } else if (!user.googleId) {
      user.googleId = payload.sub;
      user.avatar = payload.picture;
      await user.save();
    }

    req.login(user, (err) => {
      if (err) {
        logAuthEvent("google_token_autentifikacija_klaida", { error: err.message });
        return res.status(401).json({ success: false, error: "Autentifikacija nepavyko" });
      }
      
      logAuthEvent("google_token_autentifikacija_pavyko", { userId: user.id });
      res.json({ 
        success: true, 
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar
        }
      });
    });
  } catch (error) {
    logAuthEvent("google_token_autentifikacija_klaida", { error: error.message });
    res.status(401).json({ success: false, error: "Autentifikacija nepavyko" });
  }
});

// Esami Google maršrutai (paliekami suderinamumui)
router.get("/auth/google", (req, res, next) => {
  logAuthEvent("google_autentifikacija_pradeta", { ip: req.ip });
  passport.authenticate("google", AUTH_CONFIG.google)(req, res, next);
});

router.get("/auth/google/callback", 
  passport.authenticate("google", AUTH_CONFIG.google),
  (req, res) => {
    logAuthEvent("google_autentifikacija_pavyko", { userId: req.user.id });
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
