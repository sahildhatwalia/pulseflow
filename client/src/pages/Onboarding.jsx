import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout.jsx';
import { Button, Input, Select, Alert } from '../components/ui.jsx';
import { Stepper, RoleCard } from '../components/Cards.jsx';
import { registerUser } from '../services/api.js';
import { User, Building, HeartPulse, ShieldCheck, ArrowRight, Activity, Clock, Zap } from 'lucide-react';

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
    license: false
  });

  const steps = [
    { id: 'role', title: 'Account & Role Selection' },
    { id: 'verify', title: 'Identity & Clinical Verification' },
    { id: 'facility', title: 'Facility & Department Pairing' }
  ];

  const handleNext = async () => {
    if (currentStep === 0) navigate('/onboarding/verify');
    else if (currentStep === 1) navigate('/onboarding/facility');
    else {
      setIsLoading(true);
      setError('');
      try {
        await registerUser({ ...formData, role });
        navigate('/'); // Go to dashboard on finish
      } catch (err) {
        setError(err.message || 'Registration failed');
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

  const rightPanel = (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm sticky top-24">
      <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Why MediQueue?</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
        Built for clinical velocity, our high-precision telemetry cuts emergency room wait bottlenecks by up to 41%.
      </p>

      <div className="space-y-6 mb-8">
        <div>
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-bold text-slate-800 dark:text-slate-200">96.4% Accurate Forecasts</h4>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xs text-slate-500">AI algorithms continuously recompute patient drift and triage velocity in real time.</p>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-bold text-slate-800 dark:text-slate-200">Zero-Delay EHR Synchronization</h4>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xs text-slate-500">Instant HL7 FHIR bi-directional sync with Epic, Cerner, and MEDITECH enterprise vaults.</p>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-bold text-slate-800 dark:text-slate-200">Autonomous Surge Protection</h4>
            <ShieldCheck className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-xs text-slate-500">Intelligent re-routing of acute cases before physical hallway congestion manifests.</p>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800 mb-6 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Real-time Facility Pulse</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">12.4m <span className="text-xs font-medium text-slate-500">avg. door-to-provider</span></div>
        </div>
        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded">
          -19% today
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-900/30 flex items-start gap-3">
        <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-1">Need clinical IT clearance?</h4>
          <p className="text-xs text-blue-800/80 dark:text-blue-300/80 mb-2">Hospital privileged staff facing two-factor issues or token expiration can expedite approval directly.</p>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900 dark:text-blue-300">Internal IT Desk: Ext. 4040</span>
            <button className="text-xs font-bold bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors">Call Ops</button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <AuthLayout leftPanel={rightPanel} mode="onboarding">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-bold text-teal-600 dark:text-teal-400 mb-2 tracking-wider uppercase">
          <ShieldCheck className="w-3 h-3" /> Accredited Clinical Gateway • HL7 & FHIR Ready
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
          Join MediQueue Hospital System
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Streamlined registration for healthcare providers, clinical staff, and self-service patients.
        </p>
      </div>

      <Stepper steps={steps} currentStep={currentStep} />

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-6 sm:p-8">
        
        {/* Step 0: Role Selection */}
        {currentStep === 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Select Profile Role</h2>
              <span className="text-sm font-medium text-slate-500">Step 1 of 3</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <RoleCard 
                icon={Stethoscope} 
                title="Clinical Provider / Staff" 
                description="Doctors, Triage Specialists, Nurses managing patient flow and consultations." 
                selected={role === 'clinical'} 
                onClick={() => setRole('clinical')} 
              />
              <RoleCard 
                icon={Building} 
                title="Hospital Reception & Ops" 
                description="Front-desk clerks, room dispatchers, and acute queue wardens." 
                selected={role === 'ops'} 
                onClick={() => setRole('ops')} 
              />
              <RoleCard 
                icon={User} 
                title="Patient & Family Caregiver" 
                description="Fast queue slips, mobile check-in, real-time arrival notifications." 
                selected={role === 'patient'} 
                onClick={() => setRole('patient')} 
              />
            </div>
          </div>
        )}

        {/* Step 1: Verification */}
        {currentStep === 1 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Clinical Provider Intake Details</h2>
              <span className="text-sm font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">Stage 1: Credentials</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
              <Input label="First Name *" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="e.g. Elena" />
              <Input label="Last Name *" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="e.g. Vance, MD" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
              <Input label="Hospital Work Email *" name="email" value={formData.email} onChange={handleChange} placeholder="evance@stjudehealth.org" />
              <Input label="Medical License / Staff ID (NPI or Badge #) *" name="npi" value={formData.npi} onChange={handleChange} placeholder="NPI: 1043928190" />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6 text-xs text-slate-500">
              <div>Must belong to a recognized health system domain.</div>
              <div>Verified instantly via National Provider Identifier index.</div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Create Secure Password *</label>
              </div>
              <Input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Minimum 12 characters" />
              <div className="flex items-center justify-between mt-2 text-xs">
                <div className="flex gap-1"><div className="w-8 h-1.5 bg-rose-500 rounded-full"></div><div className="w-8 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full"></div><div className="w-8 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full"></div><div className="w-8 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full"></div></div>
                <span className="text-slate-500">Min. 12 characters, uppercase & special symbol</span>
              </div>
            </div>

            <div className="space-y-4 mb-8 pt-4 border-t border-slate-200 dark:border-slate-800">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" name="terms" checked={formData.terms} onChange={handleChange} className="mt-1 w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-600" />
                <span className="text-sm text-slate-600 dark:text-slate-400 leading-snug">I acknowledge the <strong>HIPAA patient confidentiality protocols</strong> and agree to the Metro General Hospital EHR acceptable use policy.</span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" name="license" checked={formData.license} onChange={handleChange} className="mt-1 w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-600" />
                <span className="text-sm text-slate-600 dark:text-slate-400 leading-snug">I authorize verification of my medical licensure through national registry validation clearinghouses.</span>
              </label>
            </div>
          </div>
        )}

        {/* Step 2: Facility */}
        {currentStep === 2 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Facility & Department Pairing</h2>
              <span className="text-sm font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">Stage 2: Assignment</span>
            </div>

            <Alert type="info" title="System Synchronization" className="mb-6">
              Your credentials will be synchronized with the selected facility's on-premise AD and EHR system. This may take up to 5 minutes after registration.
            </Alert>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
              <Select 
                label="Primary Department *" 
                name="department" 
                value={formData.department} 
                onChange={handleChange}
                options={[
                  {value: 'dept-ed', label: 'Emergency Department'},
                  {value: 'dept-uc', label: 'Urgent Care Center'},
                  {value: 'dept-ped', label: 'Pediatric Emergency'},
                  {value: 'dept-trauma', label: 'Trauma & Critical Resus'}
                ]}
              />
              <Select 
                label="Preferred Hospital Facility *" 
                name="facility" 
                value={formData.facility} 
                onChange={handleChange}
                options={[
                  {value: 'st-jude-main', label: 'St. Jude Memorial Main Campus'},
                  {value: 'metro-general', label: 'Metro General Health System'},
                  {value: 'city-clinic', label: 'City Ambulatory Clinic'}
                ]}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-800">
          {currentStep === 0 ? (
            <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Already have credentials? <a href="/login" className="text-teal-600 dark:text-teal-400 hover:underline">Sign in to existing account</a>
            </div>
          ) : (
            <Button variant="outline" onClick={handleBack}>Go Back</Button>
          )}
          
          <div className="ml-auto flex items-center gap-3">
            {error && <span className="text-xs text-rose-600 dark:text-rose-400">{error}</span>}
            <Button variant="primary" onClick={handleNext} className="bg-slate-900 dark:bg-teal-600 px-8" isLoading={isLoading}>
              {currentStep === 0 ? 'Continue to Identity Verification' : currentStep === 1 ? 'Continue to Facility Selection' : 'Complete Registration'} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
