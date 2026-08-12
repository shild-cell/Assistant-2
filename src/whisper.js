const axios = require('axios');
const FormData = require('form-data');
const config = require('./config');

async function withRetry(fn, attempts = 3) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) {
        console.warn(`Retrying after error: ${err.message} (attempt ${i + 1}/${attempts})`);
        await new Promise((resolve) => setTimeout(resolve, 500 * (i + 1)));
      }
    }
  }
  throw lastErr;
}

async function downloadTwilioRecording(recordingUrl) {
  const response = await withRetry(() =>
    axios.get(`${recordingUrl}.mp3`, {
      responseType: 'arraybuffer',
      auth: {
        username: config.twilio.accountSid,
        password: config.twilio.authToken,
      },
    })
  );
  return Buffer.from(response.data);
}

async function transcribeRecording(recordingUrl) {
  const audioBuffer = await downloadTwilioRecording(recordingUrl);

  const result = await withRetry(async () => {
    const form = new FormData();
    form.append('file', audioBuffer, { filename: 'voicemail.mp3', contentType: 'audio/mpeg' });
    form.append('model', 'whisper-1');

    const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${config.openaiApiKey}`,
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });
    return response.data;
  });

  return result.text.trim();
}

module.exports = { transcribeRecording };
