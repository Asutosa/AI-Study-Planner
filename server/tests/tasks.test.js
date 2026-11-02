const jwt = require('jsonwebtoken');
const request = require('supertest');

const mockTask = {
  create: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findOneAndDelete: jest.fn(),
};

jest.mock('../models/Task', () => mockTask);

process.env.JWT_SECRET = 'test-only-jwt-secret';

const app = require('../app');

const ownerId = '507f1f77bcf86cd799439011';
const otherUserId = '507f1f77bcf86cd799439012';
const taskId = '507f1f77bcf86cd799439013';

function authHeader(userId = ownerId) {
  return `Bearer ${jwt.sign({ userId }, process.env.JWT_SECRET)}`;
}

describe('Task API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates a task successfully', async () => {
    const task = {
      _id: taskId,
      user: ownerId,
      title: 'Study algorithms',
      description: 'Review graph traversal',
      priority: 'high',
      completed: false,
    };
    mockTask.create.mockResolvedValue(task);

    const response = await request(app)
      .post('/api/tasks')
      .set('Authorization', authHeader())
      .send({
        title: ' Study algorithms ',
        description: 'Review graph traversal',
        priority: 'high',
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ success: true, task });
    expect(mockTask.create).toHaveBeenCalledWith({
      user: ownerId,
      title: 'Study algorithms',
      description: 'Review graph traversal',
      priority: 'high',
      completed: false,
    });
  });

  test('fetches all tasks belonging to the authenticated user', async () => {
    const tasks = [
      { _id: taskId, user: ownerId, title: 'Study algorithms' },
    ];
    const sort = jest.fn().mockResolvedValue(tasks);
    mockTask.find.mockReturnValue({ sort });

    const response = await request(app)
      .get('/api/tasks')
      .set('Authorization', authHeader());

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, tasks });
    expect(mockTask.find).toHaveBeenCalledWith({ user: ownerId });
    expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
  });

  test('fetches a task by ID for the authenticated user', async () => {
    const task = { _id: taskId, user: ownerId, title: 'Study algorithms' };
    mockTask.findOne.mockResolvedValue(task);

    const response = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', authHeader());

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, task });
    expect(mockTask.findOne).toHaveBeenCalledWith({
      _id: taskId,
      user: ownerId,
    });
  });

  test('updates a task successfully', async () => {
    const updatedTask = {
      _id: taskId,
      user: ownerId,
      title: 'Study algorithms today',
      priority: 'medium',
      completed: true,
    };
    mockTask.findOneAndUpdate.mockResolvedValue(updatedTask);

    const response = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', authHeader())
      .send({
        title: ' Study algorithms today ',
        priority: 'medium',
        completed: true,
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, task: updatedTask });
    expect(mockTask.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: taskId, user: ownerId },
      { title: 'Study algorithms today', priority: 'medium', completed: true },
      { new: true, runValidators: true }
    );
  });

  test('deletes a task successfully', async () => {
    mockTask.findOneAndDelete.mockResolvedValue({
      _id: taskId,
      user: ownerId,
    });

    const response = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', authHeader());

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: 'Task deleted successfully',
    });
    expect(mockTask.findOneAndDelete).toHaveBeenCalledWith({
      _id: taskId,
      user: ownerId,
    });
  });

  test('rejects requests without a JWT', async () => {
    const response = await request(app).get('/api/tasks');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: 'Authorization token is required',
    });
    expect(mockTask.find).not.toHaveBeenCalled();
  });

  test("prevents one user from accessing another user's task", async () => {
    mockTask.findOne.mockResolvedValue(null);

    const response = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', authHeader(otherUserId));

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: 'Task not found',
    });
    expect(mockTask.findOne).toHaveBeenCalledWith({
      _id: taskId,
      user: otherUserId,
    });
  });

  test("prevents one user from updating or deleting another user's task", async () => {
    mockTask.findOneAndUpdate.mockResolvedValue(null);
    mockTask.findOneAndDelete.mockResolvedValue(null);

    const updateResponse = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', authHeader(otherUserId))
      .send({ title: 'Unauthorized update' });
    const deleteResponse = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', authHeader(otherUserId));

    expect(updateResponse.status).toBe(404);
    expect(updateResponse.body).toEqual({
      success: false,
      message: 'Task not found',
    });
    expect(deleteResponse.status).toBe(404);
    expect(deleteResponse.body).toEqual({
      success: false,
      message: 'Task not found',
    });
    expect(mockTask.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: taskId, user: otherUserId },
      { title: 'Unauthorized update' },
      { new: true, runValidators: true }
    );
    expect(mockTask.findOneAndDelete).toHaveBeenCalledWith({
      _id: taskId,
      user: otherUserId,
    });
  });
});
