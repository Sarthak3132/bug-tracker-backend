const Bug = require('../models/bug.model');
const User = require('../models/user.model');
const mongoose = require('mongoose');
const { sendEmail } = require('./email.service');

const isValidEmail = (email) => {
  const emailRegex = /\S+@\S+\.\S+/;
  return emailRegex.test(email);
};


const createBug = async (bugData) => {
  const newBug = new Bug(bugData);
  const savedBug = await newBug.save();
  
  // Send email notification if bug is assigned during creation
  if (savedBug.assignedTo) {
    try {
      const populatedBug = await getBugById(savedBug._id);
      if (populatedBug.assignedTo && populatedBug.assignedTo.email && isValidEmail(populatedBug.assignedTo.email)) {
        console.log(`Sending assignment email to ${populatedBug.assignedTo.email} for new bug ${populatedBug._id}`);
        await notifyAssignedUser(populatedBug.assignedTo.email, populatedBug);
        console.log('Assignment email sent successfully');
      }
    } catch (error) {
      console.error('Failed to send assignment email for new bug:', error);
    }
  }
  
  return savedBug;
};

const getAllBugs = async (filter, options = {}) => {
  const query = {};

  if (filter.project) {
  const projectId = typeof filter.project === 'string' ? filter.project.trim() : filter.project;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new Error('Invalid project ID format');
  }

  query.project = new mongoose.Types.ObjectId(projectId);
  } else {
  throw new Error('Project filter is required');
  }

  if (filter.status) query.status = filter.status;
  if (filter.priority) query.priority = filter.priority;
  if (filter.assignedTo) query.assignedTo = filter.assignedTo;
  if (filter.reportedBy) query.reportedBy = filter.reportedBy;

  // Date range filtering example for createdAt
  if (filter.startDate || filter.endDate) {
    query.createdAt = {};
    if (filter.startDate) query.createdAt.$gte = new Date(filter.startDate);
    if (filter.endDate) query.createdAt.$lte = new Date(filter.endDate);
  }

  // Text search on title/description using MongoDB regex or full-text search
  if (filter.searchText) {
    query.$or = [
      { title: { $regex: filter.searchText, $options: 'i' } },
      { description: { $regex: filter.searchText, $options: 'i' } }
    ];
  }

  // Pagination and sorting can be passed in options
  const bugs = await Bug.find(query)
    .populate('assignedTo', 'name email')
    .populate('reportedBy', 'name email')
    .populate('project', 'name')
    .populate('comments.author', 'name email')
    .populate('history.changedBy', 'name email')
    .sort(options.sort || { createdAt: -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 100); // Default limit

  return bugs;
};


const getBugById = async (id) => {
  return await Bug.findById(id)
    .populate('assignedTo', 'name email')
    .populate('reportedBy', 'name email')
    .populate('project', 'name')
    .populate('history.changedBy', 'name email')
    .populate('comments.author', 'name email');
};

const updateBug = async (id, updateData, userId) => {
  console.log('updateBug called with updateData:', updateData);

  const bug = await Bug.findById(id);
  if (!bug) return null;

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const now = new Date();
  const oldAssignedTo = bug.assignedTo;

  const statusComment = updateData.statusComment;
  delete updateData.statusComment;

  for (const key of Object.keys(updateData)) {
    if (!key || typeof key !== 'string') {
      console.warn('Invalid update key:', key);
      continue;
    }

    if (key === 'status') {
      if (updateData[key] !== undefined && updateData[key] !== bug[key]) {
        console.log('Pushing status history:', {
          field: key,
          oldValue: bug[key],
          newValue: updateData[key],
          comment: statusComment,
        });

        bug.history.push({
          status: updateData.status,
          field: key,
          changedBy: userObjectId,
          changedAt: now,
          oldValue: bug[key],
          newValue: updateData[key],
          comment: statusComment || '',
        });

        bug[key] = updateData[key];
      }
    } else {
      if (updateData[key] !== undefined && updateData[key] !== bug[key]) {
        console.log('Pushing history:', {
          field: key,
          oldValue: bug[key],
          newValue: updateData[key],
        });

        bug.history.push({
          field: key,
          changedBy: userObjectId,
          changedAt: now,
          oldValue: bug[key],
          newValue: updateData[key],
        });

        bug[key] = updateData[key];
      }
    }
  }

  await bug.save();
  const updatedBug = await getBugById(id);

  // Send email notification if assignedTo changed
  if (updateData.assignedTo && updateData.assignedTo !== oldAssignedTo?.toString()) {
    try {
      if (updatedBug.assignedTo && updatedBug.assignedTo.email && isValidEmail(updatedBug.assignedTo.email)) {
        console.log(`Sending assignment email to ${updatedBug.assignedTo.email} for updated bug ${updatedBug._id}`);
        await notifyAssignedUser(updatedBug.assignedTo.email, updatedBug);
        console.log('Assignment email sent successfully');
      }
    } catch (error) {
      console.error('Failed to send assignment email for updated bug:', error);
    }
  }

  return updatedBug;
};


