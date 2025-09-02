const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user.model'); // adjust path to user model

passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;
    
    // First check if user exists with this Google ID
    let user = await User.findOne({ googleId: profile.id });
    
    if (!user) {
      // Check if user exists with this email (registered normally)
      user = await User.findOne({ email: email });
      
      if (user) {
        // User exists with email, link Google account
        user.googleId = profile.id;
        await user.save();
      } else {
        // Create new user
        user = await User.create({
          googleId: profile.id,
          name: profile.displayName,
          email: email
        });
      }
    }
    
    return done(null, user);
  } catch (err) {
    console.error('Error in GoogleStrategy verify callback:', err);
    return done(err, null);
  }
}));
