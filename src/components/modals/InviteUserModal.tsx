"use client";

import React, { useState } from 'react';
import { 
  UserPlus, 
  Mail, 
  Building2, 
  Target, 
  ShieldCheck, 
  Send,
  Copy,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  User,
  LayoutGrid,
  Lock,
  ArrowRight,
  ArrowLeft,
  Search
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Select } from '../forms/Select';
import { useToast } from '../common/ToastContext';
import { useWorkforce } from '@/context/WorkforceContext';
import { useMutation } from '@/hooks/useMutation';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InviteUserModal: React.FC<InviteUserModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();
  const { addEmployee } = useWorkforce();
  
  const { mutate: sendInvite, isLoading: isDispatching } = useMutation(
    async (data: any) => {
      // Simulate API delay
      await new Promise(r => setTimeout(r, 2000));
      return addEmployee(data);
    },
    {
      activityLabel: 'Identity Provisioned',
      activityType: 'PROVISIONING',
      successMessage: 'New user registry entry synchronized globally.',
      loadingMessage: 'Provisioning Identity...',
      onSuccess: () => setShowSuccess(true)
    }
  );

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    office: 'Lagos HQ',
    department: 'Executive',
    role: 'Manager',
    scope: 'Departmental Only'
  });

  const [activationLink] = useState(`https://suler-ems.com/activate?token=${Math.random().toString(36).substring(2, 15)}`);
  const [copied, setCopied] = useState(false);

  const handleSendInvite = () => {
    sendInvite(formData);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(activationLink);
    setCopied(true);
    toast({
      type: 'info',
      message: 'Link Copied',
      description: 'Secure activation token added to clipboard.'
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 4));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const STEPS = [
    { id: 1, label: 'Identity', icon: User },
    { id: 2, label: 'Scoping', icon: Building2 },
    { id: 3, label: 'Authority', icon: ShieldCheck },
    { id: 4, label: 'Review', icon: CheckCircle2 },
  ];

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={() => {
        onClose();
        setTimeout(() => {
          setStep(1);
          setShowSuccess(false);
        }, 300);
      }}
      title={showSuccess ? "Provisioning Complete" : "Multi-Step Provisioning Pipeline"}
      subtitle={showSuccess ? "Secure Access Token Generated" : `Step ${step} of 4: Organizational Scoping`}
      size="md"
    >
      {!showSuccess ? (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-4">
          {/* Stepper Infrastructure */}
          <div className="flex items-center justify-between px-2">
            {STEPS.map((s, i) => (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center gap-2 relative">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-500 ${
                    step >= s.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white border-slate-100 text-slate-300'
                  }`}>
                    <s.icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest absolute -bottom-6 whitespace-nowrap transition-colors duration-500 ${
                    step >= s.id ? 'text-slate-900' : 'text-slate-300'
                  }`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-4 rounded-full transition-colors duration-500 ${
                    step > s.id ? 'bg-indigo-600' : 'bg-slate-50'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="mt-12 min-h-[300px]">
            {/* Step 1: Identity Protocols */}
            {step === 1 && (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Principal Name</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                      <input 
                        type="text" 
                        placeholder="e.g. Dr. Afolabi James"
                        className="w-full h-[52px] bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 text-[13px] font-bold text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-1">Institutional Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                      <input 
                        type="email" 
                        placeholder="e.g. a.james@suler.com"
                        className="w-full h-[52px] bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 text-[13px] font-bold text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Scoping Information */}
            {step === 2 && (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                <div className="grid grid-cols-1 gap-6">
                  <Select 
                    label="Primary Hub Office"
                    value={formData.office}
                    onChange={(v) => setFormData({...formData, office: v})}
                    options={[
                      { label: 'Lagos HQ', value: 'Lagos HQ' },
                      { label: 'Abuja Operations', value: 'Abuja Operations' },
                      { label: 'Benin Branch', value: 'Benin Branch' },
                      { label: 'Remote Workforce', value: 'Remote Workforce' },
                    ]}
                  />
                  <Select 
                    label="Departmental Assignment"
                    value={formData.department}
                    onChange={(v) => setFormData({...formData, department: v})}
                    options={[
                      { label: 'Executive Management', value: 'Executive Management' },
                      { label: 'Human Resources', value: 'Human Resources' },
                      { label: 'Finance & Treasury', value: 'Finance & Treasury' },
                      { label: 'Clinical Operations', value: 'Clinical Operations' },
                      { label: 'Legal & Compliance', value: 'Legal & Compliance' },
                    ]}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Authority Configuration */}
            {step === 3 && (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                <div className="grid grid-cols-1 gap-6">
                  <Select 
                    label="System Identity Role"
                    value={formData.role}
                    onChange={(v) => setFormData({...formData, role: v})}
                    options={[
                      { label: 'Super Administrator', value: 'Super Administrator' },
                      { label: 'Regional HR Lead', value: 'Regional HR Lead' },
                      { label: 'Finance Controller', value: 'Finance Controller' },
                      { label: 'Operations Manager', value: 'Operations Manager' },
                      { label: 'Staff Practitioner', value: 'Staff Practitioner' },
                    ]}
                  />
                  <Select 
                    label="Governed Access Scope"
                    value={formData.scope}
                    onChange={(v) => setFormData({...formData, scope: v})}
                    options={[
                      { label: 'Global Authority (All Hubs)', value: 'Global Authority (All Hubs)' },
                      { label: 'Office Scoped (Single Hub)', value: 'Office Scoped (Single Hub)' },
                      { label: 'Departmental Only', value: 'Departmental Only' },
                      { label: 'Restricted View Only', value: 'Restricted View Only' },
                    ]}
                  />
                </div>
              </div>
            )}

            {/* Step 4: Final Verification */}
            {step === 4 && (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                <div className="p-8 bg-slate-50 border border-slate-100 rounded-[32px] space-y-8">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[24px] bg-white border border-slate-100 flex items-center justify-center text-slate-400 font-black text-xl">
                      {formData.name.split(' ').map(n => n[0]).join('') || '?'}
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-slate-900 tracking-tight">{formData.name || 'Undefined Identity'}</h4>
                      <p className="text-[13px] font-medium text-slate-400">{formData.email || 'no-email@suler.com'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-y-6 gap-x-12 border-t border-slate-200/60 pt-8">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Hub</p>
                      <p className="text-[13px] font-black text-slate-700">{formData.office}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Department</p>
                      <p className="text-[13px] font-black text-slate-700">{formData.department}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Role</p>
                      <p className="text-[13px] font-black text-indigo-600">{formData.role}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Access Scope</p>
                      <p className="text-[13px] font-black text-slate-700">{formData.scope}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-slate-100">
             <button 
               onClick={prevStep}
               disabled={step === 1 || isDispatching}
               className="flex items-center gap-2 px-6 h-[48px] rounded-xl text-[11px] font-black uppercase tracking-widest transition-all text-slate-400 hover:text-slate-900 disabled:opacity-0"
             >
               <ArrowLeft className="w-4 h-4" />
               Previous
             </button>

             {step < 4 ? (
               <button 
                 onClick={nextStep}
                 disabled={!formData.name || !formData.email}
                 className="bg-slate-900 hover:bg-black text-white flex items-center gap-2 px-8 h-[48px] rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-slate-900/10 group"
               >
                 Next Protocol
                 <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
               </button>
             ) : (
               <button 
                 onClick={handleSendInvite}
                 disabled={isDispatching}
                 className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 px-8 h-[48px] rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 group relative overflow-hidden"
               >
                 {isDispatching ? (
                   <Loader2 className="w-5 h-5 animate-spin" />
                 ) : (
                   <>
                     Authorize Provisioning
                     <Send className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                   </>
                 )}
               </button>
             )}
          </div>
        </div>
      ) : (
        <div className="py-6 space-y-10 animate-in zoom-in-95 duration-500">
           <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 rounded-[32px] bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 mb-2">
                 <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                 <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Identity Initialized</h3>
                 <p className="text-[14px] font-medium text-slate-500 max-w-[340px]">
                    The provisioning invite for <span className="font-bold text-slate-900">{formData.name}</span> has been dispatched to the institutional registry.
                 </p>
              </div>
           </div>

           <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Secure Activation Link</label>
                 <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Single-Use Token</span>
              </div>
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl flex items-center justify-between gap-4">
                 <code className="text-[12px] font-bold text-slate-600 truncate flex-1">{activationLink}</code>
                 <button 
                   onClick={copyToClipboard}
                   className={`flex items-center gap-2 px-5 h-[40px] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                     copied ? 'bg-emerald-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-400 shadow-sm'
                   }`}
                 >
                    {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy Token'}
                 </button>
              </div>
           </div>

           <div className="p-6 bg-slate-900 rounded-[32px] text-white flex items-center justify-between shadow-2xl shadow-slate-900/20">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-indigo-400" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Governance Status</p>
                    <p className="text-[15px] font-black tracking-tight leading-none">Awaiting Identity Activation</p>
                 </div>
              </div>
              <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-[10px] font-black uppercase tracking-widest">
                 ISO 27001
              </div>
           </div>

           <div className="flex items-center justify-center pt-4">
              <button 
                onClick={onClose}
                className="bg-slate-50 border border-slate-100 px-8 h-[48px] rounded-xl text-[11px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-900 hover:bg-white transition-all"
              >
                Close Pipeline
              </button>
           </div>
        </div>
      )}
    </Modal>
  );
};

const Loader2 = ({ className }: { className?: string }) => (
  <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);
