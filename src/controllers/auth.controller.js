const authService = require('../services/auth.service');

// ---------------- REGISTER ----------------
const register = async (req, res) => {
  try {
    // Call service with data from request body
    const { token, user } = await authService.registerUser(req.body);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ---------------- LOGIN ----------------
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Call service with email & password
    const { token, user } = await authService.loginUser(email, password);

    res.json({
      message: 'Login successful',
      token,
      user
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

// ---------------- LOGOUT ----------------
const logout = async (req, res) => {
  // In a stateless JWT setup, logout = client removes token
  res.json({ message: 'Logged out successfully' });
};

const changePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current and new password are required." });
    }

    const result = await authService.changePassword(userId, currentPassword, newPassword);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Request password reset
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required." });

    const result = await authService.requestPasswordReset(email);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Reset via token
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token and new password are required." });
    }
    const result = await authService.resetPassword(token, newPassword);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};



module.exports = {
  register,
  login,
  logout,
  changePassword,
  forgotPassword,
  resetPassword,
};
