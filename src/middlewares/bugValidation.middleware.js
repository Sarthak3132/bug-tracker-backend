const { query, validationResult } = require('express-validator');

const validateBugQueryParams = [
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('sortOrder must be "asc" or "desc"'),
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('priority must be one of "low", "medium", "high"'),
  query('status')
    .optional()
    .isIn(['open', 'in-progress', 'closed', 'resolved'])
    .withMessage('status must be one of "open", "in-progress", "closed", "resolved"'),
];

const checkValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = {
  validateBugQueryParams,
  checkValidationErrors,
};
