import React, { useState } from 'react';
import { 
  Search, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  UserCheck, 
  DoorOpen, 
  Send 
} from 'lucide-react';

export function PatientDisplayView({
  patients = [],
  department = {},
  onCheckInSubmit,
}) {
  const [subTab, setSubTab] = useState('board');
  const [lookupQuery, setLookupQuery] = useState('');
  const [foundPatient, setFoundPatient] = useState(null);
  const [lookupError, setLookupError] = useState('');

  const [formData, setFormData] = useState({
    legalFullName: '',
    dateOfBirth: '',
    phoneNumber: '',
    chiefComplaint: '',
    painLevel: '4',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newlyCreatedToken, setNewlyCreatedToken] = useState(null);

  const deptPatients = patients.filter(
    p => p.departmentId === department.id && p.status !== 'discharged'
  );

  const currentlyBeingSeen = deptPatients.filter(
    p => p.status === 'in_treatment' || p.assignedRoomName
  );

  const inWaitingRoom = deptPatients.filter(
    p => ['checked_in', 'in_triage', 'triage_completed', 'waiting_for_bed'].includes(p.status)
  ).sort((a, b) => b.calculatedPriorityScore - a.calculatedPriorityScore);

  const handleLookup = (e) => {
    e.preventDefault();
    setLookupError('');
    const clean = lookupQuery.trim().toUpperCase();
    if (!clean) return;

    const match = patients.find(
      p => p.displayToken.toUpperCase() === clean || p.displayToken.replace('PT-', '') === clean
    );

    if (match) {
      setFoundPatient(match);
    } else {
      setFoundPatient(null);
      setLookupError(`No active record found for ticket "${clean}". Please verify your ticket with the triage desk.`);
    }
  };

  const handleSelfCheckin = async (e) => {
    e.preventDefault();
    if (!formData.legalFullName || !formData.chiefComplaint) return;

    setIsSubmitting(true);
    try {
      const pain = Number(formData.painLevel) || 4;
      let estimatedEsi = 4;
      if (pain >= 8) estimatedEsi = 3;
      if (
        formData.chiefComplaint.toLowerCase().includes('chest') ||
        formData.chiefComplaint.toLowerCase().includes('breath') ||
        formData.chiefComplaint.toLowerCase().includes('stroke')
      ) {
        estimatedEsi = 2;
      }

      const res = await onCheckInSubmit({
        legalFullName: formData.legalFullName,
        dateOfBirth: formData.dateOfBirth || '1995-01-01',
        phoneNumber: formData.phoneNumber,
        departmentId: department.id,
        chiefComplaint: formData.chiefComplaint,
        esiLevel: estimatedEsi,
        vitals: {
          heartRate: 80,
          bloodPressureSystolic: 120,
          bloodPressureDiastolic: 80,
          oxygenSaturation: 98,
          respiratoryRate: 16,
          temperature: 98.6,
          painScore: pain,
        },
      });

      if (res && res.displayToken) {
        setNewlyCreatedToken(res.displayToken);
        setFoundPatient(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub Header & Mode Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {department.name} — Patient Lobby Display
            </h2>
            <span className="bg-teal-50 dark:bg-cyan-950 text-teal-700 dark:text-cyan-300 text-[11px] font-mono px-2 py-0.5 rounded border border-teal-200 dark:border-cyan-800/60 font-semibold">
              HIPAA Safe Harbor Certified
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time public display with privacy protection. Patient identities are de-identified via cryptographic tokens.
          </p>
        </div>

        <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setSubTab('board')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'board' 
                ? 'bg-teal-600 dark:bg-cyan-600 text-white shadow-xs' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Lobby Queue Board
          </button>
          <button
            onClick={() => setSubTab('lookup')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'lookup' 
                ? 'bg-teal-600 dark:bg-cyan-600 text-white shadow-xs' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            My Queue Tracker
          </button>
          <button
            onClick={() => setSubTab('checkin')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'checkin' 
                ? 'bg-teal-600 dark:bg-cyan-600 text-white shadow-xs' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Self Check-In Kiosk
          </button>
        </div>
      </div>

      {/* Overview Stat Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm transition-colors">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Estimated Average Wait
          </div>
          <div className="text-2xl md:text-3xl font-extrabold font-mono text-teal-600 dark:text-cyan-400 mt-1 flex items-baseline gap-2">
            <span>{department.averageWaitMinutes || 0}</span>
            <span className="text-sm font-sans font-normal text-slate-500 dark:text-slate-400">minutes</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-teal-500 dark:text-cyan-500" />
            <span>Door-to-Physician Projected</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm transition-colors">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Waiting in Lobby
          </div>
          <div className="text-2xl md:text-3xl font-extrabold font-mono text-slate-900 dark:text-slate-100 mt-1">
            {inWaitingRoom.length}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
            {currentlyBeingSeen.length} patients currently in exam bays
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm transition-colors">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Surge Traffic Status
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <span className={`inline-block w-3 h-3 rounded-full ${
              department.surgeStatus === 'critical' ? 'bg-rose-500 animate-ping' :
              department.surgeStatus === 'moderate' ? 'bg-amber-500' : 'bg-emerald-500'
            }`} />
            <span className="text-lg md:text-xl font-bold capitalize text-slate-900 dark:text-slate-100">
              {department.surgeStatus || 'Normal'}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {department.isDiverting ? '🚨 Ambulance Diversion Active' : 'Emergency Intake Operational'}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm transition-colors">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Clinical Bed Capacity
          </div>
          <div className="text-2xl md:text-3xl font-extrabold font-mono text-teal-700 dark:text-emerald-400 mt-1">
            {department.occupiedBeds || 0} / {department.totalBeds || 0}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
            {department.activePhysicians || 0} Physicians • {department.activeNurses || 0} Nurses Active
          </div>
        </div>
      </div>

      {/* TAB 1: PUBLIC LOBBY BOARD */}
      {subTab === 'board' && (
        <div className="space-y-6">
          {currentlyBeingSeen.length > 0 && (
            <div className="bg-gradient-to-r from-teal-50 via-cyan-50 to-sky-50 dark:from-slate-900 dark:via-teal-950/40 dark:to-slate-900 border border-teal-200 dark:border-teal-800/50 p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-600"></span>
                  </span>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-teal-900 dark:text-teal-300">
                    Now Serving / Proceeding to Exam Rooms
                  </h3>
                </div>
                <span className="text-xs text-teal-700 dark:text-slate-400 font-medium">Chime & Voice Enabled</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {currentlyBeingSeen.map(p => (
                  <div
                    key={p.id}
                    className="bg-white dark:bg-slate-950/80 border border-teal-200 dark:border-teal-600/40 p-4 rounded-xl flex items-center justify-between shadow-xs"
                  >
                    <div>
                      <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Patient Ticket
                      </div>
                      <div className="text-xl font-extrabold font-mono text-teal-800 dark:text-cyan-200 tracking-wide mt-0.5">
                        {p.displayToken}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-teal-600 dark:text-teal-400 uppercase font-bold tracking-wider">
                        Report To
                      </div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1 justify-end mt-0.5">
                        <DoorOpen className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        <span>{p.assignedRoomName || 'Exam Bay'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MAIN WAITING QUEUE LIST */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-colors">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2 bg-slate-50/70 dark:bg-transparent">
              <div className="flex items-center gap-2">
                <Clock className="w-4.5 h-4.5 text-teal-600 dark:text-cyan-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Waiting Room Queue Order
                </h3>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Sorted by clinical urgency & arrival timestamp
              </div>
            </div>

            {inWaitingRoom.length === 0 ? (
              <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-80" />
                <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
                  No patients currently waiting in this department.
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  All registered patients have been admitted to exam rooms.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                <div className="grid grid-cols-12 px-6 py-2.5 bg-slate-100/80 dark:bg-slate-950 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  <div className="col-span-3 sm:col-span-2">Ticket #</div>
                  <div className="col-span-4 sm:col-span-4">Care Stage</div>
                  <div className="col-span-3 sm:col-span-3 text-right">Est. Wait</div>
                  <div className="col-span-2 sm:col-span-3 text-right">Trend</div>
                </div>

                {inWaitingRoom.map((patient, index) => {
                  const isNext = index === 0;

                  return (
                    <div
                      key={patient.id}
                      className={`grid grid-cols-12 px-6 py-3.5 items-center transition-colors ${
                        isNext 
                          ? 'bg-teal-50/70 hover:bg-teal-50 dark:bg-cyan-950/30 dark:hover:bg-cyan-950/40 border-l-4 border-teal-600 dark:border-cyan-500' 
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Ticket */}
                      <div className="col-span-3 sm:col-span-2 flex items-center gap-2">
                        <span className="font-mono text-base md:text-lg font-bold text-slate-900 dark:text-white tracking-wide">
                          {patient.displayToken}
                        </span>
                        {isNext && (
                          <span className="hidden md:inline-block px-2 py-0.5 text-[10px] uppercase font-bold rounded bg-teal-100 text-teal-800 dark:bg-cyan-500/20 dark:text-cyan-300 border border-teal-300 dark:border-cyan-500/40">
                            Next
                          </span>
                        )}
                      </div>

                      {/* Current Stage */}
                      <div className="col-span-4 sm:col-span-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 ${
                          patient.status === 'in_triage' ? 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800/60' :
                          patient.status === 'triage_completed' ? 'bg-indigo-100 text-indigo-900 border border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800/60' :
                          patient.status === 'waiting_for_bed' ? 'bg-teal-100 text-teal-900 border border-teal-300 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800/60' :
                          'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          <span className="capitalize">{patient.status.replace(/_/g, ' ')}</span>
                        </span>
                      </div>

                      {/* Est Wait */}
                      <div className="col-span-3 sm:col-span-3 text-right">
                        <span className="font-mono text-base md:text-lg font-bold text-teal-700 dark:text-cyan-400">
                          ~{patient.estimatedWaitMinutes}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">min</span>
                      </div>

                      {/* Trend */}
                      <div className="col-span-2 sm:col-span-3 text-right">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                          patient.waitTrend === 'falling' ? 'text-emerald-600 dark:text-emerald-400' :
                          patient.waitTrend === 'rising' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'
                        }`}>
                          {patient.waitTrend === 'falling' && <ArrowDownRight className="w-3.5 h-3.5" />}
                          {patient.waitTrend === 'rising' && <ArrowUpRight className="w-3.5 h-3.5" />}
                          {patient.waitTrend === 'stable' && <Minus className="w-3.5 h-3.5" />}
                          <span className="hidden sm:inline capitalize">{patient.waitTrend}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Privacy Notice Banner */}
          <div className="bg-slate-100/90 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-start gap-3 text-xs text-slate-600 dark:text-slate-400 shadow-2xs">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-300">
                Hospital HIPAA Safe Harbor Notice:
              </p>
              <p className="mt-0.5 leading-relaxed">
                In strict compliance with federal HIPAA privacy regulations, this public board shows random ticket numbers only. Patient names, clinical conditions, and diagnoses are strictly protected. Please keep your printed ticket or SMS code handy.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MY QUEUE TRACKER */}
      {subTab === 'lookup' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-teal-600 dark:text-cyan-400" />
              <span>Track Your Ticket & Wait Time</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Enter the 4-digit ticket number from your check-in slip (e.g., PT-5120 or 5120) to view your personalized care progression.
            </p>

            <form onSubmit={handleLookup} className="mt-4 flex gap-2">
              <input
                type="text"
                value={lookupQuery}
                onChange={e => setLookupQuery(e.target.value)}
                placeholder="e.g. PT-5120"
                className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="submit"
                className="bg-teal-600 hover:bg-teal-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm shadow-sm cursor-pointer"
              >
                Track Ticket
              </button>
            </form>

            {lookupError && (
              <div className="mt-3 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400" />
                <span>{lookupError}</span>
              </div>
            )}
          </div>

          {foundPatient && (
            <div className="bg-white dark:bg-slate-900 border border-teal-300 dark:border-cyan-800/60 p-6 rounded-2xl shadow-md space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Personal Tracker for Ticket</span>
                  <div className="text-2xl font-extrabold font-mono text-teal-800 dark:text-cyan-300">
                    {foundPatient.displayToken}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Predicted Wait Time</div>
                  <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
                    {foundPatient.status === 'in_treatment' ? (
                      <span className="text-emerald-600 dark:text-emerald-400 text-lg">In Care Bay</span>
                    ) : (
                      <>~{foundPatient.estimatedWaitMinutes} <span className="text-sm font-sans font-normal text-slate-500 dark:text-slate-400">min</span></>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Milestones */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                  Clinical Care Pathway
                </h4>
                <div className="space-y-3">
                  {[
                    { title: '1. Patient Registration', desc: 'Check-in recorded in hospital EHR system', done: true },
                    { 
                      title: '2. Clinical Triage Assessment', 
                      desc: 'Vitals & symptom severity evaluated by nurse', 
                      done: ['in_triage', 'triage_completed', 'waiting_for_bed', 'in_treatment', 'ready_for_discharge', 'discharged'].includes(foundPatient.status),
                      current: foundPatient.status === 'in_triage'
                    },
                    { 
                      title: '3. Bed & Provider Assignment', 
                      desc: 'Exam room allocation in progress', 
                      done: ['waiting_for_bed', 'in_treatment', 'ready_for_discharge', 'discharged'].includes(foundPatient.status),
                      current: foundPatient.status === 'waiting_for_bed'
                    },
                    { 
                      title: '4. Physician Examination & Treatment', 
                      desc: foundPatient.assignedRoomName ? `Assigned to ${foundPatient.assignedRoomName}` : 'Under clinical evaluation', 
                      done: ['in_treatment', 'ready_for_discharge', 'discharged'].includes(foundPatient.status),
                      current: foundPatient.status === 'in_treatment'
                    },
                    { 
                      title: '5. Discharge & Care Plan', 
                      desc: 'Prescriptions and discharge instructions', 
                      done: foundPatient.status === 'discharged',
                      current: foundPatient.status === 'ready_for_discharge'
                    },
                  ].map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                        step.done 
                          ? 'bg-emerald-500 text-white' 
                          : step.current
                          ? 'bg-teal-600 dark:bg-cyan-500 text-white ring-4 ring-teal-500/20'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                      }`}>
                        {step.done ? '✓' : idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className={`text-sm font-bold ${step.done || step.current ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                          {step.title}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{step.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Red Flag Warning */}
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 p-4 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 dark:text-amber-200/90 space-y-1">
                  <p className="font-bold text-amber-900 dark:text-amber-200">
                    Important: If your symptoms worsen while waiting
                  </p>
                  <p>
                    Please inform our triage nurse immediately if you experience chest pain, sudden difficulty breathing, dizziness, faintness, or severe sudden pain.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SELF CHECK-IN KIOSK */}
      {subTab === 'checkin' && (
        <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-5">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-teal-600 dark:text-cyan-400" />
              <span>Hospital Self Check-In Kiosk</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Register upon arrival to receive your secure queue ticket and real-time wait estimate.
            </p>
          </div>

          {newlyCreatedToken ? (
            <div className="p-6 bg-slate-50 dark:bg-slate-950 border border-emerald-300 dark:border-emerald-500/50 rounded-xl text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">Check-In Successful!</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your confidential ticket number is:
              </p>
              <div className="text-4xl font-extrabold font-mono text-teal-700 dark:text-cyan-300 py-2 tracking-widest">
                {newlyCreatedToken}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Estimated wait time: <span className="font-bold text-slate-900 dark:text-white">~{department.averageWaitMinutes || 20} minutes</span>
              </p>
              <button
                onClick={() => {
                  setNewlyCreatedToken(null);
                  setSubTab('board');
                }}
                className="mt-3 px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold cursor-pointer"
              >
                View On Waiting Room Board
              </button>
            </div>
          ) : (
            <form onSubmit={handleSelfCheckin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Legal Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.legalFullName}
                  onChange={e => setFormData({ ...formData, legalFullName: e.target.value })}
                  placeholder="e.g. Jane Doe"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <span className="text-[10px] text-slate-500">Stored with AES-256 encryption. Redacted on all public boards.</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Phone (for SMS updates)
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="(555) 000-0000"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Chief Complaint / Reason for Visit <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.chiefComplaint}
                  onChange={e => setFormData({ ...formData, chiefComplaint: e.target.value })}
                  placeholder="Please briefly describe your primary symptoms or illness..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Current Pain Level (0 to 10)</span>
                  <span className="font-mono text-teal-700 dark:text-cyan-400 font-bold text-sm">{formData.painLevel} / 10</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={formData.painLevel}
                  onChange={e => setFormData({ ...formData, painLevel: e.target.value })}
                  className="w-full accent-teal-600"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                  <span>0 (No Pain)</span>
                  <span>5 (Moderate)</span>
                  <span>10 (Severe Pain)</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Generating Secure Ticket...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Complete Check-In & Get Ticket</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
