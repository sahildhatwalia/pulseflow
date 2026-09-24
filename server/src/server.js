import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './db.js';
import { sanitizePatientForPublic } from './hipaa.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  },
  pingTimeout: 30000,
  pingInterval: 10000,
});

app.use(express.json());

// Socket.io Real-Time Event Hub
io.on('connection', (socket) => {
  const departments = db.getDepartments();
  const rawPatients = db.getAllPatients();

  socket.emit('queue:sync', {
    departments,
    patients: rawPatients,
    timestamp: new Date().toISOString(),
  });

  socket.on('join:room', (roomName) => {
    socket.join(roomName);
  });
});

/**
 * Broadcast updated queue, wait times, and departments to all connected Socket.io clients
 */
export function broadcastQueueUpdate(eventPayload) {
  const departments = db.getDepartments();
  const patients = db.getAllPatients();
  const auditLogs = db.getAuditLogs();

  io.emit('queue:updated', {
    departments,
    patients,
    timestamp: new Date().toISOString(),
    event: eventPayload,
  });

  io.emit('wait_times:recalculated', {
    departments,
    timestamp: new Date().toISOString(),
  });

  io.emit('audit:logged', {
    logs: auditLogs.slice(0, 50),
  });

  if (eventPayload && eventPayload.eventType === 'patient:called') {
    io.emit('patient:called', eventPayload);
  }

  if (eventPayload && eventPayload.eventType === 'priority:overridden') {
    io.emit('priority:overridden', eventPayload);
  }
}

// REST API Endpoints

// 1. Departments
app.get('/api/departments', (req, res) => {
  res.json({ success: true, data: db.getDepartments() });
});

app.patch('/api/departments/:id', (req, res) => {
  const { id } = req.params;
  const user = req.body.user || { id: 'admin-01', name: 'Clinical Administrator', role: 'Administrator' };
  const updated = db.updateDepartment(id, req.body.updates, user);

  if (!updated) {
    res.status(404).json({ success: false, error: 'Department not found' });
    return;
  }

  broadcastQueueUpdate({
    eventType: 'department:updated',
    message: `Department ${updated.name} settings updated`,
  });

  res.json({ success: true, data: updated });
});

// 2. Queue & Patients
app.get('/api/queue', (req, res) => {
  const role = req.query.role || 'staff';
  const departmentId = req.query.departmentId;
  let patients = db.getAllPatients();

  if (departmentId) {
    patients = patients.filter(p => p.departmentId === departmentId);
  }

  if (role === 'public') {
    const publicPatients = patients.map(sanitizePatientForPublic);
    res.json({ success: true, data: publicPatients, isDeIdentified: true });
    return;
  }

  res.json({ success: true, data: patients, isDeIdentified: false });
});

// Patient Self-Lookup by Token
app.get('/api/patient/:token', (req, res) => {
  const { token } = req.params;
  const patient = db.getPatientByToken(token);

  if (!patient) {
    res.status(404).json({ success: false, error: 'Patient ticket not found' });
    return;
  }

  res.json({
    success: true,
    data: {
      ...sanitizePatientForPublic(patient),
      chiefComplaint: patient.chiefComplaint,
      arrivalTime: patient.arrivalTime,
      triageTime: patient.triageTime,
      treatmentStartTime: patient.treatmentStartTime,
      assignedRoomName: patient.assignedRoomName,
      assignedProviderName: patient.assignedProviderName,
    },
  });
});

// Patient Intake Check-In
import { predictTriageLevel } from './ai.js';

