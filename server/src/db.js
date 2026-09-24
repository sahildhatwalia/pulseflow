import { generatePatientDisplayToken, generateAuditHash } from './hipaa.js';
import { recalculateDepartmentQueue } from './predictionEngine.js';

class HospitalDatabase {
  constructor() {
    this.departments = new Map();
    this.patients = new Map();
    this.providers = new Map();
    this.roomBays = new Map();
    this.auditLogs = [];

    this.seedInitialData();
  }

  seedInitialData() {
    this.departments.clear();
    this.patients.clear();
    this.providers.clear();
    this.roomBays.clear();
    this.auditLogs = [];

    // 1. Seed Departments
    const initialDepts = [
      {
        id: 'dept-ed',
        name: 'Emergency Department',
        code: 'ED',
        description: 'Main Adult Emergency Medicine, Acute Care, and Rapid Stabilization',
        totalBeds: 24,
        occupiedBeds: 18,
        activePhysicians: 4,
        activeNurses: 8,
        targetDoorToDoctorMinutes: 30,
        isDiverting: false,
        surgeStatus: 'moderate',
        averageWaitMinutes: 28,
        queueCount: 7,
      },
      {
        id: 'dept-uc',
        name: 'Urgent Care Center',
        code: 'UC',
        description: 'Sub-acute illness, minor injuries, fractures, and rapid clinic care',
        totalBeds: 12,
        occupiedBeds: 7,
        activePhysicians: 2,
        activeNurses: 4,
        targetDoorToDoctorMinutes: 20,
        isDiverting: false,
        surgeStatus: 'normal',
        averageWaitMinutes: 18,
        queueCount: 5,
      },
      {
        id: 'dept-ped',
        name: 'Pediatric Emergency',
        code: 'PED',
        description: 'Dedicated children and adolescent acute emergency wing (Ages 0-18)',
        totalBeds: 14,
        occupiedBeds: 9,
        activePhysicians: 2,
        activeNurses: 5,
        targetDoorToDoctorMinutes: 25,
        isDiverting: false,
        surgeStatus: 'normal',
        averageWaitMinutes: 22,
        queueCount: 4,
      },
      {
        id: 'dept-trauma',
        name: 'Trauma & Critical Resus',
        code: 'TRAUMA',
        description: 'Level 1 Trauma resuscitation bays, stroke alerts, and STEMI activations',
        totalBeds: 6,
        occupiedBeds: 3,
        activePhysicians: 3,
        activeNurses: 6,
        targetDoorToDoctorMinutes: 0,
        isDiverting: false,
        surgeStatus: 'normal',
        averageWaitMinutes: 0,
        queueCount: 1,
      },
    ];
    initialDepts.forEach(d => this.departments.set(d.id, d));

    // 2. Seed Staff / Providers
    const initialProviders = [
      { id: 'prov-1', name: 'Dr. Priya Sharma, MD', role: 'Attending Physician', departmentId: 'dept-ed', status: 'on_duty', activePatientsCount: 3, maxPatientsCapacity: 6 },
      { id: 'prov-2', name: 'Dr. Rahul Verma, MD', role: 'Attending Physician', departmentId: 'dept-ed', status: 'on_duty', activePatientsCount: 4, maxPatientsCapacity: 6 },
      { id: 'prov-3', name: 'Kavita Singh, RN, BSN', role: 'Triage Nurse', departmentId: 'dept-ed', status: 'on_duty', activePatientsCount: 5, maxPatientsCapacity: 8 },
      { id: 'prov-4', name: 'Rajesh Kumar, RN', role: 'Charge Nurse', departmentId: 'dept-ed', status: 'on_duty', activePatientsCount: 2, maxPatientsCapacity: 5 },
      { id: 'prov-5', name: 'Dr. Aisha Patel, DO', role: 'Attending Physician', departmentId: 'dept-uc', status: 'on_duty', activePatientsCount: 3, maxPatientsCapacity: 6 },
      { id: 'prov-6', name: 'Sanjay Gupta, PA-C', role: 'Physician Assistant', departmentId: 'dept-uc', status: 'on_duty', activePatientsCount: 4, maxPatientsCapacity: 6 },
      { id: 'prov-7', name: 'Dr. Neha Desai, MD', role: 'Attending Physician', departmentId: 'dept-ped', status: 'on_duty', activePatientsCount: 2, maxPatientsCapacity: 5 },
      { id: 'prov-8', name: 'Anjali Rao, RN, CPN', role: 'Triage Nurse', departmentId: 'dept-ped', status: 'on_duty', activePatientsCount: 3, maxPatientsCapacity: 7 },
      { id: 'prov-9', name: 'Dr. Vikram Rathore, FACS', role: 'Attending Physician', departmentId: 'dept-trauma', status: 'on_duty', activePatientsCount: 1, maxPatientsCapacity: 3 },
    ];
    initialProviders.forEach(p => this.providers.set(p.id, p));

    // 3. Seed Exam Rooms / Bays
    const initialRooms = [
      { id: 'bay-1', departmentId: 'dept-ed', name: 'Exam Bay 01', type: 'Acute Exam', status: 'occupied', currentPatientToken: 'PT-4190' },
      { id: 'bay-2', departmentId: 'dept-ed', name: 'Exam Bay 02', type: 'Acute Exam', status: 'occupied', currentPatientToken: 'PT-7312' },
      { id: 'bay-3', departmentId: 'dept-ed', name: 'Exam Bay 03', type: 'Acute Exam', status: 'vacant' },
      { id: 'bay-4', departmentId: 'dept-ed', name: 'Exam Bay 04', type: 'Acute Exam', status: 'vacant' },
      { id: 'bay-5', departmentId: 'dept-ed', name: 'Cardiac Bay 05', type: 'Acute Exam', status: 'occupied', currentPatientToken: 'PT-8941' },
      { id: 'bay-6', departmentId: 'dept-ed', name: 'Isolation Bay 06', type: 'Acute Exam', status: 'vacant' },
      { id: 'bay-7', departmentId: 'dept-uc', name: 'FastTrack Room A', type: 'Fast Track', status: 'occupied', currentPatientToken: 'PT-2284' },
      { id: 'bay-8', departmentId: 'dept-uc', name: 'FastTrack Room B', type: 'Fast Track', status: 'vacant' },
      { id: 'bay-9', departmentId: 'dept-uc', name: 'Suture / Minor Proc', type: 'Fast Track', status: 'vacant' },
      { id: 'bay-10', departmentId: 'dept-ped', name: 'Pediatric Suite 1', type: 'Pediatric', status: 'occupied', currentPatientToken: 'PT-6610' },
      { id: 'bay-11', departmentId: 'dept-ped', name: 'Pediatric Suite 2', type: 'Pediatric', status: 'vacant' },
      { id: 'bay-12', departmentId: 'dept-trauma', name: 'Resus Bay Alpha', type: 'Trauma/Resus', status: 'occupied', currentPatientToken: 'PT-9901' },
      { id: 'bay-13', departmentId: 'dept-trauma', name: 'Resus Bay Bravo', type: 'Trauma/Resus', status: 'vacant' },
    ];
    initialRooms.forEach(r => this.roomBays.set(r.id, r));

    // 4. Seed Realistic Patients
    const now = Date.now();
    const createTime = (minutesAgo) => new Date(now - minutesAgo * 60000).toISOString();

    const samplePatients = [
      {
        id: 'pat-1',
        displayToken: 'PT-8941',
        departmentId: 'dept-ed',
        esiLevel: 2,
        chiefComplaint: 'Substernal chest pressure radiating to left arm with diaphoresis',
        status: 'in_treatment',
        arrivalTime: createTime(42),
        triageTime: createTime(36),
        treatmentStartTime: createTime(20),
        assignedProviderId: 'prov-1',
        assignedProviderName: 'Dr. Priya Sharma, MD',
        assignedRoomId: 'bay-5',
        assignedRoomName: 'Cardiac Bay 05',
        calculatedPriorityScore: 92,
        estimatedWaitMinutes: 0,
        waitTrend: 'stable',
        isPriorityOverridden: false,
        vitals: {
          heartRate: 104,
          bloodPressureSystolic: 154,
          bloodPressureDiastolic: 98,
          oxygenSaturation: 94,
          respiratoryRate: 22,
          temperature: 98.6,
          painScore: 8,
        },
        phi: {
          legalFullName: 'Arvind Patel',
          dateOfBirth: '1962-04-18',
          mrn: 'MRN-882190',
          phoneNumber: '+91 98234 8901',
          emergencyContact: 'Leela Patel (Spouse) - +91 98234 8902',
        },
      },
      {
        id: 'pat-2',
        displayToken: 'PT-5120',
        departmentId: 'dept-ed',
        esiLevel: 2,
        chiefComplaint: 'Acute sudden dyspnea, wheezing, history of asthma, accessory muscle use',
        status: 'waiting_for_bed',
        arrivalTime: createTime(28),
        triageTime: createTime(20),
        calculatedPriorityScore: 88,
        estimatedWaitMinutes: 6,
        waitTrend: 'falling',
        isPriorityOverridden: false,
        vitals: {
          heartRate: 112,
          bloodPressureSystolic: 136,
          bloodPressureDiastolic: 84,
          oxygenSaturation: 91,
          respiratoryRate: 26,
          temperature: 99.1,
          painScore: 4,
        },
        phi: {
          legalFullName: 'Rohan Sharma',
          dateOfBirth: '1988-11-03',
          mrn: 'MRN-441209',
          phoneNumber: '+91 98782 9901',
          emergencyContact: 'Kavita Sharma (Mother) - +91 98782 9902',
        },
      },
      {
        id: 'pat-3',
        displayToken: 'PT-3341',
        departmentId: 'dept-ed',
        esiLevel: 3,
        chiefComplaint: 'Right lower quadrant abdominal pain x 8h, nausea, rebound tenderness',
        status: 'triage_completed',
        arrivalTime: createTime(48),
        triageTime: createTime(35),
        calculatedPriorityScore: 74,
        estimatedWaitMinutes: 14,
        waitTrend: 'stable',
        isPriorityOverridden: false,
        vitals: {
          heartRate: 92,
          bloodPressureSystolic: 128,
          bloodPressureDiastolic: 80,
          oxygenSaturation: 98,
          respiratoryRate: 18,
          temperature: 100.8,
          painScore: 7,
        },
        phi: {
          legalFullName: 'Meera Reddy',
          dateOfBirth: '1995-07-22',
          mrn: 'MRN-773105',
          phoneNumber: '+91 98345 1234',
          emergencyContact: 'Dilip Reddy (Brother) - +91 98345 1235',
        },
      },
      {
        id: 'pat-4',
        displayToken: 'PT-7104',
        departmentId: 'dept-ed',
        esiLevel: 3,
        chiefComplaint: 'Diabetic patient with hyperglycemia (glucose 380), lethargy and nausea',
        status: 'in_triage',
        arrivalTime: createTime(32),
        calculatedPriorityScore: 71,
        estimatedWaitMinutes: 22,
        waitTrend: 'rising',
        isPriorityOverridden: false,
        vitals: {
          heartRate: 98,
          bloodPressureSystolic: 122,
          bloodPressureDiastolic: 76,
          oxygenSaturation: 97,
          respiratoryRate: 20,
          temperature: 98.4,
          painScore: 3,
        },
        phi: {
          legalFullName: 'Karan Mehta',
          dateOfBirth: '1970-02-14',
          mrn: 'MRN-229048',
          phoneNumber: '+91 98901 2384',
          emergencyContact: 'Sneha Mehta (Wife) - +91 98901 2385',
        },
      },
      {
        id: 'pat-5',
        displayToken: 'PT-8422',
        departmentId: 'dept-ed',
        esiLevel: 4,
        chiefComplaint: 'Closed distal radius wrist deformity post ground level fall',
        status: 'checked_in',
        arrivalTime: createTime(55),
        calculatedPriorityScore: 52,
        estimatedWaitMinutes: 38,
        waitTrend: 'rising',
        isPriorityOverridden: false,
        vitals: {
          heartRate: 78,
          bloodPressureSystolic: 124,
          bloodPressureDiastolic: 78,
          oxygenSaturation: 99,
          respiratoryRate: 16,
          temperature: 98.2,
          painScore: 6,
        },
        phi: {
          legalFullName: 'Esha Bansal',
          dateOfBirth: '1954-09-30',
          mrn: 'MRN-551049',
          phoneNumber: '+91 98492 0192',
          emergencyContact: 'Mohan Bansal (Son) - +91 98492 0193',
        },
      },
      {
        id: 'pat-6',
        displayToken: 'PT-1903',
        departmentId: 'dept-ed',
        esiLevel: 4,
        chiefComplaint: 'Forearm laceration from kitchen knife, bleeding controlled with pressure dressing',
        status: 'checked_in',
        arrivalTime: createTime(35),
        calculatedPriorityScore: 47,
        estimatedWaitMinutes: 48,
        waitTrend: 'stable',
        isPriorityOverridden: false,
        vitals: {
          heartRate: 74,
          bloodPressureSystolic: 118,
          bloodPressureDiastolic: 74,
          oxygenSaturation: 99,
          respiratoryRate: 14,
          temperature: 98.6,
          painScore: 5,
        },
        phi: {
          legalFullName: 'Tarun Joshi',
          dateOfBirth: '1998-05-12',
          mrn: 'MRN-338291',
          phoneNumber: '+91 98819 2031',
          emergencyContact: 'Jaya Joshi (Sister) - +91 98819 2032',
        },
      },
      {
        id: 'pat-7',
        displayToken: 'PT-6029',
        departmentId: 'dept-ed',
        esiLevel: 5,
        chiefComplaint: 'Medication refill for hypertension and chronic mild back ache',
        status: 'checked_in',
        arrivalTime: createTime(40),
        calculatedPriorityScore: 28,
        estimatedWaitMinutes: 75,
        waitTrend: 'stable',
        isPriorityOverridden: false,
        vitals: {
          heartRate: 68,
          bloodPressureSystolic: 132,
          bloodPressureDiastolic: 82,
          oxygenSaturation: 98,
          respiratoryRate: 14,
          temperature: 98.4,
          painScore: 2,
        },
        phi: {
          legalFullName: 'Gaurav Kulkarni',
          dateOfBirth: '1960-08-09',
          mrn: 'MRN-190483',
          phoneNumber: '+91 98604 3921',
          emergencyContact: 'Hema Kulkarni (Wife) - +91 98604 3922',
        },
      },
      // Urgent Care Patients
      {
        id: 'pat-8',
        displayToken: 'PT-2284',
        departmentId: 'dept-uc',
        esiLevel: 4,
        chiefComplaint: 'Mild concussion post soccer match, mild headache, no vomiting',
        status: 'in_treatment',
        arrivalTime: createTime(25),
        triageTime: createTime(18),
        treatmentStartTime: createTime(8),
        assignedProviderId: 'prov-6',
        assignedProviderName: 'Sanjay Gupta, PA-C',
        assignedRoomId: 'bay-7',
        assignedRoomName: 'FastTrack Room A',
        calculatedPriorityScore: 50,
        estimatedWaitMinutes: 0,
        waitTrend: 'stable',
        isPriorityOverridden: false,
        vitals: {
          heartRate: 72,
          bloodPressureSystolic: 120,
          bloodPressureDiastolic: 76,
          oxygenSaturation: 99,
          respiratoryRate: 16,
          temperature: 98.6,
          painScore: 3,
        },
        phi: {
          legalFullName: 'Lakshya Agarwal',
          dateOfBirth: '2005-03-14',
          mrn: 'MRN-603921',
          phoneNumber: '+91 98993 4412',
          emergencyContact: 'Pooja Agarwal (Mother) - +91 98993 4413',
        },
      },
      {
        id: 'pat-9',
        displayToken: 'PT-4481',
        departmentId: 'dept-uc',
        esiLevel: 4,
        chiefComplaint: 'Dysuria, urinary frequency and suprapubic discomfort for 2 days',
        status: 'checked_in',
        arrivalTime: createTime(18),
        calculatedPriorityScore: 46,
        estimatedWaitMinutes: 16,
        waitTrend: 'stable',
        isPriorityOverridden: false,
        phi: {
          legalFullName: 'Harshita Desai',
          dateOfBirth: '1992-12-05',
          mrn: 'MRN-904128',
          phoneNumber: '+91 98441 9023',
          emergencyContact: 'Self',
        },
      },
      // Pediatric Emergency Patient
      {
        id: 'pat-10',
        displayToken: 'PT-6610',
        departmentId: 'dept-ped',
        esiLevel: 3,
        chiefComplaint: 'High febrile illness (103.4 F), barking croup cough, stridor at rest',
        status: 'in_treatment',
        arrivalTime: createTime(35),
        triageTime: createTime(28),
        treatmentStartTime: createTime(12),
        assignedProviderId: 'prov-7',
        assignedProviderName: 'Dr. Neha Desai, MD',
        assignedRoomId: 'bay-10',
        assignedRoomName: 'Pediatric Suite 1',
        calculatedPriorityScore: 78,
        estimatedWaitMinutes: 0,
        waitTrend: 'stable',
        isPriorityOverridden: false,
        vitals: {
          heartRate: 135,
          bloodPressureSystolic: 102,
          bloodPressureDiastolic: 64,
          oxygenSaturation: 95,
          respiratoryRate: 34,
          temperature: 103.4,
          painScore: 6,
        },
        phi: {
          legalFullName: 'Lavanya Iyer (Age 4)',
          dateOfBirth: '2022-06-19',
          mrn: 'MRN-110294',
          phoneNumber: '+91 98773 1092',
          emergencyContact: 'Ekta Iyer (Mother) - +91 98773 1093',
        },
      },
      // Trauma Center Patient
      {
        id: 'pat-11',
        displayToken: 'PT-9901',
        departmentId: 'dept-trauma',
        esiLevel: 1,
        chiefComplaint: 'Major Motor Vehicle Collision rollover, blunt abdominal trauma, hemorrhagic shock',
        status: 'in_treatment',
        arrivalTime: createTime(15),
        treatmentStartTime: createTime(15),
        assignedProviderId: 'prov-9',
        assignedProviderName: 'Dr. Vikram Rathore, FACS',
        assignedRoomId: 'bay-12',
        assignedRoomName: 'Resus Bay Alpha',
        calculatedPriorityScore: 99,
        estimatedWaitMinutes: 0,
        waitTrend: 'stable',
        isPriorityOverridden: false,
        vitals: {
          heartRate: 138,
          bloodPressureSystolic: 84,
          bloodPressureDiastolic: 48,
          oxygenSaturation: 89,
          respiratoryRate: 28,
          temperature: 97.4,
          painScore: 9,
        },
        phi: {
          legalFullName: 'Agyaat Vyakti (Male, ~35)',
          dateOfBirth: '1991-01-01',
          mrn: 'MRN-TRAUMA-01',
          phoneNumber: 'EMS Inbound',
          emergencyContact: 'Pending Police/Social Work Identification',
        },
      },
    ];

    samplePatients.forEach(p => this.patients.set(p.id, p));

    // 5. Seed Initial Audit Logs
    this.addAuditLog({
      userId: 'system-init',
      userName: 'Hospital System Engine',
      userRole: 'System Engine',
      action: 'QUEUE_SIMULATION',
      details: 'HIPAA-compliant Queue Intelligence Core initialized with 4 departments and active ESI prediction pipeline.',
      ipAddress: '127.0.0.1',
    });

    this.addAuditLog({
      userId: 'nurse-lin-03',
      userName: 'Kavita Singh, RN',
      userRole: 'Nurse',
      action: 'PATIENT_INTAKE',
      patientToken: 'PT-5120',
      details: 'Triaged patient with acute asthma exacerbation. ESI Level 2 assigned due to accessory muscle use and SpO2 91%.',
      ipAddress: '10.24.11.84',
    });

    this.recalculateAllWaitTimes();
  }

