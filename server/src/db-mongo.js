import mongoose from 'mongoose';
import { Department, Provider, RoomBay, Patient, AuditLog } from './models/index.js';
import { generatePatientDisplayToken, generateAuditHash } from './hipaa.js';
import { recalculateDepartmentQueue } from './predictionEngine.js';

class MongoDatabase {
  async connect() {
    try {
      const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pulseflow';
      await mongoose.connect(uri);
      console.log('✅ Connected to MongoDB');
      
      const deptCount = await Department.countDocuments();
      if (deptCount === 0) {
        console.log('🌱 Seeding initial MongoDB data...');
        await this.seedInitialData();
      }
    } catch (err) {
      console.error('❌ MongoDB Connection Error:', err.message);
      console.log('Ensure MongoDB is running locally on port 27017 or provide a valid MONGODB_URI in .env');
    }
  }

  async seedInitialData() {
    await Promise.all([
      Department.deleteMany({}),
      Provider.deleteMany({}),
      RoomBay.deleteMany({}),
      Patient.deleteMany({}),
      AuditLog.deleteMany({})
    ]);

    const initialDepts = [
      { id: 'dept-ed', name: 'Emergency Department', code: 'ED', description: 'Main Adult Emergency Medicine, Acute Care, and Rapid Stabilization', totalBeds: 24, occupiedBeds: 18, activePhysicians: 4, activeNurses: 8, targetDoorToDoctorMinutes: 30, isDiverting: false, surgeStatus: 'moderate', averageWaitMinutes: 28, queueCount: 7 },
      { id: 'dept-uc', name: 'Urgent Care Center', code: 'UC', description: 'Sub-acute illness, minor injuries, fractures, and rapid clinic care', totalBeds: 12, occupiedBeds: 7, activePhysicians: 2, activeNurses: 4, targetDoorToDoctorMinutes: 20, isDiverting: false, surgeStatus: 'normal', averageWaitMinutes: 18, queueCount: 5 },
      { id: 'dept-ped', name: 'Pediatric Emergency', code: 'PED', description: 'Dedicated children and adolescent acute emergency wing', totalBeds: 14, occupiedBeds: 9, activePhysicians: 2, activeNurses: 5, targetDoorToDoctorMinutes: 25, isDiverting: false, surgeStatus: 'normal', averageWaitMinutes: 22, queueCount: 4 },
      { id: 'dept-trauma', name: 'Trauma & Critical Resus', code: 'TRAUMA', description: 'Level 1 Trauma resuscitation bays', totalBeds: 6, occupiedBeds: 3, activePhysicians: 3, activeNurses: 6, targetDoorToDoctorMinutes: 0, isDiverting: false, surgeStatus: 'normal', averageWaitMinutes: 0, queueCount: 1 },
    ];
    await Department.insertMany(initialDepts);

    const initialProviders = [
      { id: 'prov-admin', name: 'Jane Admin', role: 'Administrator', departmentId: 'dept-ed', email: 'admin@mediqueue.com', status: 'on_duty' },
      { id: 'prov-staff', name: 'John Staff, RN', role: 'Clinical Provider', departmentId: 'dept-ed', email: 'staff@mediqueue.com', status: 'on_duty' }
    ];
    await Provider.insertMany(initialProviders);

    const initialRooms = [
      { id: 'bay-1', departmentId: 'dept-ed', name: 'Exam Bay 01', type: 'Acute Exam', status: 'occupied', currentPatientToken: 'PT-4190' },
      { id: 'bay-3', departmentId: 'dept-ed', name: 'Exam Bay 03', type: 'Acute Exam', status: 'vacant' },
      { id: 'bay-12', departmentId: 'dept-trauma', name: 'Resus Bay Alpha', type: 'Trauma/Resus', status: 'occupied', currentPatientToken: 'PT-9901' },
    ];
    await RoomBay.insertMany(initialRooms);

    const samplePatients = [
      {
        id: 'pat-1', displayToken: 'PT-8941', departmentId: 'dept-ed', esiLevel: 2, chiefComplaint: 'Substernal chest pressure',
        status: 'in_treatment', calculatedPriorityScore: 92, estimatedWaitMinutes: 0, arrivalTime: new Date(),
        phi: { email: 'patient@mediqueue.com', legalFullName: 'Demo Patient' }
      }
    ];
    await Patient.insertMany(samplePatients);

    await this.addAuditLog({
      userId: 'system-init', userName: 'Hospital System Engine', userRole: 'System Engine',
      action: 'SYSTEM_MIGRATION', details: 'Successfully migrated backend architecture to MongoDB.',
      ipAddress: '127.0.0.1',
    });

    await this.recalculateAllWaitTimes();
  }

