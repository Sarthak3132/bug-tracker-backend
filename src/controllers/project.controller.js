const Project = require('../models/project.model');
const mongoose = require('mongoose');

const getAllProjects = async (req, res) => {
  try {
    console.log('Logged in user id:', req.user._id);

    const userId = new mongoose.Types.ObjectId(req.user._id);
    console.log('Using userId for query:', userId);

    const projects = await Project.find({
      members: { $elemMatch: { userId: userId } }
    }).populate('createdBy', 'name email');

    console.log(`Projects found for user ${userId}:`, projects.length);

    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: error.message });
  }
};

const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('createdBy', 'name email');
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
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('createdBy', 'name email');
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
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
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