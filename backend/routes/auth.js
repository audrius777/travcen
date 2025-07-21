const express = require("express");
const passport = require("passport");
const router = express.Router();

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => res.redirect("/")
);

router.get("/facebook", passport.authenticate("facebook", { scope: ["email"] }));
router.get("/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "/" }),
  (req, res) => res.redirect("/")
);

router.get("/logout", (req, res) => {
  req.logout(err => {
    if (err) return res.status(500).send("Atsijungimo klaida");
    req.session.destroy(() => res.redirect("/"));
  });
});

module.exports = router;
