import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // e.g. dept-ed
  name: String,
  code: String,
  description: String,
  totalBeds: Number,
  occupiedBeds: { type: Number, default: 0 },
  activePhysicians: { type: Number, default: 0 },
  activeNurses: { type: Number, default: 0 },
  targetDoorToDoctorMinutes: Number,
  isDiverting: { type: Boolean, default: false },
  surgeStatus: { type: String, default: 'normal' },
  averageWaitMinutes: { type: Number, default: 0 },
  queueCount: { type: Number, default: 0 },
}, { timestamps: true });

const providerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  role: String, // e.g. Administrator, Clinical Provider
  departmentId: String,
  email: { type: String, unique: true },
  npi: String,
  facility: String,
  status: { type: String, default: 'on_duty' },
}, { timestamps: true });

const roomBaySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  departmentId: String,
  name: String,
  type: String,
  status: { type: String, default: 'vacant' },
  currentPatientToken: String,
}, { timestamps: true });

const patientSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  displayToken: { type: String, required: true },
  departmentId: String,
  esiLevel: { type: Number, default: 3 },
  originalEsiLevel: Number,
  chiefComplaint: String,
  status: { type: String, default: 'checked_in' },
  arrivalTime: Date,
  triageTime: Date,
  treatmentStartTime: Date,
  dischargedTime: Date,
  assignedProviderId: String,
  assignedProviderName: String,
  assignedRoomId: String,
  assignedRoomName: String,
  calculatedPriorityScore: { type: Number, default: 50 },
  estimatedWaitMinutes: { type: Number, default: 0 },
  waitTrend: { type: String, default: 'stable' },
  isPriorityOverridden: { type: Boolean, default: false },
  overrideReason: String,
  overriddenBy: String,
  overriddenAt: Date,
  vitals: {
    heartRate: Number,
    bloodPressureSystolic: Number,
    bloodPressureDiastolic: Number,
    oxygenSaturation: Number,
    respiratoryRate: Number,
    temperature: Number,
    painScore: Number,
  },
  phi: {
    legalFullName: String,
    dateOfBirth: String,
    mrn: String,
    phoneNumber: String,
    emergencyContact: String,
    email: String,
  },
}, { timestamps: true });

const auditLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  timestamp: Date,
  userId: String,
  userName: String,
  userRole: String,
  action: String,
  patientToken: String,
  details: String,
  clinicalJustification: String,
  ipAddress: String,
  tamperHash: String,
}, { timestamps: true });

export const Department = mongoose.model('Department', departmentSchema);
export const Provider = mongoose.model('Provider', providerSchema);
export const RoomBay = mongoose.model('RoomBay', roomBaySchema);
export const Patient = mongoose.model('Patient', patientSchema);
export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
