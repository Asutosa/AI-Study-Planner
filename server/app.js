const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const aiRoutes = require('./routes/aiRoutes');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';

console.log(
  `[CORS] CLIENT_URL set: ${Boolean(process.env.CLIENT_URL)}, allowed origin: ${allowedOrigin}`
);

app.use(
  cors({
    origin: allowedOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/ai', aiRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'AI Study Planner API is running',
  });
});

module.exports = app;
