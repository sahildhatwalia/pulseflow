import React from 'react';
import { Activity, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AuthLayout({ children, mode = 'login' }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans flex flex-col relative overflow-hidden">
      {/* Subtle background grid */}
      <div
        className="absolute inset-0 z-0 opacity-30 dark:opacity-10"
        style={{
          backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, #cbd5e1 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Header */}
      <header className="z-10 relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-sm">
            <Activity className="w-4.5 h-4.5" />
          </div>
          <span className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">PulseFlow</span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 ml-1">
            <ShieldCheck className="w-3 h-3" /> HIPAA Compliant
          </span>
        </div>

        <nav className="flex items-center gap-1 text-sm font-medium">
          <Link
            to="/login"
            className={`px-3.5 py-1.5 rounded-md transition-colors ${
              mode === 'login'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Sign In
          </Link>
          <Link
            to="/onboarding"
            className={`px-3.5 py-1.5 rounded-md transition-colors ${
              mode === 'onboarding'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Register
          </Link>
        </nav>
      </header>

      {/* Main */}
      <main className="z-10 relative flex-1 flex items-center justify-center px-4 py-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="z-10 relative px-6 py-4 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-200/60 dark:border-slate-800/60">
        <span>© 2026 PulseFlow Health Systems</span>
        <div className="flex gap-4">
          <a href="#" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Privacy</a>
          <a href="#" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Terms</a>
          <a href="#" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Support</a>
        </div>
      </footer>
    </div>
  );
}
