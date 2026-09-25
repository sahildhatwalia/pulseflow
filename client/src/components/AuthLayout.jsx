import React from 'react';
import { Activity, ShieldCheck, FileCheck, Stethoscope } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AuthLayout({ children, leftPanel, mode = 'login' }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans relative overflow-hidden flex flex-col">
      {/* Background Dot Grid */}
      <div className="absolute inset-0 z-0 opacity-40 dark:opacity-20"
        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #cbd5e1 1px, transparent 0)', backgroundSize: '24px 24px' }}>
      </div>

      {/* Top Header */}
      <header className="z-10 relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold shadow-sm">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">MediQueue</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium ml-2 border border-slate-200 dark:border-slate-700 hidden sm:inline-block">Metro General Health System • ED Main Campus</span>
          </div>
          <div className="hidden lg:flex items-center gap-4 text-xs font-medium text-slate-500">
            <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> All Clinical Systems Operational</div>
            <div className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> HIPAA / HL7 FHIR • SOC2 Type II</div>
          </div>
        </div>

        <nav className="flex items-center gap-2 text-sm font-medium">
          <Link to="/login" className={`px-4 py-2 rounded-md transition-colors ${mode === 'login' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'}`}>Staff Login</Link>
          <Link to="/onboarding" className={`px-4 py-2 rounded-md transition-colors hidden sm:block ${mode === 'onboarding' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'}`}>Credential Intake</Link>
          <button className="px-4 py-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors hidden md:block">Facility Enrollment</button>
          <button className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-md shadow-sm transition-colors flex items-center gap-2 ml-2">
            <Stethoscope className="w-4 h-4" />
            <span>Fast-Track Assistance</span>
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="z-10 relative flex-1 max-w-[1400px] w-full mx-auto p-4 sm:p-6 lg:p-8 lg:py-12 flex flex-col lg:flex-row gap-8 xl:gap-16">
        {mode === 'login' ? (
          <>
            {/* Login Mode: Left Panel takes space, Auth on right */}
            <div className="flex-1 flex flex-col justify-center">
              {leftPanel}
            </div>
            <div className="w-full lg:w-[480px] xl:w-[500px] flex-shrink-0">
              {children}
            </div>
          </>
        ) : (
          <>
            {/* Onboarding Mode: Main content on left, smaller panel on right */}
            <div className="flex-[3]">
              {children}
            </div>
            <div className="flex-[1.5] w-full lg:w-[350px] xl:w-[400px] flex-shrink-0">
              {leftPanel}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="z-10 relative px-8 py-6 flex items-center justify-between text-xs font-medium text-slate-500 border-t border-slate-200/50 dark:border-slate-800/50">
        <p>© 2026 MediQueue Flow Systems Inc. Enterprise Hospital Operations.</p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-slate-800 dark:hover:text-slate-300">Clinical Privacy Policy</a>
          <a href="#" className="hover:text-slate-800 dark:hover:text-slate-300">HL7 FHIR Interoperability</a>
          <a href="#" className="hover:text-slate-800 dark:hover:text-slate-300">Triage Safety Protocols</a>
          <a href="#" className="hover:text-slate-800 dark:hover:text-slate-300">Support Desk</a>
        </div>
      </footer>
    </div>
  );
}