  async addAuditLog(entry) {
    const timestamp = new Date();
    const id = `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    
    // We await for the creation to complete
    const log = await AuditLog.create({
      ...entry,
      id,
      timestamp,
      tamperHash: generateAuditHash({ ...entry, timestamp: timestamp.toISOString() }),
    });
    return log;
  }

  async getAuditLogs() {
    return await AuditLog.find().sort({ timestamp: -1 }).limit(50);
  }

  async getDepartments() {
    return await Department.find().lean();
  }

  async getDepartment(id) {
    return await Department.findOne({ id }).lean();
  }

  async updateDepartment(id, updates, user) {
    const dept = await Department.findOne({ id });
    if (!dept) return null;

    const prevDiversion = dept.isDiverting;
    Object.assign(dept, updates);
    await dept.save();

    if (updates.isDiverting !== undefined && updates.isDiverting !== prevDiversion) {
      await this.addAuditLog({
        userId: user.id, userName: user.name, userRole: user.role,
        action: 'DIVERSION_TOGGLED',
        details: `Ambulance diversion for ${dept.name} toggled to ${updates.isDiverting ? 'ACTIVE' : 'INACTIVE'}`,
        ipAddress: '10.24.11.90',
      });
    }

    if (updates.activePhysicians !== undefined || updates.activeNurses !== undefined) {
      await this.addAuditLog({
        userId: user.id, userName: user.name, userRole: user.role,
        action: 'STAFF_REALLOCATION',
        details: `Updated staffing for ${dept.name}: ${dept.activePhysicians} Physicians, ${dept.activeNurses} Nurses`,
        ipAddress: '10.24.11.90',
      });
      await this.recalculateAllWaitTimes();
    }

    return dept;
  }

  async getProviders() {
    return await Provider.find().lean();
  }

  async registerProvider(data) {
    const id = `prov-${Date.now()}`;
    const newProvider = await Provider.create({
      id,
      name: data.name,
      role: data.role,
      departmentId: data.departmentId,
      status: 'on_duty',
      email: data.email,
      npi: data.npi,
      facility: data.facility
    });
    
    await this.addAuditLog({
      userId: id, userName: data.name, userRole: data.role,
      action: 'PROVIDER_REGISTERED',
      details: `New clinical provider registered and paired with ${data.departmentId}.`,
      ipAddress: '10.24.11.99',
    });
    
    return newProvider;
  }

  async getRooms() {
    return await RoomBay.find().lean();
  }

  async updateRoom(id, updates) {
    return await RoomBay.findOneAndUpdate({ id }, updates, { new: true }).lean();
  }

  async getAllPatients() {
    return await Patient.find().lean();
  }

  async getPatient(id) {
    return await Patient.findOne({ id }).lean();
  }

  async getPatientByToken(token) {
    const cleanToken = token.trim().toUpperCase();
    return await Patient.findOne({ displayToken: cleanToken }).lean();
  }

  async checkInPatient(data) {
    const id = `pat-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const displayToken = generatePatientDisplayToken();
    const esiLevel = data.esiLevel || 3;

    const newPatient = await Patient.create({
      id,
      displayToken,
      departmentId: data.departmentId,
      esiLevel,
      chiefComplaint: data.chiefComplaint,
      status: 'checked_in',
      arrivalTime: new Date(),
      calculatedPriorityScore: 50,
      estimatedWaitMinutes: 20,
      vitals: data.vitals,
      phi: {
        legalFullName: data.legalFullName,
        dateOfBirth: data.dateOfBirth,
        mrn: data.mrn || `MRN-${Math.floor(100000 + Math.random() * 900000)}`,
        phoneNumber: data.phoneNumber || '+91 98000 0000',
        emergencyContact: data.emergencyContact || 'None provided',
      },
    });

    await this.addAuditLog({
      userId: data.recordedBy.id, userName: data.recordedBy.name, userRole: data.recordedBy.role,
      action: 'PATIENT_INTAKE', patientToken: displayToken,
      details: `Intake recorded for ${displayToken}. Assigned preliminary ESI Level ${esiLevel}.`,
      ipAddress: '10.24.11.84',
    });

    await this.recalculateAllWaitTimes();
    return newPatient.toObject();
  }

