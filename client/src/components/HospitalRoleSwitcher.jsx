import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../services/api.js';
import {
  ChevronDown,
  Shield,
  Stethoscope,
  HeartPulse,
  UserCheck,
  User,
  Tv,
  Check,
  Building2,
  Sparkles,
} from 'lucide-react';

const HOSPITAL_ROLES = [
  {
    id: 'admin',
    name: 'Jane Admin',
    email: 'admin@mediqueue.com',
    role: 'Administrator',
    label: 'Administrator',
    sublabel: 'Full Command · Priority Overrides · Analytics · HIPAA',
    icon: Shield,
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-700',
    dotColor: 'bg-amber-500',
  },
  {
    id: 'supervisor',
    name: 'Dr. Sam Okonkwo',
    email: 'supervisor@mediqueue.com',
    role: 'Clinical Supervisor',
    label: 'Clinical Supervisor',
    sublabel: 'Hospital Operations · Department & Surge Oversight',
    icon: Building2,
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-300 dark:border-purple-700',
    dotColor: 'bg-purple-500',
  },
  {
    id: 'doctor',
    name: 'Dr. Aisha Kapoor',
    email: 'doctor@mediqueue.com',
    role: 'Clinical Provider',
    label: 'Emergency Physician (MD)',
    sublabel: 'Bedside EHR · Exam Bay Assignments · Clinical Discharge',
    icon: Stethoscope,
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300 dark:border-blue-700',
    dotColor: 'bg-blue-500',
  },
  {
    id: 'nurse',
    name: 'Marcus Chen, RN',
    email: 'nurse@mediqueue.com',
    role: 'Charge Nurse',
    label: 'Charge Nurse (RN)',
    sublabel: 'Triage Acuity Sorting · Vital Telemetry · Bed Placement',
    icon: HeartPulse,
    badgeColor: 'bg-violet-100 text-violet-800 dark:bg-violet-950/80 dark:text-violet-300 border-violet-300 dark:border-violet-700',
    dotColor: 'bg-violet-500',
  },
  {
    id: 'reception',
    name: 'Priya Sharma',
    email: 'reception@mediqueue.com',
    role: 'Hospital Operations',
    label: 'Admissions & Reception',
    sublabel: 'Patient Intake · Live Queue Board · Wait Times Registry',
    icon: UserCheck,
    badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300 border-teal-300 dark:border-teal-700',
    dotColor: 'bg-teal-500',
  },
  {
    id: 'patient',
    name: 'Demo Patient',
    email: 'patient@mediqueue.com',
    role: 'Patient',
    label: 'Patient Portal',
    sublabel: 'Personal Care Pathway · Wait Time Tracker · Self Check-In',
    icon: User,
    badgeColor: 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border-sky-300 dark:border-sky-700',
    dotColor: 'bg-sky-500',
  },
];

export function HospitalRoleSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem('pulseflow_user') || 'null');
  } catch (_) {}

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeRoleConfig = HOSPITAL_ROLES.find(
    r => r.role === currentUser?.role || r.email === currentUser?.email
  ) || HOSPITAL_ROLES[0];

  const handleSelectRole = async (targetRole) => {
    setIsSwitching(true);
    try {
      await loginUser(targetRole.email, 'password123');
      setIsOpen(false);
      window.location.href = '/';
    } catch (err) {
      console.error('Role switch failed:', err);
      // Fallback update in case of local cache
      localStorage.setItem('pulseflow_user', JSON.stringify(targetRole));
      window.location.href = '/';
    } finally {
      setIsSwitching(false);
    }
  };

  const handleOpenLobbyBoard = () => {
    setIsOpen(false);
    navigate('/patient');
  };

  const IconComponent = activeRoleConfig.icon;

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSwitching}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-teal-400 dark:hover:border-cyan-500 text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-xs transition-all cursor-pointer"
        title="Switch Hospital Portal / View as another staff role"
      >
        <span className={`w-2 h-2 rounded-full ${activeRoleConfig.dotColor} animate-pulse shrink-0`} />
        <div className="flex items-center gap-1.5 max-w-[170px] truncate text-left">
          <IconComponent className="w-3.5 h-3.5 text-teal-600 dark:text-cyan-400 shrink-0" />
          <span className="font-bold truncate">{activeRoleConfig.label}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-2 overflow-hidden animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-cyan-400" />
                Hospital Role Navigator
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Switch instantly between hospital portals
              </p>
            </div>
            <span className="text-[10px] bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border border-teal-200 dark:border-teal-800 px-2 py-0.5 rounded-full font-mono font-bold">
              Instant Jumper
            </span>
          </div>

          {/* Role List */}
          <div className="py-1 space-y-1 max-h-80 overflow-y-auto">
            {HOSPITAL_ROLES.map((roleItem) => {
              const isSelected = activeRoleConfig.id === roleItem.id;
              const RoleIcon = roleItem.icon;
              return (
                <button
                  key={roleItem.id}
                  onClick={() => handleSelectRole(roleItem)}
                  className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/80 shadow-xs'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                    <RoleIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                        {roleItem.label}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-teal-600 dark:text-cyan-400 shrink-0" />}
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium truncate">
                      {roleItem.name} <span className="text-slate-400 font-normal">({roleItem.email})</span>
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                      {roleItem.sublabel}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Public Kiosk Shortcut */}
          <div className="mt-1 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleOpenLobbyBoard}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-teal-50 dark:bg-slate-800/60 dark:hover:bg-teal-950/40 text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <Tv className="w-4 h-4 text-teal-600 dark:text-cyan-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Public Patient Kiosk (`/patient`)
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Lobby board &amp; ticket tracker (No authentication needed)
                  </div>
                </div>
              </div>
              <span className="text-xs text-teal-600 dark:text-cyan-400 font-bold group-hover:translate-x-0.5 transition-transform">
                Open →
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

