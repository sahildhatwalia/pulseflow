import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, Search, Clock, ArrowRight, MapPin, Heart, ShieldCheck,
  AlertTriangle, Loader2, ChevronRight, UserCheck, CheckCircle2,
  DoorOpen, Stethoscope, Bell,
} from 'lucide-react';
import { publicTrackTicket, publicGetWaitTimes } from '../services/api.js';

// ─── Status labels & colors ──────────────────────────────────────────────────

const STATUS_LABEL = {
  checked_in:          'Just Arrived',
  in_triage:           'Nurse Assessing',
  triage_completed:    'Assessment Done',
  waiting_for_bed:     'Waiting for Room',
  in_treatment:        'With Doctor',
  ready_for_discharge: 'Ready to Discharge',
  discharged:          'Discharged',
};

const STATUS_COLOR = {
  in_treatment:        'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  in_triage:           'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  triage_completed:    'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  discharged:          'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700',
  ready_for_discharge: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300 border-sky-200 dark:border-sky-800',
};

const DEFAULT_STATUS_COLOR = 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300 border-teal-200 dark:border-teal-800';

// ─── Care steps for progress indicator ───────────────────────────────────────

const CARE_STEPS = [
  { key: 'checked_in',     label: 'Registered',    icon: '✓' },
  { key: 'in_triage',      label: 'Triage',        icon: '🩺' },
  { key: 'waiting_for_bed', label: 'Bed Assigned', icon: '🛏️' },
  { key: 'in_treatment',   label: 'With Doctor',   icon: '👨‍⚕️' },
  { key: 'discharged',     label: 'Discharged',    icon: '🏠' },
];

// Map each status to an index on the CARE_STEPS array for progress
const STATUS_STEP_INDEX = {
  checked_in: 0,
  in_triage: 1,
  triage_completed: 1,
  waiting_for_bed: 2,
  in_treatment: 3,
  ready_for_discharge: 3,
  discharged: 4,
};

// ─── Surge badge helper ──────────────────────────────────────────────────────

