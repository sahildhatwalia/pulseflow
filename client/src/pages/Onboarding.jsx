import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout.jsx';
import { Button, Input, Select, Alert } from '../components/ui.jsx';
import { Stepper, RoleCard } from '../components/Cards.jsx';
import { registerUser } from '../services/api.js';
import { User, Building, HeartPulse, ShieldCheck, ArrowRight, Stethoscope } from 'lucide-react';

export default function Onboarding() {
  const navigate = useNavigate();
  const location = useLocation();

  let currentStep = 0;
  if (location.pathname === '/onboarding/verify') currentStep = 1;
  if (location.pathname === '/onboarding/facility') currentStep = 2;

  const [role, setRole] = useState('clinical');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    npi: '',
    department: '',
    facility: '',
    password: '',
    terms: false,
    license: false,
  });

  const steps = [
    { id: 'role',     title: 'Select Role'  },
    { id: 'verify',  title: 'Your Details'  },
    { id: 'facility', title: 'Facility'     },
  ];

  const handleNext = async () => {
    if (currentStep === 0) navigate('/onboarding/verify');
    else if (currentStep === 1) navigate('/onboarding/facility');
    else {
      setIsLoading(true);
      setError('');
      try {
        await registerUser({ ...formData, role });
        navigate('/');
      } catch (err) {
        setError(err.message || 'Registration failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (currentStep === 1) navigate('/onboarding');
    else if (currentStep === 2) navigate('/onboarding/verify');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const calculatePasswordStrength = (pwd) => {
    if (!pwd) return 0;
    let strength = 1;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[A-Z]/.test(pwd) && (/[0-9]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd))) strength++;
    return Math.min(4, Math.max(1, strength));
  };

  const pwdStrength = calculatePasswordStrength(formData.password);

  const getStrengthColor = (isActive) => {
    if (!isActive) return 'bg-slate-200 dark:bg-slate-700';
    if (pwdStrength === 1) return 'bg-rose-500';
    if (pwdStrength === 2) return 'bg-orange-500';
    if (pwdStrength === 3) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <AuthLayout mode="onboarding">
      <div className="w-full max-w-lg">
        {/* Page heading */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-1.5 text-teal-600 dark:text-teal-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-3.5 h-3.5" /> Staff & Patient Registration
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Create your account</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Join the hospital queue management system</p>
        </div>

        <Stepper steps={steps} currentStep={currentStep} />

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg shadow-slate-200/40 dark:shadow-none mt-6">
          <div className="p-6">

            {/* Step 0: Role Selection */}
            {currentStep === 0 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-400">
                <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-4">Who are you registering as?</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <RoleCard
                    icon={Stethoscope}
                    title="Clinical Staff"
                    description="Doctors, nurses & triage specialists."
                    selected={role === 'clinical'}
                    onClick={() => setRole('clinical')}
                  />
                  <RoleCard
                    icon={Building}
                    title="Reception & Ops"
                    description="Front-desk, room dispatch & admin."
                    selected={role === 'ops'}
                    onClick={() => setRole('ops')}
                  />
                  <RoleCard
                    icon={User}
                    title="Patient"
                    description="Queue check-in & arrival tracking."
                    selected={role === 'patient'}
                    onClick={() => setRole('patient')}
                  />
                </div>
              </div>
            )}

            {/* Step 1: Personal & credential details */}
            {currentStep === 1 && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-400">
                <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-5">Your details</h2>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Input label="First Name *" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="Elena" />
                  <Input label="Last Name *"  name="lastName"  value={formData.lastName}  onChange={handleChange} placeholder="Vance" />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Input label="Work Email *"  name="email" value={formData.email} onChange={handleChange} placeholder="you@hospital.org" />
                  <Input label="Staff ID / NPI *" name="npi" value={formData.npi}   onChange={handleChange} placeholder="NPI or Badge #" />
                </div>

                <div className="mb-5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Password *</label>
                  <Input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Minimum 12 characters" />
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`w-8 h-1.5 rounded-full transition-colors duration-300 ${getStrengthColor(pwdStrength >= i)}`} />
                      ))}
                    </div>
                    <span className={`text-xs transition-colors ${pwdStrength === 4 ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                      {pwdStrength === 4 ? 'Strong ✓' : '12+ chars, uppercase & symbol'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input type="checkbox" name="terms" checked={formData.terms} onChange={handleChange} className="mt-0.5 w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-600" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">I agree to the <strong>HIPAA confidentiality policy</strong> and hospital EHR terms of use.</span>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input type="checkbox" name="license" checked={formData.license} onChange={handleChange} className="mt-0.5 w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-600" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">I authorize verification of my medical license via national registry.</span>
                  </label>
                </div>
              </div>
            )}

            {/* Step 2: Facility */}
            {currentStep === 2 && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-400">
                <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-2">Facility & department</h2>
                <p className="text-sm text-slate-500 mb-5">Your access will be linked to the selected facility's systems.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Department *"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    options={[
                      { value: 'dept-ed',     label: 'Emergency Department'   },
                      { value: 'dept-uc',     label: 'Urgent Care'             },
                      { value: 'dept-ped',    label: 'Pediatric Emergency'     },
                      { value: 'dept-trauma', label: 'Trauma & Critical Care'  },
                    ]}
                  />
                  <Select
                    label="Facility *"
                    name="facility"
                    value={formData.facility}
                    onChange={handleChange}
                    options={[
                      { value: 'st-jude-main',  label: 'St. Jude Memorial — Main'  },
                      { value: 'metro-general', label: 'Metro General Health System' },
                      { value: 'city-clinic',   label: 'City Ambulatory Clinic'      },
                    ]}
                  />
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
              {currentStep === 0 ? (
                <span className="text-sm text-slate-500">
                  Already registered?{' '}
                  <a href="/login" className="text-teal-600 dark:text-teal-400 hover:underline font-medium">Sign in</a>
                </span>
              ) : (
                <Button variant="outline" onClick={handleBack}>Back</Button>
              )}

              <div className="flex items-center gap-3 ml-auto">
                {error && <span className="text-xs text-rose-600 dark:text-rose-400">{error}</span>}
                <Button variant="primary" onClick={handleNext} className="px-6" isLoading={isLoading}>
                  {currentStep < 2 ? 'Continue' : 'Finish'} <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
