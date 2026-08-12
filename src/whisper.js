const axios = require('axios');
const OpenAI = require('openai');
const { toFile } = require('openai');
const config = require('./config');

const openai = new OpenAI({ apiKey: config.openaiApiKey });

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
  const file = await toFile(audioBuffer, 'voicemail.mp3');
  const result = await withRetry(() =>
    openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
    })
  );
  return result.text.trim();
}

module.exports = { transcribeRecording };
