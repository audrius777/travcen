const passport = require("passport");
const { OAuth2Client } = require('google-auth-library');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const User = require("./models/user");
require("dotenv").config();

// Inicializuojame Google klientą
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

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

// Svečio strategija
passport.use('guest', new JwtStrategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
    passReqToCallback: true
  },
  (req, jwtPayload, done) => {
    try {
      if (jwtPayload.role === 'guest') {
        // Sukuriame minimalų vartotojo objektą svečiui
        const guestUser = {
          role: 'guest',
          sessionType: 'guest',
          createdAt: jwtPayload.createdAt
        };
        return done(null, guestUser);
      }
      return done(null, false);
    } catch (error) {
      return done(error, false);
    }
  }
));

// Middleware svečių tikrinimui
exports.allowGuest = (req, res, next) => {
  passport.authenticate('guest', { session: false }, (err, user, info) => {
    if (err) {
      return res.status(500).json({ error: 'Serverio klaida' });
    }
    if (!user) {
      return res.status(401).json({ error: 'Negalima prieiga' });
    }
    req.user = user;
    next();
  })(req, res, next);
};

// Google tokeno patvirtinimo funkcija
exports.verifyGoogleToken = async (token) => {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    
    if (!payload.email_verified) {
      throw new Error("Google el. paštas nepatvirtintas");
    }

    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name || payload.email.split('@')[0],
      picture: payload.picture || null
    };
  } catch (error) {
    console.error('Google tokeno patvirtinimo klaida:', error);
    throw new Error("Neteisingas Google tokenas");
  }
};

// Google Strategy (OAuth2)
passport.use(
  new (require("passport-google-oauth20").Strategy)(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "https://travcen-backendas.onrender.com/auth/google/callback",
      scope: ['email'],
      prompt: 'select_account',
      accessType: 'online',
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
            name: profile.displayName || email.split('@')[0],
            avatar: profile.photos?.[0]?.value || null,
            provider: "google",
            role: email === process.env.ADMIN_EMAIL ? "admin" : "user"
          });
        } else if (!user.googleId) {
          user.googleId = profile.id;
          user.avatar = profile.photos?.[0]?.value || user.avatar;
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

// Facebook Strategy (paliekamas nepakeistas)
passport.use(
  new (require("passport-facebook").Strategy)(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL || "https://travcen-backendas.onrender.com/auth/facebook/callback",
      profileFields: ['id', 'emails', 'name', 'displayName', 'photos'],
      passReqToCallback: true,
      proxy: true
    },
    async (req, accessToken, refreshToken, profile, done) => {
      return done(null, false, { message: "Facebook prisijungimas laikinai išjungtas" });
    }
  )
);

module.exports = passport;
