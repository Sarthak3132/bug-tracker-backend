const validator = require('validator');

const validateProfileUpdate = (req, res, next) => {
  const { name, bio, avatar } = req.body;

  if (name && typeof name !== 'string') {
    return res.status(400).json({ error: 'Name must be a string' });
  }

  if (bio && (typeof bio !== 'string' || bio.length > 300)) {
    return res.status(400).json({ error: 'Bio must be a string max 300 characters' });
  }

  if (avatar && !validator.isURL(avatar)) {
    return res.status(400).json({ error: 'Avatar must be a valid URL' });
  }

  next();
};

module.exports = validateProfileUpdate;
