const Project = require('../models/project.model');
const mongoose = require('mongoose');

const getAllProjects = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);

    const projects = await Project.find({
      members: { $elemMatch: { userId: userId } }
    }).populate('createdBy', 'name email');

    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: error.message });
  }
};

const getProjectById = async (req, res) => {
  try {
    const projectId = req.params.projectId || req.params.id;
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: 'Invalid project ID format' });
    }
    const project = await Project.findById(projectId)
      .populate('createdBy', 'name email')
      .populate('members.userId', 'name email');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createProject = async (req, res) => {
  try {
    const project = new Project({
      ...req.body,
      createdBy: req.user._id,
      members: [{
        userId: req.user._id,
        role: 'admin'
      }]
    });
    await project.save();
    await project.populate('createdBy', 'name email');
    res.status(201).json(project);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateProject = async (req, res) => {
  try {
    const projectId = req.params.projectId || req.params.id;
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: 'Invalid project ID format' });
    }
    const project = await Project.findByIdAndUpdate(
      projectId,
      req.body,
      { new: true }
    ).populate('createdBy', 'name email')
     .populate('members.userId', 'name email');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteProject = async (req, res) => {
  try {
    const projectId = req.params.projectId || req.params.id;
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: 'Invalid project ID format' });
    }
    
    // First find the project to check permissions
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if user is admin of this project
    const userMember = project.members.find(m => m.userId.toString() === req.user._id.toString());
    if (!userMember || userMember.role !== 'admin') {
      return res.status(403).json({ message: 'Only project admins can delete projects' });
    }
    
    // Delete the project
    await Project.findByIdAndDelete(projectId);
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Add member
const addMember = async (req, res) => {
  const { projectId } = req.params;
  const { userId, role } = req.body;

  if (!userId || !role) {
    return res.status(400).json({ message: 'userId and role are required' });
  }

  if (!['admin', 'developer', 'tester'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  try {
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const existingMember = project.members.find(m => m.userId.toString() === userId);
    if (existingMember) return res.status(409).json({ message: 'User already a member' });

    project.members.push({
      userId: new mongoose.Types.ObjectId(userId),
      role: role,
    });
    await project.save();

    res.status(201).json({ message: 'Member added successfully', members: project.members });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove member
const removeMember = async (req, res) => {
  const { projectId, memberId } = req.params;

  try {
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const memberIndex = project.members.findIndex(m => m._id.toString() === memberId);
    if (memberIndex === -1) return res.status(404).json({ message: 'Member not found' });

    project.members.splice(memberIndex, 1);
    await project.save();

    res.json({ message: 'Member removed successfully', members: project.members });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get project members
const getProjectMembers = async (req, res) => {
  const { projectId } = req.params;

  try {
    const project = await Project.findById(projectId).populate('members.userId', 'name email');
    if (!project) return res.status(404).json({ message: 'Project not found' });

    res.json(project.members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  getProjectMembers,
};