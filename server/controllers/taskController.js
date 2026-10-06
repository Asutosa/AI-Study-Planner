const mongoose = require('mongoose');
const Task = require('../models/Task');

const allowedUpdateFields = ['title', 'description', 'priority', 'completed'];

function sendDatabaseError(res, error) {
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: Object.values(error.errors)
        .map((validationError) => validationError.message)
        .join(', '),
    });
  }

  console.error('Task database operation failed:', error.message);
  return res.status(500).json({
    success: false,
    message: 'Unable to complete task operation',
  });
}

function getTaskId(req, res) {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({
      success: false,
      message: 'Invalid task ID',
    });
    return null;
  }

  return id;
}

async function createTask(req, res) {
  const { title, description, priority } = req.body || {};

  if (typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Title is required',
    });
  }

  if (!['low', 'medium', 'high'].includes(priority)) {
    return res.status(400).json({
      success: false,
      message: 'Priority must be low, medium, or high',
    });
  }

  try {
    const task = await Task.create({
      user: req.user,
      title: title.trim(),
      description,
      priority,
      completed: false,
    });

    return res.status(201).json({ success: true, task });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

async function getTasks(req, res) {
  try {
    const tasks = await Task.find({ user: req.user }).sort({ createdAt: -1 });
    return res.json({ success: true, tasks });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

async function getTaskById(req, res) {
  const taskId = getTaskId(req, res);
  if (!taskId) return;

  try {
    const task = await Task.findOne({ _id: taskId, user: req.user });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    return res.json({ success: true, task });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

async function updateTask(req, res) {
  const taskId = getTaskId(req, res);
  if (!taskId) return;

  const updates = {};

  for (const field of allowedUpdateFields) {
    if (Object.prototype.hasOwnProperty.call(req.body || {}, field)) {
      updates[field] = req.body[field];
    }
  }

  if (
    Object.prototype.hasOwnProperty.call(updates, 'title') &&
    (typeof updates.title !== 'string' || !updates.title.trim())
  ) {
    return res.status(400).json({
      success: false,
      message: 'Title is required',
    });
  }

  if (
    Object.prototype.hasOwnProperty.call(updates, 'priority') &&
    !['low', 'medium', 'high'].includes(updates.priority)
  ) {
    return res.status(400).json({
      success: false,
      message: 'Priority must be low, medium, or high',
    });
  }

  if (typeof updates.title === 'string') {
    updates.title = updates.title.trim();
  }

  try {
    const task = await Task.findOneAndUpdate(
      { _id: taskId, user: req.user },
      updates,
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    return res.json({ success: true, task });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

async function deleteTask(req, res) {
  const taskId = getTaskId(req, res);
  if (!taskId) return;

  try {
    const task = await Task.findOneAndDelete({
      _id: taskId,
      user: req.user,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    return res.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
};
