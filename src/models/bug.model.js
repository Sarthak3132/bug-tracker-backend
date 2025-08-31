const mongoose = require('mongoose');

const bugSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'resolved', 'closed','pending'],
    default: 'open',
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  project: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project', 
    required: true 
  },
  history: [
    {
      status: String,
      changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      changedAt: { type: Date, default: Date.now },
      field: { type: String, required: true },
      oldValue: { type: mongoose.Schema.Types.Mixed }, // Old value
      newValue: { type: mongoose.Schema.Types.Mixed }, // New value
      comment: String, // optional note about the change
    }
  ],
  comments: [
    {
      author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      content: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
      // Optionally: updatedAt, attachments, etc.
    }
  ],
}, {
  timestamps: true,
});

bugSchema.index({ title: 'text', description: 'text' });
bugSchema.index({ status: 1 });
bugSchema.index({ priority: 1 });
bugSchema.index({ project: 1 });
bugSchema.index({ assignedTo: 1 });
bugSchema.index({ reportedBy: 1 });
bugSchema.index({ createdAt: 1 });

module.exports = mongoose.model('Bug', bugSchema);