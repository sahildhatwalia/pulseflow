import React, { useState } from 'react';
import {
  Stethoscope,
  Heart,
  Activity,
  Thermometer,
  DoorOpen,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  Bed,
  Users,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  X,
  User as UserIcon,
  Sun,
  Moon,
  LogOut,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';
import { logoutUser } from '../services/api.js';

// ─── Role badge config ─────────────────────────────────────────────────────
const ROLE_CONFIG = {
  'Clinical Provider': {
    label: 'Doctor',
    icon: '👨‍⚕️',
    color: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-700/60',
    headerGradient: 'from-blue-600 via-indigo-600 to-blue-700',
  },
  'Charge Nurse': {
    label: 'Charge Nurse',
    icon: '👩‍⚕️',
    color: 'bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-950/70 dark:text-violet-300 dark:border-violet-700/60',
    headerGradient: 'from-violet-600 via-purple-600 to-violet-700',
  },
};

const ESI_CONFIG = {
  1: { label: 'CRITICAL — Immediate', dot: 'bg-red-500', badge: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700/50', border: 'border-l-red-500' },
  2: { label: 'Very Urgent <15 min',  dot: 'bg-orange-500', badge: 'bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-700/50', border: 'border-l-orange-500' },
  3: { label: 'Urgent',               dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700/50', border: 'border-l-amber-500' },
  4: { label: 'Less Urgent',          dot: 'bg-blue-500', badge: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700/50', border: 'border-l-blue-400' },
  5: { label: 'Non-Urgent',           dot: 'bg-slate-400', badge: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600', border: 'border-l-slate-400' },
};

const STATUS_LABEL = {
  checked_in:       { text: 'Just Arrived',       color: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  in_triage:        { text: 'Nurse Assessing',     color: 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800/60' },
  triage_completed: { text: 'Assessment Done',     color: 'bg-indigo-100 text-indigo-800 border border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800/60' },
  waiting_for_bed:  { text: 'Waiting for Room',    color: 'bg-sky-100 text-sky-800 border border-sky-300 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800/60' },
  in_treatment:     { text: 'In Exam Bay',         color: 'bg-teal-100 text-teal-800 border border-teal-300 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800/60' },
  discharged:       { text: 'Discharged',          color: 'bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-500' },
};

function VitalChip({ label, value, alert }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-mono font-semibold transition-colors ${
      alert
        ? 'bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950/60 dark:border-rose-700/60 dark:text-rose-300'
        : 'bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300'
    }`}>
      {alert && <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />}
      {label}: <span className="font-bold">{value}</span>
    </span>
  );
}

function PatientCard({ patient, rooms, onStatusUpdate, deptProviders }) {
  const [showPhi, setShowPhi] = useState(false);
  const [showVitals, setShowVitals] = useState(false);
  const [assigningRoom, setAssigningRoom] = useState(false);

  const esi = ESI_CONFIG[patient.esiLevel] || ESI_CONFIG[3];
  const status = STATUS_LABEL[patient.status] || { text: patient.status, color: 'bg-slate-200 text-slate-700' };
  const v = patient.vitals;
  const isDischarged = patient.status === 'discharged';

  return (
    <div className={`bg-white dark:bg-slate-900 border-l-4 ${esi.border} border-t border-r border-b border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md ${isDischarged ? 'opacity-55' : ''}`}>
      {/* Card header row */}
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* ESI dot */}
          <div className={`mt-1 w-3 h-3 rounded-full shrink-0 ${esi.dot} shadow-sm`} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl font-extrabold font-mono text-slate-900 dark:text-white tracking-wide">{patient.displayToken}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wide ${esi.badge}`}>
                ESI {patient.esiLevel} — {esi.label}
              </span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${status.color}`}>
                {status.text}
              </span>
              {patient.isPriorityOverridden && (
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40 text-[11px] font-bold flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Priority Override
                </span>
              )}
            </div>

            <p className="mt-1.5 text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug">{patient.chiefComplaint}</p>

            {/* PHI toggle */}
            <button
              onClick={() => setShowPhi(p => !p)}
              className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors cursor-pointer"
            >
              {showPhi ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {showPhi ? 'Hide patient details' : 'Show patient details'}
            </button>
            {showPhi && patient.phi && (
              <div className="mt-1.5 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-lg text-xs font-mono font-medium text-blue-900 dark:text-blue-200 animate-in fade-in">
                <UserIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                {patient.phi.legalFullName}
                {patient.phi.dateOfBirth && <> · DOB: {patient.phi.dateOfBirth}</>}
                {patient.phi.mrn && <> · {patient.phi.mrn}</>}
                {patient.phi.phoneNumber && <> · 📞 {patient.phi.phoneNumber}</>}
              </div>
            )}

            {/* Room / Provider */}
            <div className="mt-2 flex items-center gap-3 flex-wrap text-xs text-slate-500 dark:text-slate-400">
              {patient.assignedRoomName && (
                <span className="flex items-center gap-1 text-teal-700 dark:text-teal-300 font-semibold">
                  <DoorOpen className="w-3.5 h-3.5" /> {patient.assignedRoomName}
                </span>
              )}
              {patient.assignedProviderName && (
                <span className="flex items-center gap-1">
                  <Stethoscope className="w-3.5 h-3.5" /> Dr. {patient.assignedProviderName}
                </span>
              )}
              {patient.status !== 'in_treatment' && patient.status !== 'discharged' && (
                <span className="flex items-center gap-1 font-mono text-teal-700 dark:text-cyan-400 font-bold">
                  <Clock className="w-3.5 h-3.5" /> ~{patient.estimatedWaitMinutes} min wait
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Vitals toggle */}
        {v && (
          <button
            onClick={() => setShowVitals(p => !p)}
            className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          >
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            Vitals
            {showVitals ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>

      {/* Vitals panel */}
      {showVitals && v && (
        <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-800 pt-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Vital Signs</p>
          <div className="flex flex-wrap gap-1.5">
            <VitalChip label="HR" value={`${v.heartRate} bpm`} alert={v.heartRate > 100 || v.heartRate < 55} />
            <VitalChip label="BP" value={`${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}`} alert={v.bloodPressureSystolic > 140 || v.bloodPressureSystolic < 90} />
            <VitalChip label="SpO₂" value={`${v.oxygenSaturation}%`} alert={v.oxygenSaturation < 94} />
            <VitalChip label="Temp" value={`${v.temperature}°F`} alert={v.temperature > 100.4 || v.temperature < 96} />
            <VitalChip label="RR" value={`${v.respiratoryRate}/min`} alert={v.respiratoryRate > 20 || v.respiratoryRate < 12} />
            <VitalChip label="Pain" value={`${v.painScore}/10`} alert={v.painScore >= 8} />
          </div>
        </div>
      )}

      {/* Action bar */}
      {!isDischarged && (
        <div className="px-4 pb-4 flex flex-wrap items-center gap-2">
          {patient.status === 'checked_in' && (
            <button
              onClick={() => onStatusUpdate(patient.id, { status: 'in_triage' })}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              → Begin Assessment
            </button>
          )}
          {['checked_in', 'in_triage', 'triage_completed', 'waiting_for_bed'].includes(patient.status) && (
            <button
              onClick={() => setAssigningRoom(true)}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <DoorOpen className="w-3.5 h-3.5" /> Assign Exam Room
            </button>
          )}
          {patient.status === 'waiting_for_bed' && (
            <button
              onClick={() => onStatusUpdate(patient.id, { status: 'in_treatment' })}
              className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              ✓ Doctor Has Arrived
            </button>
          )}
          {patient.status === 'in_treatment' && (
            <button
              onClick={() => onStatusUpdate(patient.id, { status: 'discharged' })}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              ✓ Mark Discharged
            </button>
          )}
          {patient.status === 'in_triage' && (
            <button
              onClick={() => onStatusUpdate(patient.id, { status: 'triage_completed' })}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              ✓ Complete Triage
            </button>
          )}
          {patient.status === 'triage_completed' && (
            <button
              onClick={() => onStatusUpdate(patient.id, { status: 'waiting_for_bed' })}
              className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              → Waiting for Bed
            </button>
          )}
        </div>
      )}

      {/* Room assign modal inline */}
      {assigningRoom && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-sm p-5 rounded-2xl shadow-2xl space-y-3 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Assign Room — {patient.displayToken}</h4>
              <button onClick={() => setAssigningRoom(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {rooms.map(room => (
                <button
                  key={room.id}
                  disabled={room.status === 'occupied'}
                  onClick={async () => {
                    await onStatusUpdate(patient.id, { status: 'in_treatment', assignedRoomId: room.id, assignedProviderId: deptProviders[0]?.id });
                    setAssigningRoom(false);
                  }}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-colors cursor-pointer text-sm ${
                    room.status === 'occupied'
                      ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                      : 'bg-slate-50 hover:bg-blue-50 border-slate-200 dark:bg-slate-950 dark:hover:bg-blue-950/40 dark:border-slate-700 hover:border-blue-400'
                  }`}
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{room.name}</div>
                    <div className="text-xs text-slate-400">{room.type}</div>
                  </div>
                  {room.status === 'occupied'
                    ? <span className="text-xs text-rose-500 font-mono">In Use ({room.currentPatientToken})</span>
                    : <span className="text-xs text-teal-600 dark:text-teal-400 font-semibold">Assign →</span>
                  }
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main DoctorView ────────────────────────────────────────────────────────
export function DoctorView({ patients = [], departments = [], providers = [], rooms = [], onStatusUpdate, socketConnected }) {
  const [selectedDeptId, setSelectedDeptId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('active');
  const [filterEsi, setFilterEsi] = useState('all');
  const [theme, setTheme] = useState(() => localStorage.getItem('pulseflow-theme') || 'light');

  let user = null;
  try { user = JSON.parse(localStorage.getItem('pulseflow_user') || 'null'); } catch (_) {}

  const roleConf = ROLE_CONFIG[user?.role] || ROLE_CONFIG['Clinical Provider'];
  const effectiveDeptId = selectedDeptId || departments[0]?.id;
  const currentDept = departments.find(d => d.id === effectiveDeptId) || departments[0];

  // Filter patients for this department
  const deptPatients = patients.filter(p => p.departmentId === effectiveDeptId);
  const deptRooms = rooms.filter(r => r.departmentId === effectiveDeptId);
  const deptProviders = providers.filter(p => p.departmentId === effectiveDeptId);

  const filteredPatients = deptPatients.filter(p => {
    if (filterStatus === 'active' && p.status === 'discharged') return false;
    if (filterStatus === 'discharged' && p.status !== 'discharged') return false;
    if (filterEsi !== 'all' && p.esiLevel !== Number(filterEsi)) return false;
    return true;
  }).sort((a, b) => {
    if (a.status === 'discharged' && b.status !== 'discharged') return 1;
    if (b.status === 'discharged' && a.status !== 'discharged') return -1;
    return b.calculatedPriorityScore - a.calculatedPriorityScore;
  });

  // Stats
  const activeCount   = deptPatients.filter(p => p.status !== 'discharged').length;
  const criticalCount = deptPatients.filter(p => p.esiLevel <= 2 && p.status !== 'discharged').length;
  const inTreatment   = deptPatients.filter(p => p.status === 'in_treatment').length;
  const waiting       = deptPatients.filter(p => ['checked_in','in_triage','triage_completed','waiting_for_bed'].includes(p.status)).length;

  React.useEffect(() => {
    const root = document.documentElement;
    theme === 'dark' ? root.classList.add('dark') : root.classList.remove('dark');
    localStorage.setItem('pulseflow-theme', theme);
  }, [theme]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">

      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur shadow-sm">
        {/* Top bar */}
        <div className="px-4 py-1.5 border-b border-slate-200/70 dark:border-slate-800/70 bg-slate-100/80 dark:bg-slate-950/60 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-teal-500 dark:bg-cyan-400 animate-pulse" />
              PulseFlow Clinical Queue Engine v2.4
            </span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
            <span className="hidden sm:inline text-slate-500 dark:text-slate-400">St. Jude Metropolitan Academic Health</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Socket indicator */}
            <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
              socketConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60'
                : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/60'
            }`}>
              {socketConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span className="font-mono">{socketConnected ? 'Live' : 'Reconnecting'}</span>
            </span>
            <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 transition-all cursor-pointer">
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-500" />}
            </button>
            <button onClick={logoutUser} className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-rose-300 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-all cursor-pointer">
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>

        {/* Brand + Role identity */}
        <div className="px-4 py-3 max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${roleConf.headerGradient} flex items-center justify-center shadow-md ring-1 ring-white/20`}>
              <Activity className="w-6 h-6 text-white stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">PulseFlow</h1>
                <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 px-2 py-0.5 rounded font-mono font-semibold">
                  Clinical Dashboard
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Patient management & clinical workflow</p>
            </div>
          </div>

          {/* WHO IS THIS USER — prominent role badge */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border font-semibold text-sm shadow-sm ${roleConf.color}`}>
              <span className="text-xl">{roleConf.icon}</span>
              <div>
                <div className="text-[10px] uppercase tracking-widest opacity-70 font-bold leading-tight">Logged in as</div>
                <div className="font-extrabold leading-tight">{roleConf.label} — {user?.name || 'Clinician'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Department switcher */}
        <div className="px-4 pb-3 max-w-7xl mx-auto flex items-center gap-3 flex-wrap">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Department:</span>
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 gap-0.5">
            {departments.map(dept => (
              <button
                key={dept.id}
                onClick={() => setSelectedDeptId(dept.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  effectiveDeptId === dept.id
                    ? 'bg-blue-600 dark:bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-900'
                }`}
              >
                {dept.code}
                <span className="hidden md:inline ml-1 text-[10px] opacity-80">({dept.name.split(' ')[0]})</span>
                {dept.isDiverting && <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 inline-block animate-pulse" />}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── MAIN ──────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 space-y-6">

        {/* ── DEPT STAT CARDS ───────────────────────────────────────── */}
        {currentDept && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Active Patients',   value: activeCount,             sub: `${inTreatment} in treatment`,   icon: Users,      color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30' },
              { label: 'Critical (ESI 1-2)',value: criticalCount,            sub: 'Needs immediate attention',     icon: AlertTriangle, color: criticalCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400', bg: criticalCount > 0 ? 'bg-rose-50 dark:bg-rose-950/30' : 'bg-slate-100 dark:bg-slate-900' },
              { label: 'Still Waiting',     value: waiting,                  sub: `~${currentDept.averageWaitMinutes}m avg wait`, icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30' },
              { label: 'Beds Available',    value: `${currentDept.totalBeds - currentDept.occupiedBeds}/${currentDept.totalBeds}`, sub: `${currentDept.activePhysicians} physicians on duty`, icon: Bed, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-950/30' },
            ].map(card => (
              <div key={card.label} className={`${card.bg} border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-start gap-3 transition-all hover:shadow-sm`}>
                <card.icon className={`w-5 h-5 mt-0.5 ${card.color} shrink-0`} />
                <div>
                  <div className={`text-xl font-extrabold font-mono ${card.color}`}>{card.value}</div>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">{card.label}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-500 mt-0.5">{card.sub}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── FILTERS ───────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Show:</span>
          {[
            { val: 'active', label: `Active (${activeCount})` },
            { val: 'discharged', label: 'Discharged' },
            { val: 'all', label: 'All' },
          ].map(opt => (
            <button key={opt.val} onClick={() => setFilterStatus(opt.val)} className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${filterStatus === opt.val ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>{opt.label}</button>
          ))}
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ESI Level:</span>
          {['all','1','2','3','4','5'].map(v => (
            <button key={v} onClick={() => setFilterEsi(v)} className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${filterEsi === v ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              {v === 'all' ? 'All' : `ESI ${v}`}
            </button>
          ))}
        </div>

        {/* ── PATIENT LIST ──────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              {currentDept?.name} — Patient Queue ({filteredPatients.length})
            </h2>
          </div>

          {filteredPatients.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <p className="text-base font-semibold text-slate-700 dark:text-slate-300">No patients match the current filter.</p>
              <p className="text-xs text-slate-400 mt-1">Try changing the filter or switching departments.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPatients.map(patient => (
                <PatientCard
                  key={patient.id}
                  patient={patient}
                  rooms={deptRooms}
                  deptProviders={deptProviders}
                  onStatusUpdate={onStatusUpdate}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── ROOM STATUS ───────────────────────────────────────────── */}
        {deptRooms.length > 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Bed className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Exam Rooms & Beds — {deptRooms.length} Total</h3>
              <div className="ml-auto flex items-center gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Available</span>
                <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" />Occupied</span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {deptRooms.map(room => (
                <div key={room.id} className={`p-3.5 rounded-xl border text-xs transition-colors ${
                  room.status === 'occupied'
                    ? 'bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800/60'
                    : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/50'
                }`}>
                  <div className="font-bold text-slate-900 dark:text-white">{room.name}</div>
                  <div className="text-[11px] text-slate-400">{room.type}</div>
                  <div className="mt-2 font-mono font-bold">
                    {room.status === 'occupied'
                      ? <span className="text-rose-600 dark:text-rose-300">{room.currentPatientToken || 'Occupied'}</span>
                      : <span className="text-emerald-600 dark:text-emerald-400">Free</span>
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-900 bg-white/80 dark:bg-slate-950/80 px-6 py-3 text-center text-xs text-slate-400 dark:text-slate-500">
        PulseFlow Clinical Systems © 2026 · St. Jude Health Network · {roleConf.icon} {roleConf.label} Portal · HIPAA Safeguard Level 3
      </footer>
    </div>
  );
}
