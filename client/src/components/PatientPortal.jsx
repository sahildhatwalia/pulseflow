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
  ChevronDown,
  Stethoscope,
  Loader2,
  HelpCircle,
  Phone,
  Home,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
  Info,
  Sparkles,
  BedDouble,
  Users,
} from 'lucide-react';
import { logoutUser, fetchPatientByToken } from '../services/api.js';
import { HospitalRoleSwitcher } from './HospitalRoleSwitcher.jsx';

// ─── Care Pathway Configuration ───────────────────────────────────────────────
const CARE_STEPS = [
  { key: 'checked_in',        title: 'Registration Complete',       desc: 'Check-in recorded in hospital EHR system', icon: '📋' },
  { key: 'in_triage',         title: 'Nurse Assessment (Triage)',   desc: 'Vitals & symptom severity evaluated by nurse', prev: ['in_triage','triage_completed','waiting_for_bed','in_treatment','ready_for_discharge','discharged'], icon: '🩺' },
  { key: 'waiting_for_bed',   title: 'Bed & Room Allocation',       desc: 'Clinical exam room allocation in progress',    prev: ['waiting_for_bed','in_treatment','ready_for_discharge','discharged'], icon: '🛏️' },
  { key: 'in_treatment',      title: 'Physician Examination',       desc: 'Active evaluation, diagnostics & treatment',  prev: ['in_treatment','ready_for_discharge','discharged'], icon: '👨‍⚕️' },
  { key: 'discharged',        title: 'Discharge & Care Plan',       desc: 'Prescriptions, summary and aftercare guide',   prev: ['discharged'], icon: '✅' },
];

function stepState(step, current) {
  if (step.key === 'checked_in') return 'done';
  if (step.prev?.includes(current)) return 'done';
  if (step.key === current) return 'current';
  return 'pending';
}

const STATUS_LABEL = {
  checked_in: 'Registered · In Queue',
  in_triage: 'Triage in Progress',
  triage_completed: 'Triage Complete',
  waiting_for_bed: 'Awaiting Exam Room',
  in_treatment: 'Under Physician Care',
  ready_for_discharge: 'Preparing Discharge',
  discharged: 'Visit Completed',
};

const QUICK_SYMPTOMS = [
  'Chest Discomfort',
  'Shortness of Breath',
  'High Fever / Chills',
  'Severe Headache',
  'Stomach / Abdominal Pain',
  'Laceration / Bleeding',
  'Dizziness / Fainting',
  'Sprain / Bone Injury',
  'Allergic Reaction',
  'Other / Unlisted',
];

const FAQS = [
  {
    q: 'How is my waiting time determined?',
    a: 'Hospital Queue Prediction System uses the clinical Emergency Severity Index (ESI 1-5). Patients experiencing life-threatening conditions (ESI 1 & 2) receive immediate care, regardless of arrival time. Your position updates dynamically based on current medical priority and hospital physician capacity.',
  },
  {
    q: 'What should I do if my symptoms become worse while waiting?',
    a: 'Please notify the triage nurse immediately or press the emergency call button in the waiting lounge. If you experience sudden chest pressure, confusion, or difficulty breathing, notify any staff member without waiting.',
  },
  {
    q: 'Can I eat, drink, or take medications while waiting?',
    a: 'Please ask the triage nurse before eating, drinking, or taking medications. Some diagnostic tests, blood draws, and surgical procedures require an empty stomach (fasting).',
  },
  {
    q: 'How will I be alerted when an exam room is ready for me?',
    a: 'The Hospital Queue Prediction System will flash your Ticket Token on this portal and on the waiting lounge departure displays. If you provided your mobile number at check-in, an automated SMS alert will also be sent.',
  },
  {
    q: 'Is my personal medical information visible on public displays?',
    a: 'No. The Hospital Queue Prediction System adheres strictly to HIPAA Safe Harbor guidelines (45 CFR § 164.312). Public lobby monitors and boards display only anonymized ticket tokens (e.g. PT-4190). Your legal name and diagnosis are completely confidential.',
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, unit, accent = 'teal', note }) {
  const colors = {
    teal:    { bg: 'bg-teal-50/70 dark:bg-teal-950/30', icon: 'text-teal-600 dark:text-cyan-400', val: 'text-teal-800 dark:text-cyan-200', border: 'border-teal-200/80 dark:border-teal-800/50' },
    amber:   { bg: 'bg-amber-50/70 dark:bg-amber-950/30', icon: 'text-amber-600 dark:text-amber-400', val: 'text-amber-800 dark:text-amber-200', border: 'border-amber-200/80 dark:border-amber-800/50' },
    rose:    { bg: 'bg-rose-50/70 dark:bg-rose-950/30', icon: 'text-rose-600 dark:text-rose-400', val: 'text-rose-800 dark:text-rose-200', border: 'border-rose-200/80 dark:border-rose-800/50' },
    emerald: { bg: 'bg-emerald-50/70 dark:bg-emerald-950/30', icon: 'text-emerald-600 dark:text-emerald-400', val: 'text-emerald-800 dark:text-emerald-200', border: 'border-emerald-200/80 dark:border-emerald-800/50' },
  };
  const c = colors[accent] || colors.teal;
  return (
    <div className={`${c.bg} border ${c.border} rounded-2xl p-4 flex flex-col justify-between transition-all hover:shadow-sm`}>
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${c.icon}`} />
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-2xl font-extrabold font-mono ${c.val} flex items-baseline gap-1 my-1`}>
        {value}
        {unit && <span className="text-sm font-sans font-normal text-slate-500 dark:text-slate-400">{unit}</span>}
      </div>
      {note && <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{note}</div>}
    </div>
  );
}

