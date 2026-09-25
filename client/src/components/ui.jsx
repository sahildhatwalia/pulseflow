import React from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export const Button = React.forwardRef(({ className = '', variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
  const baseStyle = "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-slate-900 hover:bg-slate-800 text-white dark:bg-teal-600 dark:hover:bg-teal-500 focus:ring-slate-900 dark:focus:ring-teal-600",
    secondary: "bg-slate-100 hover:bg-slate-200 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 focus:ring-slate-200",
    outline: "border border-slate-300 hover:bg-slate-50 text-slate-700 dark:border-slate-700 dark:hover:bg-slate-800 dark:text-slate-200",
    ghost: "hover:bg-slate-100 text-slate-700 dark:hover:bg-slate-800 dark:text-slate-300",
    danger: "bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-600",
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };
  
  return (
    <button 
      ref={ref}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
});

export const Input = React.forwardRef(({ className = '', label, error, icon: Icon, ...props }, ref) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</label>}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <input
          ref={ref}
          className={`w-full rounded-lg border bg-white dark:bg-slate-900 px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:border-transparent
            ${Icon ? 'pl-10' : ''}
            ${error 
              ? 'border-rose-300 focus:ring-rose-500/20 dark:border-rose-500/50' 
              : 'border-slate-300 focus:ring-slate-900/10 dark:border-slate-700 dark:focus:ring-slate-700'} 
            ${className}`}
          {...props}
        />
      </div>
      {error && <span className="text-xs text-rose-600 dark:text-rose-400">{error}</span>}
    </div>
  );
});

export const Select = React.forwardRef(({ className = '', label, error, options = [], ...props }, ref) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</label>}
      <select
        ref={ref}
        className={`w-full rounded-lg border bg-white dark:bg-slate-900 px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:border-transparent appearance-none
          ${error 
            ? 'border-rose-300 focus:ring-rose-500/20 dark:border-rose-500/50' 
            : 'border-slate-300 focus:ring-slate-900/10 dark:border-slate-700 dark:focus:ring-slate-700'} 
          ${className}`}
        {...props}
      >
        <option value="" disabled hidden>Select...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <span className="text-xs text-rose-600 dark:text-rose-400">{error}</span>}
    </div>
  );
});

export const Alert = ({ type = 'info', title, children, className = '' }) => {
  const styles = {
    info: "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/30",
    error: "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800/30",
    success: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800/30",
  };
  
  const Icon = type === 'error' ? AlertCircle : type === 'success' ? CheckCircle2 : AlertCircle;

  return (
    <div className={`p-4 rounded-lg border flex gap-3 ${styles[type]} ${className}`}>
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div>
        {title && <h4 className="font-semibold text-sm mb-1">{title}</h4>}
        <div className="text-sm opacity-90">{children}</div>
      </div>
    </div>
  );
};
