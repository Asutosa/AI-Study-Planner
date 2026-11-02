const Groq = require('groq-sdk');

const DEFAULT_MODEL = 'openai/gpt-oss-120b';
const STUDY_RECOMMENDATION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    summary: { type: 'string' },
    focusTask: { type: 'string' },
    reason: { type: 'string' },
    resources: {
      type: 'array',
      maxItems: 3,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          url: { type: 'string' },
          reason: { type: 'string' },
        },
        required: ['title', 'url', 'reason'],
      },
    },
    strategy: {
      type: 'array',
      maxItems: 4,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          step: { type: 'string' },
          description: { type: 'string' },
        },
        required: ['step', 'description'],
      },
    },
    estimatedTime: { type: 'string' },
    quickHint: { type: 'string' },
    studyTechnique: {
      type: 'object',
      additionalProperties: false,
      properties: {
        name: { type: 'string' },
        instructions: { type: 'string' },
      },
      required: ['name', 'instructions'],
    },
  },
  required: [
    'summary',
    'focusTask',
    'reason',
    'resources',
    'strategy',
    'estimatedTime',
    'quickHint',
    'studyTechnique',
  ],
};

function invalidResponseError(message) {
  const error = new Error(message);
  error.code = 'GROQ_INVALID_RESPONSE';
  return error;
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidResource(resource) {
  if (
    !resource ||
    !isNonEmptyString(resource.title) ||
    !isNonEmptyString(resource.reason)
  ) {
    return false;
  }

  if (typeof resource.url !== 'string') {
    return false;
  }

  if (resource.url === '') {
    return true;
  }

  if (!isNonEmptyString(resource.url)) {
    return false;
  }

  try {
    const url = new URL(resource.url);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isValidStructuredRecommendation(recommendation) {
  return (
    recommendation &&
    isNonEmptyString(recommendation.summary) &&
    isNonEmptyString(recommendation.focusTask) &&
    isNonEmptyString(recommendation.reason) &&
    Array.isArray(recommendation.resources) &&
    recommendation.resources.length <= 3 &&
    recommendation.resources.every(isValidResource) &&
    Array.isArray(recommendation.strategy) &&
    recommendation.strategy.length > 0 &&
    recommendation.strategy.length <= 4 &&
    recommendation.strategy.every(
      (step) =>
        step &&
        isNonEmptyString(step.step) &&
        isNonEmptyString(step.description),
    ) &&
    isNonEmptyString(recommendation.estimatedTime) &&
    isNonEmptyString(recommendation.quickHint) &&
    recommendation.studyTechnique &&
    isNonEmptyString(recommendation.studyTechnique.name) &&
    isNonEmptyString(recommendation.studyTechnique.instructions)
  );
}

function parseStructuredRecommendation(content) {
  const trimmedContent = content.trim();
  const jsonContent = trimmedContent.startsWith('```')
    ? trimmedContent.replace(/^```(?:json)?\s*|\s*```$/gi, '').trim()
    : trimmedContent;

  let recommendation;

  try {
    recommendation = JSON.parse(jsonContent);
  } catch {
    throw invalidResponseError('Groq returned invalid JSON');
  }

  if (!isValidStructuredRecommendation(recommendation)) {
    throw invalidResponseError('Groq returned an incomplete recommendation');
  }

  return recommendation;
}

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
    max_completion_tokens: 1800,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'study_recommendation',
        strict: true,
        schema: STUDY_RECOMMENDATION_SCHEMA,
      },
    },
    messages: [
      {
        role: 'system',
        content:
          'Create a concise, task-specific study recommendation from the supplied pending tasks. Prioritize by urgency and context, use actionable strategies, and recommend no more than 3 reliable resources and 4 strategy steps. Use an empty URL when a resource URL is uncertain. Never invent tasks, topics, or URLs.',
      },
      {
        role: 'user',
        content: `Pending study tasks:\n${JSON.stringify(tasks, null, 2)}`,
      },
    ],
  });

  const content = response.choices?.[0]?.message?.content?.trim();

  if (!content) {
    const error = new Error('Groq returned an empty recommendation');
    error.code = 'GROQ_EMPTY_RESPONSE';
    throw error;
  }

  return parseStructuredRecommendation(content);
}

module.exports = {
  generateRecommendation,
  parseStructuredRecommendation,
};
