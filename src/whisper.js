const axios = require('axios');
const OpenAI = require('openai');
const { toFile } = require('openai');
const config = require('./config');

const openai = new OpenAI({ apiKey: config.openaiApiKey });

async function downloadTwilioRecording(recordingUrl) {
  const response = await axios.get(`${recordingUrl}.mp3`, {
    responseType: 'arraybuffer',
    auth: {
      username: config.twilio.accountSid,
      password: config.twilio.authToken,
    },
  });
  return Buffer.from(response.data);
}

async function transcribeRecording(recordingUrl) {
  const audioBuffer = await downloadTwilioRecording(recordingUrl);
  const file = await toFile(audioBuffer, 'voicemail.mp3');
  const result = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
  });
  return result.text.trim();
}

module.exports = { transcribeRecording };
