const express = require('express');
const {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  getProjectMembers,
} = require('../controllers/project.controller');

const authMiddleware = require('../middlewares/auth.middleware');
const projectRoleCheck = require('../middlewares/projectRoleCheck.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getAllProjects);
router.get('/:id', getProjectById);
router.post('/', createProject);
router.put('/:projectId', projectRoleCheck(['admin']), updateProject);
router.delete('/:projectId', projectRoleCheck(['admin']), deleteProject);

router.get('/:projectId/members', projectRoleCheck(['admin', 'developer', 'tester']), getProjectMembers);
router.post('/:projectId/members', projectRoleCheck(['admin']), addMember);
router.delete('/:projectId/members/:memberId', projectRoleCheck(['admin']), removeMember);

module.exports = router;