const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const publicUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
});

function createToken(userId) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    const error = new Error('JWT_SECRET is not configured');
    error.statusCode = 500;
    throw error;
  }

  return jwt.sign({ userId }, secret, { expiresIn: '7d' });
}

async function registerUser(req, res) {
  const { name, email, password } = req.body || {};

  if (
    typeof name !== 'string' ||
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    !name.trim() ||
    !email.trim() ||
    !password
  ) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and password are required',
    });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'An account with this email already exists',
    });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  try {
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: publicUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)
          .map((validationError) => validationError.message)
          .join(', '),
      });
    }

    throw error;
  }
}

async function loginUser(req, res) {
  const { email, password } = req.body || {};

  if (
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    !email.trim() ||
    !password
  ) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required',
    });
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() });
  const passwordMatches = user
    ? await bcrypt.compare(password, user.password)
    : false;

  if (!user || !passwordMatches) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  return res.json({
    success: true,
    token: createToken(user._id.toString()),
    user: publicUser(user),
  });
}

async function getCurrentUser(req, res) {
  const user = await User.findById(req.user);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  return res.json({
    success: true,
    user: publicUser(user),
  });
}

module.exports = { registerUser, loginUser, getCurrentUser };
