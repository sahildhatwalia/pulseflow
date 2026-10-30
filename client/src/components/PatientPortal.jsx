import React, { useState, useEffect } from 'react';
import {
  Activity,
  Clock,
  Search,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  DoorOpen,
  Send,
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  ShieldCheck,
  Bell,
  CalendarClock,
  MapPin,
  Heart,
  LogOut,
  Sun,
  Moon,
  ChevronRight,
  Stethoscope,
  Loader2,
} from 'lucide-react';
import { logoutUser } from '../services/api.js';
import { fetchPatientByToken } from '../services/api.js';

// ─── Utility ──────────────────────────────────────────────────────────────────
const CARE_STEPS = [
  { key: 'checked_in',        title: '1. Registration Complete',       desc: 'Check-in recorded in hospital EHR system' },
  { key: 'in_triage',         title: '2. Nurse Assessment',            desc: 'Vitals & symptom severity evaluated by nurse', prev: ['in_triage','triage_completed','waiting_for_bed','in_treatment','ready_for_discharge','discharged'] },
  { key: 'waiting_for_bed',   title: '3. Bed & Provider Assignment',   desc: 'Exam room allocation in progress',             prev: ['waiting_for_bed','in_treatment','ready_for_discharge','discharged'] },
  { key: 'in_treatment',      title: '4. Physician Examination',       desc: 'Under clinical evaluation & treatment',        prev: ['in_treatment','ready_for_discharge','discharged'] },
  { key: 'discharged',        title: '5. Discharge & Care Plan',       desc: 'Prescriptions and discharge instructions',     prev: ['discharged'] },
];

function stepState(step, current) {
  if (step.key === 'checked_in') return 'done';
  if (step.prev?.includes(current)) return 'done';
  if (step.key === current) return 'current';
  return 'pending';
}

