const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title must be 200 characters or fewer'],
    },
    description: {
      type: String,
      trim: true,
    },
    priority: {
      type: String,
      required: [true, 'Priority is required'],
      enum: {
        values: ['low', 'medium', 'high'],
        message: 'Priority must be low, medium, or high',
      },
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

taskSchema.index({ user: 1 });

module.exports = mongoose.model('Task', taskSchema);
