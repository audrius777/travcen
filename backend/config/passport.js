const passport = require("passport");
const { OAuth2Client } = require('google-auth-library');
const User = require("./models/user");
require("dotenv").config();

// Inicializuojame Google klientą
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

// Serializacija/deserializacija (paliekama nepakitusi)
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

// Google tokeno patvirtinimo funkcija (nauja)
exports.verifyGoogleToken = async (token) => {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    return ticket.getPayload();
  } catch (error) {
    console.error('Google token verification failed:', error);
    throw error;
  }
};

// Google Strategy (paliekama suderinamumui, bet rekomenduojama naudoti tik token-based auth)
passport.use(
  new (require("passport-google-oauth20").Strategy)(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://travcen-backendas.onrender.com/auth/google/callback",
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
