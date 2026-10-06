const Task = require('../models/Task');
const { generateRecommendation } = require('../services/groqService');

function logGroqError(error) {
  const apiKey = process.env.GROQ_API_KEY;
  const rawMessage = String(error.message || 'Unknown Groq error');
  const message = apiKey
    ? rawMessage.replace(apiKey, '[redacted]')
    : rawMessage;
  const status = error.status ?? error.statusCode ?? 'unknown';
  const code = error.error?.code || error.code || 'unknown';
  const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

  console.error(
    `[Groq] status=${status} code=${code} model=${model} message=${message}`,
  );
}

async function getRecommendations(req, res) {
  const userId = req.user?.id || req.user;
  let pendingTasks;

  try {
    pendingTasks = await Task.find({
      user: userId,
      completed: false,
    })
      .select('title description priority -_id')
      .sort({ priority: -1, createdAt: 1 })
      .lean();

  } catch (error) {
    console.error('Failed to load tasks for AI recommendation:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Unable to load tasks for a recommendation',
    });
  }

  if (pendingTasks.length === 0) {
    return res.json({
      success: true,
      recommendation:
        'You have no pending study tasks. Add some tasks to get personalized recommendations.',
    });
  }

  try {
    const recommendation = await generateRecommendation(pendingTasks);
    return res.json({ success: true, recommendation });
  } catch (error) {
    logGroqError(error);

    if (error.code === 'GROQ_NOT_CONFIGURED') {
      return res.status(503).json({
        success: false,
        message: 'AI recommendations are not configured yet',
      });
    }

    if (error.code === 'GROQ_EMPTY_RESPONSE') {
      return res.status(502).json({
        success: false,
        message: 'The AI did not return a recommendation. Please try again.',
      });
    }

    return res.status(502).json({
      success: false,
      message: 'Unable to generate a recommendation right now',
    });
  }
}

module.exports = { getRecommendations };
