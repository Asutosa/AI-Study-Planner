const jwt = require('jsonwebtoken');
const request = require('supertest');

const mockTask = {
  find: jest.fn(),
};

const mockGenerateRecommendation = jest.fn();

jest.mock('../models/Task', () => mockTask);
jest.mock('../services/groqService', () => ({
  generateRecommendation: mockGenerateRecommendation,
}));

process.env.JWT_SECRET = 'test-only-jwt-secret';

const app = require('../app');

const userId = '507f1f77bcf86cd799439011';

function authHeader() {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET);
  return `Bearer ${token}`;
}

function mockTaskQuery(tasks) {
  const lean = jest.fn().mockResolvedValue(tasks);
  const sort = jest.fn().mockReturnValue({ lean });
  const select = jest.fn().mockReturnValue({ sort });

  mockTask.find.mockReturnValue({ select });

  return { lean, select, sort };
}

describe('AI recommendations API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns AI recommendations for pending tasks', async () => {
    const pendingTasks = [
      {
        title: 'Review algorithms',
        description: 'Study graph traversal',
        priority: 'high',
      },
    ];
    mockTaskQuery(pendingTasks);
    mockGenerateRecommendation.mockResolvedValue(
      'Review graph traversal first, then practice related problems.'
    );

    const response = await request(app)
      .post('/api/ai/recommendations')
      .set('Authorization', authHeader());

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      recommendation:
        'Review graph traversal first, then practice related problems.',
    });
    expect(mockTask.find).toHaveBeenCalledWith({
      user: userId,
      completed: false,
    });
    expect(mockGenerateRecommendation).toHaveBeenCalledWith(pendingTasks);
  });

  test('returns the expected message when there are no pending tasks', async () => {
    mockTaskQuery([]);

    const response = await request(app)
      .post('/api/ai/recommendations')
      .set('Authorization', authHeader());

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      recommendation:
        'You have no pending study tasks. Add some tasks to get personalized recommendations.',
    });
    expect(mockGenerateRecommendation).not.toHaveBeenCalled();
  });

  test('rejects requests without a valid JWT', async () => {
    const response = await request(app)
      .post('/api/ai/recommendations')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      message: 'Invalid or expired token',
    });
    expect(mockTask.find).not.toHaveBeenCalled();
    expect(mockGenerateRecommendation).not.toHaveBeenCalled();
  });

  test('handles Groq API failures gracefully', async () => {
    mockTaskQuery([
      {
        title: 'Review algorithms',
        description: 'Study graph traversal',
        priority: 'high',
      },
    ]);
    mockGenerateRecommendation.mockRejectedValue(new Error('Groq unavailable'));

    const response = await request(app)
      .post('/api/ai/recommendations')
      .set('Authorization', authHeader());

    expect(response.status).toBe(502);
    expect(response.body).toEqual({
      success: false,
      message: 'Unable to generate a recommendation right now',
    });
  });

  test('excludes completed tasks from data sent to Groq', async () => {
    const pendingTasks = [
      {
        title: 'Pending task',
        description: 'Still needs work',
        priority: 'medium',
      },
    ];
    mockTaskQuery(pendingTasks);
    mockGenerateRecommendation.mockResolvedValue('Focus on the pending task.');

    const response = await request(app)
      .post('/api/ai/recommendations')
      .set('Authorization', authHeader());

    expect(response.status).toBe(200);
    expect(mockTask.find).toHaveBeenCalledWith({
      user: userId,
      completed: false,
    });
    expect(mockGenerateRecommendation).toHaveBeenCalledWith(pendingTasks);
    expect(mockGenerateRecommendation).not.toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ completed: true })])
    );
  });
});
