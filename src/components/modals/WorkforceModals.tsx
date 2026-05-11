"use client";

import React, { useState, useEffect } from 'react';
import { 
  UserCircle, 
  ShieldAlert, 
  Trash2, 
  AlertTriangle,
  Fingerprint,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  Loader2,
  ShieldCheck,
  Activity,
  History,
  Zap
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useWorkforce, Employee } from '@/context/WorkforceContext';
import { useToast } from '../common/ToastContext';
import { useOrganization } from '@/context/OrganizationContext';
import { Select } from '../forms/Select';

interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
}

export const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({ isOpen, onClose, employee }) => {
  const [formData, setFormData] = useState({ ...employee });
  const [isUpdating, setIsUpdating] = useState(false);
  const { updateEmployee } = useWorkforce();
  const { toast } = useToast();

  const handleUpdate = () => {
    setIsUpdating(true);
    toast({ 
      type: 'loading', 
      message: 'Synchronizing Identity...', 
      description: `Updating organizational metadata for ${employee.name}.` 
    });
    
    setTimeout(() => {
      updateEmployee(employee.id, formData);
      setIsUpdating(false);
      onClose();
      toast({ 
        type: 'success', 
        message: 'Identity Updated', 
        description: 'Employee records synchronized across the intelligence cluster.' 
      });
    }, 1500);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Edit Employee Identity" 
      subtitle={`EMP ID: ${employee.id}`}
      size="md"
    >
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
         <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Full Name</label>
               <input 
                 value={formData.name} 
                 onChange={e => setFormData({...formData, name: e.target.value})}
                 className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] font-bold outline-none focus:border-indigo-500 transition-all shadow-sm"
               />
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Email Address</label>
               <input 
                 value={formData.email} 
                 onChange={e => setFormData({...formData, email: e.target.value})}
                 className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] font-bold outline-none focus:border-indigo-500 transition-all shadow-sm"
               />
            </div>
         </div>

         <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Operational Role"
              value={formData.role}
              onChange={val => setFormData({...formData, role: val})}
              options={[
                { label: 'Super Administrator', value: 'Super Administrator' },
                { label: 'HR Admin', value: 'HR Admin' },
                { label: 'Finance Admin', value: 'Finance Admin' },
                { label: 'Operations Manager', value: 'Operations Manager' },
                { label: 'Staff Practitioner', value: 'Staff Practitioner' },
              ]}
            />
            <Select 
              label="Designated Hub"
              value={formData.hub}
              onChange={val => setFormData({...formData, hub: val})}
              options={[
                { label: 'Lagos HQ', value: 'Lagos HQ' },
                { label: 'Abuja Operations', value: 'Abuja Operations' },
                { label: 'Benin Branch', value: 'Benin Branch' },
                { label: 'Remote / Global', value: 'Remote / Global' },
              ]}
            />
         </div>

         <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-4">
            <ShieldCheck className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
               <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">Governance Propagation</h4>
               <p className="text-[12px] text-slate-500 leading-relaxed font-medium">
                  Identity changes will propagate to the ECC and IAM clusters instantly. Session persistence may be affected if the role scope is reduced.
               </p>
            </div>
         </div>

         <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button onClick={onClose} disabled={isUpdating} className="px-6 h-[44px] text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
            <button 
              onClick={handleUpdate}
              disabled={isUpdating}
              className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 px-8 h-[48px] rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20"
            >
               {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Synchronize Identity'}
            </button>
         </div>
      </div>
    </Modal>
  );
};

interface SuspendAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
}

