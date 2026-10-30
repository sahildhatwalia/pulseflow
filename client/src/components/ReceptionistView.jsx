import React, { useState } from 'react';
import {
  Activity,
  Clock,
  UserCheck,
  Users,
  DoorOpen,
  CheckCircle2,
  AlertTriangle,
  Send,
  Search,
  ShieldCheck,
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  LogOut,
  Sun,
  Moon,
  Wifi,
  WifiOff,
  Loader2,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import { logoutUser } from '../services/api.js';

const STATUS_LABEL = {
  checked_in: 'Just Arrived',
  in_triage: 'Nurse Assessing',
  triage_completed: 'Assessment Done',
  waiting_for_bed: 'Waiting for Room',
  in_treatment: 'In Exam Bay',
  discharged: 'Discharged',
};

export function ReceptionistView({
  patients = [],
  departments = [],
  onCheckInSubmit,
  socketConnected,
}) {
  const [activeSection, setActiveSection] = useState('board');
  const [selectedDeptId, setSelectedDeptId] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('pulseflow-theme') || 'light');

  // Check-in form
  const [form, setForm] = useState({
    legalFullName: '',
    dateOfBirth: '',
    phoneNumber: '',
    chiefComplaint: '',
    painLevel: '4',
    departmentId: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToken, setSuccessToken] = useState(null);

  // Lookup
  const [lookupQuery, setLookupQuery] = useState('');
  const [foundPatient, setFoundPatient] = useState(null);
  const [lookupError, setLookupError] = useState('');

  let user = null;
  try { user = JSON.parse(localStorage.getItem('pulseflow_user') || 'null'); } catch (_) {}

  React.useEffect(() => {
    const root = document.documentElement;
    theme === 'dark' ? root.classList.add('dark') : root.classList.remove('dark');
    localStorage.setItem('pulseflow-theme', theme);
  }, [theme]);

  // Set default dept
  React.useEffect(() => {
    if (!selectedDeptId && departments.length > 0) {
      setSelectedDeptId(departments[0].id);
      setForm(f => ({ ...f, departmentId: departments[0].id }));
    }
  }, [departments]);

  const currentDept = departments.find(d => d.id === selectedDeptId) || departments[0];

  const deptPatients = patients.filter(
    p => p.departmentId === selectedDeptId && p.status !== 'discharged'
  );
  const currentlyBeingSeen = deptPatients.filter(p => p.status === 'in_treatment' || p.assignedRoomName);
  const inWaiting = deptPatients.filter(p =>
    ['checked_in', 'in_triage', 'triage_completed', 'waiting_for_bed'].includes(p.status)
  ).sort((a, b) => b.calculatedPriorityScore - a.calculatedPriorityScore);

  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (!form.legalFullName || !form.chiefComplaint) return;
    setIsSubmitting(true);
    try {
      const pain = Number(form.painLevel) || 4;
      let esi = 4;
      if (pain >= 8) esi = 3;
      const lc = form.chiefComplaint.toLowerCase();
      if (lc.includes('chest') || lc.includes('breath') || lc.includes('stroke') || lc.includes('heart')) esi = 2;

      const res = await onCheckInSubmit({
        legalFullName: form.legalFullName,
        dateOfBirth: form.dateOfBirth || '1990-01-01',
        phoneNumber: form.phoneNumber,
        departmentId: form.departmentId || selectedDeptId,
        chiefComplaint: form.chiefComplaint,
        esiLevel: esi,
        vitals: { heartRate: 80, bloodPressureSystolic: 120, bloodPressureDiastolic: 80, oxygenSaturation: 98, respiratoryRate: 16, temperature: 98.6, painScore: pain },
      });
      if (res?.displayToken) {
        setSuccessToken(res.displayToken);
        setForm(f => ({ ...f, legalFullName: '', dateOfBirth: '', phoneNumber: '', chiefComplaint: '', painLevel: '4' }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLookup = (e) => {
    e.preventDefault();
    const clean = lookupQuery.trim().toUpperCase();
    if (!clean) return;
    setLookupError('');
    const match = patients.find(p => p.displayToken?.toUpperCase() === clean || p.displayToken?.replace('PT-', '') === clean);
    if (match) { setFoundPatient(match); }
    else { setFoundPatient(null); setLookupError(`No record found for "${clean}".`); }
  };

  const navItems = [
    { id: 'board',   icon: Activity, label: 'Live Queue Board' },
    { id: 'checkin', icon: UserCheck, label: 'Check-In Patient' },
    { id: 'lookup',  icon: Search,   label: 'Ticket Lookup' },
    { id: 'waits',   icon: Clock,    label: 'All Departments' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur shadow-sm">
        {/* Status bar */}
        <div className="px-4 py-1.5 border-b border-slate-200/70 dark:border-slate-800/70 bg-slate-100/80 dark:bg-slate-950/60 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              PulseFlow Reception Console
            </span>
            <span className="hidden sm:inline text-slate-400 dark:text-slate-600">•</span>
            <span className="hidden sm:inline text-slate-500 dark:text-slate-400">St. Jude Metropolitan Academic Health</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
              socketConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60'
                : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/60'
            }`}>
              {socketConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span className="font-mono">{socketConnected ? 'Live Updates' : 'Reconnecting'}</span>
            </span>
            <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 transition-all cursor-pointer">
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-500" />}
            </button>
            <button onClick={logoutUser} className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-rose-300 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-all cursor-pointer">
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>

        {/* Brand + Role badge */}
        <div className="px-4 py-3 max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 via-cyan-600 to-sky-500 flex items-center justify-center shadow-md ring-1 ring-white/20">
              <Activity className="w-6 h-6 text-white stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">PulseFlow</h1>
                <span className="text-xs bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800 px-2 py-0.5 rounded font-mono font-semibold">Reception</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Patient intake, queue management & wait times</p>
            </div>
          </div>

          {/* WHO IS THIS — Receptionist badge */}
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl border font-semibold text-sm shadow-sm bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/60 dark:text-teal-200 dark:border-teal-800/60">
            <span className="text-xl">🛎️</span>
            <div>
              <div className="text-[10px] uppercase tracking-widest opacity-70 font-bold leading-tight">Logged in as</div>
              <div className="font-extrabold leading-tight">Receptionist — {user?.name || 'Front Desk'}</div>
            </div>
          </div>
        </div>

        {/* Dept + Nav */}
        <div className="px-4 pb-2 max-w-7xl mx-auto flex items-center gap-3 flex-wrap">
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            {departments.map(dept => (
              <button
                key={dept.id}
                onClick={() => { setSelectedDeptId(dept.id); setForm(f => ({ ...f, departmentId: dept.id })); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedDeptId === dept.id
                    ? 'bg-teal-600 dark:bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-900'
                }`}
              >
                {dept.code} {dept.isDiverting && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-rose-500 inline-block animate-pulse" />}
              </button>
            ))}
          </div>
        </div>

        {/* Section nav */}
        <div className="px-4 border-t border-slate-200/80 dark:border-slate-800/60 max-w-7xl mx-auto flex gap-1 pb-1.5 pt-1.5 overflow-x-auto scrollbar-none">
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
          {/* quick stats in nav bar */}
          {currentDept && (
            <div className="ml-auto hidden lg:flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-medium pl-4 border-l border-slate-200 dark:border-slate-700">
              <span>Avg Wait: <span className="font-bold text-slate-800 dark:text-white font-mono">{currentDept.averageWaitMinutes}m</span></span>
              <span>In Queue: <span className="font-bold text-teal-700 dark:text-cyan-300 font-mono">{inWaiting.length}</span></span>
              <span>Surge: <span className={`font-bold ${currentDept.surgeStatus === 'critical' ? 'text-rose-600' : currentDept.surgeStatus === 'moderate' ? 'text-amber-600' : 'text-emerald-600'}`}>{currentDept.surgeStatus}</span></span>
            </div>
          )}
        </div>
      </header>

      {/* ── MAIN ──────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 space-y-6">

        {/* ═══ LIVE QUEUE BOARD ════════════════════════════════════════ */}
        {activeSection === 'board' && (
          <div className="space-y-5">
            {/* Stat ribbon */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Avg Wait Time', value: currentDept?.averageWaitMinutes || 0, unit: 'min', color: 'text-teal-700 dark:text-cyan-300', icon: Clock },
                { label: 'In Waiting Room', value: inWaiting.length, unit: '', color: 'text-slate-900 dark:text-white', icon: Users },
                { label: 'Being Seen Now', value: currentlyBeingSeen.length, unit: '', color: 'text-emerald-700 dark:text-emerald-300', icon: DoorOpen },
                { label: 'Surge Status', value: currentDept?.surgeStatus || 'Normal', unit: '', color: currentDept?.surgeStatus === 'critical' ? 'text-rose-600' : currentDept?.surgeStatus === 'moderate' ? 'text-amber-600' : 'text-emerald-600', icon: TrendingUp },
              ].map((s) => (
                <div key={s.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <s.icon className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{s.label}</span>
                  </div>
                  <div className={`text-2xl font-extrabold font-mono ${s.color}`}>{s.value}{s.unit && <span className="text-sm font-sans font-normal text-slate-400 ml-1">{s.unit}</span>}</div>
                </div>
              ))}
            </div>

            {/* Now Serving */}
            {currentlyBeingSeen.length > 0 && (
              <div className="bg-gradient-to-r from-teal-50 via-cyan-50 to-sky-50 dark:from-slate-900 dark:via-teal-950/30 dark:to-slate-900 border border-teal-200 dark:border-teal-800/50 p-5 rounded-2xl shadow-xs">
                <div className="flex items-center gap-2 mb-3">
                  <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-500 opacity-75" /><span className="relative inline-flex rounded-full h-3 w-3 bg-teal-600" /></span>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-teal-900 dark:text-teal-300">Now Serving — Proceeding to Exam Rooms</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {currentlyBeingSeen.map(p => (
                    <div key={p.id} className="bg-white dark:bg-slate-950/80 border border-teal-200 dark:border-teal-600/40 p-3.5 rounded-xl flex items-center justify-between shadow-xs">
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Ticket</div>
                        <div className="text-lg font-extrabold font-mono text-teal-800 dark:text-cyan-200">{p.displayToken}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase">Room</div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1 mt-0.5">
                          <DoorOpen className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                          {p.assignedRoomName || 'Exam Bay'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Waiting queue table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-transparent">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-600 dark:text-cyan-400" />
                  <h3 className="font-bold text-slate-900 dark:text-white">Waiting Room Queue ({inWaiting.length})</h3>
                </div>
                <span className="text-xs text-slate-400 dark:text-slate-500">Sorted by clinical urgency & arrival</span>
              </div>

              {inWaiting.length === 0 ? (
                <div className="p-10 text-center text-slate-400">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                  <p className="font-semibold text-slate-600 dark:text-slate-300">No patients currently waiting.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
                  <div className="grid grid-cols-12 px-5 py-2 bg-slate-100/80 dark:bg-slate-950 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <div className="col-span-3">Ticket</div>
                    <div className="col-span-4">Care Stage</div>
                    <div className="col-span-3 text-right">Est. Wait</div>
                    <div className="col-span-2 text-right">Trend</div>
                  </div>
                  {inWaiting.map((p, idx) => {
                    const isNext = idx === 0;
                    return (
                      <div key={p.id} className={`grid grid-cols-12 px-5 py-3.5 items-center transition-colors ${
                        isNext ? 'bg-teal-50/70 dark:bg-cyan-950/20 border-l-4 border-teal-500' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                      }`}>
                        <div className="col-span-3 flex items-center gap-2">
                          <span className="font-mono text-base font-bold text-slate-900 dark:text-white">{p.displayToken}</span>
                          {isNext && <span className="hidden md:inline-block px-1.5 py-0.5 text-[9px] uppercase font-extrabold rounded bg-teal-100 text-teal-700 dark:bg-cyan-500/20 dark:text-cyan-300 border border-teal-300 dark:border-cyan-500/30">Next</span>}
                        </div>
                        <div className="col-span-4">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold inline-flex items-center gap-1.5 ${
                            p.status === 'in_triage' ? 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800/60' :
                            p.status === 'triage_completed' ? 'bg-indigo-100 text-indigo-800 border border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800/60' :
                            p.status === 'waiting_for_bed' ? 'bg-sky-100 text-sky-800 border border-sky-300 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800/60' :
                            'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {STATUS_LABEL[p.status] || p.status}
                          </span>
                        </div>
                        <div className="col-span-3 text-right font-mono text-sm font-bold text-teal-700 dark:text-cyan-400">~{p.estimatedWaitMinutes}<span className="text-xs font-sans font-normal text-slate-400 ml-0.5">min</span></div>
                        <div className="col-span-2 text-right">
                          <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
                            p.waitTrend === 'falling' ? 'text-emerald-600 dark:text-emerald-400' :
                            p.waitTrend === 'rising' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'
                          }`}>
                            {p.waitTrend === 'falling' && <ArrowDownRight className="w-3 h-3" />}
                            {p.waitTrend === 'rising' && <ArrowUpRight className="w-3 h-3" />}
                            {p.waitTrend === 'stable' && <Minus className="w-3 h-3" />}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* HIPAA notice */}
            <div className="flex items-start gap-3 p-4 bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-500 dark:text-slate-400">
              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <p><span className="font-bold text-slate-700 dark:text-slate-300">HIPAA Safe Harbor: </span>This board displays ticket numbers only. Patient names and medical details are never shown publicly and are stored with AES-256 encryption.</p>
            </div>
          </div>
        )}

        {/* ═══ CHECK-IN ════════════════════════════════════════════════ */}
        {activeSection === 'checkin' && (
          <div className="max-w-xl mx-auto space-y-5">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Patient Check-In</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Register a new patient arrival to the queue.</p>
            </div>

            {successToken && (
              <div className="p-5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="font-bold text-emerald-800 dark:text-emerald-300">Check-In Successful!</p>
                <p className="text-2xl font-extrabold font-mono text-teal-700 dark:text-cyan-300 tracking-widest">{successToken}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Give this ticket number to the patient. They can track their queue position using it.</p>
                <button onClick={() => setSuccessToken(null)} className="mt-2 px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold cursor-pointer transition-colors">
                  Check In Another Patient
                </button>
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <form onSubmit={handleCheckIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Full Legal Name <span className="text-rose-500">*</span></label>
                  <input type="text" required value={form.legalFullName} onChange={e => setForm({ ...form, legalFullName: e.target.value })} placeholder="e.g. Jane Doe" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Date of Birth</label>
                    <input type="date" value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Phone Number</label>
                    <input type="tel" value={form.phoneNumber} onChange={e => setForm({ ...form, phoneNumber: e.target.value })} placeholder="(555) 000-0000" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Department <span className="text-rose-500">*</span></label>
                  <select value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500">
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Chief Complaint / Reason for Visit <span className="text-rose-500">*</span></label>
                  <textarea required rows={3} value={form.chiefComplaint} onChange={e => setForm({ ...form, chiefComplaint: e.target.value })} placeholder="Describe symptoms briefly..." className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Pain Level (0–10)</label>
                    <span className="font-mono font-bold text-teal-700 dark:text-cyan-400 text-sm">{form.painLevel}/10</span>
                  </div>
                  <input type="range" min="0" max="10" value={form.painLevel} onChange={e => setForm({ ...form, painLevel: e.target.value })} className="w-full accent-teal-600" />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>0 None</span><span>5 Moderate</span><span>10 Severe</span>
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm cursor-pointer">
                  {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />Processing...</> : <><Send className="w-4 h-4" />Register Patient & Issue Ticket</>}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ═══ TICKET LOOKUP ══════════════════════════════════════════ */}
        {activeSection === 'lookup' && (
          <div className="max-w-xl mx-auto space-y-5">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Ticket Lookup</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Search for a patient by their queue ticket number.</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
              <form onSubmit={handleLookup} className="flex gap-2">
                <input type="text" value={lookupQuery} onChange={e => setLookupQuery(e.target.value)} placeholder="e.g. PT-5120" className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                <button type="submit" className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm cursor-pointer">
                  <Search className="w-4 h-4" /> Look Up
                </button>
              </form>
              {lookupError && (
                <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />{lookupError}
                </div>
              )}
            </div>

            {foundPatient && (
              <div className="bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800/60 rounded-2xl p-6 shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ticket</div>
                    <div className="text-3xl font-extrabold font-mono text-teal-800 dark:text-cyan-200">{foundPatient.displayToken}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Est. Wait</div>
                    <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
                      {foundPatient.status === 'in_treatment' ? <span className="text-lg text-emerald-600">In Care Bay</span> : <>~{foundPatient.estimatedWaitMinutes}<span className="text-sm font-sans font-normal text-slate-400 ml-1">min</span></>}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-xs text-slate-400 block">Department</span><span className="font-semibold text-slate-800 dark:text-slate-200">{departments.find(d => d.id === foundPatient.departmentId)?.name || foundPatient.departmentId}</span></div>
                  <div><span className="text-xs text-slate-400 block">Status</span><span className="font-semibold text-slate-800 dark:text-slate-200">{STATUS_LABEL[foundPatient.status] || foundPatient.status}</span></div>
                  {foundPatient.assignedRoomName && <div><span className="text-xs text-slate-400 block">Assigned Room</span><span className="font-semibold text-teal-700 dark:text-teal-300">{foundPatient.assignedRoomName}</span></div>}
                  {foundPatient.chiefComplaint && <div><span className="text-xs text-slate-400 block">Reason for Visit</span><span className="font-semibold text-slate-800 dark:text-slate-200">{foundPatient.chiefComplaint}</span></div>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ ALL DEPARTMENTS ════════════════════════════════════════ */}
        {activeSection === 'waits' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">All Department Wait Times</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Live wait times and capacity across St. Jude Health Network.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {departments.map(dept => {
                const dPats = patients.filter(p => p.departmentId === dept.id && p.status !== 'discharged');
                const dWaiting = dPats.filter(p => ['checked_in','in_triage','triage_completed','waiting_for_bed'].includes(p.status));
                return (
                  <div key={dept.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{dept.code}</div>
                        <div className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">{dept.name}</div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${
                        dept.surgeStatus === 'critical' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' :
                        dept.surgeStatus === 'moderate' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' :
                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}>{dept.surgeStatus === 'critical' ? '🔴 Critical' : dept.surgeStatus === 'moderate' ? '🟡 Moderate' : '🟢 Normal'}</span>
                    </div>
                    <div className="flex items-baseline gap-1.5 mb-3">
                      <span className="text-4xl font-extrabold font-mono text-teal-700 dark:text-cyan-300">{dept.averageWaitMinutes}</span>
                      <span className="text-slate-400 text-sm">min avg wait</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs border-t border-slate-100 dark:border-slate-800 pt-3">
                      <div className="text-center">
                        <div className="font-bold text-slate-800 dark:text-slate-200 font-mono">{dWaiting.length}</div>
                        <div className="text-slate-400">Waiting</div>
                      </div>
                      <div className="text-center border-x border-slate-100 dark:border-slate-800">
                        <div className="font-bold text-slate-800 dark:text-slate-200 font-mono">{dept.occupiedBeds}/{dept.totalBeds}</div>
                        <div className="text-slate-400">Beds Used</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-slate-800 dark:text-slate-200 font-mono">{dept.activePhysicians}</div>
                        <div className="text-slate-400">Doctors</div>
                      </div>
                    </div>
                    {dept.isDiverting && (
                      <div className="mt-3 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-xs font-semibold text-rose-700 dark:text-rose-300">
                        🚨 Ambulance Diversion Active
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-900 bg-white/80 dark:bg-slate-950/80 px-6 py-3 text-center text-xs text-slate-400 dark:text-slate-500">
        PulseFlow Reception Console © 2026 · St. Jude Health Network · 🛎️ Reception Portal · HIPAA Safe Harbor Protected
      </footer>
    </div>
  );
}
