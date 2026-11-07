import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout.jsx';
import { Button, Input, Alert } from '../components/ui.jsx';
import { loginUser } from '../services/api.js';
import { Lock, Mail, Activity, ArrowRight } from 'lucide-react';

// ─── All demo roles ────────────────────────────────────────────────────────
const DEMO_ROLES = [
  {
    id: 'admin',
    icon: '🛡️',
    label: 'Administrator',
    desc: 'Full access · All tabs · Priority overrides · Analytics · HIPAA logs',
    email: 'admin@mediqueue.com',
    borderActive: 'ring-2 ring-amber-400 border-amber-400 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-700',
    borderIdle: 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700',
    chip: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  {
    id: 'supervisor',
    icon: '🏥',
    label: 'Clinical Supervisor',
    desc: 'Full access · Department oversight · Staff management',
    email: 'supervisor@mediqueue.com',
    borderActive: 'ring-2 ring-purple-400 border-purple-400 bg-purple-50 dark:bg-purple-950/40 dark:border-purple-700',
    borderIdle: 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700',
    chip: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  },
  {
    id: 'doctor',
    icon: '👨‍⚕️',
    label: 'Doctor',
    desc: 'Patient queue · Vitals · Status updates · Room assignment',
    email: 'doctor@mediqueue.com',
    borderActive: 'ring-2 ring-blue-400 border-blue-400 bg-blue-50 dark:bg-blue-950/40 dark:border-blue-700',
    borderIdle: 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700',
    chip: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
  {
    id: 'nurse',
    icon: '👩‍⚕️',
    label: 'Charge Nurse',
    desc: 'Triage · Vitals · Room assignment · Status updates',
    email: 'nurse@mediqueue.com',
    borderActive: 'ring-2 ring-violet-400 border-violet-400 bg-violet-50 dark:bg-violet-950/40 dark:border-violet-700',
    borderIdle: 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700',
    chip: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300 border-violet-200 dark:border-violet-800',
  },
  {
    id: 'reception',
    icon: '🛎️',
    label: 'Receptionist',
    desc: 'Check-in patients · Live queue board · Wait times lookup',
    email: 'reception@mediqueue.com',
    borderActive: 'ring-2 ring-teal-400 border-teal-400 bg-teal-50 dark:bg-teal-950/40 dark:border-teal-700',
    borderIdle: 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700',
    chip: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  },
  {
    id: 'patient',
    icon: '🧑‍🤝‍🧑',
    label: 'Patient',
    desc: 'My queue status · Self check-in · Department wait times',
    email: 'patient@mediqueue.com',
    borderActive: 'ring-2 ring-sky-400 border-sky-400 bg-sky-50 dark:bg-sky-950/40 dark:border-sky-700',
    borderIdle: 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700',
    chip: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  },
];

export default function Login() {
  const [selectedRole, setSelectedRole] = useState(DEMO_ROLES[0]);
  const [emailValue, setEmailValue] = useState(DEMO_ROLES[0].email);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const selectRole = (role) => {
    setSelectedRole(role);
    setEmailValue(role.email);
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const email = e.target.email.value;
      const password = e.target.password.value;
      await loginUser(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout mode="login">
      <div className="w-full max-w-md">

        {/* ── Patient Quick Access Banner ──────────────────────────── */}
        <div className="mb-5 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/40 dark:to-cyan-950/40 border border-teal-200 dark:border-teal-800/60 rounded-2xl p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/60 flex items-center justify-center">
              <span className="text-lg">🧑‍🤝‍🧑</span>
            </div>
            <div>
              <div className="text-sm font-bold text-teal-900 dark:text-teal-200">Are you a patient?</div>
              <div className="text-xs text-teal-700 dark:text-teal-400">Track your ticket or check wait times — no login needed</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/patient')}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold transition-colors cursor-pointer shadow-sm"
          >
            Quick Access <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ── Logo & heading ───────────────────────────────────────── */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-600 via-cyan-600 to-sky-500 flex items-center justify-center text-white shadow-lg mb-4 ring-4 ring-teal-500/20">
            <Activity className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">PulseFlow</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Select your role to sign in to the right portal</p>
        </div>

        {/* ── Role selector grid ───────────────────────────────────── */}
        <div className="mb-5">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
            Who are you?
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {DEMO_ROLES.map(role => (
              <button
                key={role.id}
                type="button"
                onClick={() => selectRole(role)}
                className={`flex flex-col items-start gap-1.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedRole.id === role.id ? role.borderActive : role.borderIdle
                }`}
              >
                <span className="text-xl">{role.icon}</span>
                <div>
                  <div className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight">
                    {role.label}
                  </div>
                  <div className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    {role.desc}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Selected role confirmation chip ──────────────────────── */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold mb-4 border ${selectedRole.chip}`}>
          <span className="text-base">{selectedRole.icon}</span>
          <span>
            Signing in as <strong>{selectedRole.label}</strong>
          </span>
          <span className="ml-auto font-mono text-[10px] opacity-60">{selectedRole.email}</span>
        </div>

        {/* ── Login card ───────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg shadow-slate-200/40 dark:shadow-none overflow-hidden">
          <div className="p-6">
            {error && <Alert type="error" className="mb-4">{error}</Alert>}

            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                name="email"
                label="Email"
                placeholder="your@hospital.org"
                icon={Mail}
                value={emailValue}
                onChange={e => setEmailValue(e.target.value)}
                required
              />

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
                  <a href="#" className="text-xs text-teal-600 dark:text-teal-400 hover:underline">Forgot password?</a>
                </div>
                <Input
                  name="password"
                  type="password"
                  placeholder="••••••••••••"
                  icon={Lock}
                  defaultValue="password123"
                  required
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-600"
                />
                <span className="text-sm text-slate-600 dark:text-slate-400">Remember this device</span>
              </label>

              <div className="flex gap-3 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  className="w-1/3 py-2.5"
                  onClick={() => navigate('/onboarding')}
                >
                  Register
                </Button>
                <Button type="submit" className="w-2/3 py-2.5" isLoading={isLoading}>
                  <ArrowRight className="w-4 h-4 mr-1.5" />
                  Sign In as {selectedRole?.label}
                </Button>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[11px] text-slate-400">
              Protected under HIPAA · 45 CFR § 164.312 · All logins are logged and audited
            </p>
          </div>
        </div>

        {/* ── Demo hint ────────────────────────────────────────────── */}
        <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 mt-4">
          All demo accounts use password:{' '}
          <span className="font-mono font-bold text-slate-600 dark:text-slate-300">password123</span>
        </p>
      </div>
    </AuthLayout>
  );
}
