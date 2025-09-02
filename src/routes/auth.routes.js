const express = require('express');
const authController = require('../controllers/auth.controller');
const passport = require('passport'); 
const { generateToken } = require('../config/jwt');
const { loginLimiter, passwordResetLimiter } = require('../middlewares/rateLimiters');
const authMiddleware = require('../middlewares/auth.middleware');
const router = express.Router();

router.post('/login', loginLimiter, authController.login);
router.post('/forgot-password', passwordResetLimiter, authController.forgotPassword);
router.post('/reset-password', passwordResetLimiter, authController.resetPassword);

router.post('/register', authController.register);
router.post('/logout', authController.logout);
router.post('/change-password', authMiddleware, authController.changePassword);

router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/test', (req, res) => {
  res.json({ message: "Auth router is working" });
});

// Google OAuth callback route
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: 'http://localhost:3000/login' }), 
  (req, res) => {
    if (!req.user) {
      return res.redirect('http://localhost:3000/login?error=auth_failed');
    }
    const payload = {
      id: req.user._id,
      email: req.user.email,
    };
    const token = generateToken(payload);
    res.redirect(`http://localhost:3000/oauth-callback?token=${token}`);
  }
);

module.exports = router;