  addAuditLog(entry) {
    const timestamp = new Date().toISOString();
    const id = `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const fullEntry = {
      ...entry,
      id,
      timestamp,
      tamperHash: generateAuditHash({ ...entry, timestamp }),
    };
    this.auditLogs.unshift(fullEntry);
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
    return fullEntry;
  }

  getAuditLogs() {
    return this.auditLogs;
  }

  getDepartments() {
    return Array.from(this.departments.values());
  }

  getDepartment(id) {
    return this.departments.get(id);
  }

  updateDepartment(id, updates, user) {
    const dept = this.departments.get(id);
    if (!dept) return null;

    const prevDiversion = dept.isDiverting;
    Object.assign(dept, updates);
    this.departments.set(id, dept);

    if (updates.isDiverting !== undefined && updates.isDiverting !== prevDiversion) {
      this.addAuditLog({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'DIVERSION_TOGGLED',
        details: `Ambulance diversion for ${dept.name} toggled to ${updates.isDiverting ? 'ACTIVE (Diverting)' : 'INACTIVE (Open)'}`,
        clinicalJustification: updates.isDiverting ? 'Critical ED bed saturation reached' : 'Capacity restored',
        ipAddress: '10.24.11.90',
      });
    }

    if (updates.activePhysicians !== undefined || updates.activeNurses !== undefined) {
      this.addAuditLog({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'STAFF_REALLOCATION',
        details: `Updated staffing for ${dept.name}: ${dept.activePhysicians} Physicians, ${dept.activeNurses} Nurses`,
        ipAddress: '10.24.11.90',
      });
      this.recalculateAllWaitTimes();
    }

    return dept;
  }

  getProviders() {
    return Array.from(this.providers.values());
  }

  getRooms() {
    return Array.from(this.roomBays.values());
  }

  updateRoom(id, updates) {
    const room = this.roomBays.get(id);
    if (!room) return null;
    Object.assign(room, updates);
    this.roomBays.set(id, room);
    return room;
  }

  getAllPatients() {
    return Array.from(this.patients.values());
  }

  getPatient(id) {
    return this.patients.get(id);
  }

  getPatientByToken(token) {
    const cleanToken = token.trim().toUpperCase();
    return Array.from(this.patients.values()).find(
      p => p.displayToken.toUpperCase() === cleanToken
    );
  }

  checkInPatient(data) {
    const id = `pat-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const displayToken = generatePatientDisplayToken();
    const esiLevel = data.esiLevel || 3;

    const newPatient = {
      id,
      displayToken,
      departmentId: data.departmentId,
      esiLevel,
      chiefComplaint: data.chiefComplaint,
      status: 'checked_in',
      arrivalTime: new Date().toISOString(),
      calculatedPriorityScore: 50,
      estimatedWaitMinutes: 20,
      waitTrend: 'stable',
      isPriorityOverridden: false,
      vitals: data.vitals,
      phi: {
        legalFullName: data.legalFullName,
        dateOfBirth: data.dateOfBirth,
        mrn: data.mrn || `MRN-${Math.floor(100000 + Math.random() * 900000)}`,
        phoneNumber: data.phoneNumber || '+91 98000 0000',
        emergencyContact: data.emergencyContact || 'None provided',
      },
    };

    this.patients.set(id, newPatient);

    this.addAuditLog({
      userId: data.recordedBy.id,
      userName: data.recordedBy.name,
      userRole: data.recordedBy.role,
      action: 'PATIENT_INTAKE',
      patientToken: displayToken,
      details: `Intake recorded for ${displayToken}. Assigned preliminary ESI Level ${esiLevel}. Chief complaint: "${data.chiefComplaint.substring(0, 40)}..."`,
      ipAddress: '10.24.11.84',
    });

    this.recalculateAllWaitTimes();
    return this.patients.get(id);
  }