app.post('/api/ai/predict-triage', async (req, res) => {
  try {
    const { chiefComplaint, vitals } = req.body;
    const prediction = await predictTriageLevel(chiefComplaint, vitals);
    res.json({ success: true, data: prediction });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/queue/checkin', (req, res) => {
  try {
    const {
      legalFullName,
      dateOfBirth,
      departmentId,
      chiefComplaint,
      esiLevel,
      vitals,
      mrn,
      phoneNumber,
      emergencyContact,
      recordedBy,
    } = req.body;

    const patient = db.checkInPatient({
      legalFullName: legalFullName || 'Patient',
      dateOfBirth: dateOfBirth || '1990-01-01',
      departmentId: departmentId || 'dept-ed',
      chiefComplaint: chiefComplaint || 'General acute consultation',
      esiLevel: esiLevel ? Number(esiLevel) : 3,
      vitals,
      mrn,
      phoneNumber,
      emergencyContact,
      recordedBy: recordedBy || { id: 'nurse-kiosk', name: 'Triage Intake Station', role: 'Nurse' },
    });

    broadcastQueueUpdate({
      eventType: 'patient:checkin',
      patientToken: patient.displayToken,
      message: `New check-in: ${patient.displayToken} in ${patient.departmentId}`,
    });

    res.json({ success: true, data: patient });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update Patient Status
app.patch('/api/queue/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, assignedRoomId, assignedProviderId, vitals, esiLevel, user } = req.body;

  const updated = db.updatePatientStatus(id, status, {
    assignedRoomId,
    assignedProviderId,
    vitals,
    esiLevel,
    user: user || { id: 'staff-station', name: 'Staff Station', role: 'Nurse' },
  });

  if (!updated) {
    res.status(404).json({ success: false, error: 'Patient not found' });
    return;
  }

  const isCalling = status === 'in_treatment' || assignedRoomId;

  broadcastQueueUpdate({
    eventType: isCalling ? 'patient:called' : 'patient:status_change',
    patientToken: updated.displayToken,
    roomName: updated.assignedRoomName,
    message: isCalling 
      ? `Patient ${updated.displayToken} called to ${updated.assignedRoomName || 'Exam Room'}`
      : `Patient ${updated.displayToken} status updated to ${status}`,
  });

  res.json({ success: true, data: updated });
});

// Admin Manual Priority Override (CRITICAL REQUIREMENT)
app.post('/api/queue/:id/override-priority', (req, res) => {
  const { id } = req.params;
  const { overrideScore, overrideEsi, reason, justificationCategory, user } = req.body;

  if (!reason || !justificationCategory) {
    res.status(400).json({
      success: false,
      error: 'Clinical justification category and explanatory reason are strictly mandatory under HIPAA regulations.',
    });
    return;
  }

  const updated = db.overridePriority(id, {
    overrideScore: overrideScore !== undefined ? Number(overrideScore) : undefined,
    overrideEsi: overrideEsi !== undefined ? Number(overrideEsi) : undefined,
    reason,
    justificationCategory,
    user: user || { id: 'admin-01', name: 'Clinical Supervisor', role: 'Administrator' },
  });

  if (!updated) {
    res.status(404).json({ success: false, error: 'Patient not found' });
    return;
  }

  broadcastQueueUpdate({
    eventType: 'priority:overridden',
    patientToken: updated.displayToken,
    message: `Manual Priority Override applied to ${updated.displayToken}: ${justificationCategory}`,
  });

  res.json({ success: true, data: updated });
});

// Providers & Rooms
app.get('/api/providers', (req, res) => {
  res.json({ success: true, data: db.getProviders() });
});

app.get('/api/rooms', (req, res) => {
  res.json({ success: true, data: db.getRooms() });
});

// Analytics
app.get('/api/analytics', (req, res) => {
  res.json({ success: true, data: db.getAnalytics() });
});

// Audit Logs
app.get('/api/audit-logs', (req, res) => {
  res.json({ success: true, data: db.getAuditLogs() });
});

// Simulate Live Arrival / Surge Trigger
app.post('/api/simulate-arrival', (req, res) => {
  const { type, departmentId } = req.body;
  const deptId = departmentId || 'dept-ed';

  const isAmbulance = type === 'ambulance';
  const displayToken = db.checkInPatient({
    legalFullName: isAmbulance ? 'EMS Trauma Arrival' : 'Walk-in Emergent Patient',
    dateOfBirth: '1985-05-15',
    departmentId: deptId,
    chiefComplaint: isAmbulance
      ? 'Direct Inbound EMS: Suspected acute ST-elevation myocardial infarction with diaphoresis'
      : 'Acute sudden severe headache (10/10 worst of life), photophobia, elevated BP',
    esiLevel: isAmbulance ? 1 : 2,
    vitals: isAmbulance
      ? { heartRate: 118, bloodPressureSystolic: 172, bloodPressureDiastolic: 104, oxygenSaturation: 93, respiratoryRate: 24, temperature: 98.8, painScore: 9 }
      : { heartRate: 98, bloodPressureSystolic: 168, bloodPressureDiastolic: 102, oxygenSaturation: 97, respiratoryRate: 18, temperature: 99.2, painScore: 10 },
    recordedBy: { id: 'ems-intake', name: 'Rapid Triage Intake', role: 'Nurse' },
  });

  broadcastQueueUpdate({
    eventType: 'patient:checkin',
    patientToken: displayToken.displayToken,
    message: `${isAmbulance ? '🚨 AMBULANCE INBOUND' : '⚡ Urgent Patient'} arrived: ${displayToken.displayToken} (ESI ${displayToken.esiLevel})`,
  });

  res.json({ success: true, data: displayToken });
});

// Reset seed data
app.post('/api/reset-data', (req, res) => {
  db.seedInitialData();
  broadcastQueueUpdate({
    eventType: 'system:reset',
    message: 'System queue and departments reset to initial state',
  });
  res.json({ success: true, message: 'Database reset to initial seed' });
});

// Vite Middleware & Static Serving Setup
async function startServer() {
<<<<<<< HEAD
  const PORT = process.env.PORT || 0;
=======
  const initialPort = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
>>>>>>> 817daab (Initial commit to PulseFlow)

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { 
        middlewareMode: true, 
      },
      appType: 'spa',
      root: path.resolve(__dirname, '../../client'),
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, '../../client/dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, '../../client/dist', 'index.html'));
    });
  }

<<<<<<< HEAD
  server.listen(PORT, '0.0.0.0', () => {
    const actualPort = server.address().port;
    console.log(`PulseFlow Hospital Server running on port ${actualPort}`);
    console.log(`🌐 Application URL: http://localhost:${actualPort}`);
  });
=======
  const startWithRetry = (port) => {
    server.listen(port, '0.0.0.0')
      .once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`Port ${port} is in use, trying port ${port + 1}...`);
          startWithRetry(port + 1);
        } else {
          console.error('Server error:', err);
        }
      })
      .once('listening', () => {
        const actualPort = server.address().port;
        console.log(`\n🚀 PulseFlow Hospital Server successfully running!`);
        console.log(`🌐 Local URL: http://localhost:${actualPort}\n`);
      });
  };

  startWithRetry(initialPort);
>>>>>>> 817daab (Initial commit to PulseFlow)
}

startServer();
