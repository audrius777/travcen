const express = require("express");
const passport = require("passport");
const router = express.Router();
const { logAuthEvent } = require("../utils/logger");
const { validateSession } = require("../middleware/auth");

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
