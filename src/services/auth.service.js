const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const { generateToken } = require('../config/jwt');
const crypto = require('crypto');
const { sendEmail } = require('./email.service');

const registerUser = async (userData) => {
  // 1. Check if a user already exists with this email
  const existing = await User.findOne({ email: userData.email });
  if (existing) throw new Error('Email already registered');

  // 2. Create a new user instance (password hashing is handled in userSchema pre-save hook)
  const user = new User(userData);
  await user.save();

  // 3. Prepare JWT payload
  const payload = { id: user._id, email: user.email, role: user.role };
  const token = generateToken(payload);

  // 4. Return token and safe user info
  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
};

const loginUser = async (email, password) => {
  // 1. Find user by email
  const user = await User.findOne({ email });
  if (!user || !user.password) throw new Error('Invalid credentials');

  // 2. Compare plaintext password with hashed password in DB
  const isMatch = await user.matchPassword(password); 
  if (!isMatch) throw new Error('Invalid credentials');

  // 3. Prepare data for JWT payload
  const payload = { id: user._id, email: user.email, role: user.role };

  // 4. Generate JWT token
  const token = generateToken(payload);

  // 5. Return token and safe user info
  return { 
    token, 
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  };
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const match = await user.matchPassword(currentPassword);
  if (!match) throw new Error('Current password is incorrect');

  user.password = newPassword; // triggers pre-save hook
  await user.save();

  return { message: 'Password changed successfully' };
};

const requestPasswordReset = async (email) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("No user found with that email");

  // Generate secure token
  const token = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 3600 * 1000; // 1 hour expiry
  await user.save();

  // Create a password reset link for your frontend
  const resetLink = `http://your-frontend.com/reset-password?token=${token}`;

  // Compose email subject and HTML body
  const subject = 'Reset your Bug Tracker password';
  const html = `
  <p>Hello ${user.name || ''},</p>
  <p>You requested a password reset for your Bug Tracker account.</p>
  <p>Please <a href="${resetLink}">click here to reset your password</a> or copy and paste the following URL into your browser:</p>
  <p>${resetLink}</p>
  <p>This link will expire in 1 hour.</p>
  <p>If you did not request this, you can safely ignore this email.</p>
  `;

  // Send the email
  await sendEmail(user.email, subject, html);

  return { message: 'Password reset instructions have been sent to your email.' };
  // For dev/testing, show token in response. In production, only send by email.
};

const resetPassword = async (token, newPassword) => {
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() }
  });
  if (!user) throw new Error("Reset token is invalid or has expired");

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return { message: 'Password has been reset successfully' };
};


module.exports = {
  registerUser,
  loginUser,
  changePassword,
  requestPasswordReset,
  resetPassword,
};