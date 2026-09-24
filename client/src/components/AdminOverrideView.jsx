import React, { useState } from 'react';
import { 
  Sliders, 
  CheckCircle, 
  Ambulance, 
  Users, 
  ShieldAlert, 
  RotateCcw, 
  Zap, 
  TrendingDown,
  X
} from 'lucide-react';

export function AdminOverrideView({
  patients = [],
  departments = [],
  selectedDepartmentId,
  providers = [],
  onPriorityOverride,
  onUpdateDepartment,
}) {
  const currentDept = departments.find(d => d.id === selectedDepartmentId) || departments[0] || {};
  const deptPatients = patients.filter(
    p => p.departmentId === currentDept.id && p.status !== 'discharged'
  ).sort((a, b) => b.calculatedPriorityScore - a.calculatedPriorityScore);

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [overrideScore, setOverrideScore] = useState(98);
  const [overrideEsi, setOverrideEsi] = useState(1);
  const [justificationCategory, setJustificationCategory] = useState('Acute Clinical Deterioration');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const [physicianAdjustment, setPhysicianAdjustment] = useState(currentDept.activePhysicians || 4);
  const [nurseAdjustment, setNurseAdjustment] = useState(currentDept.activeNurses || 8);

  const handleOpenOverride = (patient) => {
    setSelectedPatient(patient);
    setOverrideScore(98);
    setOverrideEsi(Math.max(1, patient.esiLevel - 1));
    setJustificationCategory('Acute Clinical Deterioration');
    setClinicalNotes('');
  };

  const handleApplyOverride = async (e) => {
    e.preventDefault();
    if (!selectedPatient || !clinicalNotes) return;

    setIsSubmitting(true);
    try {
      await onPriorityOverride(selectedPatient.id, {
        overrideScore,
        overrideEsi,
        reason: clinicalNotes,
        justificationCategory,
      });

      setFeedbackMsg(`Priority override applied for ${selectedPatient.displayToken}. Queue order updated in real time.`);
      setTimeout(() => setFeedbackMsg(null), 5000);
      setSelectedPatient(null);
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPriority = async (patient) => {
    if (!confirm(`Reset priority override for ${patient.displayToken} back to natural clinical ESI score?`)) return;

    await onPriorityOverride(patient.id, {
      reason: 'Clinical stability restored, reverting to natural ESI wait sequence',
      justificationCategory: 'De-escalation / Normalization',
    });

    setFeedbackMsg(`Restored ${patient.displayToken} to natural ESI priority.`);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleToggleDiversion = async () => {
    const newStatus = !currentDept.isDiverting;
    const confirmMsg = newStatus
      ? `Activate AMBULANCE DIVERSION for ${currentDept.name}? Inbound emergency EMS will be redirected to neighboring facilities.`
      : `Re-open ${currentDept.name} to inbound EMS ambulances?`;

    if (confirm(confirmMsg)) {
      await onUpdateDepartment(currentDept.id, { isDiverting: newStatus });
    }
  };

  const handleSaveStaffing = async () => {
    await onUpdateDepartment(currentDept.id, {
      activePhysicians: physicianAdjustment,
      activeNurses: nurseAdjustment,
    });
    setFeedbackMsg(`Updated clinical staffing for ${currentDept.name}. Predictive wait times recalculated.`);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span>Admin Queue Control & Clinical Override Console</span>
            </h2>
            <span className="bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs px-2.5 py-0.5 rounded font-mono border border-amber-200 dark:border-amber-800 font-semibold">
              Clinical Leadership Privilege
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manual priority elevation, EMS diversion controls, and clinical resource reallocation with mandatory HIPAA audit tracking.
          </p>
        </div>

        {/* Ambulance Diversion Quick Action */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleDiversion}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
              currentDept.isDiverting
                ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                : 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-300 dark:bg-slate-800 dark:hover:bg-rose-950 dark:hover:text-rose-300 dark:text-slate-300 dark:border-slate-700'
            }`}
          >
            <Ambulance className="w-4 h-4" />
            <span>{currentDept.isDiverting ? 'DIVERSION ACTIVE (EMS Redirected)' : 'Divert Inbound Ambulances'}</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-300 text-sm font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Main Grid: Priority Override Queue + Traffic & Staffing Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Manual Priority Override Queue Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-colors">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-transparent">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Active Waiting Queue Priority Table</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Override priority score to immediately bump critical patients to the front of the line.
                </p>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono font-semibold">
                {deptPatients.length} Active Patients
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {deptPatients.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                  No active patients in queue.
                </div>
              ) : (
                deptPatients.map((patient, index) => {
                  const isOverridden = patient.isPriorityOverridden;

                  return (
                    <div
                      key={patient.id}
                      className={`p-4 flex items-center justify-between gap-4 transition-colors ${
                        isOverridden
                          ? 'bg-amber-50/70 dark:bg-amber-950/20 border-l-4 border-amber-500'
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-850'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono text-slate-400 dark:text-slate-500 w-6 font-bold">
                          #{index + 1}
                        </span>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-base font-extrabold text-slate-900 dark:text-white">
                              {patient.displayToken}
                            </span>
                            <span className={`px-2 py-0.2 rounded text-[11px] font-bold border ${
                              patient.esiLevel === 1 ? 'bg-red-100 text-red-800 border-red-300 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/50' :
                              patient.esiLevel === 2 ? 'bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/50' :
                              patient.esiLevel === 3 ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-500/50' :
                              'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/50'
                            }`}>
                              ESI {patient.esiLevel}
                            </span>
                            {isOverridden && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-500/30 dark:text-amber-200 dark:border-amber-500/60 animate-pulse">
                                OVERRIDDEN
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 line-clamp-1 font-medium">
                            {patient.chiefComplaint}
                          </p>
                          {isOverridden && patient.overrideReason && (
                            <p className="text-[11px] text-amber-800 dark:text-amber-300/80 font-mono mt-0.5 font-semibold">
                              Justification: {patient.overrideReason}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Priority Score</div>
                          <div className="text-lg font-bold font-mono text-teal-700 dark:text-cyan-400">
                            {patient.calculatedPriorityScore}
                          </div>
                        </div>

                        <div className="text-right hidden sm:block">
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Est. Wait</div>
                          <div className="text-sm font-mono text-slate-800 dark:text-white font-bold">
                            {patient.status === 'in_treatment' ? 'In Care' : `${patient.estimatedWaitMinutes}m`}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isOverridden ? (
                            <button
                              onClick={() => handleResetPriority(patient)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer border border-slate-300 dark:border-transparent"
                              title="Reset back to natural ESI priority"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                              <span className="hidden sm:inline">Reset</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenOverride(patient)}
                              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                            >
                              <Zap className="w-3.5 h-3.5" />
                              <span>Override</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Staff Allocation & Traffic Management */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4 transition-colors">
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Dynamic Staff Allocation</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Adjust active staff to relieve queue bottlenecks</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Active On-Duty Physicians</span>
                  <span className="font-mono text-indigo-700 dark:text-indigo-300 font-bold">{physicianAdjustment} MDs</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPhysicianAdjustment(Math.max(1, physicianAdjustment - 1))}
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={physicianAdjustment}
                    onChange={e => setPhysicianAdjustment(Number(e.target.value))}
                    className="flex-1 accent-indigo-600"
                  />
                  <button
                    onClick={() => setPhysicianAdjustment(Math.min(10, physicianAdjustment + 1))}
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Active Triage / Bed Nurses</span>
                  <span className="font-mono text-teal-700 dark:text-teal-300 font-bold">{nurseAdjustment} RNs</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setNurseAdjustment(Math.max(1, nurseAdjustment - 1))}
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min="1"
                    max="16"
                    value={nurseAdjustment}
                    onChange={e => setNurseAdjustment(Number(e.target.value))}
                    className="flex-1 accent-teal-600"
                  />
                  <button
                    onClick={() => setNurseAdjustment(Math.min(16, nurseAdjustment + 1))}
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={handleSaveStaffing}
                className="w-full mt-2 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                Apply Staffing & Recalculate
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
              <div className="font-bold text-slate-800 dark:text-slate-300 flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Predictive Impact Engine</span>
              </div>
              <p>
                Each added physician decreases wait times by an estimated <span className="text-slate-900 dark:text-white font-bold">14-22%</span> under current queue depth.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl text-xs text-slate-600 dark:text-slate-400 space-y-2 shadow-sm transition-colors">
            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-200 font-bold">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>HIPAA § 164.312 Audit Requirement</span>
            </div>
            <p className="leading-relaxed">
              Manual priority overrides are strictly monitored. Clinical justifications and operator identity are logged to the immutable audit ledger with cryptographic hashes.
            </p>
          </div>
        </div>
      </div>

      {/* MODAL: MANUAL PRIORITY OVERRIDE DIALOG */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-600/50 w-full max-w-lg p-6 rounded-2xl shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Manual Priority Override — {selectedPatient.displayToken}
                </h4>
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyOverride} className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                <span className="text-slate-500 dark:text-slate-400">Chief Complaint:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                  {selectedPatient.chiefComplaint}
                </p>
                <div className="flex gap-4 mt-2 text-slate-600 dark:text-slate-400">
                  <span>Current ESI: <strong className="text-slate-900 dark:text-white">{selectedPatient.esiLevel}</strong></span>
                  <span>Current Score: <strong className="text-slate-900 dark:text-white">{selectedPatient.calculatedPriorityScore}</strong></span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <span>New Priority Score (1-100)</span>
                  <span className="font-mono text-amber-600 dark:text-amber-400 font-bold text-sm">
                    {overrideScore} / 100 {overrideScore >= 95 ? '(Immediate Top Priority)' : ''}
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={overrideScore}
                  onChange={e => setOverrideScore(Number(e.target.value))}
                  className="w-full accent-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Elevated Clinical Acuity Tier
                </label>
                <select
                  value={overrideEsi}
                  onChange={e => setOverrideEsi(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white font-bold"
                >
                  <option value={1}>ESI 1 - Resuscitation (Code Red / Bypass All)</option>
                  <option value={2}>ESI 2 - Emergent (&lt;15 min Target)</option>
                  <option value={3}>ESI 3 - Urgent Priority</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mandatory Clinical Justification <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={justificationCategory}
                  onChange={e => setJustificationCategory(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white font-medium"
                >
                  <option value="Acute Clinical Deterioration">Acute Clinical Deterioration (Vitals / Sensorium)</option>
                  <option value="Direct EMS / Trauma Inbound">Direct EMS / Trauma Inbound Activation</option>
                  <option value="Pediatric High Risk">Pediatric High Risk / Febrile Infancy</option>
                  <option value="Infection / Airborne Isolation">Infection / Airborne Precaution Isolation</option>
                  <option value="Attending Physician Discretion">Attending Physician Discretion</option>
                  <option value="Code Sepsis / STEMI / Stroke">Code Sepsis / STEMI / Stroke Alert</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Clinical Rationale & Notes <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={clinicalNotes}
                  onChange={e => setClinicalNotes(e.target.value)}
                  placeholder="State specific medical findings justifying priority elevation for compliance review..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedPatient(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !clinicalNotes}
                  className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold shadow-sm cursor-pointer"
                >
                  {isSubmitting ? 'Recording Audit...' : 'Execute Priority Override'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
