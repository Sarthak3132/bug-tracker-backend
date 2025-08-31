const rateLimit = require('express-rate-limit');

// Limit login attempts: max 5 requests per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts from this IP, please try again after 15 minutes.'
});

// Limit password reset requests: max 5 per hour per IP
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many password reset requests from this IP, please try again after an hour.'
});

module.exports = {
  loginLimiter,
  passwordResetLimiter
};
