import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout.jsx';
import { Button, Input, Alert } from '../components/ui.jsx';
import { StatCard } from '../components/Cards.jsx';
import { loginUser } from '../services/api.js';
import { Lock, Mail, CreditCard, Activity, ArrowRight, Shield } from 'lucide-react';

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
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const leftPanel = (
    <div className="max-w-xl">
      <div className="flex items-center gap-2 text-xs font-bold text-teal-600 dark:text-teal-400 mb-4 tracking-wider uppercase">
        <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></div>
        Live Operational Sync • St. Jude Memorial • Main ER & Acute Wings
      </div>
      <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white leading-tight mb-6 tracking-tight">
        Next-Generation Hospital Queue <br className="hidden lg:block"/>& Patient Flow Intelligence
      </h1>
      <p className="text-lg text-slate-600 dark:text-slate-400 mb-12 max-w-lg leading-relaxed">
        Connecting 14 acute wings, 48 consultation rooms, and low-latency FHIR EHR telemetry. Engineered for sub-second triage routing and calmer clinical environments.
      </p>

      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl shadow-slate-200/20 dark:shadow-none mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-slate-800 dark:text-slate-200">St. Jude Central Wing Live Vitals</h3>
          </div>
          <span className="text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-md">EHR Heartbeat: 11ms</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <StatCard title="Active Census" value="84%" subtitle="of Nominal Cap" />
          <StatCard title="Avg Triage Wait" value="16" subtitle="min" trend="▼ -4m vs peak" />
          <StatCard title="Telemetry Flow" value="99.9%" subtitle="" trend="HL7v2 + FHIR R4" />
        </div>
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> 24-Hour Patient Throughput Velocity</span>
          <svg className="w-32 h-6" viewBox="0 0 100 20" preserveAspectRatio="none">
            <path d="M0,15 Q10,5 20,10 T40,10 T60,5 T80,15 T100,5" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal-500 opacity-50" />
          </svg>
        </div>
      </div>

      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
        <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
          <span className="text-slate-400">⌘</span> Public Queue Status & Wait Estimate
        </h3>
        <p className="text-sm text-slate-500 mb-4">Arrived at the clinic or tracking from the waiting atrium? Enter your Queue Ticket (e.g. T-204) or Medical Record Number (MRN) for immediate forecasts.</p>
        <div className="flex gap-2">
          <Input placeholder="Ticket # (e.g. T-204) or MRN..." className="flex-1" />
          <Button variant="primary" className="bg-teal-600 hover:bg-teal-700 focus:ring-teal-600">Forecast <ArrowRight className="w-4 h-4 ml-2" /></Button>
        </div>
      </div>
    </div>
  );

  return (
    <AuthLayout leftPanel={leftPanel} mode="login">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none rounded-2xl overflow-hidden">
        
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-1">Secure Gate 01</div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Sign in to MediQueue Portal</h2>
            </div>
            <div className="text-right">
              <div className="w-2 h-2 rounded-full bg-emerald-500 ml-auto mb-1"></div>
              <div className="text-[10px] font-mono text-slate-500">Workstation ID:<br/>SD-WS-44A</div>
            </div>
          </div>

          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Access your clinical queue, triage priority roster, or personal care records.
          </p>

          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg mb-8">
            <button 
              type="button"
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2 ${role === 'staff' ? 'bg-white dark:bg-slate-700 shadow-sm text-teal-700 dark:text-teal-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              onClick={() => setRole('staff')}
            >
              <Shield className="w-4 h-4" /> Staff / Clinical
            </button>
            <button 
              type="button"
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2 ${role === 'patient' ? 'bg-white dark:bg-slate-700 shadow-sm text-teal-700 dark:text-teal-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              onClick={() => setRole('patient')}
            >
              <Activity className="w-4 h-4" /> Patient / Caregiver
            </button>
          </div>

          <div className="mb-6 p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between group cursor-pointer hover:border-teal-500 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">Tap Hospital ID Badge</div>
                <div className="text-xs text-slate-500">Fast contactless authentication (HID / FIDO2)</div>
              </div>
            </div>
            <div className="text-xs font-bold text-teal-600 bg-teal-50 dark:bg-teal-900/30 px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
              Scan Key
            </div>
          </div>

          <div className="relative flex items-center py-4 mb-4">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
            <span className="flex-shrink-0 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Or Standard Sign-In</span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
          </div>

          {error && <Alert type="error" className="mb-4">{error}</Alert>}

          <form onSubmit={handleLogin} className="space-y-5">
            <Input 
              name="email"
              label="Clinical Staff ID / Hospital Email" 
              placeholder="e.g. j.doe@metrohealth.org" 
              icon={Mail} 
              defaultValue="admin@mediqueue.com"
              required 
            />
            
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Security Password / PIN</label>
                <a href="#" className="text-xs font-medium text-teal-600 dark:text-teal-400 hover:underline">Forgot PIN or Badging Access?</a>
              </div>
              <Input 
                name="password"
                type="password" 
                placeholder="••••••••••••••••" 
                icon={Lock} 
                defaultValue="password123"
                required 
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer mt-2">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-600" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Remember clinical workstation (8-hr shift lock)</span>
            </label>

            <Button type="submit" className="w-full text-base py-3 mt-2" isLoading={isLoading}>
              <ArrowRight className="w-4 h-4 mr-2" /> Sign In to Operational Dashboard
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
            <div className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Institutional Single Sign-On (SSO)</div>
            <div className="flex gap-2">
              <button className="flex-1 py-2 border border-slate-200 dark:border-slate-700 rounded-md text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                Epic MyChart
              </button>
              <button className="flex-1 py-2 border border-slate-200 dark:border-slate-700 rounded-md text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                Cerner SSO
              </button>
              <button className="flex-1 py-2 border border-slate-200 dark:border-slate-700 rounded-md text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                Hospital Okta
              </button>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-xs text-slate-500 leading-relaxed mb-3">
            Protected Healthcare Information (PHI) system. Unauthorized access is audited under 45 CFR § 164.312.
          </p>
          <div className="text-sm">
            <span className="text-slate-600 dark:text-slate-400">New clinician or ambulatory patient? </span>
            <a href="/onboarding" className="font-bold text-teal-600 dark:text-teal-400 hover:underline">Register for access or setup clinical workstation →</a>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
