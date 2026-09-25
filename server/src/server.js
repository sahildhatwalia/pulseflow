import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './db-mongo.js';
import { sanitizePatientForPublic } from './hipaa.js';
import { authMiddleware, roleMiddleware, generateToken } from './auth.js';
import { predictTriageLevel } from './ai.js';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

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
io.on('connection', async (socket) => {
  try {
    const departments = await db.getDepartments();
    const rawPatients = await db.getAllPatients();

    socket.emit('queue:sync', {
      departments,
      patients: rawPatients,
      timestamp: new Date().toISOString(),
    });

    socket.on('join:room', (roomName) => {
      socket.join(roomName);
    });
  } catch (err) {
    console.error('Socket connection error:', err);
  }
});

/**
 * Broadcast updated queue, wait times, and departments to all connected Socket.io clients
 */
export async function broadcastQueueUpdate(eventPayload) {
  try {
    const departments = await db.getDepartments();
    const patients = await db.getAllPatients();
    const auditLogs = await db.getAuditLogs();

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
  } catch (err) {
    console.error('Broadcast error:', err);
  }
}

// REST API Endpoints

// 1. Departments
app.get('/api/departments', authMiddleware, async (req, res) => {
  try {
    const data = await db.getDepartments();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/departments/:id', authMiddleware, roleMiddleware(['Administrator', 'Clinical Supervisor']), async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const updated = await db.updateDepartment(id, req.body.updates, user);

    if (!updated) {
      res.status(404).json({ success: false, error: 'Department not found' });
      return;
    }

    broadcastQueueUpdate({
      eventType: 'department:updated',
      message: `Department ${updated.name} settings updated`,
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Queue & Patients
app.get('/api/queue', authMiddleware, async (req, res) => {
  try {
    const role = req.query.role || 'staff';
    const departmentId = req.query.departmentId;
    let patients = await db.getAllPatients();

    if (departmentId) {
      patients = patients.filter(p => p.departmentId === departmentId);
    }

    if (role === 'public') {
      const publicPatients = patients.map(sanitizePatientForPublic);
      res.json({ success: true, data: publicPatients, isDeIdentified: true });
      return;
    }

    res.json({ success: true, data: patients, isDeIdentified: false });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Patient Self-Lookup by Token
app.get('/api/patient/:token', authMiddleware, async (req, res) => {
  try {
    const { token } = req.params;
    const patient = await db.getPatientByToken(token);

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
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/ai/predict-triage', authMiddleware, async (req, res) => {
  try {
    const { chiefComplaint, vitals } = req.body;
    const prediction = await predictTriageLevel(chiefComplaint, vitals);
    res.json({ success: true, data: prediction });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/queue/checkin', authMiddleware, async (req, res) => {
  try {
    const {
      legalFullName, dateOfBirth, departmentId, chiefComplaint,
      esiLevel, vitals, mrn, phoneNumber, emergencyContact,
    } = req.body;

    const patient = await db.checkInPatient({
      legalFullName: legalFullName || 'Patient',
      dateOfBirth: dateOfBirth || '1990-01-01',
      departmentId: departmentId || 'dept-ed',
      chiefComplaint: chiefComplaint || 'General acute consultation',
      esiLevel: esiLevel ? Number(esiLevel) : 3,
      vitals, mrn, phoneNumber, emergencyContact,
      recordedBy: req.user,
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
app.patch('/api/queue/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignedRoomId, assignedProviderId, vitals, esiLevel } = req.body;

    const updated = await db.updatePatientStatus(id, status, {
      assignedRoomId, assignedProviderId, vitals, esiLevel,
      user: req.user,
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
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Manual Priority Override (CRITICAL REQUIREMENT)
app.post('/api/queue/:id/override-priority', authMiddleware, roleMiddleware(['Administrator', 'Clinical Supervisor', 'Charge Nurse']), async (req, res) => {
  try {
    const { id } = req.params;
    const { overrideScore, overrideEsi, reason, justificationCategory } = req.body;

    if (!reason || !justificationCategory) {
      res.status(400).json({
        success: false,
        error: 'Clinical justification category and explanatory reason are strictly mandatory under HIPAA regulations.',
      });
      return;
    }

    const updated = await db.overridePriority(id, {
      overrideScore: overrideScore !== undefined ? Number(overrideScore) : undefined,
      overrideEsi: overrideEsi !== undefined ? Number(overrideEsi) : undefined,
      reason, justificationCategory,
      user: req.user,
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
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Providers & Rooms
app.get('/api/providers', authMiddleware, async (req, res) => {
  try {
    const data = await db.getProviders();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/rooms', authMiddleware, async (req, res) => {
  try {
    const data = await db.getRooms();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Analytics
app.get('/api/analytics', authMiddleware, async (req, res) => {
  try {
    const data = await db.getAnalytics();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Auth & Registration
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 1. Check Staff
    const providers = await db.getProviders();
    let user = providers.find(p => p.email === email || p.id === email);
    
    // 2. Check Patients
    if (!user) {
      const patients = await db.getAllPatients();
      const patient = patients.find(p => p.phi?.email === email || p.displayToken === email);
      if (patient) {
        user = {
          id: patient.id,
          name: patient.phi?.legalFullName || patient.displayToken,
          role: 'Patient',
          email: email
        };
      }
    }
    
    // Fallback for demo convenience
    if (!user && (email === 'admin' || email.includes('admin'))) {
      user = providers.find(p => p.role === 'Administrator') || providers[0];
    }
    
    if (user) {
      const token = generateToken(user);
      res.json({ success: true, data: { user: user, token } });
    } else {
      res.status(401).json({ success: false, error: 'Invalid credentials.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { firstName, lastName, email, npi, department, facility, password, role } = req.body;
    
    const newProvider = await db.registerProvider({
      name: `${firstName} ${lastName}`, email, npi,
      departmentId: department, facility,
      role: role === 'clinical' ? 'Clinical Provider' : 'Hospital Operations',
    });
    
    const token = generateToken(newProvider);
    res.json({ success: true, data: { user: newProvider, token } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Audit Logs
app.get('/api/audit-logs', authMiddleware, async (req, res) => {
  try {
    const data = await db.getAuditLogs();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Simulate Live Arrival / Surge Trigger
app.post('/api/simulate-arrival', authMiddleware, async (req, res) => {
  try {
    const { type, departmentId } = req.body;
    const deptId = departmentId || 'dept-ed';

    const isAmbulance = type === 'ambulance';
    const displayToken = await db.checkInPatient({
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
      recordedBy: req.user,
    });

    broadcastQueueUpdate({
      eventType: 'patient:checkin',
      patientToken: displayToken.displayToken,
      message: `${isAmbulance ? '🚨 AMBULANCE' : '⚡ Urgent'} arrived: ${displayToken.displayToken} (ESI ${displayToken.esiLevel})`,
    });

    res.json({ success: true, data: displayToken });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Reset seed data
app.post('/api/reset-data', authMiddleware, async (req, res) => {
  try {
    await db.seedInitialData();
    broadcastQueueUpdate({
      eventType: 'system:reset',
      message: 'System queue and departments reset to initial state',
    });
    res.json({ success: true, message: 'Database reset to initial seed' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Vite Middleware & Static Serving Setup
async function startServer() {
  const initialPort = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Connect to MongoDB Database!
  await db.connect();

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
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
}

startServer();
