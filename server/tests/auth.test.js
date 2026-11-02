const request = require('supertest');

const mockUser = {
  findOne: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
};

jest.mock('../models/User', () => mockUser);

process.env.JWT_SECRET = 'test-only-jwt-secret';

const app = require('../app');
const bcrypt = require('bcryptjs');

describe('Authentication API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    test('registers a user successfully', async () => {
      mockUser.findOne.mockResolvedValue(null);
      mockUser.create.mockResolvedValue({
        _id: { toString: () => 'user-1' },
        name: 'Test User',
        email: 'test@example.com',
      });

      const response = await request(app).post('/api/auth/register').send({
        name: ' Test User ',
        email: ' Test@Example.com ',
        password: 'strong-password',
      });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        message: 'Registration successful',
        user: {
          id: 'user-1',
          name: 'Test User',
          email: 'test@example.com',
        },
      });
      expect(mockUser.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
      expect(mockUser.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test User',
          email: 'test@example.com',
        })
      );
      expect(mockUser.create.mock.calls[0][0].password).not.toBe(
        'strong-password'
      );
    });

    test('rejects a duplicate email', async () => {
      mockUser.findOne.mockResolvedValue({
        _id: { toString: () => 'existing-user' },
      });

      const response = await request(app).post('/api/auth/register').send({
        name: 'Another User',
        email: 'existing@example.com',
        password: 'strong-password',
      });

      expect(response.status).toBe(409);
      expect(response.body).toEqual({
        success: false,
        message: 'An account with this email already exists',
      });
      expect(mockUser.create).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/login', () => {
    test('logs in successfully with valid credentials', async () => {
      const passwordHash = await bcrypt.hash('strong-password', 4);
      mockUser.findOne.mockResolvedValue({
        _id: { toString: () => 'user-1' },
        name: 'Test User',
        email: 'test@example.com',
        password: passwordHash,
      });

      const response = await request(app).post('/api/auth/login').send({
        email: 'TEST@EXAMPLE.COM',
        password: 'strong-password',
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        token: expect.any(String),
        user: {
          id: 'user-1',
          name: 'Test User',
          email: 'test@example.com',
        },
      });
      expect(mockUser.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
    });

    test('rejects an incorrect password', async () => {
      const passwordHash = await bcrypt.hash('strong-password', 4);
      mockUser.findOne.mockResolvedValue({
        _id: { toString: () => 'user-1' },
        name: 'Test User',
        email: 'test@example.com',
        password: passwordHash,
      });

      const response = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'wrong-password',
      });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: 'Invalid email or password',
      });
    });
  });

  describe('GET /api/auth/me', () => {
    test('rejects a request without a JWT', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: 'Authorization token is required',
      });
    });

    test('rejects a request with an invalid JWT', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: 'Invalid or expired token',
      });
    });
  });
});