  async updatePatientStatus(patientId, newStatus, extra) {
    const patient = await Patient.findOne({ id: patientId });
    if (!patient) return null;

    const oldStatus = patient.status;
    patient.status = newStatus;

    if (extra.esiLevel) patient.esiLevel = extra.esiLevel;
    if (extra.vitals) patient.vitals = extra.vitals;

    if (newStatus === 'in_triage' && !patient.triageTime) {
      patient.triageTime = new Date();
    }
    if (newStatus === 'in_treatment') {
      patient.treatmentStartTime = new Date();
      patient.estimatedWaitMinutes = 0;
    }
    if (newStatus === 'discharged') {
      patient.dischargedTime = new Date();
      patient.estimatedWaitMinutes = 0;
      if (patient.assignedRoomId) {
        await RoomBay.findOneAndUpdate({ id: patient.assignedRoomId }, { status: 'cleaning', currentPatientToken: null });
      }
    }

    if (extra.assignedRoomId) {
      patient.assignedRoomId = extra.assignedRoomId;
      const room = await RoomBay.findOneAndUpdate(
        { id: extra.assignedRoomId },
        { status: 'occupied', currentPatientToken: patient.displayToken },
        { new: true }
      );
      if (room) patient.assignedRoomName = room.name;
    }

    if (extra.assignedProviderId) {
      patient.assignedProviderId = extra.assignedProviderId;
      const provider = await Provider.findOne({ id: extra.assignedProviderId });
      if (provider) patient.assignedProviderName = provider.name;
    }

    await patient.save();

    await this.addAuditLog({
      userId: extra.user.id, userName: extra.user.name, userRole: extra.user.role,
      action: newStatus === 'discharged' ? 'PATIENT_DISCHARGE' : 'STATUS_CHANGE',
      patientToken: patient.displayToken,
      details: `Status progressed from ${oldStatus} to ${newStatus}.`,
      ipAddress: '10.24.11.84',
    });

    await this.recalculateAllWaitTimes();
    return patient.toObject();
  }

  async overridePriority(patientId, params) {
    const patient = await Patient.findOne({ id: patientId });
    if (!patient) return null;

    if (!patient.originalEsiLevel) {
      patient.originalEsiLevel = patient.esiLevel;
    }

    const isReset = params.justificationCategory === 'De-escalation / Normalization';

    patient.isPriorityOverridden = !isReset;
    patient.overrideReason = `${params.justificationCategory}: ${params.reason}`;
    patient.overriddenBy = params.user.name;
    patient.overriddenAt = new Date();

    if (isReset) {
      patient.isPriorityOverridden = false;
      patient.esiLevel = patient.originalEsiLevel || patient.esiLevel;
    } else {
      if (params.overrideEsi) patient.esiLevel = params.overrideEsi;
      patient.calculatedPriorityScore = params.overrideScore !== undefined ? params.overrideScore : 98;
    }

    await patient.save();

    await this.addAuditLog({
      userId: params.user.id, userName: params.user.name, userRole: params.user.role,
      action: 'PRIORITY_OVERRIDE', patientToken: patient.displayToken,
      clinicalJustification: `${params.justificationCategory} - ${params.reason}`,
      details: `Priority manually ${isReset ? 'RESET' : 'OVERRIDDEN'}.`,
      ipAddress: '10.24.11.99',
    });

    await this.recalculateAllWaitTimes();
    return patient.toObject();
  }

