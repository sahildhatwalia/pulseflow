import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export const StatCard = ({ title, value, subtitle, trend, icon: Icon, className = '' }) => (
  <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm ${className}`}>
    <div className="flex items-start justify-between mb-2">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</h3>
      {Icon && <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-600 dark:text-slate-300"><Icon className="w-4 h-4" /></div>}
    </div>
    <div className="flex items-baseline gap-2">
      <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{value}</span>
      {subtitle && <span className="text-sm font-medium text-slate-500">{subtitle}</span>}
    </div>
    {trend && (
      <div className="mt-3 text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
        {trend}
      </div>
    )}
  </div>
);

export const RoleCard = ({ icon: Icon, title, description, selected, onClick, disabled }) => (
  <div 
    onClick={!disabled ? onClick : undefined}
    className={`p-5 rounded-xl border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col items-start
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-300 dark:hover:border-slate-600'}
      ${selected 
        ? 'border-slate-900 bg-slate-50 dark:border-teal-500 dark:bg-teal-900/10' 
        : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'}`}
  >
    <div className={`p-2.5 rounded-lg mb-4 ${selected ? 'bg-slate-900 text-white dark:bg-teal-600' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
      <Icon className="w-6 h-6" />
    </div>
    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">{title}</h3>
    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{description}</p>
    
    <div className="mt-auto flex items-center gap-2">
      <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${selected ? 'border-slate-900 bg-slate-900 text-white dark:border-teal-500 dark:bg-teal-500' : 'border-slate-300 dark:border-slate-600'}`}>
        {selected && <CheckCircle2 className="w-3 h-3" />}
      </div>
      <span className={`text-xs font-bold ${selected ? 'text-slate-900 dark:text-teal-400' : 'text-slate-500'}`}>
        {selected ? 'Active Selection' : 'Select this profile'}
      </span>
    </div>
  </div>
);

export const Stepper = ({ steps, currentStep }) => (
  <div className="flex items-center w-full mb-8">
    {steps.map((step, index) => {
      const isCompleted = index < currentStep;
      const isActive = index === currentStep;
      
      return (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center relative z-10">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors
              ${isActive ? 'bg-slate-900 border-slate-900 text-white dark:bg-teal-600 dark:border-teal-600' : 
                isCompleted ? 'bg-white border-slate-900 text-slate-900 dark:bg-slate-900 dark:border-teal-600 dark:text-teal-400' : 
                'bg-slate-100 border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-700'}
            `}>
              {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
            </div>
            <div className="absolute top-10 whitespace-nowrap text-center">
              <span className={`text-[10px] font-bold uppercase tracking-widest block mb-0.5 ${isActive ? 'text-slate-900 dark:text-teal-400' : 'text-slate-400'}`}>Step 0{index + 1} • {isActive ? 'Active' : isCompleted ? 'Done' : 'Next'}</span>
              <span className={`text-xs font-semibold ${isActive ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500'}`}>{step.title}</span>
            </div>
          </div>
          {index < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-4 transition-colors ${isCompleted ? 'bg-slate-900 dark:bg-teal-600' : 'bg-slate-200 dark:bg-slate-800'}`} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);
