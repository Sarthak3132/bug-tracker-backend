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
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetLink = `${frontendUrl}/reset-password?token=${token}`;
  console.log('Reset link generated:', resetLink);

  // Compose email subject and HTML body
  const subject = 'Reset Your Bug Tracker Password';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🐛 Bug Tracker</h1>
        <p style="color: #e8e8e8; margin: 10px 0 0 0; font-size: 16px;">Password Reset Request</p>
      </div>
      
      <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h2 style="color: #333; margin-top: 0;">Hello ${user.name || 'there'},</h2>
        
        <p style="color: #666; line-height: 1.6; font-size: 16px;">We received a request to reset your Bug Tracker account password. If you made this request, click the button below to set a new password:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">Reset My Password</a>
        </div>
        
        <p style="color: #666; line-height: 1.6; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="background: #f5f5f5; padding: 15px; border-radius: 5px; word-break: break-all; font-family: monospace; font-size: 14px; color: #333;">${resetLink}</p>
        
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #856404; font-size: 14px;">⚠️ <strong>Security Notice:</strong> This link will expire in 1 hour for your security.</p>
        </div>
        
        <p style="color: #666; line-height: 1.6; font-size: 14px;">If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">This email was sent by Bug Tracker System<br>© ${new Date().getFullYear()} Bug Tracker. All rights reserved.</p>
      </div>
    </div>
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