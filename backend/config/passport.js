const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("./models/user");
require("dotenv").config();

// Serializacija/deserializacija
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-__v');
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://travcen-backendas.onrender.com/auth/google/callback", // Fiksuotas URL (be process.env)
      scope: ["profile", "email"],
      passReqToCallback: true,
      proxy: true,
      state: true
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          throw new Error("Google paskyboje nerastas el. paštas");
        }

        let user = await User.findOne({ 
          $or: [
            { googleId: profile.id },
            { email: email.toLowerCase() }
          ]
        });

        if (!user) {
          user = await User.create({
            googleId: profile.id,
            email: email.toLowerCase(),
            name: profile.displayName,
            avatar: profile.photos?.[0]?.value,
            provider: "google",
            role: email === process.env.ADMIN_EMAIL ? "admin" : "user"
          });
        } else if (!user.googleId) {
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
