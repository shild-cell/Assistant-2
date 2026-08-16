const axios = require('axios');
const config = require('./config');

async function sendTaskEmail(task) {
    if (!config.smtp.enabled) return;

  const sourceLabel = task.source === 'voice' ? 'Voicemail' : 'Text';
    const metaLines = [
          `${sourceLabel} from ${task.from} at ${task.createdAt}`,
          task.category ? `Category: ${task.category}` : null,
          task.dueDate ? `Due: ${task.dueDate}` : null,
        ].filter(Boolean);

  await axios.post(
        'https://api.resend.com/emails',
    {
            from: config.smtp.from,
            to: [config.smtp.to],
            subject: `[TaskFlow] ${task.title}`,
            text: `${metaLines.join('\n')}\n\n${task.transcript}`,
    },
    {
            headers: {
                      Authorization: `Bearer ${config.resend.apiKey}`,
                      'Content-Type': 'application/json',
            },
    }
      );
}

module.exports = { sendTaskEmail };
