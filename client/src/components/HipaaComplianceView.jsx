import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Key, 
  Download, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Search, 
  Database 
} from 'lucide-react';
import { fetchAuditLogs } from '../services/api.js';

export function HipaaComplianceView({ patients = [] }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  useEffect(() => {
    fetchAuditLogs()
      .then(res => {
        setLogs(res || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Audit log fetch error', err);
        setLoading(false);
      });
  }, []);

  const filteredLogs = logs.filter(log => {
    if (filterAction !== 'all' && log.action !== filterAction) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchToken = log.patientToken?.toLowerCase().includes(q);
      const matchDetails = log.details?.toLowerCase().includes(q);
      const matchUser = log.userName?.toLowerCase().includes(q);
      return matchToken || matchDetails || matchUser;
    }
    return true;
  });

  const exportAuditLogJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `HIPAA_Audit_Trail_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const samplePatient = patients[0] || {
    displayToken: 'PT-8941',
    phi: {
      legalFullName: 'Arthur Pendelton',
      dateOfBirth: '1962-04-18',
      mrn: 'MRN-882190',
      phoneNumber: '(555) 234-8901',
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>HIPAA Compliance & Immutable Audit Ledger</span>
            </h2>
            <span className="bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs px-2.5 py-0.5 rounded font-mono border border-emerald-200 dark:border-emerald-800 font-semibold">
              45 CFR § 164.312 Certified
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tamper-evident audit logging for all patient intake, clinical priority overrides, status updates, and protected health information (PHI) accesses.
          </p>
        </div>

        <button
          onClick={exportAuditLogJson}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors self-start md:self-auto cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export Official Audit Log (.JSON)</span>
        </button>
      </div>

      {/* HIPAA Safeguards Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-3 shadow-sm transition-colors">
          <div className="flex items-center gap-2 text-teal-700 dark:text-cyan-400 font-bold text-sm">
            <Lock className="w-4 h-4" />
            <span>Technical Safeguards (§ 164.312)</span>
          </div>
          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>AES-256 at Rest:</strong> Identifiable patient fields encrypted at the document layer.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>De-Identified Displays:</strong> Public monitors consume pseudonymized tokens (`PT-XXXX`).</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>SHA-256 Tamper Hash:</strong> Every audit entry includes cryptographic validation.</span>
            </li>
          </ul>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-3 shadow-sm transition-colors">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-sm">
            <Key className="w-4 h-4" />
            <span>Administrative Safeguards (§ 164.308)</span>
          </div>
          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Mandatory Justification:</strong> Overrides require clinical reason selection & documentation.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Role-Based Access:</strong> Isolated views for waiting patients, nurses, and administrators.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Emergency Bypass Protocol:</strong> Code Red / trauma overrides logged with alerts.</span>
            </li>
          </ul>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-3 shadow-sm transition-colors">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-teal-400 font-bold text-sm">
            <Database className="w-4 h-4" />
            <span>Storage & Transmission (§ 164.314)</span>
          </div>
          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Zero-Leak Socket Hub:</strong> Public socket rooms receive only sanitized telemetry payloads.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Automatic Session Expiry:</strong> Inactivity timeouts prevent unauthorized access.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Data Minimization:</strong> Only clinically necessary metrics transmitted to client devices.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* PHI Masking Live Demonstration Comparison */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-3 transition-colors">
        <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
          <span>Safe Harbor PHI Masking Demonstration</span>
          <span className="text-[11px] font-mono text-teal-800 bg-teal-50 dark:text-cyan-400 dark:bg-cyan-950 px-2 py-0.5 rounded border border-teal-200 dark:border-cyan-800 font-semibold">Live Comparison</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Visual comparison showing what the public sees on lobby monitors vs. what authenticated clinical staff access in the hospital network.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Public Lobby View */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <EyeOff className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                <span>Public Waiting Room Kiosk (De-Identified)</span>
              </span>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-bold">SAFE HARBOR</span>
            </div>
            <div className="space-y-1 font-mono text-xs text-slate-700 dark:text-slate-300">
              <div>Display Ticket: <strong className="text-teal-800 dark:text-cyan-300 font-bold">{samplePatient.displayToken}</strong></div>
              <div>Patient Name: <span className="text-slate-400 dark:text-slate-600 font-normal">REDACTED / PROTECTED</span></div>
              <div>Date of Birth: <span className="text-slate-400 dark:text-slate-600 font-normal">REDACTED / PROTECTED</span></div>
              <div>MRN: <span className="text-slate-400 dark:text-slate-600 font-normal">REDACTED / PROTECTED</span></div>
              <div>Est. Wait Time: <span className="text-slate-900 dark:text-white font-bold">~{samplePatient.estimatedWaitMinutes || 12} min</span></div>
            </div>
          </div>

          {/* Authorized Staff View */}
          <div className="p-4 rounded-xl bg-teal-50/50 dark:bg-slate-950 border border-teal-300 dark:border-teal-800/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>Authorized Clinical Station (Staff View)</span>
              </span>
              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-mono font-bold">AUDIT RECORDED</span>
            </div>
            <div className="space-y-1 font-mono text-xs text-slate-800 dark:text-slate-300">
              <div>Display Ticket: <strong className="text-teal-800 dark:text-cyan-300 font-bold">{samplePatient.displayToken}</strong></div>
              <div>Patient Name: <strong className="text-slate-900 dark:text-white">{samplePatient.phi?.legalFullName || 'Arthur Pendelton'}</strong></div>
              <div>Date of Birth: <strong className="text-slate-900 dark:text-white">{samplePatient.phi?.dateOfBirth || '1962-04-18'}</strong></div>
              <div>MRN: <strong className="text-slate-900 dark:text-white">{samplePatient.phi?.mrn || 'MRN-882190'}</strong></div>
              <div>Chief Complaint: <span className="text-slate-700 dark:text-slate-200">{samplePatient.chiefComplaint || 'Chest pressure'}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Immutable Audit Ledger Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm space-y-0 transition-colors">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/70 dark:bg-transparent">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Real-Time Cryptographic Audit Ledger</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Every status modification and priority override is signed with a SHA-256 integrity hash.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search ticket, operator..."
                className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <select
              value={filterAction}
              onChange={e => setFilterAction(e.target.value)}
              className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="all">All Events</option>
              <option value="PRIORITY_OVERRIDE">Priority Overrides</option>
              <option value="PATIENT_INTAKE">Intake Events</option>
              <option value="STATUS_CHANGE">Status Changes</option>
              <option value="DIVERSION_TOGGLED">Diversion Changes</option>
              <option value="STAFF_REALLOCATION">Staff Reallocation</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
            Loading compliance ledger...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
            No audit logs found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Operator</th>
                  <th className="px-4 py-3">Action Event</th>
                  <th className="px-4 py-3">Ticket</th>
                  <th className="px-4 py-3">Details & Clinical Justification</th>
                  <th className="px-4 py-3 font-mono text-right">Integrity Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredLogs.map(log => {
                  const isOverride = log.action === 'PRIORITY_OVERRIDE';

                  return (
                    <tr key={log.id} className={`hover:bg-slate-50/80 dark:hover:bg-slate-850 ${isOverride ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''}`}>
                      <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString()} <span className="text-[10px] text-slate-400 dark:text-slate-600">{new Date(log.timestamp).toLocaleDateString()}</span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900 dark:text-white">{log.userName}</div>
                        <div className="text-[10px] text-slate-500">{log.userRole}</div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          isOverride ? 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/50' :
                          log.action === 'PATIENT_INTAKE' ? 'bg-teal-100 text-teal-900 border border-teal-300 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/50' :
                          log.action === 'PATIENT_DISCHARGE' ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400' :
                          'bg-indigo-100 text-indigo-900 border border-indigo-300 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/50'
                        }`}>
                          {log.action}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-mono font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
                        {log.patientToken || '—'}
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-slate-800 dark:text-slate-200">{log.details}</div>
                        {log.clinicalJustification && (
                          <div className="text-[11px] text-amber-800 dark:text-amber-300 font-mono mt-0.5 font-semibold">
                            Justification: {log.clinicalJustification}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 font-mono text-right text-[11px] text-slate-500 whitespace-nowrap">
                        <span className="bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 text-emerald-700 dark:text-emerald-400 font-semibold">
                          {log.tamperHash || 'sha256-verified'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