  updatePatientStatus(patientId, newStatus, extra) {
    const patient = this.patients.get(patientId);
    if (!patient) return null;

    const oldStatus = patient.status;
    patient.status = newStatus;

    if (extra.esiLevel) {
      patient.esiLevel = extra.esiLevel;
    }
    if (extra.vitals) {
      patient.vitals = extra.vitals;
    }

    if (newStatus === 'in_triage' && !patient.triageTime) {
      patient.triageTime = new Date().toISOString();
    }

    if (newStatus === 'in_treatment') {
      patient.treatmentStartTime = new Date().toISOString();
      patient.estimatedWaitMinutes = 0;
    }

    if (newStatus === 'discharged') {
      patient.dischargedTime = new Date().toISOString();
      patient.estimatedWaitMinutes = 0;
      if (patient.assignedRoomId) {
        const room = this.roomBays.get(patient.assignedRoomId);
        if (room) {
          room.status = 'cleaning';
          room.currentPatientToken = undefined;
        }
      }
    }

    if (extra.assignedRoomId) {
      patient.assignedRoomId = extra.assignedRoomId;
      const room = this.roomBays.get(extra.assignedRoomId);
      if (room) {
        patient.assignedRoomName = room.name;
        room.status = 'occupied';
        room.currentPatientToken = patient.displayToken;
      }
    }

    if (extra.assignedProviderId) {
      patient.assignedProviderId = extra.assignedProviderId;
      const provider = this.providers.get(extra.assignedProviderId);
      if (provider) {
        patient.assignedProviderName = provider.name;
      }
    }

    this.patients.set(patientId, patient);

    this.addAuditLog({
      userId: extra.user.id,
      userName: extra.user.name,
      userRole: extra.user.role,
      action: newStatus === 'discharged' ? 'PATIENT_DISCHARGE' : 'STATUS_CHANGE',
      patientToken: patient.displayToken,
      details: `Status progressed from ${oldStatus} to ${newStatus}.${extra.assignedRoomId ? ` Assigned to ${patient.assignedRoomName}.` : ''}`,
      ipAddress: '10.24.11.84',
    });

    this.recalculateAllWaitTimes();
    return patient;
  }

