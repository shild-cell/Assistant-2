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
          from: process.env.EMAIL_FROM,
          to: process.env.EMAIL_TO,
    },

    resend: {
          apiKey: process.env.RESEND_API_KEY,
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
    config.resend.apiKey && config.smtp.from && config.smtp.to
  );

module.exports = config;