const deleteBug = async (id) => {
  return await Bug.findByIdAndDelete(id); // returns deleted document or null if not found
};

const addComment = async (bugId, userId, content) => {
  const bug = await Bug.findById(bugId);
  if (!bug) return null;

  bug.comments.push({
    author: userId,
    content,
    createdAt: new Date(),
  });

  await bug.save();
  
  // Return bug with populated comments.author info
  return Bug.findById(bugId)
    .populate('comments.author', 'name email')
    .populate('assignedTo', 'name email')
    .populate('reportedBy', 'name email')
    .populate('history.changedBy', 'name email');
};

const notifyAssignedUser = async (userEmail, bug) => {
  const subject = `New Bug Assigned: ${bug.title}`;
  const html = `<p>You have been assigned a new bug: <b>${bug.title}</b></p>
                <p>Description: ${bug.description}</p>
                <a href="http://yourfrontend.com/bugs/${bug._id}">View Bug</a>`;
  await sendEmail(userEmail, subject, html);
};


const assignBug = async (bugId, assignedToId) => {
  const user = await User.findById(assignedToId);
  if (!user || !isValidEmail(user.email)) {
    throw new Error('Assigned user is invalid or has no valid email');
  }
  const updatedBug = await Bug.findByIdAndUpdate(
    bugId,
    { assignedTo: assignedToId },
    { new: true }
  )
    .populate('assignedTo', 'name email')
    .populate('reportedBy', 'name email')
    .populate('comments.author', 'name email')
    .populate('history.changedBy', 'name email');

  if (updatedBug && updatedBug.assignedTo && updatedBug.assignedTo.email && isValidEmail(updatedBug.assignedTo.email)) {
    try {
      console.log(`Sending assignment email to ${updatedBug.assignedTo.email} for bug ${updatedBug._id}`);
      await notifyAssignedUser(updatedBug.assignedTo.email, updatedBug);
      console.log('Assignment email sent successfully');
    } catch (error) {
      console.error('Failed to send assignment email:', error);
    }
  } else {
    console.warn(`No valid email found for assigned user on bug ${updatedBug._id}`);
  }

  return updatedBug;
};



const countBugs = async (filter) => {
  const query = {};

  if (filter.project) {
    const projectId = typeof filter.project === 'string' ? filter.project.trim() : filter.project;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new Error('Invalid project ID format');
    }
    query.project = new mongoose.Types.ObjectId(projectId);
  } else {
    throw new Error('Project filter is required');
  }

  if (filter.status) query.status = filter.status;
  if (filter.priority) query.priority = filter.priority;
  if (filter.assignedTo) query.assignedTo = filter.assignedTo;
  if (filter.reportedBy) query.reportedBy = filter.reportedBy;

  if (filter.startDate || filter.endDate) {
    query.createdAt = {};
    if (filter.startDate) query.createdAt.$gte = new Date(filter.startDate);
    if (filter.endDate) query.createdAt.$lte = new Date(filter.endDate);
  }

  if (filter.searchText) {
    query.$or = [
      { title: { $regex: filter.searchText, $options: 'i' } },
      { description: { $regex: filter.searchText, $options: 'i' } }
    ];
  }

  return await Bug.countDocuments(query);
};


module.exports = {
  createBug,
  getAllBugs,
  getBugById,
  updateBug,
  deleteBug,
  addComment,
  assignBug,
  countBugs,
};