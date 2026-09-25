import React, { useState } from 'react';
import { 
  Stethoscope, 
  UserPlus, 
  DoorOpen, 
  Filter, 
  Eye, 
  EyeOff, 
  Bed, 
  X,
  Heart,
  Thermometer,
  Activity,
  Bot
} from 'lucide-react';

export function StaffTriageView({
  patients = [],
  department = {},
  providers = [],
  rooms = [],
  onStatusUpdate,
  onIntakeSubmit,
}) {
  const [filterEsi, setFilterEsi] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showPhiMap, setShowPhiMap] = useState({});
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [assigningPatient, setAssigningPatient] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [aiRationale, setAiRationale] = useState('');

  const [intakeForm, setIntakeForm] = useState({
    legalFullName: '',
    dateOfBirth: '',
    mrn: '',
    chiefComplaint: '',
    esiLevel: 3,
    heartRate: 82,
    bpSystolic: 122,
    bpDiastolic: 78,
    oxygenSat: 98,
    respiratoryRate: 16,
    temperature: 98.6,
    painScore: 5,
  });

  const deptPatients = patients.filter(p => p.departmentId === department.id);
  const deptRooms = rooms.filter(r => r.departmentId === department.id);
  const deptProviders = providers.filter(p => p.departmentId === department.id);

  const filteredPatients = deptPatients.filter(p => {
    if (filterEsi !== 'all' && p.esiLevel !== Number(filterEsi)) return false;
    if (filterStatus === 'waiting' && !['checked_in', 'in_triage', 'triage_completed', 'waiting_for_bed'].includes(p.status)) return false;
    if (filterStatus === 'in_care' && p.status !== 'in_treatment') return false;
    if (filterStatus === 'discharged' && p.status !== 'discharged') return false;
    return true;
  }).sort((a, b) => {
    if (a.status === 'discharged' && b.status !== 'discharged') return 1;
    if (b.status === 'discharged' && a.status !== 'discharged') return -1;
    return b.calculatedPriorityScore - a.calculatedPriorityScore;
  });

  const togglePhi = (patientId) => {
    setShowPhiMap(prev => ({ ...prev, [patientId]: !prev[patientId] }));
  };

  const handleIntakeSubmit = async (e) => {
    e.preventDefault();
    if (!intakeForm.legalFullName || !intakeForm.chiefComplaint) return;

    await onIntakeSubmit({
      legalFullName: intakeForm.legalFullName,
      dateOfBirth: intakeForm.dateOfBirth,
      mrn: intakeForm.mrn,
      departmentId: department.id,
      chiefComplaint: intakeForm.chiefComplaint,
      esiLevel: Number(intakeForm.esiLevel),
      vitals: {
        heartRate: Number(intakeForm.heartRate),
        bloodPressureSystolic: Number(intakeForm.bpSystolic),
        bloodPressureDiastolic: Number(intakeForm.bpDiastolic),
        oxygenSaturation: Number(intakeForm.oxygenSat),
        respiratoryRate: Number(intakeForm.respiratoryRate),
        temperature: Number(intakeForm.temperature),
        painScore: Number(intakeForm.painScore),
      },
    });

    setShowIntakeModal(false);
  };

  const handleAiPredict = async () => {
    if (!intakeForm.chiefComplaint) {
      alert("Please enter a chief complaint first.");
      return;
    }
    setIsPredicting(true);
    setAiRationale('');
    try {
      const response = await fetch('/api/ai/predict-triage', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('pulseflow_token')}`
        },
        body: JSON.stringify({
          chiefComplaint: intakeForm.chiefComplaint,
          vitals: {
            heartRate: Number(intakeForm.heartRate),
            bloodPressureSystolic: Number(intakeForm.bpSystolic),
            bloodPressureDiastolic: Number(intakeForm.bpDiastolic),
            oxygenSaturation: Number(intakeForm.oxygenSat),
            respiratoryRate: Number(intakeForm.respiratoryRate),
            temperature: Number(intakeForm.temperature),
            painScore: Number(intakeForm.painScore),
          }
        })
      });
      const data = await response.json();
      if (data.success && data.data) {
        setIntakeForm(prev => ({ ...prev, esiLevel: data.data.esiLevel }));
        setAiRationale(data.data.rationale);
      } else {
        alert("AI Prediction Failed.");
      }
    } catch (err) {
      console.error(err);
      alert("AI Prediction Error.");
    } finally {
      setIsPredicting(false);
    }
  };

  const getEsiBadge = (level) => {
    switch (level) {
      case 1:
        return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/50 font-extrabold';
      case 2:
        return 'bg-orange-100 text-orange-900 border-orange-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/50 font-bold';
      case 3:
        return 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-500/50 font-semibold';
      case 4:
        return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/50';
      case 5:
        return 'bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-700/40 dark:text-slate-300 dark:border-slate-600';
      default:
        return 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <span>{department.name} — Clinical Triage Station</span>
            </h2>
            <span className="bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-xs px-2.5 py-0.5 rounded font-mono border border-teal-200 dark:border-teal-800 font-semibold">
              Authorized Clinician View
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Active acuity triage management, vital signs tracking, and bay assignments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowIntakeModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Rapid Patient Intake</span>
          </button>
        </div>
      </div>

      {/* Filter and Quick Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-2xs">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Acuity Filter:</span>
          </div>
          <div className="flex gap-1">
            {['all', '1', '2', '3', '4', '5'].map(val => (
              <button
                key={val}
                onClick={() => setFilterEsi(val)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                  filterEsi === val
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {val === 'all' ? 'All ESI' : `ESI ${val}`}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Status:</span>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="all">All Patients ({deptPatients.length})</option>
            <option value="waiting">Waiting Room</option>
            <option value="in_care">In Care / Exam</option>
            <option value="discharged">Discharged</option>
          </select>
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-colors">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredPatients.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
              No patients match the selected filter.
            </div>
          ) : (
            filteredPatients.map((patient) => {
              const isOverridden = patient.isPriorityOverridden;
              const isDischarged = patient.status === 'discharged';
              const showPhi = showPhiMap[patient.id];

              return (
                <div
                  key={patient.id}
                  className={`p-5 transition-colors ${
                    isDischarged
                      ? 'opacity-60 bg-slate-50 dark:bg-slate-950/40'
                      : isOverridden
                      ? 'bg-amber-50/60 dark:bg-amber-950/20 border-l-4 border-amber-500'
                      : patient.esiLevel === 1
                      ? 'bg-red-50/60 dark:bg-red-950/30 border-l-4 border-red-500'
                      : patient.esiLevel === 2
                      ? 'bg-orange-50/50 dark:bg-orange-950/20 border-l-4 border-orange-500'
                      : 'hover:bg-slate-50/60 dark:hover:bg-slate-850'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Patient Core Info */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono text-xl font-extrabold text-slate-900 dark:text-white tracking-wide">
                          {patient.displayToken}
                        </span>

                        <span className={`px-2.5 py-0.5 rounded-full text-xs border ${getEsiBadge(patient.esiLevel)}`}>
                          ESI Level {patient.esiLevel}
                        </span>

                        <span className={`px-2 py-0.5 rounded text-xs font-semibold capitalize ${
                          patient.status === 'in_treatment' ? 'bg-teal-100 text-teal-800 border border-teal-300 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800' :
                          patient.status === 'waiting_for_bed' ? 'bg-indigo-100 text-indigo-800 border border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800' :
                          patient.status === 'in_triage' ? 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800' :
                          patient.status === 'discharged' ? 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400' :
                          'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {patient.status.replace(/_/g, ' ')}
                        </span>

                        {isOverridden && (
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-500/20 dark:border-amber-500/50 dark:text-amber-300 text-[11px] font-bold flex items-center gap-1">
                            <span>⚡ PRIORITY OVERRIDE</span>
                          </span>
                        )}

                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                          Score: <span className="font-bold text-slate-900 dark:text-white">{patient.calculatedPriorityScore}</span>/100
                        </div>
                      </div>

                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {patient.chiefComplaint}
                      </p>

                      {/* Protected Health Info (PHI) toggle */}
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3 flex-wrap">
                        <button
                          onClick={() => togglePhi(patient.id)}
                          className="flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-cyan-400 transition-colors cursor-pointer font-medium"
                        >
                          {showPhi ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          <span>{showPhi ? 'Hide Protected Health Info' : 'Show PHI (Legal Name / MRN)'}</span>
                        </button>

                        {showPhi && patient.phi && (
                          <span className="bg-teal-50 dark:bg-slate-950 px-2.5 py-1 rounded border border-teal-200 dark:border-cyan-800/60 text-teal-900 dark:text-cyan-300 font-mono font-medium animate-in fade-in">
                            {patient.phi.legalFullName} • DOB: {patient.phi.dateOfBirth} • {patient.phi.mrn}
                          </span>
                        )}

                        {patient.assignedRoomName && (
                          <span className="text-teal-700 dark:text-teal-300 font-bold flex items-center gap-1">
                            <DoorOpen className="w-3.5 h-3.5" />
                            {patient.assignedRoomName}
                          </span>
                        )}

                        {patient.assignedProviderName && (
                          <span className="text-slate-600 dark:text-slate-300">
                            MD: {patient.assignedProviderName}
                          </span>
                        )}
                      </div>

                      {/* Vital Signs Grid */}
                      {patient.vitals && (
                        <div className="flex items-center gap-2.5 flex-wrap pt-1 text-xs font-mono">
                          <span className={`px-2 py-0.5 rounded border ${
                            patient.vitals.heartRate > 100 || patient.vitals.heartRate < 55
                              ? 'bg-rose-50 border-rose-300 text-rose-700 dark:bg-slate-950 dark:border-rose-700 dark:text-rose-300 font-bold'
                              : 'bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300'
                          }`}>
                            HR: {patient.vitals.heartRate} bpm
                          </span>

                          <span className={`px-2 py-0.5 rounded border ${
                            patient.vitals.bloodPressureSystolic > 140 || patient.vitals.bloodPressureSystolic < 90
                              ? 'bg-amber-50 border-amber-300 text-amber-800 dark:bg-slate-950 dark:border-amber-700 dark:text-amber-300 font-bold'
                              : 'bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300'
                          }`}>
                            BP: {patient.vitals.bloodPressureSystolic}/{patient.vitals.bloodPressureDiastolic}
                          </span>

                          <span className={`px-2 py-0.5 rounded border ${
                            patient.vitals.oxygenSaturation < 94
                              ? 'bg-rose-50 border-rose-400 text-rose-800 dark:bg-slate-950 dark:border-rose-600 dark:text-rose-300 font-extrabold'
                              : 'bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300'
                          }`}>
                            SpO2: {patient.vitals.oxygenSaturation}%
                          </span>

                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300">
                            Temp: {patient.vitals.temperature}°F
                          </span>

                          <span className={`px-2 py-0.5 rounded border ${
                            patient.vitals.painScore >= 7
                              ? 'bg-orange-50 border-orange-300 text-orange-800 dark:bg-slate-950 dark:border-orange-600 dark:text-orange-300 font-bold'
                              : 'bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300'
                          }`}>
                            Pain: {patient.vitals.painScore}/10
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Right Action Buttons */}
                    {!isDischarged && (
                      <div className="flex flex-wrap lg:flex-col items-end gap-2 shrink-0">
                        <div className="text-right text-xs text-slate-500 dark:text-slate-400 mb-1 hidden lg:block">
                          Est. Wait: <span className="font-bold text-teal-700 dark:text-cyan-400 font-mono text-sm">{patient.estimatedWaitMinutes} min</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {patient.status === 'checked_in' && (
                            <button
                              onClick={() => onStatusUpdate(patient.id, { status: 'in_triage' })}
                              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                            >
                              Call to Triage
                            </button>
                          )}

                          {['checked_in', 'in_triage', 'triage_completed', 'waiting_for_bed'].includes(patient.status) && (
                            <button
                              onClick={() => setAssigningPatient(patient)}
                              className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                            >
                              <DoorOpen className="w-3.5 h-3.5" />
                              <span>Assign Exam Bay</span>
                            </button>
                          )}

                          {patient.status === 'waiting_for_bed' && (
                            <button
                              onClick={() => onStatusUpdate(patient.id, { status: 'in_treatment' })}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                            >
                              Physician In
                            </button>
                          )}

                          {patient.status === 'in_treatment' && (
                            <button
                              onClick={() => onStatusUpdate(patient.id, { status: 'discharged' })}
                              className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                            >
                              Complete Discharge
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Room & Exam Bay Status Matrix */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bed className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Clinical Bays & Suites Status ({deptRooms.length} Total)
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Available
            </span>
            <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Occupied
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {deptRooms.map(room => (
            <div
              key={room.id}
              className={`p-3.5 rounded-xl border text-xs transition-colors ${
                room.status === 'occupied'
                  ? 'bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800/60'
                  : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/50'
              }`}
            >
              <div className="font-bold text-slate-900 dark:text-white">{room.name}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">{room.type}</div>
              <div className="mt-2 font-mono font-bold">
                {room.status === 'occupied' ? (
                  <span className="text-rose-700 dark:text-cyan-300 font-extrabold">{room.currentPatientToken || 'Occupied'}</span>
                ) : (
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Available</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: ASSIGN ROOM / BAY */}
      {assigningPatient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 w-full max-w-md p-6 rounded-2xl shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Assign Exam Bay for {assigningPatient.displayToken}
              </h4>
              <button
                onClick={() => setAssigningPatient(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select an available bay or exam suite. This will immediately trigger the public lobby call banner and audio chime.
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {deptRooms.map(room => (
                <button
                  key={room.id}
                  onClick={async () => {
                    await onStatusUpdate(assigningPatient.id, {
                      status: 'in_treatment',
                      assignedRoomId: room.id,
                      assignedProviderId: deptProviders[0]?.id,
                    });
                    setAssigningPatient(null);
                  }}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-colors cursor-pointer ${
                    room.status === 'occupied'
                      ? 'bg-slate-100 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed'
                      : 'bg-slate-50 hover:bg-teal-50 border-slate-200 dark:bg-slate-950 dark:hover:bg-teal-950/40 dark:border-slate-700 hover:border-teal-500'
                  }`}
                  disabled={room.status === 'occupied'}
                >
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">{room.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{room.type}</div>
                  </div>
                  <div>
                    {room.status === 'occupied' ? (
                      <span className="text-xs text-rose-600 dark:text-rose-400 font-mono">In Use ({room.currentPatientToken})</span>
                    ) : (
                      <span className="text-xs text-teal-600 dark:text-teal-400 font-semibold">Select Bay →</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RAPID CLINICAL INTAKE */}
      {showIntakeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 w-full max-w-lg p-6 rounded-2xl shadow-2xl space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span>Rapid Clinical Intake & Triage</span>
              </h4>
              <button
                onClick={() => setShowIntakeModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIntakeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Legal Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={intakeForm.legalFullName}
                  onChange={e => setIntakeForm({ ...intakeForm, legalFullName: e.target.value })}
                  placeholder="e.g. Johnathan Doe"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">DOB</label>
                  <input
                    type="date"
                    value={intakeForm.dateOfBirth}
                    onChange={e => setIntakeForm({ ...intakeForm, dateOfBirth: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Assigned ESI Level</label>
                  <select
                    value={intakeForm.esiLevel}
                    onChange={e => setIntakeForm({ ...intakeForm, esiLevel: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white font-bold"
                  >
                    <option value={1}>ESI 1 - Resuscitation (Immediate)</option>
                    <option value={2}>ESI 2 - Emergent (High Risk / &lt;15m)</option>
                    <option value={3}>ESI 3 - Urgent (Multiple Resources)</option>
                    <option value={4}>ESI 4 - Less Urgent (1 Resource)</option>
                    <option value={5}>ESI 5 - Non-Urgent (0 Resources)</option>
                  </select>
                  {aiRationale && (
                    <p className="mt-1 text-[10px] text-teal-600 dark:text-teal-400 italic">
                      AI Suggestion: {aiRationale}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Chief Complaint</label>
                <textarea
                  required
                  rows={2}
                  value={intakeForm.chiefComplaint}
                  onChange={e => setIntakeForm({ ...intakeForm, chiefComplaint: e.target.value })}
                  placeholder="Symptoms, onset, severity, allergies..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleAiPredict}
                  disabled={isPredicting}
                  className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white text-xs font-semibold shadow-sm cursor-pointer transition-colors"
                >
                  <Bot className="w-4 h-4" />
                  {isPredicting ? 'Analyzing...' : 'Predict ESI with AI'}
                </button>
              </div>

              {/* Triage Vitals */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Triage Vitals
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Heart Rate</span>
                    <input
                      type="number"
                      value={intakeForm.heartRate}
                      onChange={e => setIntakeForm({ ...intakeForm, heartRate: Number(e.target.value) })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-slate-900 dark:text-white font-mono mt-0.5"
                    />
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400 font-medium">BP Systolic</span>
                    <input
                      type="number"
                      value={intakeForm.bpSystolic}
                      onChange={e => setIntakeForm({ ...intakeForm, bpSystolic: Number(e.target.value) })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-slate-900 dark:text-white font-mono mt-0.5"
                    />
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400 font-medium">BP Diastolic</span>
                    <input
                      type="number"
                      value={intakeForm.bpDiastolic}
                      onChange={e => setIntakeForm({ ...intakeForm, bpDiastolic: Number(e.target.value) })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-slate-900 dark:text-white font-mono mt-0.5"
                    />
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400 font-medium">SpO2 (%)</span>
                    <input
                      type="number"
                      value={intakeForm.oxygenSat}
                      onChange={e => setIntakeForm({ ...intakeForm, oxygenSat: Number(e.target.value) })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-slate-900 dark:text-white font-mono mt-0.5"
                    />
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Temp (°F)</span>
                    <input
                      type="number"
                      step="0.1"
                      value={intakeForm.temperature}
                      onChange={e => setIntakeForm({ ...intakeForm, temperature: Number(e.target.value) })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-slate-900 dark:text-white font-mono mt-0.5"
                    />
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Pain (0-10)</span>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={intakeForm.painScore}
                      onChange={e => setIntakeForm({ ...intakeForm, painScore: Number(e.target.value) })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-slate-900 dark:text-white font-mono mt-0.5"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowIntakeModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-sm cursor-pointer"
                >
                  Save & Insert into Real-time Queue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
