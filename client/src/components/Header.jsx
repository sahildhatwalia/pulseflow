import React from 'react';
import { 
  Activity, 
  Tv, 
  Stethoscope, 
  Sliders, 
  BarChart3, 
  ShieldCheck, 
  WifiOff, 
  Ambulance, 
  UserPlus, 
  RotateCcw,
  Sun,
  Moon,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { logoutUser } from '../services/api.js';

export function Header({
  activeTab,
  onTabChange,
  departments = [],
  selectedDepartmentId,
  onSelectDepartment,
  socketConnected,
  onSimulate,
  onReset,
  simulating,
  theme = 'dark',
  onToggleTheme,
}) {
  const currentDept = departments.find(d => d.id === selectedDepartmentId);
  const isDark = theme === 'dark';
  
  let user = null;
  try {
    const userStr = localStorage.getItem('pulseflow_user');
    if (userStr) user = JSON.parse(userStr);
  } catch (e) {}

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur sticky top-0 z-40 transition-colors shadow-sm dark:shadow-none">
      {/* Top Banner: Clinical Status & Real-time Indicator */}
      <div className="px-4 py-1.5 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-100/90 dark:bg-slate-950/70 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 flex-wrap gap-2 transition-colors">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
            <span className="inline-block w-2 h-2 rounded-full bg-teal-500 dark:bg-cyan-400 animate-pulse"></span>
            <span>PulseFlow Clinical Queue Engine v2.4</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
          <div className="hidden sm:flex items-center gap-1">
            <span className="text-slate-500 dark:text-slate-400">Hospital:</span>
            <span className="text-slate-800 dark:text-slate-200 font-semibold">St. Jude Metropolitan Academic Health</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700 hidden md:inline">•</span>
          <span className="hidden md:inline bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 px-2 py-0.5 rounded text-[11px] font-mono">
            HIPAA Safeguard Level 3 Active
          </span>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 transition-all shadow-xs cursor-pointer"
            title={`Switch to ${isDark ? 'Daytime Clinical Light Mode' : 'Telemetry Dark Night Mode'}`}
          >
            {isDark ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Dark Mode</span>
              </>
            )}
          </button>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-300 dark:border-slate-700">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300">
              <UserIcon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{user?.name || 'Staff'}</span>
            </div>
            <button
              onClick={logoutUser}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-rose-900/30 dark:hover:border-rose-800 dark:text-slate-300 dark:hover:text-rose-400 text-slate-600 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
              title="Sign Out to switch accounts"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>

          {/* Socket.io Live Status */}
          <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
            socketConnected 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60' 
              : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/60'
          }`}>
            {socketConnected ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-mono">Socket.io LIVE</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-rose-500 dark:text-rose-400" />
                <span className="font-mono">Reconnecting...</span>
              </>
            )}
          </div>

          {/* Quick Real-Time Simulator Triggers - Hidden for Patients */}
          {user?.role !== 'Patient' && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onSimulate('ambulance')}
                disabled={simulating}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 dark:bg-rose-950/80 dark:hover:bg-rose-900 dark:border-rose-700/60 dark:text-rose-200 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                title="Simulate inbound critical ambulance (ESI 1) to test real-time Socket.io push"
              >
                <Ambulance className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span className="hidden sm:inline">+ EMS Ambulance</span>
              </button>
              <button
                onClick={() => onSimulate('walkin')}
                disabled={simulating}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 dark:bg-amber-950/80 dark:hover:bg-amber-900 dark:border-amber-700/60 dark:text-amber-200 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                title="Simulate walk-in emergent patient (ESI 2)"
              >
                <UserPlus className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span className="hidden sm:inline">+ Walk-in</span>
              </button>
              <button
                onClick={onReset}
                className="p-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer"
                title="Reset system to initial seed data"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Bar */}
      <div className="px-4 py-3 max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 via-cyan-600 to-sky-500 flex items-center justify-center shadow-md shadow-teal-500/20 ring-1 ring-white/20">
            <Activity className="w-6 h-6 text-white stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
                PulseFlow
              </h1>
              <span className="text-xs bg-teal-50 text-teal-700 border border-teal-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800/80 px-2 py-0.5 rounded font-mono font-semibold">
                Clinical Intelligence
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Hospital Queue Triage & Real-Time Wait-Time Prediction System
            </p>
          </div>
        </div>

        {/* Department Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:inline">
            Clinical Unit:
          </span>
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            {departments.map((dept) => (
              <button
                key={dept.id}
                onClick={() => onSelectDepartment(dept.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedDepartmentId === dept.id
                    ? 'bg-teal-600 dark:bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-900'
                }`}
              >
                <span>{dept.code}</span>
                <span className="hidden md:inline ml-1 text-[11px] opacity-80">({dept.name.split(' ')[0]})</span>
                {dept.isDiverting && (
                  <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 inline-block animate-pulse" title="Diverting" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-4 border-t border-slate-200/90 dark:border-slate-800/80 max-w-7xl mx-auto flex items-center justify-between overflow-x-auto scrollbar-none">
        <nav className="flex space-x-1.5 py-1.5">
          <button
            onClick={() => onTabChange('patient')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'patient'
                ? 'bg-teal-50 dark:bg-slate-800 text-teal-800 dark:text-cyan-300 border border-teal-200 dark:border-slate-700/80 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/40'
            }`}
          >
            <Tv className="w-4 h-4 text-teal-600 dark:text-cyan-400" />
            <span>Patient Display & Kiosk</span>
          </button>

          {user?.role !== 'Patient' && (
            <>
              <button
                onClick={() => onTabChange('staff')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'staff'
                    ? 'bg-teal-50 dark:bg-slate-800 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-slate-700/80 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                }`}
              >
                <Stethoscope className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Staff Triage Station</span>
              </button>

              <button
                onClick={() => onTabChange('admin')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-amber-50 dark:bg-slate-800 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-slate-700/80 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                }`}
              >
                <Sliders className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Admin Priority Overrides</span>
              </button>

              <button
                onClick={() => onTabChange('analytics')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'bg-indigo-50 dark:bg-slate-800 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-slate-700/80 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Hospital Analytics</span>
              </button>

              <button
                onClick={() => onTabChange('hipaa')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'hipaa'
                    ? 'bg-emerald-50 dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-slate-700/80 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>HIPAA & Audit Logs</span>
              </button>
            </>
          )}
        </nav>

        {currentDept && (
          <div className="hidden lg:flex items-center gap-4 text-xs py-1.5 pl-4 text-slate-600 dark:text-slate-400">
            <div>
              <span className="text-slate-400 dark:text-slate-500">Avg Wait:</span>{' '}
              <span className="font-bold text-slate-800 dark:text-white font-mono">{currentDept.averageWaitMinutes || 0}m</span>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500">In Queue:</span>{' '}
              <span className="font-bold text-teal-700 dark:text-cyan-300 font-mono">{currentDept.queueCount || 0}</span>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500">Beds:</span>{' '}
              <span className="font-bold text-slate-700 dark:text-slate-200 font-mono">
                {currentDept.occupiedBeds}/{currentDept.totalBeds}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