  async recalculateAllWaitTimes() {
    // Basic async implementation of wait time recalculation using Mongoose
    const allPatients = await Patient.find().lean();
    const allProviders = await Provider.find().lean();
    const allRooms = await RoomBay.find().lean();
    const allDepts = await Department.find();

    for (const dept of allDepts) {
      const updatedDeptPatients = recalculateDepartmentQueue(allPatients, dept, allProviders, allRooms);
      
      for (const p of updatedDeptPatients) {
        // Bulk update would be better here, but for simplicity:
        await Patient.updateOne({ id: p.id }, { 
          estimatedWaitMinutes: p.estimatedWaitMinutes,
          calculatedPriorityScore: p.calculatedPriorityScore
        });
      }

      const activeWaiting = updatedDeptPatients.filter(
        p => ['checked_in', 'in_triage', 'triage_completed', 'waiting_for_bed'].includes(p.status)
      );

      dept.queueCount = activeWaiting.length;
      if (activeWaiting.length > 0) {
        const sumWait = activeWaiting.reduce((acc, curr) => acc + curr.estimatedWaitMinutes, 0);
        dept.averageWaitMinutes = Math.round(sumWait / activeWaiting.length);
      } else {
        dept.averageWaitMinutes = 0;
      }

      const bedOccupancyRatio = dept.occupiedBeds / Math.max(1, dept.totalBeds);
      if (bedOccupancyRatio > 0.9 || dept.averageWaitMinutes > 45) {
        dept.surgeStatus = 'critical';
      } else if (bedOccupancyRatio > 0.7 || dept.averageWaitMinutes > 25) {
        dept.surgeStatus = 'moderate';
      } else {
        dept.surgeStatus = 'normal';
      }

      await dept.save();
    }
  }

  async getAnalytics() {
    const depts = await Department.find().lean();

    const departmentThroughput = depts.map(d => {
      const isEd = d.code === 'ED';
      const isUc = d.code === 'UC';
      const isPed = d.code === 'PED';

      return {
        departmentId: d.id,
        name: d.name,
        totalPatientsToday: isEd ? 68 : isUc ? 44 : isPed ? 29 : 14,
        currentWaitTimeAvg: d.averageWaitMinutes,
        doorToDoctorAvg: isEd ? 27 : isUc ? 16 : isPed ? 21 : 3,
        lengthOfStayAvg: isEd ? 164 : isUc ? 58 : isPed ? 112 : 210,
        lwbsRate: isEd ? 1.4 : isUc ? 0.8 : isPed ? 0.5 : 0.0,
        peakHour: '18:00 - 20:00',
        bedTurnoverRate: Number((isEd ? 3.4 : isUc ? 4.8 : isPed ? 2.8 : 2.1).toFixed(1)),
        targetMetPercentage: isEd ? 88 : isUc ? 94 : isPed ? 91 : 99,
      };
    });

    const hourlySurgeData = [
      { hour: '06:00', arrivals: 4, discharges: 2, averageWait: 12 },
      { hour: '08:00', arrivals: 9, discharges: 5, averageWait: 18 },
      { hour: '10:00', arrivals: 14, discharges: 11, averageWait: 26 },
      { hour: '12:00', arrivals: 18, discharges: 14, averageWait: 32 },
    ];

    const acuityDistribution = [
      { esiLevel: 1, count: 2, averageWaitMinutes: 0, label: 'ESI 1 - Resuscitation', color: '#ef4444' },
      { esiLevel: 2, count: 5, averageWaitMinutes: 8, label: 'ESI 2 - Emergent', color: '#f97316' },
      { esiLevel: 3, count: 12, averageWaitMinutes: 24, label: 'ESI 3 - Urgent', color: '#eab308' },
    ];

    return {
      departmentThroughput,
      hourlySurgeData,
      acuityDistribution,
      kpis: {
        averageDoorToDoctor: 23, averageLengthOfStay: 142,
        lwbsRate: 1.1, totalPatientsTreated: 155,
        bedTurnoverVelocity: 3.3, hipaaComplianceScore: 100,
      },
    };
  }
}

export const db = new MongoDatabase();
