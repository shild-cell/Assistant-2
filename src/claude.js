const Anthropic = require('@anthropic-ai/sdk');
const config = require('./config');

const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });

const CATEGORIES = ['task', 'reminder', 'call', 'shopping', 'appointment', 'idea', 'other'];

function todayContext() {
  const now = new Date();
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: config.timezone }).format(now);
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: config.timezone }).format(now); // YYYY-MM-DD
  return `${weekday}, ${date} (timezone: ${config.timezone})`;
}

async function analyzeTranscript(transcript) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 300,
    system:
      'You extract structured info from short voice/text notes for a personal task list. ' +
      `The current date is ${todayContext()}. Resolve relative dates ("tomorrow", "Friday", "next week") against it. ` +
      'Call save_task_details with your best answer. Only set dueDate if the note actually implies a deadline or ' +
      'scheduled time — do not invent one.',
    messages: [{ role: 'user', content: transcript }],
    tools: [
      {
        name: 'save_task_details',
        description: 'Save the extracted title, category, and (if implied) due date for this note.',
        input_schema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Clear, concise title, max 8 words. No quotes, no trailing punctuation.',
            },
            category: {
              type: 'string',
              enum: CATEGORIES,
              description: 'Best-fit category for this note.',
            },
            dueDate: {
              type: 'string',
              description:
                'ISO 8601 date (YYYY-MM-DD) or datetime (YYYY-MM-DDTHH:mm) if the note implies a deadline or ' +
                'scheduled time. Omit this field entirely if no due date/time is implied.',
            },
          },
          required: ['title', 'category'],
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'save_task_details' },
  });

  const toolUse = message.content.find((block) => block.type === 'tool_use');
  const input = toolUse ? toolUse.input : {};

  return {
    title: input.title || 'Untitled note',
    category: CATEGORIES.includes(input.category) ? input.category : 'other',
    dueDate: input.dueDate || null,
  };
}

module.exports = { analyzeTranscript, CATEGORIES };