// Horizontal Stepper Bar for Quick Overview
function CareProgressBar({ patient }) {
  if (!patient) return null;
  return (
    <div className="w-full pt-2 pb-6 px-1">
      <div className="relative flex items-center justify-between">
        {/* Continuous connector line */}
        <div className="absolute left-4 right-4 top-4 -translate-y-1/2 h-1 bg-slate-200 dark:bg-slate-800 -z-0" />
        
        {CARE_STEPS.map((step, idx) => {
          const state = stepState(step, patient.status);
          const isDone = state === 'done';
          const isCurrent = state === 'current';
          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center group">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                  isDone
                    ? 'bg-emerald-500 text-white ring-4 ring-emerald-50 dark:ring-emerald-950/40'
                    : isCurrent
                    ? 'bg-teal-600 dark:bg-cyan-500 text-white ring-4 ring-teal-500/30 dark:ring-cyan-400/30 animate-pulse'
                    : 'bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500'
                }`}
              >
                {isDone ? '✓' : idx + 1}
              </div>
              <span
                className={`absolute top-9 text-[10px] font-semibold text-center whitespace-nowrap transition-colors max-w-[70px] truncate ${
                  isCurrent
                    ? 'text-teal-700 dark:text-cyan-300 font-bold scale-105'
                    : isDone
                    ? 'text-slate-700 dark:text-slate-300'
                    : 'text-slate-400 dark:text-slate-600'
                }`}
              >
                {step.title.split(' ')[0]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Vertical Detailed Care Pathway
function CarePathway({ patient }) {
  return (
    <div className="space-y-4">
      {CARE_STEPS.map((step, idx) => {
        const state = stepState(step, patient.status);
        const isCurrent = state === 'current';
        const isDone = state === 'done';
        return (
          <div key={idx} className="flex items-start gap-3.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold transition-all ${
              isDone
                ? 'bg-emerald-500 dark:bg-emerald-600 text-white shadow-sm'
                : isCurrent
                ? 'bg-teal-600 dark:bg-cyan-500 text-white ring-4 ring-teal-500/25 dark:ring-cyan-400/25 animate-pulse'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border border-slate-300 dark:border-slate-700'
            }`}>
              {isDone ? '✓' : idx + 1}
            </div>
            <div className="flex-1 pt-0.5">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${
                  state !== 'pending' ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-600'
                }`}>
                  {idx + 1}. {step.title}
                </span>
                {isCurrent && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 dark:bg-cyan-950 text-teal-800 dark:text-cyan-300 border border-teal-300 dark:border-cyan-800 font-bold uppercase tracking-wide">
                    In Progress
                  </span>
                )}
              </div>
              <div className={`text-xs mt-1 ${
                isCurrent ? 'text-teal-700 dark:text-cyan-300 font-medium' : 'text-slate-500 dark:text-slate-400'
              }`}>
                {step.desc}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Portal Component ───────────────────────────────────────────────────
export function PatientPortal({ patients = [], departments = [], onCheckInSubmit }) {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [theme, setTheme] = useState(() => localStorage.getItem('pulseflow-theme') || 'light');
  const [copiedToken, setCopiedToken] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  // Lookup state
  const [lookupQuery, setLookupQuery] = useState(() => localStorage.getItem('pulseflow_last_ticket') || '');
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

  // Logged-in user information
  let user = null;
  try {
    const s = localStorage.getItem('pulseflow_user');
    if (s) user = JSON.parse(s);
  } catch (_) {}

  const patientName = user?.name || 'Patient';
  const patientEmail = user?.email || '';

  // Theme synchronization
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('pulseflow-theme', theme);
  }, [theme]);

  // Find active patient entry: first check logged-in email, then tracked patient
  const myQueueEntry = patients.find(
    p => p.phi?.email === patientEmail && p.status !== 'discharged'
  ) || trackedPatient;

  // Calculate waiting list in patient's department and dynamic queue position
  const deptWaitingPatients = patients.filter(
    p => p.departmentId === (myQueueEntry?.departmentId || 'dept-ed') &&
         ['checked_in', 'in_triage', 'triage_completed', 'waiting_for_bed'].includes(p.status)
  ).sort((a, b) => (b.calculatedPriorityScore || 0) - (a.calculatedPriorityScore || 0));

  const myQueueRank = myQueueEntry 
    ? deptWaitingPatients.findIndex(p => p.id === myQueueEntry.id || p.displayToken === myQueueEntry.displayToken) + 1 
    : 0;

  // Refresh tracked patient when patients socket array updates
  useEffect(() => {
    if (!trackedPatient) return;
    const fresh = patients.find(p => p.id === trackedPatient.id || p.displayToken === trackedPatient.displayToken);
    if (fresh) setTrackedPatient(fresh);
  }, [patients]);

  // Copy Ticket Token Helper
  const handleCopyToken = (token) => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  // Ticket Lookup Handler
  const handleLookup = async (e, customToken) => {
    if (e) e.preventDefault();
    const tokenToSearch = (customToken || lookupQuery).trim().toUpperCase();
    if (!tokenToSearch) return;

    setLookupError('');
    setLookupLoading(true);
    try {
      // 1. Try local memory list
      const local = patients.find(
        p => p.displayToken?.toUpperCase() === tokenToSearch || 
             p.displayToken?.replace('PT-', '') === tokenToSearch
      );
      if (local) {
        setTrackedPatient(local);
        localStorage.setItem('pulseflow_last_ticket', local.displayToken);
      } else {
        // 2. Query backend API
        const remote = await fetchPatientByToken(tokenToSearch);
        if (remote) {
          setTrackedPatient(remote);
          localStorage.setItem('pulseflow_last_ticket', remote.displayToken);
        } else {
          throw new Error('Ticket not found');
        }
      }
    } catch (_) {
      setTrackedPatient(null);
      setLookupError(`No record found for ticket "${tokenToSearch}". Please check the slip given at triage or ask the reception desk.`);
    } finally {
      setLookupLoading(false);
    }
  };

  // Self Check-in Submission
  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (!checkInForm.legalFullName || !checkInForm.chiefComplaint) return;
    setIsSubmitting(true);
    try {
      const pain = Number(checkInForm.painLevel) || 4;
      let esi = 4;
      if (pain >= 8) esi = 3;
      const lc = checkInForm.chiefComplaint.toLowerCase();
      if (lc.includes('chest') || lc.includes('breath') || lc.includes('stroke') || lc.includes('heart') || lc.includes('unconscious')) {
        esi = 2;
      }

      const res = await onCheckInSubmit({
        legalFullName: checkInForm.legalFullName,
        dateOfBirth: checkInForm.dateOfBirth || '1995-01-01',
        phoneNumber: checkInForm.phoneNumber,
        departmentId: checkInForm.departmentId || 'dept-ed',
        chiefComplaint: checkInForm.chiefComplaint,
        esiLevel: esi,
        vitals: {
          heartRate: 82,
          bloodPressureSystolic: 122,
          bloodPressureDiastolic: 80,
          oxygenSaturation: 98,
          respiratoryRate: 16,
          temperature: 98.6,
          painScore: pain,
        },
      });

      if (res?.displayToken) {
        setSuccessToken(res.displayToken);
        setTrackedPatient(res);
        localStorage.setItem('pulseflow_last_ticket', res.displayToken);
        setLookupQuery(res.displayToken);
      }
    } catch (err) {
      console.error('Check-in error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentDept = departments.find(d => d.id === (myQueueEntry?.departmentId || checkInForm.departmentId)) || departments[0] || {
    id: 'dept-ed',
    name: 'Emergency Department',
    code: 'ED',
    averageWaitMinutes: 24,
    occupiedBeds: 18,
    totalBeds: 24,
    activePhysicians: 4,
    surgeStatus: 'normal',
  };

  // Time-of-day greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  // Navigation Items
  const navItems = [
    { id: 'dashboard', icon: Home,        label: 'My Care' },
    { id: 'tracker',   icon: Search,      label: 'Track Ticket' },
    { id: 'checkin',   icon: UserCheck,   label: 'Check In' },
    { id: 'waiting',   icon: Clock,       label: 'Wait Times' },
    { id: 'help',      icon: HelpCircle,  label: 'Help & FAQ' },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">

      {/* ── TOP HEADER ────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur shadow-xs">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 via-cyan-600 to-sky-500 flex items-center justify-center shadow-md ring-1 ring-white/20">
              <Activity className="w-5 h-5 text-white stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Hospital Queue Prediction System</span>
                <span className="text-[10px] font-bold bg-teal-50 text-teal-700 dark:bg-cyan-950 dark:text-cyan-300 border border-teal-200 dark:border-cyan-800/70 px-2 py-0.5 rounded-full">
                  Patient Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">St. Jude Health Network · Live Telemetry</p>
            </div>
          </div>

          {/* User Controls */}
          <div className="flex items-center gap-2">
            <HospitalRoleSwitcher />
            <button
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
              title="Toggle Theme"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            </button>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/60 text-xs font-semibold text-teal-800 dark:text-teal-300">
              <Heart className="w-3.5 h-3.5 text-teal-600 dark:text-cyan-400" />
              <span>{patientName}</span>
            </div>

            <button
              onClick={logoutUser}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-rose-300 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <div className="max-w-5xl mx-auto px-4 hidden sm:flex gap-1.5 pb-2 overflow-x-auto scrollbar-none">
          {navItems.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeSection === id
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 pb-24 sm:pb-8">

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: OVERVIEW & ACTIVE CARE                                    */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {activeSection === 'dashboard' && (
          <div className="space-y-6">

            {/* Welcome Banner */}
            <div className="relative overflow-hidden bg-gradient-to-r from-teal-700 via-cyan-700 to-sky-700 rounded-3xl p-6 text-white shadow-lg shadow-teal-700/15">
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-teal-200 text-xs font-semibold uppercase tracking-wider">
                    <span>{formattedDate}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Live System Active
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
                    {greeting}, {patientName}
                  </h1>
                  <p className="text-teal-100 text-xs sm:text-sm mt-1 max-w-xl">
                    View real-time clinical triage updates, exam room assignments, and estimated waiting times.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setActiveSection('checkin')}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-teal-800 hover:bg-teal-50 text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4 text-teal-600" />
                    <span>Self Check-In</span>
                  </button>
                  <button
                    onClick={() => setActiveSection('tracker')}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-semibold backdrop-blur transition-all cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                    <span>Track Ticket</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Active Visit Card (if active in queue) */}
            {myQueueEntry ? (
              <div className="bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800/70 rounded-3xl p-6 shadow-sm space-y-6">
                
                {/* Header row: Ticket + Status + Estimated Wait */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-xs font-bold text-teal-600 dark:text-cyan-400 uppercase tracking-wider block mb-1">
                      Active Queue Ticket
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl sm:text-4xl font-black font-mono text-teal-900 dark:text-cyan-200 tracking-wider">
                        {myQueueEntry.displayToken}
                      </span>
                      <button
                        onClick={() => handleCopyToken(myQueueEntry.displayToken)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-colors"
                        title="Copy ticket token"
                      >
                        {copiedToken ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <span className={`px-3 py-1 rounded-full text-xs font-extrabold border inline-flex items-center gap-1.5 ${
                        myQueueEntry.status === 'in_treatment'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700'
                          : myQueueEntry.status === 'in_triage'
                          ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                          : 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950 dark:text-cyan-300 dark:border-teal-800'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
                        {STATUS_LABEL[myQueueEntry.status] || myQueueEntry.status}
                      </span>
                    </div>
                  </div>

                  {/* Wait Time Indicator */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center bg-slate-50 dark:bg-slate-950/60 p-3 sm:p-0 rounded-2xl sm:bg-transparent">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Estimated Door-to-Doctor
                    </span>
                    {myQueueEntry.status === 'in_treatment' ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-lg flex items-center gap-1">
                        <Stethoscope className="w-4 h-4" /> In Care Bay
                      </span>
                    ) : myQueueEntry.status === 'discharged' ? (
                      <span className="text-slate-500 font-extrabold text-lg">Completed</span>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">
                          ~{myQueueEntry.estimatedWaitMinutes ?? 18}
                        </span>
                        <span className="text-xs font-bold text-slate-500">mins</span>
                        {myQueueEntry.waitTrend === 'falling' && (
                          <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold ml-1 flex items-center" title="Decreasing wait">
                            <ArrowDownRight className="w-3.5 h-3.5" /> ↓
                          </span>
                        )}
                        {myQueueEntry.waitTrend === 'rising' && (
                          <span className="text-rose-600 dark:text-rose-400 text-xs font-bold ml-1 flex items-center" title="Increasing wait">
                            <ArrowUpRight className="w-3.5 h-3.5" /> ↑
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Live Queue Position & Velocity Banner */}
                {myQueueRank > 0 && myQueueEntry.status !== 'in_treatment' && myQueueEntry.status !== 'discharged' && (
                  <div className="bg-gradient-to-r from-teal-50 via-cyan-50 to-sky-50 dark:from-slate-950 dark:via-cyan-950/40 dark:to-slate-950 border border-teal-200 dark:border-cyan-800/60 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-teal-600 dark:bg-cyan-600 text-white flex items-center justify-center font-black font-mono text-xl shadow-md">
                        #{myQueueRank}
                      </div>
                      <div>
                        <div className="text-[11px] font-black uppercase tracking-wider text-teal-800 dark:text-cyan-300">
                          {myQueueRank === 1 ? '🌟 You are NEXT in Queue' : 'Your Live Position in Queue'}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                          {myQueueRank === 1 
                            ? 'Please remain close to the triage call display. A medical provider will call your ticket momentarily.'
                            : `There are ${Math.max(0, myQueueRank - 1)} patient(s) ahead of you in this clinical service stream.`
                          }
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div className="bg-white/80 dark:bg-slate-900/80 px-3.5 py-1.5 rounded-xl border border-teal-200/80 dark:border-cyan-800/80">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Queue Depth</div>
                        <div className="text-sm font-black font-mono text-teal-900 dark:text-cyan-200">
                          {deptWaitingPatients.length} Waiting
                        </div>
                      </div>
                      <div className="bg-white/80 dark:bg-slate-900/80 px-3.5 py-1.5 rounded-xl border border-teal-200/80 dark:border-cyan-800/80">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Forecast Trend</div>
                        <div className={`text-sm font-black capitalize ${
                          myQueueEntry.waitTrend === 'falling' ? 'text-emerald-600 dark:text-emerald-400' :
                          myQueueEntry.waitTrend === 'rising' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'
                        }`}>
                          {myQueueEntry.waitTrend || 'Steady'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Prominent Exam Room Banner (when assigned) */}
                {myQueueEntry.assignedRoomName && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border-2 border-emerald-500/40 dark:border-emerald-500/30 flex items-center justify-between gap-3 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <DoorOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                          Please Proceed Immediately
                        </div>
                        <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                          Room Bay: <span className="text-emerald-700 dark:text-emerald-400">{myQueueEntry.assignedRoomName}</span>
                        </div>
                      </div>
                    </div>
                    {myQueueEntry.assignedProviderName && (
                      <div className="text-right text-xs hidden sm:block">
                        <span className="text-slate-500 block">Attending Provider</span>
                        <span className="font-bold text-slate-900 dark:text-white">{myQueueEntry.assignedProviderName}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Horizontal Stepper */}
                <div>
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Care Pathway Status
                  </div>
                  <CareProgressBar patient={myQueueEntry} />
                </div>

                {/* Complaint Summary */}
                {myQueueEntry.chiefComplaint && (
                  <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                        Registered Reason for Visit
                      </span>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        {myQueueEntry.chiefComplaint}
                      </p>
                    </div>
                    {myQueueEntry.vitals?.painScore !== undefined && (
                      <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span>Pain Level:</span>
                        <span className="text-teal-600 dark:text-cyan-400 font-mono text-sm">{myQueueEntry.vitals.painScore}/10</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={() => {
                      setLookupQuery(myQueueEntry.displayToken);
                      setActiveSection('tracker');
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                    <span>View Comprehensive Tracker</span>
                  </button>
                  <button
                    onClick={() => setActiveSection('help')}
                    className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>Symptom Guidance</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Empty State: No active checkin */
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-10 text-center shadow-sm">
                <div className="w-16 h-16 rounded-3xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-cyan-400 flex items-center justify-center mx-auto mb-4 border border-teal-100 dark:border-teal-900">
                  <CalendarClock className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  No Active Visit Registered
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-6">
                  You are not currently checked into any department queue. You can register your arrival in under a minute or track an existing ticket.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
                  <button
                    onClick={() => setActiveSection('checkin')}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Begin Self Check-In</span>
                  </button>
                  <button
                    onClick={() => setActiveSection('tracker')}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                    <span>Look Up Existing Ticket</span>
                  </button>
                </div>
              </div>
            )}

            {/* Department Status Live Glance */}
            {currentDept && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-teal-600 dark:text-cyan-400" />
                    {currentDept.name} — Current Facility Capacity
                  </h2>
                  <button
                    onClick={() => setActiveSection('waiting')}
                    className="text-xs font-bold text-teal-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    All Departments <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard
                    icon={Clock}
                    label="Door-to-Doctor"
                    value={currentDept.averageWaitMinutes || 24}
                    unit="min"
                    accent="teal"
                    note="Average triage to physician"
                  />
                  <StatCard
                    icon={Users}
                    label="Queue Load"
                    value={currentDept.queueCount || 12}
                    unit="patients"
                    accent="amber"
                    note="Registered & waiting"
                  />
                  <StatCard
                    icon={BedDouble}
                    label="Bed Utilization"
                    value={`${currentDept.occupiedBeds || 18}/${currentDept.totalBeds || 24}`}
                    accent="emerald"
                    note={`${currentDept.activePhysicians || 4} physicians on duty`}
                  />
                  <StatCard
                    icon={Activity}
                    label="Surge Status"
                    value={currentDept.surgeStatus === 'critical' ? 'Busy' : currentDept.surgeStatus === 'moderate' ? 'Moderate' : 'Normal'}
                    accent={currentDept.surgeStatus === 'critical' ? 'rose' : currentDept.surgeStatus === 'moderate' ? 'amber' : 'emerald'}
                    note="Hospital divert: inactive"
                  />
                </div>
              </div>
            )}

            {/* HIPAA Safeguard Guarantee */}
            <div className="bg-slate-100/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-start gap-3.5 text-xs text-slate-600 dark:text-slate-400">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200">HIPAA Security Rule Protection (45 CFR § 164.312): </span>
                Your Protected Health Information (PHI) is secured with AES-256 encryption. Public lounge displays use de-identified tokens. Clinical details are restricted strictly to credentialed hospital staff.
              </div>
            </div>

          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: LIVE TICKET TRACKER                                       */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {activeSection === 'tracker' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                Live Ticket Tracker
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Enter your ticket code from your check-in receipt or SMS to view real-time care progress.
              </p>
            </div>

            {/* Search Input Box */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm">
              <form onSubmit={handleLookup} className="flex gap-2">
                <input
                  type="text"
                  value={lookupQuery}
                  onChange={e => setLookupQuery(e.target.value)}
                  placeholder="e.g. PT-4190 or 4190"
                  className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-bold uppercase"
                />
                <button
                  type="submit"
                  disabled={lookupLoading}
                  className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-60 text-white font-bold px-6 py-3 rounded-xl transition-all text-xs shadow-sm cursor-pointer shrink-0"
                >
                  {lookupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>Track</span>
                </button>
              </form>

              {lookupError && (
                <div className="mt-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>{lookupError}</span>
                </div>
              )}
            </div>

            {/* Results Display */}
            {trackedPatient && (
              <div className="bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800/70 rounded-3xl p-6 shadow-md space-y-6">
                
                {/* Header Ticket info */}
                <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-4">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Ticket Identifier
                    </span>
                    <div className="text-3xl sm:text-4xl font-black font-mono text-teal-800 dark:text-cyan-200 tracking-wider mt-0.5">
                      {trackedPatient.displayToken}
                    </div>
                    <span className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                      trackedPatient.status === 'in_treatment'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                        : trackedPatient.status === 'in_triage'
                        ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950 dark:text-cyan-300'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {STATUS_LABEL[trackedPatient.status] || trackedPatient.status}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                      Estimated Remaining Wait
                    </span>
                    <div className="text-3xl font-black font-mono text-slate-900 dark:text-white mt-0.5">
                      ~{trackedPatient.estimatedWaitMinutes ?? 20}
                      <span className="text-sm font-sans font-normal text-slate-400 ml-1">min</span>
                    </div>
                    {trackedPatient.waitTrend && trackedPatient.waitTrend !== 'stable' && (
                      <span className={`inline-flex items-center gap-1 text-xs font-bold mt-1 ${
                        trackedPatient.waitTrend === 'falling' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                      }`}>
                        {trackedPatient.waitTrend === 'falling' ? <ArrowDownRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                        Trend {trackedPatient.waitTrend}
                      </span>
                    )}
                  </div>
                </div>

                {/* Live Queue Position for Tracked Ticket */}
                {deptWaitingPatients.findIndex(p => p.id === trackedPatient.id || p.displayToken === trackedPatient.displayToken) >= 0 && (
                  <div className="bg-teal-50 dark:bg-cyan-950/40 border border-teal-200 dark:border-cyan-800/60 p-4 rounded-2xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black font-mono text-lg shadow-sm">
                        #{deptWaitingPatients.findIndex(p => p.id === trackedPatient.id || p.displayToken === trackedPatient.displayToken) + 1}
                      </div>
                      <div>
                        <div className="text-xs font-black uppercase text-teal-800 dark:text-cyan-300">
                          Current Queue Position
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          {deptWaitingPatients.findIndex(p => p.id === trackedPatient.id || p.displayToken === trackedPatient.displayToken) === 0
                            ? 'You are next in queue for exam room assignment.'
                            : `${deptWaitingPatients.findIndex(p => p.id === trackedPatient.id || p.displayToken === trackedPatient.displayToken)} patient(s) currently ahead of you.`
                          }
                        </div>
                      </div>
                    </div>
                    <div className="text-right font-mono text-xs text-slate-500">
                      Total Waiting: <strong className="text-slate-800 dark:text-slate-200">{deptWaitingPatients.length}</strong>
                    </div>
                  </div>
                )}

                {/* Exam Room Assignment */}
                {trackedPatient.assignedRoomName && (
                  <div className="flex items-center gap-3 p-4 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 rounded-2xl">
                    <DoorOpen className="w-6 h-6 text-teal-600 dark:text-cyan-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wider">
                        Assigned Examination Bay
                      </div>
                      <div className="text-lg font-black text-slate-900 dark:text-white">
                        {trackedPatient.assignedRoomName}
                      </div>
                    </div>
                  </div>
                )}

                {/* Detailed Vertical Care Pathway */}
                <div>
                  <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                    Clinical Milestone Progression
                  </h4>
                  <CarePathway patient={trackedPatient} />
                </div>

                {/* Warning Alert */}
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-4 rounded-2xl flex items-start gap-3">
                  <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 dark:text-amber-200/90 space-y-1">
                    <p className="font-bold">Are your symptoms intensifying?</p>
                    <p>
                      If you notice increasing pain, sudden shortness of breath, dizziness, or chest tightness, please inform the triage desk immediately. You will be re-evaluated promptly.
                    </p>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* TAB 3: SELF CHECK-IN KIOSK                                       */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {activeSection === 'checkin' && (
          <div className="max-w-xl mx-auto space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                Patient Self Check-In Kiosk
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Register your symptoms securely. Receive your anonymous ticket and estimated door-to-doctor time.
              </p>
            </div>

            {successToken ? (
              /* Success Slip Card */
              <div className="bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800/60 rounded-3xl p-8 text-center shadow-lg space-y-5">
                <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    Check-In Successfully Recorded!
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Please take a seat in the waiting lounge. Here is your confidential ticket:
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 border border-dashed border-teal-300 dark:border-teal-800 rounded-2xl p-6 max-w-xs mx-auto">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Your Queue Token
                  </div>
                  <div className="text-4xl sm:text-5xl font-black font-mono text-teal-800 dark:text-cyan-300 py-2 tracking-wider">
                    {successToken}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Est. Wait: <span className="font-bold text-slate-800 dark:text-slate-200">~{currentDept?.averageWaitMinutes || 24} mins</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
                  This token will be displayed on lobby screens when your room is ready. Keep this screen open to track progress live.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <button
                    onClick={() => setActiveSection('tracker')}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                    <span>Track Ticket Status</span>
                  </button>
                  <button
                    onClick={() => {
                      setSuccessToken(null);
                      setActiveSection('dashboard');
                    }}
                    className="px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Return to Overview
                  </button>
                </div>
              </div>
            ) : (
              /* Check-in Form */
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm">
                <form onSubmit={handleCheckIn} className="space-y-5">
                  
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Legal Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={checkInForm.legalFullName}
                      onChange={e => setCheckInForm({ ...checkInForm, legalFullName: e.target.value })}
                      placeholder="e.g. Maria Gonzalez"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Protected under HIPAA Safe Harbor. Never revealed on public boards.
                    </span>
                  </div>

                  {/* DOB & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={checkInForm.dateOfBirth}
                        onChange={e => setCheckInForm({ ...checkInForm, dateOfBirth: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Mobile Phone <span className="text-slate-400 font-normal">(for SMS alerts)</span>
                      </label>
                      <input
                        type="tel"
                        value={checkInForm.phoneNumber}
                        onChange={e => setCheckInForm({ ...checkInForm, phoneNumber: e.target.value })}
                        placeholder="(555) 234-5678"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  {/* Department Select */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Select Department <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={checkInForm.departmentId}
                      onChange={e => setCheckInForm({ ...checkInForm, departmentId: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                    >
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.name} — (Avg wait: {d.averageWaitMinutes || 20}m)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quick Symptoms Picker */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Quick Symptom Tags (click to add)
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_SYMPTOMS.map((symptom) => (
                        <button
                          key={symptom}
                          type="button"
                          onClick={() => {
                            setCheckInForm(f => ({
                              ...f,
                              chiefComplaint: f.chiefComplaint
                                ? `${f.chiefComplaint}, ${symptom}`
                                : symptom,
                            }));
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-teal-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                        >
                          + {symptom}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Chief Complaint Description */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Chief Complaint / Symptom Details <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={checkInForm.chiefComplaint}
                      onChange={e => setCheckInForm({ ...checkInForm, chiefComplaint: e.target.value })}
                      placeholder="Please describe your symptoms, how long you've felt them, and any pertinent details..."
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                    />
                  </div>

                  {/* Pain Scale Gauge */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Current Pain Level (0 to 10)
                      </label>
                      <span className={`font-mono font-black text-sm px-2.5 py-0.5 rounded-full ${
                        Number(checkInForm.painLevel) >= 8 ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                        Number(checkInForm.painLevel) >= 5 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                        'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-cyan-300'
                      }`}>
                        {checkInForm.painLevel} / 10
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={checkInForm.painLevel}
                      onChange={e => setCheckInForm({ ...checkInForm, painLevel: e.target.value })}
                      className="w-full accent-teal-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-lg"
                    />
                    <div className="flex justify-between text-[11px] text-slate-400 font-medium mt-1">
                      <span>0 · None</span>
                      <span>3 · Mild</span>
                      <span>6 · Moderate</span>
                      <span>8 · Severe</span>
                      <span>10 · Worst</span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting Intake &amp; Generating Ticket...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Complete Check-In &amp; Receive Ticket</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* TAB 4: DEPARTMENT WAIT TIMES                                     */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {activeSection === 'waiting' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                Live Department Wait Times
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Current telemetry from triage desks across all St. Jude Health Network facilities.
              </p>
            </div>

            {/* Department Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {departments.map(dept => {
                const isSelected = checkInForm.departmentId === dept.id;
                return (
                  <div
                    key={dept.id}
                    className={`bg-white dark:bg-slate-900 border rounded-3xl p-6 shadow-sm transition-all hover:shadow-md ${
                      isSelected
                        ? 'border-teal-400 dark:border-teal-700 ring-2 ring-teal-500/20'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="text-xs font-bold text-teal-600 dark:text-cyan-400 uppercase tracking-wider">
                          {dept.code}
                        </span>
                        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">
                          {dept.name}
                        </h3>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${
                        dept.surgeStatus === 'critical'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          : dept.surgeStatus === 'moderate'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}>
                        {dept.surgeStatus === 'critical' ? '🔴 High Load' : dept.surgeStatus === 'moderate' ? '🟡 Moderate' : '🟢 Normal'}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-1.5 my-3">
                      <span className="text-4xl sm:text-5xl font-black font-mono text-teal-700 dark:text-cyan-300">
                        {dept.averageWaitMinutes || 20}
                      </span>
                      <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                        mins avg wait
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                      {dept.description || 'General emergency triage and clinical admission services.'}
                    </p>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>Beds: {dept.occupiedBeds || 12}/{dept.totalBeds || 20} in use</span>
                      <span>{dept.activePhysicians || 3} MDs · {dept.activeNurses || 6} RNs</span>
                    </div>

                    <button
                      onClick={() => {
                        setCheckInForm(f => ({ ...f, departmentId: dept.id }));
                        setActiveSection('checkin');
                      }}
                      className="mt-4 w-full py-2.5 rounded-xl bg-slate-50 hover:bg-teal-50 dark:bg-slate-800 dark:hover:bg-teal-950/40 text-teal-700 dark:text-cyan-300 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Check In to {dept.name.split(' ')[0]}</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Emergency Checklist */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                Immediate Emergency Warning Signs
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                If you or someone near you experiences any of the following, alert hospital staff immediately:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  'Crushing chest pressure or chest pain',
                  'Sudden numbness or paralysis (face, arm, leg)',
                  'Sudden severe shortness of breath',
                  'Loss of consciousness or severe confusion',
                  'Uncontrolled or profuse bleeding',
                  'Suspected poisoning or overdose',
                ].map((sign, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-rose-900 dark:text-rose-200 flex items-center gap-2 font-medium">
                    <span className="text-rose-600 font-bold">⚠️</span>
                    <span>{sign}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* TAB 5: HELP, FAQS & PATIENT RIGHTS                                */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {activeSection === 'help' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                Patient Help &amp; Facility Guide
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Answers to common questions, hospital contacts, and emergency assistance.
              </p>
            </div>

            {/* Direct Hospital Contact Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <a
                href="tel:911"
                className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-center hover:bg-rose-100 transition-colors cursor-pointer group"
              >
                <Phone className="w-5 h-5 text-rose-600 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-rose-700 dark:text-rose-300">Call 911</div>
                <div className="text-[11px] text-rose-600/80">Immediate Emergency</div>
              </a>
              <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 text-center">
                <Stethoscope className="w-5 h-5 text-teal-600 mx-auto mb-1" />
                <div className="text-xs font-bold text-teal-800 dark:text-teal-300">Triage Desk</div>
                <div className="text-[11px] text-teal-600 dark:text-teal-400 font-mono">Lobby Station 1</div>
              </div>
              <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 text-center">
                <HelpCircle className="w-5 h-5 text-sky-600 mx-auto mb-1" />
                <div className="text-xs font-bold text-sky-800 dark:text-sky-300">Patient Advocate</div>
                <div className="text-[11px] text-sky-600 dark:text-sky-400">Ext. 4022</div>
              </div>
            </div>

            {/* Accordion FAQ */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white mb-2">
                Frequently Asked Questions
              </h3>
              
              {FAQS.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between p-4 text-left font-bold text-xs sm:text-sm text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-950/40">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Patient Rights Box */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-cyan-400" />
                Patient Rights &amp; Safe Harbor Guarantee
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Under federal law (EMTALA), every patient presenting to our facility has the right to a medical screening examination regardless of ability to pay or insurance status.
              </p>
              <div className="text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-3">
                PulseFlow Clinical Systems · HIPAA Security Rule 45 CFR § 164.312 Compliant.
              </div>
            </div>

          </div>
        )}

      </main>

      {/* ── MOBILE FIXED BOTTOM NAVIGATION BAR ───────────────────────────── */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-800 shadow-lg px-2 py-1.5 flex items-center justify-around">
        {navItems.map(({ id, icon: Icon, label }) => {
          const isActive = activeSection === id;
          return (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'text-teal-600 dark:text-cyan-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">{label}</span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-teal-600 dark:bg-cyan-400 mt-0.5" />
              )}
            </button>
          );
        })}
      </nav>

      {/* ── DESKTOP FOOTER ────────────────────────────────────────────────── */}
      <footer className="hidden sm:block border-t border-slate-200 dark:border-slate-900 bg-white/80 dark:bg-slate-950/80 px-6 py-4 text-center text-xs text-slate-400 dark:text-slate-500">
        PulseFlow Patient Portal © 2026 · St. Jude Health Network · HIPAA Safe Harbor Certified · 45 CFR § 164.312
      </footer>

    </div>
  );
}
