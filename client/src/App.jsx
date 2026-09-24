import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.jsx';
import { PatientCallBanner } from './components/PatientCallBanner.jsx';
import { PatientDisplayView } from './components/PatientDisplayView.jsx';
import { StaffTriageView } from './components/StaffTriageView.jsx';
import { AdminOverrideView } from './components/AdminOverrideView.jsx';
import { AnalyticsView } from './components/AnalyticsView.jsx';
import { HipaaComplianceView } from './components/HipaaComplianceView.jsx';
import { getSocket } from './services/socket.js';
import { 
  fetchDepartments, 
  fetchQueue, 
  fetchProviders, 
  fetchRooms, 
  checkInPatient, 
  updatePatientStatus, 
  overridePatientPriority, 
  updateDepartmentSettings,
  simulateArrival,
  resetDatabase
} from './services/api.js';

export default function App() {
  const [activeTab, setActiveTab] = useState('patient');
  const [departments, setDepartments] = useState([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('dept-ed');
  const [patients, setPatients] = useState([]);
  const [providers, setProviders] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const [simulating, setSimulating] = useState(false);

  // Theme Management (Light Clinical vs Dark Telemetry Mode)
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('pulseflow-theme');
      if (stored) return stored;
    }
    return 'light'; // Default to clean hospital clinical daylight mode
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('pulseflow-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Initial Data Fetch & Socket.io listeners
  useEffect(() => {
    Promise.all([
      fetchDepartments(),
      fetchQueue(),
      fetchProviders(),
      fetchRooms(),
    ]).then(([depts, qRes, provs, rms]) => {
      setDepartments(depts || []);
      if (depts && depts.length > 0) {
        setSelectedDepartmentId(depts[0].id);
      }
      setPatients(qRes.data || []);
      setProviders(provs || []);
      setRooms(rms || []);
    }).catch(err => {
      console.error('Initial data fetch failed', err);
    });

    const socket = getSocket();

    const onConnect = () => {
      setSocketConnected(true);
    };

    const onDisconnect = () => {
      setSocketConnected(false);
    };

    const onQueueSync = (payload) => {
      if (payload.departments) setDepartments(payload.departments);
      if (payload.patients) setPatients(payload.patients);
    };

    const onQueueUpdated = (payload) => {
      if (payload.departments) setDepartments(payload.departments);
      if (payload.patients) setPatients(payload.patients);
    };

    const onWaitTimesRecalculated = (payload) => {
      if (payload.departments) setDepartments(payload.departments);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('queue:sync', onQueueSync);
    socket.on('queue:updated', onQueueUpdated);
    socket.on('wait_times:recalculated', onWaitTimesRecalculated);

    if (socket.connected) {
      setSocketConnected(true);
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('queue:sync', onQueueSync);
      socket.off('queue:updated', onQueueUpdated);
      socket.off('wait_times:recalculated', onWaitTimesRecalculated);
    };
  }, []);

  const currentDepartment = departments.find(d => d.id === selectedDepartmentId) || departments[0] || {
    id: 'dept-ed',
    name: 'Emergency Department',
    code: 'ED',
    averageWaitMinutes: 28,
    occupiedBeds: 18,
    totalBeds: 24,
    surgeStatus: 'moderate',
    activePhysicians: 4,
    activeNurses: 8,
  };

  // Actions
  const handleCheckIn = async (data) => {
    return await checkInPatient(data);
  };

  const handleStatusUpdate = async (patientId, payload) => {
    return await updatePatientStatus(patientId, payload);
  };

  const handlePriorityOverride = async (patientId, payload) => {
    return await overridePatientPriority(patientId, payload);
  };

  const handleUpdateDepartment = async (deptId, updates) => {
    return await updateDepartmentSettings(deptId, updates);
  };

  const handleSimulate = async (type) => {
    setSimulating(true);
    try {
      await simulateArrival(type, selectedDepartmentId);
    } catch (err) {
      console.error('Simulation error', err);
    } finally {
      setTimeout(() => setSimulating(false), 800);
    }
  };

  const handleReset = async () => {
    if (confirm('Reset entire hospital queue and departments to initial demo state?')) {
      await resetDatabase();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Real-time Call Banner */}
      <PatientCallBanner />

      {/* Main Header & Navigation */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        departments={departments}
        selectedDepartmentId={selectedDepartmentId}
        onSelectDepartment={setSelectedDepartmentId}
        socketConnected={socketConnected}
        onSimulate={handleSimulate}
        onReset={handleReset}
        simulating={simulating}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'patient' && (
          <PatientDisplayView
            patients={patients}
            department={currentDepartment}
            onCheckInSubmit={handleCheckIn}
          />
        )}

        {activeTab === 'staff' && (
          <StaffTriageView
            patients={patients}
            department={currentDepartment}
            providers={providers}
            rooms={rooms}
            onStatusUpdate={handleStatusUpdate}
            onIntakeSubmit={handleCheckIn}
          />
        )}

        {activeTab === 'admin' && (
          <AdminOverrideView
            patients={patients}
            departments={departments}
            selectedDepartmentId={selectedDepartmentId}
            providers={providers}
            onPriorityOverride={handlePriorityOverride}
            onUpdateDepartment={handleUpdateDepartment}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView />
        )}

        {activeTab === 'hipaa' && (
          <HipaaComplianceView patients={patients} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-900 bg-white/80 dark:bg-slate-950/80 px-6 py-4 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span>PulseFlow Clinical Systems © 2026. St. Jude Health Network. HIPAA Security Rule Compliant.</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <span>WebSocket Live</span>
            <span>•</span>
            <span>ESI Acuity 1-5 Predictive Pipeline</span>
            <span>•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Safe Harbor Protected</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
