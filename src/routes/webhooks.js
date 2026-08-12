const express = require('express');
const twilio = require('twilio');
const config = require('../config');
const { isAllowed } = require('../allowlist');
const { transcribeRecording } = require('../whisper');
const { analyzeTranscript } = require('../claude');
const { addTask } = require('../db');
const { sendTaskEmail } = require('../email');
const { logTask } = require('../airtable');

const router = express.Router();

// Never log err directly: Axios/HTTP client errors embed the full request,
// including Authorization headers, and would leak API keys into logs.
function describeError(err) {
  const status = err.response?.status;
  const apiMessage = err.response?.data?.error?.message;
  const detail = apiMessage || err.message;
  return status ? `${detail} (HTTP ${status})` : detail;
}

function validateTwilioRequest(req, res, next) {
  if (!config.twilio.validateSignature) return next();

  const signature = req.header('X-Twilio-Signature');
  const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  const valid = twilio.validateRequest(
    config.twilio.authToken,
    signature,
    url,
    req.body
  );

  if (!valid) {
    console.warn('Rejected webhook with invalid Twilio signature', { url });
    return res.status(403).send('Invalid signature');
  }
  next();
}

router.use(validateTwilioRequest);

async function saveAndNotify({ transcript, source, from }) {
  const { title, category, dueDate } = await analyzeTranscript(transcript);
  const task = addTask({
    title,
    category,
    dueDate,
    transcript,
    source,
    from,
    createdAt: new Date().toISOString(),
  });

  await Promise.all([
    sendTaskEmail(task).catch((err) => console.error('Email send failed:', err.message)),
    logTask(task).catch((err) => console.error('Airtable log failed:', err.message)),
  ]);

  return task;
}

// Incoming SMS
router.post('/sms', async (req, res) => {
  const from = req.body.From;
  const body = (req.body.Body || '').trim();

  const twiml = new twilio.twiml.MessagingResponse();

  if (!isAllowed(from)) {
    console.warn('Rejected SMS from non-allowed sender', { from });
    res.type('text/xml').send(twiml.toString());
    return;
  }

  if (!body) {
    res.type('text/xml').send(twiml.toString());
    return;
  }

  try {
    const task = await saveAndNotify({ transcript: body, source: 'sms', from });
    twiml.message(`Saved: ${task.title}`);
  } catch (err) {
    console.error('Failed to process SMS note:', describeError(err));
    twiml.message('Sorry, something went wrong saving that note.');
  }

  res.type('text/xml').send(twiml.toString());
});

// Incoming call — record a voicemail
router.post('/voice', (req, res) => {
  const from = req.body.From;
  const twiml = new twilio.twiml.VoiceResponse();

  if (!isAllowed(from)) {
    twiml.say('This number is not authorized to use this line. Goodbye.');
    twiml.hangup();
    res.type('text/xml').send(twiml.toString());
    return;
  }

  twiml.say('Leave your note after the tone. Hang up or press pound when done.');
  twiml.record({
    action: '/webhooks/recording',
    method: 'POST',
    maxLength: 180,
    finishOnKey: '#',
    playBeep: true,
    trim: 'trim-silence',
  });
  twiml.say('No note was recorded. Goodbye.');

  res.type('text/xml').send(twiml.toString());
});

// Twilio calls this once the recording is ready
router.post('/recording', async (req, res) => {
  const from = req.body.From;
  const recordingUrl = req.body.RecordingUrl;

  res.type('text/xml').send(new twilio.twiml.VoiceResponse().toString());

  if (!isAllowed(from) || !recordingUrl) return;

  try {
    const transcript = await transcribeRecording(recordingUrl);
    if (transcript) {
      await saveAndNotify({ transcript, source: 'voice', from });
    }
  } catch (err) {
    console.error('Failed to process voicemail:', describeError(err));
  }
});

module.exports = router;
