const User = require('../models/user.model');

/**
 * GET /api/users/profile
 * Authenticated user gets their profile
 */
const getProfile = async (req, res) => {
  try {
    // req.user is set by authMiddleware
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.avatar) {
      user.avatar = user.avatar.replace(/\\/g, '/');
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * PUT /api/users/profile
 * Authenticated user updates their profile
 */
const updateProfile = async (req, res) => {
  try {
    // Only allow specific fields to be updated for security
    const allowedUpdates = ['name', 'avatar', 'bio', 'contactPreferences']; // You may limit role updates to admins
    const updates = {};

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true}
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (updatedUser.avatar) {
      updatedUser.avatar = updatedUser.avatar.replace(/\\/g, '/');
    }
    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/users
 * Admin only - gets all users
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('Error getting users list:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getAllUsers,
};
