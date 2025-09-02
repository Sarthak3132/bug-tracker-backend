const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: {
    validator: validator.isEmail,
    message: 'Please provide a valid email address',
  }
  },
  password: {
    type: String,
    minlength: 6,
    required: function () {
      // Only require password if not a Google OAuth user
      return !this.googleId;
    }
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  role: {
    type: String,
    enum: ['admin', 'developer', 'tester'],
    default: 'developer',
  },
  avatar: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    maxlength: 300,
    trim: true
  },
  contactPreferences: {
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false }
  },
  resetPasswordToken: {
  type: String
  },
  resetPasswordExpires: {
  type: Date
  }
}, {
  timestamps: true,
});



userSchema.pre('save', async function(next) {
  // Only hash if password exists and was changed
  if (this.password && this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  if (!this.password) return false; // no password for OAuth users
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);