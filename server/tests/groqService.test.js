const mockCreate = jest.fn();

jest.mock('groq-sdk', () =>
  jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }))
);

const { generateRecommendation } = require('../services/groqService');

const structuredResponse = {
  summary: 'Start with the highest-priority topic.',
  focusTask: 'Review algorithms',
  reason: 'It is the most urgent pending task.',
  resources: [
    {
      title: 'Algorithms overview',
      url: '',
      reason: 'Use your course notes when no reliable URL is known.',
    },
  ],
  strategy: [
    {
      step: 'Review the concept',
      description: 'Study the key definitions for 25 minutes.',
    },
  ],
  estimatedTime: '45 minutes',
  quickHint: 'Write one example from memory before checking your notes.',
  studyTechnique: {
    name: 'Pomodoro',
    instructions: 'Study for 25 minutes, then take a 5-minute break.',
  },
};

describe('Groq recommendation request', () => {
  beforeEach(() => {
    process.env.GROQ_API_KEY = 'test-only-groq-key';
    mockCreate.mockReset();
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify(structuredResponse),
          },
        },
      ],
    });
  });

  test('uses strict JSON schema structured output mode', async () => {
    const tasks = [
      {
        title: 'Review algorithms',
        description: 'Study sorting algorithms',
        priority: 'high',
      },
    ];

    await expect(generateRecommendation(tasks)).resolves.toEqual(
      structuredResponse
    );

    const request = mockCreate.mock.calls[0][0];
    expect(request.model).toBe('openai/gpt-oss-120b');
    expect(request.max_completion_tokens).toBe(1800);
    expect(request.max_tokens).toBeUndefined();
    expect(request.response_format).toMatchObject({
      type: 'json_schema',
      json_schema: {
        name: 'study_recommendation',
        strict: true,
      },
    });
    expect(request.response_format.json_schema.schema).toMatchObject({
      type: 'object',
      additionalProperties: false,
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
    });
    expect(
      request.response_format.json_schema.schema.properties.resources.items
    ).toMatchObject({
      type: 'object',
      additionalProperties: false,
      required: ['title', 'url', 'reason'],
    });
    expect(
      request.response_format.json_schema.schema.properties.resources.maxItems
    ).toBe(3);
    expect(
      request.response_format.json_schema.schema.properties.strategy.maxItems
    ).toBe(4);
  });
});
