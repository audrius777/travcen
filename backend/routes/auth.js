import express from "express";
import passport from "passport";
import { logAuthEvent } from "../utils/logger.js";
import { validateSession } from "../middleware/auth.js";

const router = express.Router();

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
