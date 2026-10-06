const Groq = require('groq-sdk');

const DEFAULT_MODEL = 'openai/gpt-oss-120b';

async function generateRecommendation(tasks) {
  if (!process.env.GROQ_API_KEY) {
    const error = new Error('GROQ_API_KEY is not configured');
    error.code = 'GROQ_NOT_CONFIGURED';
    throw error;
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const response = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL || DEFAULT_MODEL,
    temperature: 0.3,
    max_tokens: 300,
    messages: [
      {
        role: 'system',
        content:
          'You are a concise study planning assistant. Recommend what the student should study first based only on the supplied pending tasks. Give high-priority tasks more attention than medium or low-priority tasks. Do not invent tasks or topics that are not supplied. Give practical, clear advice in a short paragraph.',
      },
      {
        role: 'user',
        content: `Pending study tasks:\n${JSON.stringify(tasks, null, 2)}`,
      },
    ],
  });

  const recommendation = response.choices?.[0]?.message?.content?.trim();

  if (!recommendation) {
    const error = new Error('Groq returned an empty recommendation');
    error.code = 'GROQ_EMPTY_RESPONSE';
    throw error;
  }

  return recommendation;
}

module.exports = { generateRecommendation };
