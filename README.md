# TaskFlow

Call or text a phone number, say or type whatever's on your mind, and it becomes a
transcribed, titled task: saved to a dashboard, emailed to you, and (optionally) logged
to Airtable.

## How it works

- **Twilio** receives calls and texts and forwards them to this app as webhooks.
- **Text messages** are saved as-is (verbatim transcript).
- **Calls** are recorded as voicemails; **OpenAI Whisper** transcribes the audio.
- **Claude** (Anthropic API) reads the transcript and extracts a short title, a category
  (`task`, `reminder`, `call`, `shopping`, `appointment`, `idea`, `other`), and a due date
  if one is implied ("call back tomorrow", "renew by Friday").
- The task (title + category + due date + verbatim transcript + source + timestamp) is:
  - saved to a local JSON store, viewable at `/dashboard` — checkboxes to mark done, a
    delete button per row, and open tasks sorted with the soonest due date first
  - emailed to you
  - optionally logged to an Airtable base
- Only phone numbers listed in `ALLOWED_SENDERS` can use the line — everyone else is
  silently ignored.

## Local setup

```bash
npm install
cp .env.example .env
# fill in .env with your real keys (see table below)
npm run dev
```

The server listens on `PORT` (default 3000). Twilio needs a public HTTPS URL to reach
it, so for local testing use a tunnel (e.g. `ngrok http 3000`) and set
`TWILIO_VALIDATE_SIGNATURE=false` temporarily if you're testing with curl instead of
real Twilio requests.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `TWILIO_ACCOUNT_SID` | yes | Twilio account SID (starts with `AC`) |
| `TWILIO_AUTH_TOKEN` | yes | Twilio auth token — also used to verify incoming webhooks are really from Twilio |
| `TWILIO_VALIDATE_SIGNATURE` | no (default `true`) | Set `false` only for local curl testing |
| `ALLOWED_SENDERS` | yes | Comma-separated E.164 numbers allowed to use the line, e.g. `+15551234567` |
| `OPENAI_API_KEY` | yes | Whisper transcription of voicemails |
| `ANTHROPIC_API_KEY` | yes | Claude generates the task title, category, and due date |
| `TIMEZONE` | no (default `UTC`) | IANA timezone (e.g. `America/New_York`) used to resolve relative due dates and format them on the dashboard |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | yes (for email) | SMTP creds — a Gmail [App Password](https://myaccount.google.com/apppasswords) works well |
| `EMAIL_FROM`, `EMAIL_TO` | yes (for email) | From/To addresses for the copy emails |
| `DASHBOARD_USER`, `DASHBOARD_PASSWORD` | recommended | Protects `/dashboard` with basic auth (public URL otherwise) |
| `DATA_DIR` | no (default `./data`) | Where `tasks.json` is stored — mount a Railway Volume here so data survives redeploys |
| `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`, `AIRTABLE_TABLE_NAME` | no | Leave blank to skip Airtable logging |

## Deploying to Railway

1. Push this repo to GitHub (already done if you're reading this from your fork).
2. In Railway: **New Project → Deploy from GitHub repo** → select this repo.
3. Add every variable from the table above under the project's **Variables** tab.
4. Add a **Volume** mounted at `/data` and set `DATA_DIR=/data`, so notes survive
   redeploys.
5. Once deployed, Railway gives you a public URL like `https://taskflow.up.railway.app`.

## Wiring up Twilio

1. Buy a phone number in the Twilio console.
2. Under the number's **Voice Configuration**, set "A call comes in" to
   `https://<your-app>.up.railway.app/webhooks/voice` (HTTP POST).
3. Under **Messaging Configuration**, set "A message comes in" to
   `https://<your-app>.up.railway.app/webhooks/sms` (HTTP POST).
4. Set `ALLOWED_SENDERS` to your own cell number in E.164 format (e.g. `+15551234567`).

## Testing

- Text "buy milk" to your number → check `/dashboard` and your inbox within a minute.
- Call the number, leave a voicemail, hang up → transcript should show up the same way.
- Text or call from a number *not* in `ALLOWED_SENDERS` → nothing should be saved.

## Optional extras (not built yet)

Per-caller menus, a spoken daily briefing, conference-call splitting, and fax delivery
are not implemented — the core text/call → task loop above is the whole system. Ask for
any of these as a follow-up if you want them added.