  overridePriority(patientId, params) {
    const patient = this.patients.get(patientId);
    if (!patient) return null;

    if (!patient.originalEsiLevel) {
      patient.originalEsiLevel = patient.esiLevel;
    }

    const isReset = params.justificationCategory === 'De-escalation / Normalization';

    patient.isPriorityOverridden = !isReset;
    patient.overrideReason = `${params.justificationCategory}: ${params.reason}`;
    patient.overriddenBy = params.user.name;
    patient.overriddenAt = new Date().toISOString();

    if (isReset) {
      patient.isPriorityOverridden = false;
      patient.esiLevel = patient.originalEsiLevel || patient.esiLevel;
    } else {
      if (params.overrideEsi) {
        patient.esiLevel = params.overrideEsi;
      }
      patient.calculatedPriorityScore = params.overrideScore !== undefined ? params.overrideScore : 98;
    }

    this.patients.set(patientId, patient);

    this.addAuditLog({
      userId: params.user.id,
      userName: params.user.name,
      userRole: params.user.role,
      action: 'PRIORITY_OVERRIDE',
      patientToken: patient.displayToken,
      clinicalJustification: `${params.justificationCategory} - ${params.reason}`,
      details: `Priority manually ${isReset ? 'RESET to natural ESI' : `OVERRIDDEN to Score ${patient.calculatedPriorityScore} (ESI ${patient.esiLevel})`}. Justification recorded in compliance log.`,
      ipAddress: '10.24.11.99',
    });

    this.recalculateAllWaitTimes();
    return patient;
  }

