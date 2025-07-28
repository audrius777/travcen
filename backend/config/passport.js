const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("./models/user"); // Importuojame User modelį
require("dotenv").config();

// Serializacija/deserializacija su MongoDB
passport.serializeUser((user, done) => {
  done(null, user.id); // Saugome tik user ID sesijoje
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google Strategy su pilna konfigūracija
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BASE_URL}/auth/google/callback`,
      scope: ["profile", "email"],
      passReqToCallback: true,
      proxy: true, // Svarbu naudojant proxy/load balancer
      state: true // Saugumo sumetimais
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          throw new Error("Google paskyboje nerastas el. paštas");
        }

        // Ieškome ar atnaujiname vartotoją duomenų bazėje
        let user = await User.findOne({ 
          $or: [
            { googleId: profile.id },
            { email: email }
          ]
        });

        if (!user) {
          // Sukuriame naują vartotoją
          user = await User.create({
            googleId: profile.id,
            email: email,
            name: profile.displayName,
            avatar: profile.photos?.[0]?.value,
            provider: "google",
            role: email === process.env.ADMIN_EMAIL ? "admin" : "user"
          });
        } else if (!user.googleId) {
          // Atnaujiname egzistuojantį vartotoją
          user.googleId = profile.id;
          user.avatar = profile.photos?.[0]?.value;
          await user.save();
        }

        done(null, user);
      } catch (error) {
        console.error("Google autentifikacijos klaida:", error);
        done(error, null);
      }
    }
  )
);

module.exports = passport;
