const express = require('express');
const router = express.Router({ mergeParams: true });
const { createBug, getAllBugs, getBugById, updateBug, deleteBug, assignBug, addBugComment } = require('../controllers/bug.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const projectRoleCheck = require('../middlewares/projectRoleCheck.middleware');
const { validateBugQueryParams, checkValidationErrors } = require('../middlewares/bugValidation.middleware');


router.use(authMiddleware);

//get all bugs in project - all project members allowed 
router.get(
  '/',
  projectRoleCheck(['admin', 'developer', 'tester']),
  validateBugQueryParams,
  checkValidationErrors,
  getAllBugs
);

// Create Bug - Only admins and developers
router.post(
  '/',
  projectRoleCheck(['admin', 'developer']),
  createBug
);

// Assign a bug to a user - only admin and developer can do this
router.put(
  '/:bugId/assign',
  projectRoleCheck(['admin', 'developer']),
  assignBug
);

// add a comment 
router.post(
  '/:bugId/comments',
  projectRoleCheck(['admin', 'developer', 'tester']),
  addBugComment
);


// Update Bug - Only admins and developers
router.put(
  '/:bugId',
  projectRoleCheck(['admin', 'developer']),
  updateBug
);

// Delete Bug - Only admins
router.delete(
  '/:bugId',
  projectRoleCheck(['admin']),
  deleteBug
);

// Get Bug - All project members allowed
router.get(
  '/:bugId',
  projectRoleCheck(['admin', 'developer', 'tester']),
  getBugById
);

module.exports = router;