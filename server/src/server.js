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
    // Parallel fetch — avoids sequential await round-trips
    const [departments, rawPatients] = await Promise.all([
      db.getDepartments(),
      db.getAllPatients(),
    ]);

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
    // Fetch all data in parallel — previously 3 sequential round-trips
    const [departments, patients, auditLogs] = await Promise.all([
      db.getDepartments(),
      db.getAllPatients(),
      db.getAuditLogs(),
    ]);

    const timestamp = new Date().toISOString();

    // Single combined payload instead of 3 separate emits
    io.emit('queue:sync', {
      departments,
      patients,
      auditLogs: auditLogs.slice(0, 50),
      timestamp,
      event: eventPayload,
    });

    // Specific event emits for targeted listeners
    if (eventPayload?.eventType === 'patient:called') {
      io.emit('patient:called', eventPayload);
    }
    if (eventPayload?.eventType === 'priority:overridden') {
      io.emit('priority:overridden', eventPayload);
    }
  } catch (err) {
    console.error('Broadcast error:', err);
  }
}

// REST API Endpoints

// ─── PUBLIC ENDPOINTS (No Authentication Required) ────────────────────────────
// These allow patients to track tickets and view wait times without logging in.

// Public: Track a patient ticket by display token (returns de-identified data only)
app.get('/api/public/track/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const patient = await db.getPatientByToken(token.toUpperCase());

    if (!patient) {
      res.status(404).json({ success: false, error: 'No active record found for this ticket number. Please verify your ticket with the triage desk.' });
      return;
    }

    // Return only safe, de-identified data — no PHI, no vitals
    const safeData = {
      displayToken: patient.displayToken,
      status: patient.status,
      departmentId: patient.departmentId,
      estimatedWaitMinutes: patient.estimatedWaitMinutes,
      waitTrend: patient.waitTrend,
      chiefComplaint: patient.chiefComplaint,
      assignedRoomName: patient.assignedRoomName || null,
      assignedProviderName: patient.assignedProviderName ? patient.assignedProviderName.split(' ')[0] + ' ...' : null,
      arrivalTime: patient.arrivalTime,
      esiLevel: patient.esiLevel,
      calculatedPriorityScore: patient.calculatedPriorityScore,
    };

    res.json({ success: true, data: safeData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Public: Get department wait times (de-identified — no patient data)
app.get('/api/public/wait-times', async (req, res) => {
  try {
    const departments = await db.getDepartments();
    // Return only public-safe department info
    const safeData = departments.map(d => ({
      id: d.id,
      name: d.name,
      code: d.code,
      description: d.description,
      averageWaitMinutes: d.averageWaitMinutes,
      surgeStatus: d.surgeStatus,
      queueCount: d.queueCount,
      totalBeds: d.totalBeds,
      occupiedBeds: d.occupiedBeds,
      activePhysicians: d.activePhysicians,
      activeNurses: d.activeNurses,
      isDiverting: d.isDiverting,
    }));
    res.json({ success: true, data: safeData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── AUTHENTICATED ENDPOINTS ──────────────────────────────────────────────────

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

// Known system demo accounts for seamless multi-role access
const DEMO_ACCOUNTS = [
  { id: 'prov-admin',      name: 'Jane Admin',          role: 'Administrator',       departmentId: 'dept-ed',    email: 'admin@mediqueue.com' },
  { id: 'prov-supervisor', name: 'Dr. Sam Okonkwo',     role: 'Clinical Supervisor', departmentId: 'dept-trauma',email: 'supervisor@mediqueue.com' },
  { id: 'prov-doctor',     name: 'Dr. Aisha Kapoor',    role: 'Clinical Provider',   departmentId: 'dept-ed',    email: 'doctor@mediqueue.com' },
  { id: 'prov-nurse',      name: 'Marcus Chen, RN',     role: 'Charge Nurse',        departmentId: 'dept-ed',    email: 'nurse@mediqueue.com' },
  { id: 'prov-reception',  name: 'Priya Sharma',        role: 'Hospital Operations', departmentId: 'dept-ed',    email: 'reception@mediqueue.com' },
  { id: 'prov-staff',      name: 'John Staff, RN',      role: 'Clinical Provider',   departmentId: 'dept-uc',    email: 'staff@mediqueue.com' },
  { id: 'pat-1',           name: 'Demo Patient',        role: 'Patient',             departmentId: 'dept-ed',    email: 'patient@mediqueue.com' },
];

// Auth & Registration
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = email?.trim().toLowerCase() || '';

    // 1. Check known system demo accounts by full email, ID, or role keyword
    let user = DEMO_ACCOUNTS.find(a => 
      a.email.toLowerCase() === cleanEmail || 
      a.id.toLowerCase() === cleanEmail ||
      (cleanEmail.includes('admin') && a.role === 'Administrator') ||
      (cleanEmail.includes('supervisor') && a.role === 'Clinical Supervisor') ||
      (cleanEmail.includes('doctor') && a.email.includes('doctor')) ||
      (cleanEmail.includes('nurse') && a.role === 'Charge Nurse') ||
      (cleanEmail.includes('reception') && a.role === 'Hospital Operations') ||
      (cleanEmail.includes('patient') && a.role === 'Patient')
    );

    // 2. Check Database Providers if not matched in demo accounts
    if (!user) {
      const providers = await db.getProviders();
      user = providers.find(p => p.email?.toLowerCase() === cleanEmail || p.id?.toLowerCase() === cleanEmail);
    }

    // 3. Check Database Patients by email
    if (!user) {
      const patient = await db.getPatientByEmail(cleanEmail);
      if (patient) {
        user = {
          id: patient.id,
          name: patient.phi?.legalFullName || patient.displayToken,
          role: 'Patient',
          email: cleanEmail,
        };
      }
    }
    
    if (user) {
      const token = generateToken(user);
      res.json({ success: true, data: { user, token } });
    } else {
      res.status(401).json({ success: false, error: 'Invalid credentials. Please select one of the hospital demo roles.' });
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
