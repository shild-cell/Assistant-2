const Anthropic = require('@anthropic-ai/sdk');
const config = require('./config');

const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });

async function titleForTranscript(transcript) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 40,
    system:
      'You title short voice/text notes for a personal task list. ' +
      'Reply with ONLY a clear, concise title (max 8 words). No quotes, no punctuation at the end, no preamble.',
    messages: [{ role: 'user', content: transcript }],
  });

  const title = message.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim();

  return title || 'Untitled note';
}

module.exports = { titleForTranscript };
