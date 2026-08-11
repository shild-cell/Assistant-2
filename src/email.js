const nodemailer = require('nodemailer');
const config = require('./config');

let transporter = null;
if (config.smtp.enabled) {
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: { user: config.smtp.user, pass: config.smtp.pass },
  });
}

async function sendTaskEmail(task) {
  if (!transporter) return;

  const sourceLabel = task.source === 'voice' ? 'Voicemail' : 'Text';
  await transporter.sendMail({
    from: config.smtp.from,
    to: config.smtp.to,
    subject: `[TaskFlow] ${task.title}`,
    text: `${sourceLabel} from ${task.from} at ${task.createdAt}\n\n${task.transcript}`,
  });
}

module.exports = { sendTaskEmail };
