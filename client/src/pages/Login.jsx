import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout.jsx';
import { Button, Input, Alert } from '../components/ui.jsx';
import { loginUser } from '../services/api.js';
import { Lock, Mail, Activity, ArrowRight, Shield } from 'lucide-react';

export default function Login() {
  const [role, setRole] = useState('staff');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const email = e.target.email.value;
      const password = e.target.password.value;
      const data = await loginUser(email, password);
      console.log('Login successful', data);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout mode="login">
      <div className="w-full max-w-sm">
        {/* Logo mark */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-md mb-4">
            <Activity className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Welcome back</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Sign in to your hospital portal</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg shadow-slate-200/40 dark:shadow-none overflow-hidden">
          <div className="p-6">
            {/* Role toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg mb-6">
              <button
                type="button"
                className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  role === 'staff'
                    ? 'bg-white dark:bg-slate-700 shadow-sm text-teal-700 dark:text-teal-400'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
                onClick={() => setRole('staff')}
              >
                <Shield className="w-3.5 h-3.5" /> Staff
              </button>
              <button
                type="button"
                className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  role === 'patient'
                    ? 'bg-white dark:bg-slate-700 shadow-sm text-teal-700 dark:text-teal-400'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
                onClick={() => setRole('patient')}
              >
                <Activity className="w-3.5 h-3.5" /> Patient
              </button>
            </div>

            {error && <Alert type="error" className="mb-4">{error}</Alert>}

            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                name="email"
                label="Email / Staff ID"
                placeholder="you@hospital.org"
                icon={Mail}
                defaultValue="admin@mediqueue.com"
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
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-600" />
                <span className="text-sm text-slate-600 dark:text-slate-400">Remember this device</span>
              </label>

              <div className="flex gap-3 pt-1">
                <Button type="button" variant="outline" className="w-1/3 py-2.5" onClick={() => navigate('/onboarding')}>
                  Register
                </Button>
                <Button type="submit" className="w-2/3 py-2.5" isLoading={isLoading}>
                  <ArrowRight className="w-4 h-4 mr-1.5" /> Sign In
                </Button>
              </div>
            </form>
          </div>

          {/* Footer strip */}
          <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[11px] text-slate-400">
              Protected under HIPAA · 45 CFR § 164.312 · Unauthorized access is logged
            </p>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
