const Project = require('../models/project.model');
const mongoose = require('mongoose');

const projectRoleCheck = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      const userId = req.user._id.toString();
      const projectId = req.params.projectId || req.params.id || req.body.projectId;

      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ message: 'Invalid project ID format' });
      }

      const project = await Project.findById(projectId);

      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      const member = project.members.find(m => m.userId.toString() === userId);

      if (!member) {
        return res.status(403).json({ message: 'Access denied: Not a member of the project' });
      }

      if (!allowedRoles.includes(member.role)) {
        return res.status(403).json({ message: `Access denied: Requires role(s) ${allowedRoles.join(', ')}` });
      }

      // Optionally attach member info to req for route handlers
      req.projectMember = member;
      req.project = project;

      next();
    } catch (error) {
      console.error('Project role check error:', error);
      res.status(500).json({ message: 'Server error during project role check' });
    }
  };
};

module.exports = projectRoleCheck;
