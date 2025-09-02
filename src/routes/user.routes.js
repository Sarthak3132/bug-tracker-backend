const express = require('express');
const { getProfile, updateProfile, getAllUsers, searchUsers } = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const rolesMiddleware = require('../middlewares/roles.middleware');
const upload = require('../middlewares/upload.middleware');
const validateProfileUpdate = require('../middlewares/validateProfileUpdate');
const User = require('../models/user.model');
const router = express.Router();

router.use(authMiddleware);

router.get('/profile', getProfile);
router.put('/profile', validateProfileUpdate, updateProfile);
// Route to upload avatar - single file field named 'avatar'
router.post('/profile/avatar', upload.single('avatar'), async (req, res) => {
  try {
    if(!req.file) {
      return res.status(400).json({ error: 'No file uploaded or wrong field name' });
    }
    // Save file path or URL to user record
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Store relative file path (or build absolute URL as needed)
    user.avatar = req.file.path.replace(/\\/g, '/');
    await user.save();

    res.json({ message: 'Avatar uploaded successfully', avatar: user.avatar });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/search', searchUsers);
router.get('/', rolesMiddleware(['admin']), getAllUsers);

module.exports = router;