export const SuspendAccessModal: React.FC<SuspendAccessModalProps> = ({ isOpen, onClose, employee }) => {
  const [isSuspending, setIsSuspending] = useState(false);
  const { updateEmployee } = useWorkforce();
  const { toast } = useToast();

  const handleSuspend = () => {
    setIsSuspending(true);
    toast({ 
      type: 'loading', 
      message: 'Revoking Authority...', 
      description: `Terminating active sessions and suspending access for ${employee.name}.` 
    });
    
    setTimeout(() => {
      updateEmployee(employee.id, { status: 'INACTIVE' });
      setIsSuspending(false);
      onClose();
      toast({ 
        type: 'success', 
        message: 'Authority Revoked', 
        description: 'Account status updated to INACTIVE. Active tokens invalidated.' 
      });
    }, 2000);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="High-Authority Governance Action" 
      subtitle="Identity Suspension"
      size="sm"
    >
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
         <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-[24px] bg-rose-50 text-rose-500 flex items-center justify-center border-2 border-rose-100 shadow-sm">
               <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="space-y-2">
               <h3 className="text-lg font-bold text-slate-900 tracking-tight">Suspend Access?</h3>
               <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
                 You are about to revoke all organizational access for **{employee.name}**. This will instantly invalidate active sessions and stop all workflow participation.
               </p>
            </div>
         </div>

         <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-xl">
            <p className="text-[11px] text-rose-600 font-bold text-center uppercase tracking-widest">
               Requires Guardian Authorization
            </p>
         </div>

         <div className="flex flex-col gap-3 pt-2">
            <button 
              onClick={handleSuspend}
              disabled={isSuspending}
              className="bg-rose-600 hover:bg-rose-700 text-white w-full h-[52px] rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2"
            >
               {isSuspending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Suspension'}
            </button>
            <button onClick={onClose} disabled={isSuspending} className="w-full h-[48px] text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">
               Abort Action
            </button>
         </div>
      </div>
    </Modal>
  );
};

interface ModifyRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
}