function getSurgeBadge(surgeLevel) {
  if (surgeLevel === 'high' || surgeLevel === 'critical')
    return { emoji: '🔴', label: 'Busy', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300' };
  if (surgeLevel === 'moderate' || surgeLevel === 'elevated')
    return { emoji: '🟡', label: 'Moderate', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' };
  return { emoji: '🟢', label: 'Open', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' };
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function PatientAccess() {
  const navigate = useNavigate();

  // Ticket tracking state
  const [ticketInput, setTicketInput] = useState('');
  const [ticketData, setTicketData] = useState(null);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [ticketError, setTicketError] = useState('');

  // Wait times state
  const [waitTimes, setWaitTimes] = useState([]);
  const [waitLoading, setWaitLoading] = useState(true);
  const [waitError, setWaitError] = useState('');

  // Auto-load wait times on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await publicGetWaitTimes();
        if (!cancelled) setWaitTimes(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) setWaitError(err.message || 'Unable to load wait times.');
      } finally {
        if (!cancelled) setWaitLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Track ticket handler
  const handleTrack = async (e) => {
    e?.preventDefault();
    const token = ticketInput.trim();
    if (!token) return;
    setTicketLoading(true);
    setTicketError('');
    setTicketData(null);
    try {
      const data = await publicTrackTicket(token);
      setTicketData(data);
    } catch (err) {
      setTicketError(err.message || 'Ticket not found. Please check the number and try again.');
    } finally {
      setTicketLoading(false);
    }
  };

  // Current step index for the ticket
  const currentStepIdx = ticketData ? (STATUS_STEP_INDEX[ticketData.status] ?? -1) : -1;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">

      {/* ─── Hero Section ─────────────────────────────────────────────── */}
      <header className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-cyan-600 to-sky-500 dark:from-teal-800 dark:via-cyan-900 dark:to-sky-900">
        {/* Decorative blobs */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-teal-400/20 blur-2xl" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center">
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg ring-4 ring-white/10 mb-6">
            <Activity className="w-8 h-8 text-white stroke-[2.5]" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
            Welcome to PulseFlow Patient Portal
          </h1>
          <p className="text-base sm:text-lg text-white/80 max-w-xl mx-auto leading-relaxed">
            Track your visit, check wait times, and stay informed — no login required.
          </p>

          {/* Quick stat pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-sm font-medium text-white">
              <ShieldCheck className="w-4 h-4" /> HIPAA Secured
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-sm font-medium text-white">
              <Clock className="w-4 h-4" /> Real-Time Updates
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-sm font-medium text-white">
              <Heart className="w-4 h-4" /> Patient First
            </span>
          </div>
        </div>
      </header>

      {/* ─── Main Content ─────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 -mt-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Track My Ticket Card ──────────────────────────────────── */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg shadow-slate-200/40 dark:shadow-none overflow-hidden">
            {/* Card header */}
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-md">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Track My Ticket</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Enter your ticket number to see your status</p>
                </div>
              </div>
            </div>

            {/* Search form */}
            <div className="px-6 pb-4">
              <form onSubmit={handleTrack} className="flex gap-2">
                <input
                  type="text"
                  value={ticketInput}
                  onChange={(e) => setTicketInput(e.target.value.toUpperCase())}
                  placeholder="PT-XXXX"
                  aria-label="Ticket number"
                  className="flex-1 min-w-0 px-4 py-3 text-lg font-mono font-semibold tracking-wider rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                />
                <button
                  type="submit"
                  disabled={ticketLoading || !ticketInput.trim()}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-semibold text-sm shadow-md shadow-teal-600/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  {ticketLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  Track
                </button>
              </form>
            </div>

            {/* Error state */}
            {ticketError && (
              <div className="mx-6 mb-4 flex items-start gap-2.5 px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-sm text-rose-700 dark:text-rose-300">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{ticketError}</span>
              </div>
            )}

            {/* Ticket results */}
            {ticketData && (
              <div className="px-6 pb-6 space-y-4">
                {/* Divider */}
                <div className="border-t border-slate-100 dark:border-slate-800" />

                {/* Ticket header */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ticket</span>
                    <p className="text-xl font-extrabold font-mono text-slate-900 dark:text-white tracking-wider">
                      {ticketData.trackingToken || ticketData.token || ticketInput}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border ${STATUS_COLOR[ticketData.status] || DEFAULT_STATUS_COLOR}`}>
                    {STATUS_LABEL[ticketData.status] || ticketData.status}
                  </span>
                </div>

                {/* Quick info grid */}
                <div className="grid grid-cols-2 gap-3">
                  {ticketData.estimatedWait != null && (
                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
                        <Clock className="w-3.5 h-3.5" /> Est. Wait
                      </div>
                      <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                        {ticketData.estimatedWait}<span className="text-sm font-semibold text-slate-400 ml-1">min</span>
                      </p>
                    </div>
                  )}
                  {ticketData.room && (
                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
                        <MapPin className="w-3.5 h-3.5" /> Assigned Room
                      </div>
                      <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                        {ticketData.room}
                      </p>
                    </div>
                  )}
                </div>

                {/* Care pathway progress */}
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Care Pathway</p>
                  <div className="flex items-center gap-0">
                    {CARE_STEPS.map((step, i) => {
                      const isCompleted = i < currentStepIdx;
                      const isCurrent   = i === currentStepIdx;
                      const isUpcoming  = i > currentStepIdx;

                      return (
                        <React.Fragment key={step.key}>
                          {/* Connector line */}
                          {i > 0 && (
                            <div className={`flex-1 h-1 rounded-full transition-colors duration-500 ${
                              isCompleted || isCurrent
                                ? 'bg-teal-400 dark:bg-teal-500'
                                : 'bg-slate-200 dark:bg-slate-700'
                            }`} />
                          )}
                          {/* Step dot */}
                          <div className="flex flex-col items-center gap-1 relative">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-500 ${
                                isCompleted
                                  ? 'bg-teal-500 border-teal-500 text-white'
                                  : isCurrent
                                    ? 'bg-teal-50 dark:bg-teal-950 border-teal-500 text-teal-700 dark:text-teal-300 ring-4 ring-teal-500/20'
                                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                              }`}
                              title={step.label}
                            >
                              {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <span>{step.icon}</span>}
                            </div>
                            <span className={`text-[10px] font-semibold text-center whitespace-nowrap ${
                              isCurrent
                                ? 'text-teal-700 dark:text-teal-300'
                                : isUpcoming
                                  ? 'text-slate-400 dark:text-slate-500'
                                  : 'text-slate-600 dark:text-slate-300'
                            }`}>
                              {step.label}
                            </span>
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* Worsening symptoms alert */}
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-amber-800 dark:text-amber-200">Worsening symptoms?</p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                      If your condition changes, please notify the front desk or any staff member immediately. Your priority will be reassessed.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Live Wait Times Card ──────────────────────────────────── */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg shadow-slate-200/40 dark:shadow-none overflow-hidden">
            {/* Card header */}
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-500 flex items-center justify-center text-white shadow-md">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Live Wait Times</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Current estimated waits by department</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 pb-6">
              {waitLoading && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <p className="text-sm font-medium">Loading wait times…</p>
                </div>
              )}

              {waitError && !waitLoading && (
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-sm text-rose-700 dark:text-rose-300">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{waitError}</span>
                </div>
              )}

              {!waitLoading && !waitError && waitTimes.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500 gap-2">
                  <Clock className="w-8 h-8" />
                  <p className="text-sm font-medium">No department data available.</p>
                </div>
              )}

              {!waitLoading && !waitError && waitTimes.length > 0 && (
                <div className="space-y-3">
                  {waitTimes.map((dept, i) => {
                    const surge = getSurgeBadge(dept.surgeLevel);
                    return (
                      <div
                        key={dept.code || dept.id || i}
                        className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
                      >
                        {/* Department info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 px-2 py-0.5 rounded-md">
                              {dept.code || dept.departmentCode}
                            </span>
                            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${surge.cls}`}>
                              {surge.emoji} {surge.label}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1 truncate">
                            {dept.name || dept.departmentName}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                            {dept.beds != null && (
                              <span className="flex items-center gap-1">
                                <DoorOpen className="w-3.5 h-3.5" />
                                {dept.beds.available ?? dept.bedsAvailable ?? '—'}/{dept.beds.total ?? dept.bedsTotal ?? '—'} beds
                              </span>
                            )}
                            {(dept.bedsAvailable != null && dept.beds == null) && (
                              <span className="flex items-center gap-1">
                                <DoorOpen className="w-3.5 h-3.5" />
                                {dept.bedsAvailable}/{dept.bedsTotal} beds
                              </span>
                            )}
                            {(dept.physicians != null || dept.physicianCount != null) && (
                              <span className="flex items-center gap-1">
                                <Stethoscope className="w-3.5 h-3.5" />
                                {dept.physicians ?? dept.physicianCount} physicians
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Wait time big number */}
                        <div className="text-right shrink-0">
                          <p className="text-3xl font-extrabold text-slate-900 dark:text-white leading-none">
                            {dept.avgWait ?? dept.averageWait ?? '—'}
                          </p>
                          <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-0.5">min avg</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Bottom Section ──────────────────────────────────────────── */}
        <div className="mt-8 space-y-6">

          {/* Full Access CTA */}
          <div className="bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-500 dark:from-teal-800 dark:via-cyan-800 dark:to-sky-800 rounded-2xl p-6 sm:p-8 shadow-lg shadow-teal-600/20 dark:shadow-none">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                <UserCheck className="w-7 h-7 text-white" />
              </div>
              <div className="text-center sm:text-left flex-1">
                <h3 className="text-xl font-bold text-white mb-1">Need Full Access?</h3>
                <p className="text-sm text-white/80">
                  Sign in to check yourself in, view your full medical queue history, and receive personalized notifications.
                </p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-teal-700 font-bold text-sm shadow-md hover:bg-teal-50 transition-colors shrink-0"
              >
                Sign In / Register
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Emergency Info & HIPAA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* When to Seek Emergency Care */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">When to Seek Emergency Care</h3>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                Go to the nearest ER or call <strong className="text-slate-700 dark:text-slate-200">911</strong> immediately if you experience:
              </p>
              <ul className="space-y-2">
                {[
                  { icon: Heart,       text: 'Chest pain or pressure' },
                  { icon: Activity,    text: 'Difficulty breathing or shortness of breath' },
                  { icon: AlertTriangle, text: 'Sudden weakness, numbness, or confusion (stroke signs)' },
                  { icon: AlertTriangle, text: 'Severe uncontrolled bleeding' },
                  { icon: AlertTriangle, text: 'Severe allergic reaction (anaphylaxis)' },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                    <item.icon className="w-4 h-4 text-rose-500 dark:text-rose-400 mt-0.5 shrink-0" />
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* HIPAA & Compliance */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-950/50 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Your Privacy Matters</h3>
              </div>
              <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <p>
                  PulseFlow complies with <strong className="text-slate-700 dark:text-slate-200">HIPAA</strong> (Health Insurance Portability and Accountability Act) and all applicable healthcare privacy regulations.
                </p>
                <p>
                  Ticket tracking uses anonymized tokens — no personal health information is displayed publicly. All data is encrypted in transit and at rest.
                </p>
                <div className="flex items-center gap-2 pt-2 text-xs text-slate-400 dark:text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>45 CFR § 164.312 · SOC 2 Type II · AES-256 Encryption</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-10 text-center">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            © {new Date().getFullYear()} PulseFlow Health Systems · All rights reserved · Protected under HIPAA
          </p>
        </footer>
      </main>
    </div>
  );
}