  recalculateAllWaitTimes() {
    const allPatients = Array.from(this.patients.values());
    const allProviders = Array.from(this.providers.values());
    const allRooms = Array.from(this.roomBays.values());

    for (const [deptId, dept] of this.departments.entries()) {
      const updatedDeptPatients = recalculateDepartmentQueue(allPatients, dept, allProviders, allRooms);
      
      for (const p of updatedDeptPatients) {
        this.patients.set(p.id, p);
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

      this.departments.set(deptId, dept);
    }
  }

  getAnalytics() {
    const depts = Array.from(this.departments.values());

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
      { hour: '14:00', arrivals: 21, discharges: 16, averageWait: 38 },
      { hour: '16:00', arrivals: 25, discharges: 18, averageWait: 42 },
      { hour: '18:00', arrivals: 28, discharges: 20, averageWait: 46 },
      { hour: '20:00', arrivals: 22, discharges: 23, averageWait: 36 },
      { hour: '22:00', arrivals: 12, discharges: 15, averageWait: 24 },
    ];

    const acuityDistribution = [
      { esiLevel: 1, count: 2, averageWaitMinutes: 0, label: 'ESI 1 - Resuscitation', color: '#ef4444' },
      { esiLevel: 2, count: 5, averageWaitMinutes: 8, label: 'ESI 2 - Emergent', color: '#f97316' },
      { esiLevel: 3, count: 12, averageWaitMinutes: 24, label: 'ESI 3 - Urgent', color: '#eab308' },
      { esiLevel: 4, count: 9, averageWaitMinutes: 44, label: 'ESI 4 - Less Urgent', color: '#3b82f6' },
      { esiLevel: 5, count: 4, averageWaitMinutes: 68, label: 'ESI 5 - Non-Urgent', color: '#64748b' },
    ];

    return {
      departmentThroughput,
      hourlySurgeData,
      acuityDistribution,
      kpis: {
        averageDoorToDoctor: 23,
        averageLengthOfStay: 142,
        lwbsRate: 1.1,
        totalPatientsTreated: 155,
        bedTurnoverVelocity: 3.3,
        hipaaComplianceScore: 100,
      },
    };
  }
}

export const db = new HospitalDatabase();
