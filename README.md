# OpenMic Intake Agent (Medical) - Demo Project

This demo project implements a **Domain-Specific AI Intake Agent** for the **Medical** domain, intended to be used with the OpenMic platform.

## What this includes
- A minimal Express.js server implementing:
  - Bot CRUD endpoints (`/api/bots`)
  - Pre-call webhook (`/webhooks/precall`)
  - In-call function endpoint (`/functions/getPatient`) — used as OpenMic "custom function".
  - Post-call webhook (`/webhooks/postcall`)
  - Call logs storage in a simple `db.json`.
- A tiny frontend UI (`public/index.html`) to create/list/delete bots and view call logs.
- `.env.example` with instructions for your OpenMic API key.

## Quick features
- Pre-call webhook returns patient record sample (based on `?patientId=`).
- In-call function `getPatient` returns patient details when OpenMic agent calls it.
- Post-call webhook stores call transcript, metadata, and function call results in `db.json`.
- Local JSON DB (`db.json`) used to persist bots and call logs.

## Requirements
- Node.js 18+ (recommended)
- npm
- ngrok (for exposing local endpoints to OpenMic dashboard)

## Setup
1. Clone or unzip this project.
2. Install dependencies:
```bash
cd openmic_intake_agent_medical
npm install
```

3. Create a `.env` file (copy from `.env.example`) and set:
```
OPENMIC_API_KEY=omic_xxx   # your OpenMic API key (optional for this demo)
PORT=3000
```

4. Run the server:
```bash
npm start
```

5. Expose using ngrok:
```bash
ngrok http 3000
```
Copy the `https://...` URL from ngrok and configure OpenMic dashboard:
- Pre-call webhook URL: `https://your-ngrok-url/webhooks/precall`
- In-call custom function URL: `https://your-ngrok-url/functions/getPatient`
- Post-call webhook URL: `https://your-ngrok-url/webhooks/postcall`

6. Use the OpenMic dashboard "Test Call" to simulate a call to the bot you create.

## Project structure
```
/public
  index.html   # small UI to manage bots and view logs
server.js
package.json
db.json        # runtime DB (created/updated by server)
README.md
.env.example
```

## Notes about security
- This is a demo intended for local dev. Do **NOT** expose private API keys in public repos.
- In production, secure webhooks with HMAC or token-based verification.

## What to demo in your Loom video
- Create a bot via the UI and copy its UID.
- Configure the bot in OpenMic dashboard and set Pre-call, Function, and Post-call URLs to your ngrok endpoints.
- Run "Test Call" from OpenMic. Show:
  - Pre-call webhook being called (OpenMic dashboard shows pre-call response).
  - During call: the agent asks for Medical ID; OpenMic function call triggers `/functions/getPatient`.
  - Post-call: transcript sent to `/webhooks/postcall` and saved in call logs shown in the UI.

"# openmic-intake-ai-agent-medical" 
