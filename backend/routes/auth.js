const express = require("express");
const passport = require("passport");
const router = express.Router();
const { logAuthEvent } = require("../utils/logger");
const { validateSession } = require("../middleware/auth");

// Konfigūracija
const AUTH_CONFIG = {
  google: {
    scope: ["profile", "email"],
    failureRedirect: "/prisijungimas?klaida=autentifikacija",
    successRedirect: "/dashboard"
  },
  facebook: {
    scope: ["email"],
    failureRedirect: "/prisijungimas?klaida=autentifikacija",
    successRedirect: "/dashboard"
  }
};

// Google autentifikacijos maršrutai
router.get("/google", (req, res, next) => {
  logAuthEvent("google_autentifikacija_pradeta", { ip: req.ip });
  passport.authenticate("google", AUTH_CONFIG.google)(req, res, next);
});

router.get("/google/callback", 
  passport.authenticate("google", AUTH_CONFIG.google),
  (req, res) => {
    logAuthEvent("google_autentifikacija_pavyko", { userId: req.user.id });
    res.redirect(AUTH_CONFIG.google.successRedirect);
  }
);

// Facebook autentifikacijos maršrutai
router.get("/facebook", (req, res, next) => {
  logAuthEvent("facebook_autentifikacija_pradeta", { ip: req.ip });
  passport.authenticate("facebook", AUTH_CONFIG.facebook)(req, res, next);
});

router.get("/facebook/callback",
  passport.authenticate("facebook", AUTH_CONFIG.facebook),
  (req, res) => {
    logAuthEvent("facebook_autentifikacija_pavyko", { userId: req.user.id });
    res.redirect(AUTH_CONFIG.facebook.successRedirect);
  }
);

// Atsijungimo maršrutas
router.get("/atsijungti", validateSession, (req, res) => {
  const userId = req.user?.id;
  
  req.logout((err) => {
    if (err) {
      logAuthEvent("atsijungti_nepavyko", { userId, error: err.message });
      return res.status(500).render("klaida", { 
        message: "Atsijungimo klaida" 
      });
    }

    req.session.destroy((err) => {
      if (err) {
        logAuthEvent("sesijos_sunaikinimas_nepavyko", { userId, error: err.message });
        return res.status(500).render("klaida", {
          message: "Sesijos sunaikinimo klaida"
        });
      }
      
      logAuthEvent("atsijungimas_pavyko", { userId });
      res.clearCookie("connect.sid");
      res.redirect("/prisijungimas?atsijungta=sėkmingai");
    });
  });
});

module.exports = router;
