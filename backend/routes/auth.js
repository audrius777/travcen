const express = require("express");
const passport = require("passport");
const router = express.Router();
const { logAuthEvent } = require("../utils/logger");
const { validateSession } = require("../middleware/auth");

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

// Atnaujinti Google maršrutai su /auth prefix'u
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
