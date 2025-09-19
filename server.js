// Simple Express server for OpenMic Intake Agent (Medical preset)
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const DB_PATH = path.join(__dirname, 'db.json');

function readDB() {
  try {
    const raw = fs.readFileSync(DB_PATH);
    return JSON.parse(raw);
  } catch (e) {
    return { bots: [], callLogs: [] };
  }
}
function writeDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// --- Bot CRUD ---
app.get('/api/bots', (req, res) => {
  const db = readDB();
  res.json(db.bots || []);
});

app.post('/api/bots', (req, res) => {
  const db = readDB();
  const bot = req.body;
  // Ensure minimal fields
  bot.uid = bot.uid || ('bot_' + Date.now());
  bot.createdAt = new Date().toISOString();
  db.bots.push(bot);
  writeDB(db);
  res.status(201).json(bot);
});

app.put('/api/bots/:uid', (req, res) => {
  const uid = req.params.uid;
  const db = readDB();
  const idx = db.bots.findIndex(b => b.uid === uid);
  if (idx === -1) return res.status(404).json({ error: 'Bot not found' });
  db.bots[idx] = { ...db.bots[idx], ...req.body, uid };
  writeDB(db);
  res.json(db.bots[idx]);
});

app.delete('/api/bots/:uid', (req, res) => {
  const uid = req.params.uid;
  const db = readDB();
  db.bots = (db.bots || []).filter(b => b.uid !== uid);
  writeDB(db);
  res.json({ ok: true });
});

// --- Simple helper: sample patient records ---
const SAMPLE_PATIENTS = {
  "MED1001": {
    medicalId: "MED1001",
    name: "Aisha Khan",
    dob: "1990-02-14",
    allergies: ["Penicillin"],
    lastVisit: "2025-08-05",
    notes: "Type 2 diabetes. Follow-up due in 1 month."
  },
  "MED1002": {
    medicalId: "MED1002",
    name: "Rahul Verma",
    dob: "1985-10-03",
    allergies: [],
    lastVisit: "2025-07-21",
    notes: "Hypertension. On Amlodipine 5mg."
  }
};

// --- Pre-call webhook: OpenMic will call this before starting a call ---
// It returns patient data (if found) so the agent has context.
app.post('/webhooks/precall', (req, res) => {
  // OpenMic may send caller info. We'll accept ?patientId= or body.callerId
  const patientId = req.query.patientId || (req.body && req.body.callerId) || "MED1001";
  const patient = SAMPLE_PATIENTS[patientId] || {
    medicalId: patientId,
    name: "Unknown",
    dob: "",
    allergies: [],
    lastVisit: null,
    notes: "No prior record"
  };
  // Return the patient object expected by your agent prompt
  res.json({
    success: true,
    patient
  });
});

// --- In-call function endpoint: this acts as the "custom function" target ---
// OpenMic agent configured to call this URL during a call when it needs patient data.
app.post('/functions/getPatient', (req, res) => {
  // Expecting body like { medicalId: "MED1001" } or similar
  const medicalId = (req.body && (req.body.medicalId || req.body.id)) || req.query.medicalId || "MED1001";
  const patient = SAMPLE_PATIENTS[medicalId];
  if (!patient) {
    return res.json({
      ok: false,
      error: 'Patient not found',
      medicalId
    });
  }
  // Also log that a function call was made (store minimal metadata)
  const db = readDB();
  db.callLogs = db.callLogs || [];
  db.callLogs.push({
    id: 'fc_' + Date.now(),
    type: 'function_call',
    function: 'getPatient',
    medicalId,
    result: patient,
    timestamp: new Date().toISOString()
  });
  writeDB(db);

  res.json({
    ok: true,
    data: patient
  });
});

// --- Post-call webhook: OpenMic will send call result/transcript here ---
app.post('/webhooks/postcall', (req, res) => {
  // The payload will contain transcript, call metadata, and possibly function-call traces
  const payload = req.body || {};
  const db = readDB();
  db.callLogs = db.callLogs || [];
  const entry = {
    id: 'call_' + Date.now(),
    receivedAt: new Date().toISOString(),
    payload
  };
  db.callLogs.push(entry);
  writeDB(db);
  console.log('Post-call webhook received and saved:', entry.id);
  res.json({ ok: true, id: entry.id });
});

// Endpoint to read call logs
app.get('/api/call-logs', (req, res) => {
  const db = readDB();
  res.json(db.callLogs || []);
});

// Health
app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`OpenMic Intake Agent demo server running on port ${PORT}`);
  console.log(`Serving UI at http://localhost:${PORT}/`);
});