export const ModifyRoleModal: React.FC<ModifyRoleModalProps> = ({ isOpen, onClose, employee }) => {
  const [role, setRole] = useState(employee.role);
  const [isUpdating, setIsUpdating] = useState(false);
  const { updateEmployee } = useWorkforce();
  const { toast } = useToast();

  const handleUpdate = () => {
    setIsUpdating(true);
    toast({ type: 'loading', message: 'Reconfiguring Capability...', description: `Updating authority scope for ${employee.name}.` });
    
    setTimeout(() => {
      updateEmployee(employee.id, { role });
      setIsUpdating(false);
      onClose();
      toast({ 
        type: 'success', 
        message: 'Capability Matrix Updated', 
        description: 'New role designations synchronized across the cluster.' 
      });
    }, 1200);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Modify Organizational Role" 
      subtitle={`Capability Management: ${employee.name}`}
      size="sm"
    >
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
         <div className="p-6 bg-slate-900 rounded-[24px] text-white space-y-4">
            <div className="flex items-center gap-3">
               <Fingerprint className="w-5 h-5 text-indigo-400" />
               <h4 className="text-[13px] font-bold uppercase tracking-widest">IAM Authority Scope</h4>
            </div>
            <p className="text-[12px] text-slate-400 leading-relaxed font-medium">
               Modifying the role will instantly re-render the workspace for this user and affect their permission matrix.
            </p>
         </div>

         <div className="space-y-4">
            <Select 
              label="Select New Role Designation"
              value={role}
              onChange={setRole}
              options={[
                { label: 'Super Administrator', value: 'Super Administrator' },
                { label: 'HR Admin', value: 'HR Admin' },
                { label: 'Finance Admin', value: 'Finance Admin' },
                { label: 'Operations Manager', value: 'Operations Manager' },
                { label: 'Staff Practitioner', value: 'Staff Practitioner' },
              ]}
            />
         </div>

         <div className="flex flex-col gap-3 pt-4 border-t border-slate-50">
            <button 
              onClick={handleUpdate}
              disabled={isUpdating}
              className="bg-slate-900 hover:bg-slate-950 text-white w-full h-[52px] rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2"
            >
               {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply Role Mutation'}
            </button>
            <button onClick={onClose} disabled={isUpdating} className="w-full h-[48px] text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">
               Cancel
            </button>
         </div>
      </div>
    </Modal>
  );
};

interface OnboardMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardMemberModal: React.FC<OnboardMemberModalProps> = ({ isOpen, onClose }) => {
  const { hubs, departments, currentHub } = useOrganization();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Staff Practitioner',
    hub: currentHub !== 'All Regions' ? currentHub : (hubs[0]?.name || 'Lagos HQ'),
    department: departments[0]?.name || 'Operations',
    designation: '',
    staffId: '',
    employmentType: 'FULL_TIME',
    startDate: new Date().toISOString().split('T')[0]
  });

  // Sync office if context changes while modal is closed
  useEffect(() => {
    if (!isOpen) {
      setFormData(prev => ({
        ...prev,
        hub: currentHub !== 'All Regions' ? currentHub : (hubs[0]?.name || 'Lagos HQ')
      }));
    }
  }, [currentHub, isOpen, hubs]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createEmployee } = useWorkforce();
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!formData.name || !formData.email || !formData.designation) {
      toast({ type: 'error', message: 'Validation Error', description: 'Identity and Organizational Placement fields are required.' });
      return;
    }

    setIsSubmitting(true);
    toast({ type: 'loading', message: 'Initializing Member Identity...', description: `Creating organizational record for ${formData.name}.` });
    
    setTimeout(() => {
      const result = createEmployee({
        ...formData,
        status: 'ACTIVE',
        id: formData.staffId || `SUL-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
      } as any);
      
      setIsSubmitting(false);
      
      if (result.success) {
        onClose();
        toast({ 
          type: 'success', 
          message: 'Member Onboarded', 
          description: `Successfully onboarded to ${formData.hub} as ${formData.designation}.` 
        });
      } else {
        toast({ 
          type: 'error', 
          message: 'Onboarding Failed', 
          description: result.error || 'An organizational policy prevented this action.' 
        });
      }
    }, 2000);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Onboard New Organization Member" 
      subtitle="Identity & Organizational Placement"
      size="lg"
    >
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
         
         {/* Section: Identity */}
         <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
               <UserCircle className="w-4 h-4 text-slate-400" />
               <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Personal Identity</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Full Name</label>
                  <input 
                    placeholder="e.g. Jane Doe"
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] font-bold outline-none focus:border-indigo-500 transition-all shadow-sm"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Email Address</label>
                  <input 
                    type="email"
                    placeholder="jane@sulerglobal.com"
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] font-bold outline-none focus:border-indigo-500 transition-all shadow-sm"
                  />
               </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Operational Mobile</label>
                  <input 
                    placeholder="+234 ..."
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] font-bold outline-none focus:border-indigo-500 transition-all shadow-sm"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Staff ID (Optional)</label>
                  <input 
                    placeholder="SUL-..."
                    value={formData.staffId} 
                    onChange={e => setFormData({...formData, staffId: e.target.value})}
                    className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] font-bold outline-none focus:border-indigo-500 transition-all shadow-sm"
                  />
               </div>
            </div>
         </div>

         {/* Section: Organizational Placement */}
         <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
               <Briefcase className="w-4 h-4 text-slate-400" />
               <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Organizational Placement</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <Select 
                 label="Designated Hub"
                 value={formData.hub}
                 onChange={val => setFormData({...formData, hub: val})}
                 options={hubs.map(h => ({ label: h.name, value: h.name }))}
               />
               <Select 
                 label="Department"
                 value={formData.department}
                 onChange={val => setFormData({...formData, department: val})}
                 options={departments
                   .filter(d => d.parentHub === formData.hub)
                   .map(d => ({ label: d.name, value: d.name }))
                 }
               />
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Principal Designation</label>
               <input 
                 placeholder="e.g. Electrical Maintenance Engineer"
                 value={formData.designation} 
                 onChange={e => setFormData({...formData, designation: e.target.value})}
                 className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] font-bold outline-none focus:border-indigo-500 transition-all shadow-sm"
               />
            </div>
         </div>

         {/* Section: System Access */}
         <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
               <ShieldCheck className="w-4 h-4 text-slate-400" />
               <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Access & Authority</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <Select 
                 label="System Role"
                 value={formData.role}
                 onChange={val => setFormData({...formData, role: val})}
                 options={[
                   { label: 'Super Administrator', value: 'Super Administrator' },
                   { label: 'HR Admin', value: 'HR Admin' },
                   { label: 'Finance Admin', value: 'Finance Admin' },
                   { label: 'Operations Manager', value: 'Operations Manager' },
                   { label: 'Staff Practitioner', value: 'Staff Practitioner' },
                 ]}
               />
               <div className="flex items-center gap-3 px-4 h-[48px] bg-indigo-50/50 border border-indigo-100 rounded-xl mt-6">
                  <input type="checkbox" id="sendInvite" className="w-4 h-4 rounded border-indigo-200 text-indigo-600 focus:ring-indigo-500" defaultChecked />
                  <label htmlFor="sendInvite" className="text-[12px] font-bold text-indigo-900">Send Invitation Email</label>
               </div>
            </div>
         </div>

         <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 sticky bottom-0 bg-white">
            <button onClick={onClose} disabled={isSubmitting} className="px-6 h-[44px] text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 px-8 h-[48px] rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20"
            >
               {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Onboarding'}
            </button>
         </div>
      </div>
    </Modal>
  );
};

interface PromoteEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
}

export const PromoteEmployeeModal: React.FC<PromoteEmployeeModalProps> = ({ isOpen, onClose, employee }) => {
  const [designation, setDesignation] = useState(employee.designation || '');
  const [role, setRole] = useState(employee.role);
  const [isPromoting, setIsPromoting] = useState(false);
  const { promoteEmployee } = useWorkforce();
  const { toast } = useToast();

  const handlePromote = () => {
    setIsPromoting(true);
    toast({ type: 'loading', message: 'Executing Rank Escalation...', description: `Promoting ${employee.name} to ${designation}.` });
    
    setTimeout(() => {
      promoteEmployee(employee.id, designation, role);
      setIsPromoting(false);
      onClose();
      toast({ 
        type: 'success', 
        message: 'Promotion Successful', 
        description: 'New organizational rank and authority levels established.' 
      });
    }, 2000);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Execute Rank Escalation" 
      subtitle={`Career Governance: ${employee.name}`}
      size="sm"
    >
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
         <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-[24px] bg-indigo-50 text-indigo-600 flex items-center justify-center border-2 border-indigo-100 shadow-sm">
               <Zap className="w-8 h-8" />
            </div>
            <div className="space-y-2">
               <h3 className="text-lg font-bold text-slate-900 tracking-tight">Promote Member?</h3>
               <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
                 You are escalating the organizational rank for **{employee.name}**. This mutation affects the org chart and IAM permissions.
               </p>
            </div>
         </div>

         <div className="space-y-6">
            <div className="space-y-2">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">New Principal Designation</label>
               <input 
                 placeholder="e.g. Finance Manager"
                 value={designation} 
                 onChange={e => setDesignation(e.target.value)}
                 className="w-full h-[48px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] font-bold outline-none focus:border-indigo-500 transition-all shadow-sm"
               />
            </div>
            <Select 
               label="Assign New System Role"
               value={role}
               onChange={setRole}
               options={[
                 { label: 'Operations Manager', value: 'Operations Manager' },
                 { label: 'HR Admin', value: 'HR Admin' },
                 { label: 'Finance Admin', value: 'Finance Admin' },
                 { label: 'Super Administrator', value: 'Super Administrator' },
               ]}
            />
         </div>

         <div className="flex flex-col gap-3 pt-4 border-t border-slate-50">
            <button 
              onClick={handlePromote}
              disabled={isPromoting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white w-full h-[52px] rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
            >
               {isPromoting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Promotion'}
            </button>
            <button onClick={onClose} disabled={isPromoting} className="w-full h-[48px] text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">
               Abort Escalation
            </button>
         </div>
      </div>
    </Modal>
  );
};
