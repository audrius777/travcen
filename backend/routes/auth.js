const express = require("express");
const passport = require("passport");
const router = express.Router();
const jwt = require('jsonwebtoken');
const { logAuthEvent } = require("../utils/logger");
const { validateSession, validateGuestSession } = require("../middleware/auth");
const { verifyGoogleToken } = require("../passport");
const User = require("../models/user");

// Auth konfigūracija
const AUTH_CONFIG = {
  google: {
    scope: ["email"],
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth`,
    successRedirect: process.env.FRONTEND_URL,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    prompt: "select_account",
    accessType: "online"
  },
  facebook: {
    scope: ["email"],
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth`,
    successRedirect: process.env.FRONTEND_URL
  },
  guest: {
    sessionDuration: '24h',
    permissions: ['browse', 'search', 'view_offers']
  }
};

// Svečio prisijungimo endpoint'as
router.post("/guest", async (req, res) => {
  try {
    const guestId = `guest_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    logAuthEvent("guest_session_created", { 
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      guestId: guestId
    });
    
    const guestToken = jwt.sign(
      { 
        guestId: guestId,
        role: 'guest',
        createdAt: new Date(),
        sessionType: 'guest',
        permissions: AUTH_CONFIG.guest.permissions
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: AUTH_CONFIG.guest.sessionDuration,
        issuer: 'travcen-guest-auth'
      }
    );

    // Nustatome cookies
    res.cookie('authToken', guestToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });

    return res.json({ 
      success: true,
      guestId: guestId,
      token: guestToken,
      expiresIn: AUTH_CONFIG.guest.sessionDuration,
      redirectUrl: AUTH_CONFIG.google.successRedirect,
      permissions: AUTH_CONFIG.guest.permissions
    });

  } catch (error) {
    logAuthEvent("guest_session_failed", { 
      error: error.message,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
    
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to create guest session',
      systemError: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Google prisijungimas per API
router.post("/google", async (req, res) => {
  try {
    if (!req.body.token) {
      throw new Error("Missing authentication token");
    }

    const payload = await verifyGoogleToken(req.body.token);
    
    if (!payload.email_verified) {
      throw new Error("Google email not verified");
    }

    const email = payload.email.toLowerCase();
    let user = await User.findOne({ 
      $or: [
        { googleId: payload.sub },
        { email: email }
      ]
    });

    if (!user) {
      user = await User.create({
        googleId: payload.sub,
        email: email,
        name: payload.name || email.split('@')[0],
        avatar: payload.picture || null,
        provider: "google",
        role: email === process.env.ADMIN_EMAIL ? "admin" : "user"
      });
    } else if (!user.googleId) {
      user.googleId = payload.sub;
      user.avatar = payload.picture || user.avatar;
      await user.save();
    }

    req.login(user, (err) => {
      if (err) {
        logAuthEvent("google_auth_error", { 
          error: err.message,
          email: email
        });
        return res.status(401).json({ 
          success: false, 
          error: "User session error" 
        });
      }
      
      // Išvalome svečio cookie
      res.clearCookie('authToken');
      
      logAuthEvent("google_auth_success", { userId: user.id });
      res.json({ 
        success: true, 
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role
        }
      });
    });
  } catch (error) {
    logAuthEvent("google_auth_failed", { 
      error: error.message,
      token: req.body.token ? "provided" : "missing"
    });
    res.status(401).json({ 
      success: false, 
      error: "Authentication failed",
      details: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
});

// Partnerio nukreipimo endpoint'as
router.post("/redirect-partner", 
  validateGuestSession, 
  async (req, res) => {
    try {
      const { partnerId, offerId } = req.body;
      
      if (!partnerId || !offerId) {
        throw new Error("Missing partner or offer ID");
      }

      logAuthEvent("partner_redirect", {
        guestId: req.guestSession?.id || 'unknown',
        partnerId,
        offerId,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });

      return res.json({
        success: true,
        redirectUrl: `https://partner-${partnerId}.com/offers/${offerId}?ref=travcen&guestId=${req.guestSession?.id || ''}`
      });

    } catch (error) {
      logAuthEvent("partner_redirect_error", {
        error: error.message,
        partnerId: req.body.partnerId,
        ip: req.ip
      });
      return res.status(400).json({
        success: false,
        error: "Failed to generate redirect URL"
      });
    }
  }
);

// Google OAuth maršrutai
router.get("/google", (req, res, next) => {
  logAuthEvent("google_oauth_started", { ip: req.ip });
  passport.authenticate("google", {
    scope: AUTH_CONFIG.google.scope,
    prompt: AUTH_CONFIG.google.prompt,
    accessType: AUTH_CONFIG.google.accessType,
    callbackURL: AUTH_CONFIG.google.callbackURL
  })(req, res, next);
});

router.get("/google/callback", 
  passport.authenticate("google", { 
    failureRedirect: AUTH_CONFIG.google.failureRedirect,
    session: true
  }),
  (req, res) => {
    logAuthEvent("google_oauth_success", { userId: req.user.id });
    res.redirect(AUTH_CONFIG.google.successRedirect);
  }
);

// Facebook maršrutai
router.get("/facebook", (req, res, next) => {
  logAuthEvent("facebook_auth_started", { ip: req.ip });
  passport.authenticate("facebook", {
    scope: AUTH_CONFIG.facebook.scope,
    callbackURL: process.env.FACEBOOK_CALLBACK_URL
  })(req, res, next);
});

router.get("/facebook/callback", 
  passport.authenticate("facebook", { 
    failureRedirect: AUTH_CONFIG.facebook.failureRedirect,
    session: true
  }),
  (req, res) => {
    logAuthEvent("facebook_auth_success", { userId: req.user.id });
    res.redirect(AUTH_CONFIG.facebook.successRedirect);
  }
);

// Atsijungimo maršrutas
router.get("/logout", validateSession, (req, res) => {
  req.logout((err) => {
    if (err) {
      logAuthEvent("logout_error", { 
        userId: req.user?.id,
        error: err.message 
      });
      return res.status(500).json({ success: false });
    }
    logAuthEvent("logout_success", { userId: req.user?.id });
    res.clearCookie('authToken');
    res.redirect(process.env.FRONTEND_URL);
  });
});

module.exports = router;