const STATUS_LABEL = {
  checked_in: 'Just Arrived',
  in_triage: 'Nurse Assessing',
  triage_completed: 'Assessment Done',
  waiting_for_bed: 'Waiting for Room',
  in_treatment: 'With Doctor',
  ready_for_discharge: 'Ready to Discharge',
  discharged: 'Discharged',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, unit, accent = 'teal', note }) {
  const colors = {
    teal:   { bg: 'bg-teal-50 dark:bg-teal-950/40', icon: 'text-teal-600 dark:text-cyan-400', val: 'text-teal-700 dark:text-cyan-300', border: 'border-teal-200 dark:border-teal-800/60' },
    amber:  { bg: 'bg-amber-50 dark:bg-amber-950/40', icon: 'text-amber-600 dark:text-amber-400', val: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800/60' },
    rose:   { bg: 'bg-rose-50 dark:bg-rose-950/40', icon: 'text-rose-600 dark:text-rose-400', val: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800/60' },
    emerald:{ bg: 'bg-emerald-50 dark:bg-emerald-950/40', icon: 'text-emerald-600 dark:text-emerald-400', val: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800/60' },
  };
  const c = colors[accent] || colors.teal;
  return (
    <div className={`${c.bg} border ${c.border} rounded-2xl p-4 flex flex-col gap-2 transition-all hover:shadow-sm`}>
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${c.icon}`} />
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-2xl font-extrabold font-mono ${c.val} flex items-baseline gap-1`}>
        {value}
        {unit && <span className="text-sm font-sans font-normal text-slate-500 dark:text-slate-400">{unit}</span>}
      </div>
      {note && <div className="text-[11px] text-slate-500 dark:text-slate-400">{note}</div>}
    </div>
  );
}

function CarePathway({ patient }) {
  return (
    <div className="space-y-3">
      {CARE_STEPS.map((step, idx) => {
        const state = stepState(step, patient.status);
        return (
          <div key={idx} className="flex items-start gap-3">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold transition-all ${
              state === 'done'
                ? 'bg-emerald-500 dark:bg-emerald-600 text-white shadow-sm'
                : state === 'current'
                ? 'bg-teal-600 dark:bg-cyan-500 text-white ring-4 ring-teal-500/25 dark:ring-cyan-400/25 animate-pulse'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600'
            }`}>
              {state === 'done' ? '✓' : idx + 1}
            </div>
            <div className="flex-1 pt-0.5">
              <div className={`text-sm font-bold ${
                state !== 'pending' ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-600'
              }`}>{step.title}</div>
              <div className={`text-xs mt-0.5 ${
                state === 'current' ? 'text-teal-700 dark:text-cyan-300 font-medium' : 'text-slate-500 dark:text-slate-500'
              }`}>
                {state === 'current' && <span className="inline-block mr-1 text-teal-500 dark:text-cyan-400">▶</span>}
                {step.desc}
              </div>
            </div>
            {state === 'current' && (
              <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-teal-100 dark:bg-cyan-900/40 text-teal-700 dark:text-cyan-300 border border-teal-300 dark:border-cyan-700/50 font-bold uppercase tracking-wide mt-1">
                Now
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Portal ──────────────────────────────────────────────────────────────
export function PatientPortal({ patients = [], departments = [], onCheckInSubmit }) {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [theme, setTheme] = useState(() => localStorage.getItem('pulseflow-theme') || 'light');

  // Lookup state
  const [lookupQuery, setLookupQuery] = useState('');
  const [trackedPatient, setTrackedPatient] = useState(null);
  const [lookupError, setLookupError] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);

  // Self check-in state
  const [checkInForm, setCheckInForm] = useState({
    legalFullName: '',
    dateOfBirth: '',
    phoneNumber: '',
    chiefComplaint: '',
    painLevel: '4',
    departmentId: 'dept-ed',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToken, setSuccessToken] = useState(null);
  const [successPatient, setSuccessPatient] = useState(null);

  // Logged-in user info
  let user = null;
  try {
    const s = localStorage.getItem('pulseflow_user');
    if (s) user = JSON.parse(s);
  } catch (_) {}

  const patientName = user?.name || 'Patient';
  const patientEmail = user?.email || '';

  // Find the patient's own queue entry by email
  const myQueueEntry = patients.find(
    p => p.phi?.email === patientEmail && p.status !== 'discharged'
  ) || trackedPatient;

  useEffect(() => {
    const root = document.documentElement;
    theme === 'dark' ? root.classList.add('dark') : root.classList.remove('dark');
    localStorage.setItem('pulseflow-theme', theme);
  }, [theme]);

  // Auto-navigate to tracker if they have a ticket
  useEffect(() => {
    if (myQueueEntry && activeSection === 'dashboard') {
      // don't auto-navigate, just surface the status on dashboard
    }
  }, [myQueueEntry]);

  // ── Lookup handler ────────────────────────────────────────────────────────
  const handleLookup = async (e) => {
    e?.preventDefault();
    const clean = lookupQuery.trim().toUpperCase();
    if (!clean) return;
    setLookupError('');
    setLookupLoading(true);
    try {
      // First try local patients list
      const local = patients.find(
        p => p.displayToken?.toUpperCase() === clean || p.displayToken?.replace('PT-', '') === clean
      );
      if (local) {
        setTrackedPatient(local);
      } else {
        // Fall back to API
        const remote = await fetchPatientByToken(clean);
        setTrackedPatient(remote);
      }
    } catch (_) {
      setTrackedPatient(null);
      setLookupError(`No active record found for ticket "${clean}". Please verify your ticket number with the triage desk.`);
    } finally {
      setLookupLoading(false);
    }
  };

  // Keep tracked patient fresh from real-time list
  useEffect(() => {
    if (!trackedPatient) return;
    const fresh = patients.find(p => p.id === trackedPatient.id || p.displayToken === trackedPatient.displayToken);
    if (fresh) setTrackedPatient(fresh);
  }, [patients]);

  // ── Self check-in handler ─────────────────────────────────────────────────
  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (!checkInForm.legalFullName || !checkInForm.chiefComplaint) return;
    setIsSubmitting(true);
    try {
      const pain = Number(checkInForm.painLevel) || 4;
      let esi = 4;
      if (pain >= 8) esi = 3;
      const lc = checkInForm.chiefComplaint.toLowerCase();
      if (lc.includes('chest') || lc.includes('breath') || lc.includes('stroke') || lc.includes('heart')) esi = 2;

      const res = await onCheckInSubmit({
        legalFullName: checkInForm.legalFullName,
        dateOfBirth: checkInForm.dateOfBirth || '1995-01-01',
        phoneNumber: checkInForm.phoneNumber,
        departmentId: checkInForm.departmentId || 'dept-ed',
        chiefComplaint: checkInForm.chiefComplaint,
        esiLevel: esi,
        vitals: {
          heartRate: 80, bloodPressureSystolic: 120, bloodPressureDiastolic: 80,
          oxygenSaturation: 98, respiratoryRate: 16, temperature: 98.6, painScore: pain,
        },
      });

      if (res?.displayToken) {
        setSuccessToken(res.displayToken);
        setSuccessPatient(res);
        setTrackedPatient(res);
        setLookupQuery(res.displayToken);
        setActiveSection('tracker');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentDept = departments.find(d => d.id === (myQueueEntry?.departmentId || checkInForm.departmentId)) || departments[0];

  // ── NAV ITEMS ─────────────────────────────────────────────────────────────
  const navItems = [
    { id: 'dashboard', icon: Activity,      label: 'My Dashboard'   },
    { id: 'tracker',   icon: Search,         label: 'Track My Ticket' },
    { id: 'checkin',   icon: UserCheck,      label: 'Check In'        },
    { id: 'waiting',   icon: Clock,          label: 'Wait Times'      },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100 dark:from-slate-950 dark:via-teal-950/10 dark:to-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">

      {/* ── TOP HEADER ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 via-cyan-600 to-sky-500 flex items-center justify-center shadow-md ring-1 ring-white/20">
              <Activity className="w-5 h-5 text-white stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">PulseFlow</span>
                <span className="text-[10px] bg-teal-50 text-teal-700 border border-teal-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800/80 px-1.5 py-0.5 rounded font-mono font-semibold">Patient Portal</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">Your personal care dashboard</p>
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-500" />}
            </button>

            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/60 text-xs font-semibold text-teal-800 dark:text-teal-300">
              <Heart className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{patientName}</span>
            </div>

            <button
              onClick={logoutUser}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-rose-300 hover:text-rose-600 dark:hover:text-rose-400 dark:hover:border-rose-700 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Bottom nav */}
        <div className="max-w-5xl mx-auto px-4 flex gap-1 pb-1.5 overflow-x-auto scrollbar-none">
          {navItems.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeSection === id
                  ? 'bg-teal-50 dark:bg-slate-800 text-teal-800 dark:text-cyan-300 border border-teal-200 dark:border-slate-700 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* ── MAIN CONTENT ────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 sm:py-8">

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* SECTION: MY DASHBOARD                                           */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeSection === 'dashboard' && (
          <div className="space-y-6">
            {/* Welcome banner */}
            <div className="relative overflow-hidden bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 rounded-2xl p-6 text-white shadow-lg shadow-teal-500/20">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
              <div className="relative">
                <p className="text-teal-100 text-sm font-medium">Welcome back,</p>
                <h1 className="text-2xl font-extrabold tracking-tight mt-0.5">{patientName}</h1>
                <p className="text-teal-100 text-sm mt-1">Here's your real-time care status at St. Jude Health Network.</p>
              </div>
              <div className="relative mt-4 flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => setActiveSection('checkin')}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur border border-white/30 text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" /> Check In Now
                </button>
                <button
                  onClick={() => setActiveSection('tracker')}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  <Search className="w-4 h-4" /> Track My Ticket
                </button>
              </div>
            </div>

            {/* My current visit (if active) */}
            {myQueueEntry ? (
              <div className="bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800/60 rounded-2xl p-5 shadow-sm space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <div className="text-xs font-bold text-teal-600 dark:text-cyan-400 uppercase tracking-wider mb-1">Your Active Visit</div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-3xl font-extrabold font-mono text-teal-800 dark:text-cyan-200 tracking-wide">
                        {myQueueEntry.displayToken}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border inline-flex items-center gap-1.5 ${
                        myQueueEntry.status === 'in_treatment' ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700'
                        : myQueueEntry.status === 'in_triage' ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800/60'
                        : 'bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {STATUS_LABEL[myQueueEntry.status] || myQueueEntry.status}
                      </span>
                    </div>
                  </div>
                  {myQueueEntry.status !== 'in_treatment' && myQueueEntry.status !== 'discharged' && (
                    <div className="text-right">
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Estimated Wait</div>
                      <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
                        ~{myQueueEntry.estimatedWaitMinutes}<span className="text-sm font-sans font-normal text-slate-400 ml-1">min</span>
                      </div>
                    </div>
                  )}
                  {myQueueEntry.status === 'in_treatment' && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-xl">
                      <Stethoscope className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Currently With Doctor</span>
                    </div>
                  )}
                </div>

                {myQueueEntry.chiefComplaint && (
                  <div className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Reason for Visit</span>
                    {myQueueEntry.chiefComplaint}
                  </div>
                )}

                {myQueueEntry.assignedRoomName && (
                  <div className="flex items-center gap-2 text-sm font-semibold text-teal-700 dark:text-teal-300">
                    <DoorOpen className="w-4 h-4" />
                    Please proceed to: <span className="font-extrabold">{myQueueEntry.assignedRoomName}</span>
                  </div>
                )}

                <CarePathway patient={myQueueEntry} />

                <button
                  onClick={() => { setLookupQuery(myQueueEntry.displayToken); setActiveSection('tracker'); }}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300 text-xs font-semibold hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors cursor-pointer"
                >
                  View Full Tracker <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center shadow-sm">
                <CalendarClock className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-700 dark:text-slate-300 mb-1">No Active Visit Detected</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
                  You don't have an active check-in at this time. Use the kiosk below to check in or track an existing ticket.
                </p>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <button
                    onClick={() => setActiveSection('checkin')}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-sm cursor-pointer transition-colors"
                  >
                    <UserCheck className="w-4 h-4" /> Check In Now
                  </button>
                  <button
                    onClick={() => setActiveSection('tracker')}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Search className="w-4 h-4" /> Track Existing Ticket
                  </button>
                </div>
              </div>
            )}

            {/* Department Stats */}
            {currentDept && (
              <div>
                <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-teal-600 dark:text-cyan-400" />
                  {currentDept.name} — Live Status
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard icon={Clock}        label="Avg Wait"       value={currentDept.averageWaitMinutes || 0} unit="min" accent="teal"    note="Door-to-physician" />
                  <StatCard icon={Activity}     label="In Queue"       value={currentDept.queueCount || 0}                   accent="amber"   note="Patients waiting" />
                  <StatCard icon={Stethoscope}  label="Surge Status"   value={currentDept.surgeStatus || 'Normal'}           accent={currentDept.surgeStatus === 'critical' ? 'rose' : currentDept.surgeStatus === 'moderate' ? 'amber' : 'emerald'} />
                  <StatCard icon={Heart}        label="Beds"           value={`${currentDept.occupiedBeds}/${currentDept.totalBeds}`} accent="teal" note={`${currentDept.activePhysicians} physicians active`} />
                </div>
              </div>
            )}

            {/* HIPAA notice */}
            <div className="bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-start gap-3 text-xs text-slate-500 dark:text-slate-400">
              <ShieldCheck className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
              <p><span className="font-bold text-slate-700 dark:text-slate-300">HIPAA Protected: </span>Your personal health information is stored with AES-256 encryption. The public queue board only shows de-identified ticket numbers. Your identity and diagnosis are never displayed publicly.</p>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* SECTION: TICKET TRACKER                                         */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeSection === 'tracker' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-1">Track Your Ticket</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Enter your ticket number from your check-in slip to see your real-time care status.</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
              <form onSubmit={handleLookup} className="flex gap-2">
                <input
                  type="text"
                  value={lookupQuery}
                  onChange={e => setLookupQuery(e.target.value)}
                  placeholder="e.g. PT-5120"
                  className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
                <button
                  type="submit"
                  disabled={lookupLoading}
                  className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm shadow-sm cursor-pointer"
                >
                  {lookupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Track
                </button>
              </form>

              {lookupError && (
                <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                  <span>{lookupError}</span>
                </div>
              )}
            </div>

            {trackedPatient && (
              <div className="bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800/60 rounded-2xl p-6 shadow-md space-y-6">
                {/* Token & wait header */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 flex-wrap gap-4">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Your Ticket</span>
                    <div className="text-3xl font-extrabold font-mono text-teal-800 dark:text-cyan-200 tracking-wider mt-0.5">
                      {trackedPatient.displayToken}
                    </div>
                    <span className={`mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                      trackedPatient.status === 'in_treatment'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700'
                        : trackedPatient.status === 'in_triage'
                        ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800/60'
                        : trackedPatient.status === 'discharged'
                        ? 'bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                        : 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {STATUS_LABEL[trackedPatient.status] || trackedPatient.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Predicted Wait</span>
                    {trackedPatient.status === 'in_treatment' || trackedPatient.status === 'discharged' ? (
                      <span className="text-emerald-600 dark:text-emerald-400 text-lg font-bold">
                        {trackedPatient.status === 'discharged' ? 'Complete' : 'In Care Bay'}
                      </span>
                    ) : (
                      <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
                        ~{trackedPatient.estimatedWaitMinutes}
                        <span className="text-sm font-sans font-normal text-slate-400 ml-1">min</span>
                      </div>
                    )}
                    {trackedPatient.waitTrend && trackedPatient.waitTrend !== 'stable' && (
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold mt-1 ${
                        trackedPatient.waitTrend === 'falling' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                      }`}>
                        {trackedPatient.waitTrend === 'falling' ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                        Wait time {trackedPatient.waitTrend}
                      </span>
                    )}
                  </div>
                </div>

                {/* Room assignment */}
                {trackedPatient.assignedRoomName && (
                  <div className="flex items-center gap-3 p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/50 rounded-xl">
                    <DoorOpen className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    <div>
                      <div className="text-xs font-semibold text-teal-700 dark:text-teal-300 uppercase tracking-wider">Please Proceed To</div>
                      <div className="text-base font-bold text-teal-900 dark:text-cyan-200">{trackedPatient.assignedRoomName}</div>
                    </div>
                  </div>
                )}

                {/* Care pathway */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Your Care Pathway</h4>
                  <CarePathway patient={trackedPatient} />
                </div>

                {/* Warning */}
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-4 rounded-xl flex items-start gap-3">
                  <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 dark:text-amber-200/90 space-y-1">
                    <p className="font-bold">If your symptoms worsen while waiting:</p>
                    <p>Please inform our triage nurse immediately if you experience chest pain, sudden difficulty breathing, dizziness, or severe sudden pain.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* SECTION: SELF CHECK-IN                                          */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeSection === 'checkin' && (
          <div className="max-w-xl mx-auto space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-1">Self Check-In Kiosk</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Register your arrival to receive your secure queue ticket and real-time wait estimate.</p>
            </div>

            {successToken ? (
              <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-8 text-center shadow-sm space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Check-In Successful!</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Your confidential ticket number is:</p>
                <div className="text-5xl font-extrabold font-mono text-teal-700 dark:text-cyan-300 py-2 tracking-widest">
                  {successToken}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Estimated wait: <span className="font-bold text-slate-900 dark:text-white">~{currentDept?.averageWaitMinutes || 20} minutes</span>
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">Keep this number handy — it's your position in the queue.</p>
                <div className="flex gap-3 justify-center flex-wrap pt-2">
                  <button
                    onClick={() => { setActiveSection('tracker'); }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold cursor-pointer transition-colors shadow-sm"
                  >
                    <Search className="w-4 h-4" /> Track My Status
                  </button>
                  <button
                    onClick={() => { setSuccessToken(null); setActiveSection('dashboard'); }}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold cursor-pointer transition-colors"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <form onSubmit={handleCheckIn} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Full Legal Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={checkInForm.legalFullName}
                      onChange={e => setCheckInForm({ ...checkInForm, legalFullName: e.target.value })}
                      placeholder="e.g. Jane Doe"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Stored with AES-256 encryption. Never shown on public boards.</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Date of Birth</label>
                      <input
                        type="date"
                        value={checkInForm.dateOfBirth}
                        onChange={e => setCheckInForm({ ...checkInForm, dateOfBirth: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Mobile Phone <span className="text-slate-400 font-normal">(for SMS updates)</span></label>
                      <input
                        type="tel"
                        value={checkInForm.phoneNumber}
                        onChange={e => setCheckInForm({ ...checkInForm, phoneNumber: e.target.value })}
                        placeholder="(555) 000-0000"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Department <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={checkInForm.departmentId}
                      onChange={e => setCheckInForm({ ...checkInForm, departmentId: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Chief Complaint / Reason for Visit <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={checkInForm.chiefComplaint}
                      onChange={e => setCheckInForm({ ...checkInForm, chiefComplaint: e.target.value })}
                      placeholder="Please briefly describe your primary symptoms or illness..."
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Current Pain Level (0–10)</label>
                      <span className="font-mono font-bold text-teal-700 dark:text-cyan-400 text-sm">{checkInForm.painLevel}/10</span>
                    </div>
                    <input
                      type="range" min="0" max="10"
                      value={checkInForm.painLevel}
                      onChange={e => setCheckInForm({ ...checkInForm, painLevel: e.target.value })}
                      className="w-full accent-teal-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                      <span>0 (No Pain)</span><span>5 (Moderate)</span><span>10 (Severe)</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm cursor-pointer"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Generating Secure Ticket...</>
                    ) : (
                      <><Send className="w-4 h-4" /> Complete Check-In &amp; Get Ticket</>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Privacy note */}
            <div className="flex items-start gap-3 text-xs text-slate-500 dark:text-slate-400 p-4 bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <p>Your personal health data is protected under HIPAA · 45 CFR § 164.312. Only your anonymous ticket number appears on the public waiting room board.</p>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* SECTION: WAIT TIMES                                             */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeSection === 'waiting' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-1">Live Department Wait Times</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Real-time estimated wait times across all departments at St. Jude Health Network.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {departments.map(dept => (
                <div
                  key={dept.id}
                  className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm transition-all hover:shadow-md cursor-pointer ${
                    checkInForm.departmentId === dept.id
                      ? 'border-teal-300 dark:border-teal-700 ring-2 ring-teal-500/20'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                  onClick={() => setCheckInForm(f => ({ ...f, departmentId: dept.id }))}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{dept.code}</div>
                      <div className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">{dept.name}</div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${
                      dept.surgeStatus === 'critical' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                      : dept.surgeStatus === 'moderate' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    }`}>
                      {dept.surgeStatus === 'critical' ? '🔴 Busy' : dept.surgeStatus === 'moderate' ? '🟡 Moderate' : '🟢 Open'}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-4xl font-extrabold font-mono text-teal-700 dark:text-cyan-300">{dept.averageWaitMinutes || 0}</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">min avg wait</span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">{dept.description}</p>

                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>{dept.occupiedBeds}/{dept.totalBeds} beds in use</span>
                    <span>{dept.activePhysicians} physicians • {dept.activeNurses} nurses</span>
                  </div>

                  {dept.isDiverting && (
                    <div className="mt-2 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-xs font-semibold text-rose-700 dark:text-rose-300">
                      🚨 Ambulance Diversion Active
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Bell className="w-4 h-4 text-teal-600 dark:text-cyan-400" />
                When to Seek Emergency Care
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-400">
                {[
                  { label: 'Chest pain or pressure', urgent: true },
                  { label: 'Difficulty breathing', urgent: true },
                  { label: 'Signs of stroke (FAST)', urgent: true },
                  { label: 'Severe uncontrolled bleeding', urgent: true },
                  { label: 'Fever above 103°F', urgent: false },
                  { label: 'Severe allergic reactions', urgent: true },
                  { label: 'Loss of consciousness', urgent: true },
                  { label: 'Broken bone or dislocation', urgent: false },
                ].map((item, i) => (
                  <div key={i} className={`flex items-center gap-2 p-2.5 rounded-lg border ${
                    item.urgent
                      ? 'bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800/50 text-rose-800 dark:text-rose-300'
                      : 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/50 text-amber-800 dark:text-amber-300'
                  }`}>
                    <span>{item.urgent ? '🔴' : '🟡'}</span>
                    <span className="font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 dark:border-slate-900 bg-white/80 dark:bg-slate-950/80 px-6 py-4 text-center text-xs text-slate-400 dark:text-slate-500">
        PulseFlow Patient Portal © 2026 · St. Jude Health Network · HIPAA Protected · 45 CFR § 164.312
      </footer>
    </div>
  );
}
