const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
require("dotenv").config();

// Serializacija / deserializacija (paprastas pavyzdys)
passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((user, done) => {
  done(null, user);
});

// Google Strategy (patobulinta)
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
      scope: ["profile", "email"], // Aiškiai nurodome, kokius duomenis norime gauti
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value || null;
        if (!email) {
          throw new Error("Google nepateikė el. pašto");
        }

        // Papildoma naudotojo informacija
        const user = {
          email,
          name: profile.displayName,
          avatar: profile.photos?.[0]?.value || null,
          provider: "google", // Nurodome, kad prisijungė per Google
        };

        // Čia galima pridėti logiką, kuri patikrina, ar naudotojas jau egzistuoja DB
        // Pvz.: const existingUser = await User.findOne({ email });
        done(null, user);
      } catch (error) {
        console.error("Google autentifikacijos klaida:", error);
        done(error, null);
      }
    }
  )
);

module.exports = passport;
