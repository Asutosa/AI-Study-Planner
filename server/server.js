const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const aiRoutes = require('./routes/aiRoutes');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: 'http://localhost:5173',
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

async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
