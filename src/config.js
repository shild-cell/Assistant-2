require('dotenv').config();

function list(name) {
  return (process.env[name] || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const config = {
  port: process.env.PORT || 3000,

  twilio: {
    accountSid: required('TWILIO_ACCOUNT_SID'),
    authToken: required('TWILIO_AUTH_TOKEN'),
    validateSignature: process.env.TWILIO_VALIDATE_SIGNATURE !== 'false',
  },

  allowedSenders: list('ALLOWED_SENDERS'),

  openaiApiKey: required('OPENAI_API_KEY'),
  anthropicApiKey: required('ANTHROPIC_API_KEY'),

  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE !== 'false',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to: process.env.EMAIL_TO,
  },

  dashboard: {
    user: process.env.DASHBOARD_USER || 'admin',
    password: process.env.DASHBOARD_PASSWORD || '',
  },

  dataDir: process.env.DATA_DIR || './data',

  timezone: process.env.TIMEZONE || 'UTC',

  airtable: {
    apiKey: process.env.AIRTABLE_API_KEY || '',
    baseId: process.env.AIRTABLE_BASE_ID || '',
    tableName: process.env.AIRTABLE_TABLE_NAME || 'Tasks',
  },
};

config.airtable.enabled = Boolean(
  config.airtable.apiKey && config.airtable.baseId
);

config.smtp.enabled = Boolean(
  config.smtp.host && config.smtp.user && config.smtp.pass && config.smtp.to
);

module.exports = config;
