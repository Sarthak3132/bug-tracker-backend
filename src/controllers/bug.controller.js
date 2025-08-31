const bugService = require('../services/bug.service');
const Project = require('../models/project.model');
const mongoose = require('mongoose');

// Helper to validate if user is member of project
const verifyUserIsProjectMember = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) throw new Error('Project not found');
  const isMember = project.members.some(m => m.userId.toString() === userId.toString());
  if (!isMember) throw new Error('User is not a member of the project');
};

// Create a new bug
const createBug = async (req, res) => {
  try {
    const { title, description, priority, status, assignedTo } = req.body;

    // Basic validation
    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required" });
    }

    // Verify assigned user is member if assignedTo set
    if (assignedTo) {
      await verifyUserIsProjectMember(req.params.projectId, assignedTo);
    }

    const bugData = {
      title,
      description,
      priority: priority || 'medium',
      status: status || 'open',
      assignedTo: assignedTo || null,
      reportedBy: req.user ? req.user._id : null,
      project: req.params.projectId,
    };

    const savedBug = await bugService.createBug(bugData);
    res.status(201).json(savedBug);

  } catch (error) {
    console.error("Create Bug Error:", error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: "Validation Error", errors: messages });
    }
    if (error.message === 'Project not found' || error.message === 'User is not a member of the project') {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Server error" });
  }
};

// Get all bugs, with optional filtering via query params
const getAllBugs = async (req, res) => {
  try {
    const filter = { project: req.params.projectId };

    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;
    if (req.query.reportedBy) filter.reportedBy = req.query.reportedBy;
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) filter.createdAt.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.createdAt.$lte = new Date(req.query.endDate);
    }
    if (req.query.searchText) {
      filter.$or = [
        { title: { $regex: req.query.searchText, $options: "i" } },
        { description: { $regex: req.query.searchText, $options: "i" } },
      ];
    }

    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = parseInt(req.query.skip) || 0;

    const sortField = req.query.sortBy || 'createdAt';
    const sortOrderRaw = req.query.sortOrder || 'desc';
    if (!['asc', 'desc'].includes(sortOrderRaw.toLowerCase())) {
      return res.status(400).json({ message: 'sortOrder must be "asc" or "desc"' });
    }
    const sortOrder = sortOrderRaw.toLowerCase() === 'asc' ? 1 : -1;

    const allowedSortFields = ['createdAt', 'priority', 'status', 'title'];
    if (!allowedSortFields.includes(sortField)) {
      return res.status(400).json({ message: `Invalid sortBy field. Allowed fields: ${allowedSortFields.join(', ')}` });
    }

    const sortOption = { [sortField]: sortOrder };

    const totalCount = await bugService.countBugs(filter);

    const bugs = await bugService.getAllBugs(filter, { sort: sortOption, skip, limit });

    res.json({ totalCount, limit, skip, bugs });

  } catch (error) {
    console.error("Get All Bugs Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get a single bug by ID
const getBugById = async (req, res) => {
  try {
    const bug = await bugService.getBugById(req.params.bugId);
    if (!bug) {
      return res.status(404).json({ message: "Bug not found" });
    }
    res.json(bug);
  } catch (error) {
    console.error("Get Bug Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update a bug by ID
const updateBug = async (req, res) => {
  try {
    // Verify assigned user membership if assignedTo set in update
    if (req.body.assignedTo) {
      await verifyUserIsProjectMember(req.params.projectId, req.body.assignedTo);
    }

    const updatedBug = await bugService.updateBug(req.params.bugId, req.body, req.user._id);
    if (!updatedBug) {
      return res.status(404).json({ message: "Bug not found" });
    }
    res.json(updatedBug);
  } catch (error) {
    console.error("Update Bug Error:", error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: "Validation Error", errors: messages });
    }
    if (error.message === 'Project not found' || error.message === 'User is not a member of the project') {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Server error" });
  }
};

// Delete a bug by ID
const deleteBug = async (req, res) => {
  try {
    const deleted = await bugService.deleteBug(req.params.bugId);
    if (!deleted) {
      return res.status(404).json({ message: "Bug not found" });
    }
    res.json({ message: "Bug deleted successfully" });
  } catch (error) {
    console.error("Delete Bug Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Assign bug to a user
const assignBug = async (req, res) => {
  try {
    const { bugId } = req.params;
    const { assignedTo } = req.body;

    if (!assignedTo) {
      return res.status(400).json({ message: 'assignedTo user ID is required' });
    }

    // Validate assigned user membership in project
    // Make sure projectId is in params as well
    await verifyUserIsProjectMember(req.params.projectId, assignedTo);

    const updatedBug = await bugService.assignBug(bugId, assignedTo);

    if (!updatedBug) {
      return res.status(404).json({ message: 'Bug not found' });
    }

    res.json(updatedBug);
  } catch (error) {
    console.error('Assign Bug Error:', error);

    if (error.message.includes('invalid') || error.message === 'User is not a member of the project' || error.message === 'Project not found') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Add a comment to a bug
const addBugComment = async (req, res) => {
  try {
    const { bugId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!content) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const updatedBug = await bugService.addComment(bugId, userId, content);
    if (!updatedBug) {
      return res.status(404).json({ message: 'Bug not found' });
    }
    res.json(updatedBug);
  } catch (error) {
    console.error('Add Comment Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createBug,
  getAllBugs,
  getBugById,
  updateBug,
  deleteBug,
  assignBug,
  addBugComment,
};
