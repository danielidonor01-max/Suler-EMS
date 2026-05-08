"use client";

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Activity, 
  Globe, 
  Zap, 
  Lock, 
  Fingerprint, 
  UserCheck, 
  MoreHorizontal, 
  ShieldAlert,
  Key,
  ChevronRight,
  Clock,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { EditRolePermissionsModal, RevokeSessionModal } from '@/components/modals/IAMModals';

// Mock Capability Matrix
const MODULE_PERMISSIONS = [
  { id: 1, module: 'Executive Governance', desc: 'Organizational strategy and policy control', roles: { superAdmin: 'FULL', hrAdmin: 'NONE', manager: 'NONE', staff: 'NONE' } },
  { id: 2, module: 'Workforce Records', desc: 'Employee data and personnel management', roles: { superAdmin: 'FULL', hrAdmin: 'FULL', manager: 'VIEW', staff: 'NONE' } },
  { id: 3, module: 'Financial Data', desc: 'Corporate financial oversight', roles: { superAdmin: 'FULL', hrAdmin: 'NONE', manager: 'NONE', staff: 'NONE' } },
  { id: 4, module: 'Team Intelligence', desc: 'Performance and analytics', roles: { superAdmin: 'FULL', hrAdmin: 'FULL', manager: 'FULL', staff: 'NONE' } },
  { id: 5, module: 'Infrastructure Settings', desc: 'System-wide technical configuration', roles: { superAdmin: 'FULL', hrAdmin: 'NONE', manager: 'NONE', staff: 'NONE' } },
];

// Mock Session Data
const ACTIVE_SESSIONS = [
  { id: 'SES-001', user: 'Chinedu Okoro', role: 'Super Admin', device: 'MacBook Pro 16', location: 'Lagos, NG', ip: '192.168.1.102', lastActive: 'Now' },
  { id: 'SES-002', user: 'Blessing Udoh', role: 'HR Admin', device: 'Windows Desktop', location: 'Abuja, NG', ip: '10.0.0.42', lastActive: '12 mins ago' },
  { id: 'SES-003', user: 'Sarah Williams', role: 'Staff', device: 'iPhone 15 Pro', location: 'London, UK', ip: '82.15.12.94', lastActive: '1h ago' },
];

export default function IAMWorkspace() {
  const [activeTab, setActiveTab] = useState<'roles' | 'sessions' | 'policies'>('roles');
  const [matrixSearch, setMatrixSearch] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  // High-Fidelity State Management
  const [permissions, setPermissions] = useState(MODULE_PERMISSIONS);
  const [rollbackCache, setRollbackCache] = useState<any>(null);
  
  // Simulated Role-Aware Rendering
  const userRole = 'SUPER_ADMIN'; // In production, this comes from context
  const canEdit = userRole === 'SUPER_ADMIN';

  const handleUpdatePermissions = (data: any) => {
    // 1. Transactional Capture (Rollback Point)
    setRollbackCache([...permissions]);
    
    setIsUpdating(true);
    
    // 2. Simulate Optimistic Update or API Cycle
    setTimeout(() => {
      // Simulate 10% Failure Rate for Audit Testing
      const isFailure = Math.random() < 0.1;

      if (isFailure) {
        // 3. Rollback Logic (Governance Continuity)
        if (rollbackCache) setPermissions(rollbackCache);
        setIsUpdating(false);
        setShowError(true);
        setTimeout(() => setShowError(false), 4000);
      } else {
        setIsUpdating(false);
        setIsEditModalOpen(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    }, 1500);
  };

  const handleRevokeSession = () => {
    setIsUpdating(true);
    setTimeout(() => {
      setIsUpdating(false);
      setIsRevokeModalOpen(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1000);
  };

  const filteredPermissions = permissions.filter(p => 
    p.module.toLowerCase().includes(matrixSearch.toLowerCase()) ||
    p.desc.toLowerCase().includes(matrixSearch.toLowerCase())
  );

  return (
    <div className="section-breathing max-w-[1600px] mx-auto animate-in space-y-10 pb-20">
      
      {showError && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-rose-600 text-white px-8 py-4 rounded-[20px] shadow-2xl flex items-center gap-4 animate-in slide-in-from-top-8 duration-500">
           <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
              <AlertTriangle className="w-5 h-5" />
           </div>
           <div className="flex flex-col">
              <p className="text-[14px] font-black tracking-tight leading-none mb-1">Update Protocol Failed</p>
              <p className="text-[11px] font-medium text-rose-100 opacity-80">Security matrix has been rolled back to prevent governance drift.</p>
           </div>
        </div>
      )}
      
      {/* Security Header: Trust & Authority */}
      <div className="bg-slate-950 rounded-[24px] md:rounded-[32px] p-6 md:p-10 border border-slate-800 shadow-2xl relative overflow-hidden text-white">
        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8">
          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center gap-2">
              <div className="px-2 py-0.5 md:px-2.5 md:py-1 bg-emerald-500/10 text-emerald-400 rounded-md text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5 border border-emerald-500/20">
                <ShieldCheck className="w-2.5 h-2.5 md:w-3 md:h-3" />
                Identity Governance Active
              </div>
            </div>
            <div>
               <h1 className="text-2xl md:text-4xl font-black text-white tracking-tighter leading-none mb-2 md:mb-3">
                 IAM <span className="text-indigo-400">Governance</span> Console
               </h1>
               <p className="text-[12px] md:text-[14px] font-medium text-slate-400 leading-relaxed max-w-[520px]">
                 Manage the global organizational capability matrix. Define high-fidelity role policies, monitor active session integrity, and enforce identity lifecycle security.
               </p>
            </div>
          </div>

          <div className="flex items-center gap-4 border-t border-slate-800 pt-6 md:border-none md:pt-0">
             <div className="flex flex-col items-start md:items-end">
                <span className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Global Security Score</span>
                <span className="text-xl md:text-2xl font-black text-white leading-none tracking-tight">98.4%</span>
             </div>
             <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400">
                <Zap className="w-5 h-5 md:w-6 md:h-6" />
             </div>
          </div>
        </div>

        {/* Console Navigation */}
        <div className="flex items-center gap-4 md:gap-8 mt-8 md:mt-12 pt-6 md:pt-8 border-t border-slate-800/60 overflow-x-auto no-scrollbar">
           <TabButton active={activeTab === 'roles'} onClick={() => setActiveTab('roles')} label="Role Matrix" icon={ShieldCheck} />
           <TabButton active={activeTab === 'sessions'} onClick={() => setActiveTab('sessions')} label="Active Sessions" icon={Activity} />
           <TabButton active={activeTab === 'policies'} onClick={() => setActiveTab('policies')} label="Global Policies" icon={Globe} />
        </div>
      </div>

      {showSuccess && (
        <div className="bg-emerald-500 text-white px-6 py-4 rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center justify-between animate-in slide-in-from-top-4">
           <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5" />
              <p className="text-[14px] font-black tracking-tight">Governance Policy Sync Successful</p>
           </div>
           <button onClick={() => setShowSuccess(false)} className="text-[11px] font-black uppercase tracking-widest opacity-60 hover:opacity-100">Dismiss</button>
        </div>
      )}

      {/* Dynamic Console Surface */}
      <div className="space-y-10">
        {activeTab === 'roles' && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
               <div className="space-y-1">
                  <h2 className="text-xl font-black text-slate-900 tracking-tighter">Permission Matrix</h2>
                  <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[480px]">Orchestrate module-level access across the organizational hierarchy.</p>
               </div>
               <div className="relative group">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Search capabilities..." 
                    className="bg-white border border-slate-200 rounded-xl py-2 pl-11 pr-4 text-[12px] font-bold text-slate-900 placeholder:text-slate-300 outline-none focus:border-indigo-500 transition-all w-64 shadow-sm"
                    value={matrixSearch}
                    onChange={(e) => setMatrixSearch(e.target.value)}
                  />
               </div>
            </div>

            <div className="bg-white border border-slate-200/60 rounded-[32px] shadow-sm overflow-hidden overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-4 md:px-8 py-3 md:py-5 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[200px] md:min-w-[300px]">System Module</th>
                    <th className="px-4 md:px-8 py-3 md:py-5 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Super Admin</th>
                    <th className="px-4 md:px-8 py-3 md:py-5 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">HR Admin</th>
                    <th className="px-4 md:px-8 py-3 md:py-5 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Manager</th>
                    <th className="px-4 md:px-8 py-3 md:py-5 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Staff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50/50">
                  {filteredPermissions.map((perm) => (
                    <tr key={perm.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 md:px-8 py-4 md:py-5">
                         <div className="flex flex-col">
                            <span className="text-[12px] md:text-[14px] font-black text-slate-900 tracking-tight leading-none mb-1 md:mb-1.5">{perm.module}</span>
                            <span className="text-[10px] md:text-[11px] font-medium text-slate-400">{perm.desc}</span>
                         </div>
                      </td>
                      <PermissionCell level={perm.roles.superAdmin} />
                      <PermissionCell level={perm.roles.hrAdmin} />
                      <PermissionCell level={perm.roles.manager} />
                      <PermissionCell level={perm.roles.staff} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Quick Role Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <RoleCard 
                role="Super Admin" 
                count={3} 
                desc="Full structural and governance authority."
                onEdit={() => {
                  setSelectedRole({ name: 'Super Admin' });
                  setIsEditModalOpen(true);
                }}
               />
               <RoleCard 
                role="HR Admin" 
                count={8} 
                desc="Workforce management and lifecycle oversight."
                onEdit={() => {
                  setSelectedRole({ name: 'HR Admin' });
                  setIsEditModalOpen(true);
                }}
               />
               <RoleCard 
                role="Staff" 
                count={242} 
                desc="Individual contributor access."
                onEdit={() => {
                  setSelectedRole({ name: 'Staff' });
                  setIsEditModalOpen(true);
                }}
               />
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SecurityMetric icon={Lock} label="Session Isolation" value="ENABLED" status="SECURE" />
                <SecurityMetric icon={Fingerprint} label="Identity Verification" value="99.9%" status="COMPLIANT" />
                <SecurityMetric icon={Clock} label="Avg. Session TTL" value="2h 14m" />
             </div>

             <div className="bg-white border border-slate-200/60 rounded-[32px] shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                   <div className="space-y-1">
                      <h2 className="text-xl font-black text-slate-900 tracking-tighter">Active Identity Sessions</h2>
                      <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[480px]">Real-time monitoring of all authenticated organizational nodes.</p>
                   </div>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/30">
                          <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Identity</th>
                          <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Device Context</th>
                          <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Operational Location</th>
                          <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right pr-12">Governance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50/50">
                        {ACTIVE_SESSIONS.map((session) => (
                          <tr key={session.id} className="group hover:bg-slate-50/50 transition-colors">
                            <td className="px-8 py-5">
                               <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 text-[10px] font-black">
                                     {session.user[0]}
                                  </div>
                                  <div>
                                     <p className="text-[13px] font-black text-slate-900 tracking-tight leading-none mb-1">{session.user}</p>
                                     <p className="text-[11px] font-bold text-indigo-500">{session.role}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-8 py-5">
                               <div className="flex flex-col">
                                  <span className="text-[13px] font-bold text-slate-600">{session.device}</span>
                                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{session.ip}</span>
                               </div>
                            </td>
                            <td className="px-8 py-5">
                               <div className="flex items-center gap-2">
                                  <Globe className="w-3.5 h-3.5 text-slate-300" />
                                  <span className="text-[12px] font-bold text-slate-500">{session.location}</span>
                               </div>
                            </td>
                            <td className="px-8 py-5 text-right pr-12">
                               <button 
                                onClick={() => {
                                  setSelectedUser(session.user);
                                  setIsRevokeModalOpen(true);
                                }}
                                className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-600 transition-colors bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100"
                               >
                                  Revoke
                               </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'policies' && (
          <div className="bg-slate-50 rounded-[40px] border border-slate-200 p-20 flex flex-col items-center justify-center text-center space-y-6">
             <div className="w-20 h-20 rounded-[32px] bg-white shadow-xl flex items-center justify-center text-slate-300">
                <ShieldAlert className="w-10 h-10" />
             </div>
             <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Policy Orchestration Restricted</h3>
                <p className="text-[13px] font-medium text-slate-400 leading-relaxed max-w-[320px]">
                  Global access policies are managed through a separate hardware-authenticated governance tunnel.
                </p>
             </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <EditRolePermissionsModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        role={selectedRole?.name}
        onSubmit={handleUpdatePermissions}
        isUpdating={isUpdating}
      />
      <RevokeSessionModal 
        isOpen={isRevokeModalOpen} 
        onClose={() => setIsRevokeModalOpen(false)} 
        user={selectedUser}
        onRevoke={handleRevokeSession}
        isRevoking={isUpdating}
      />
    </div>
  );
}

const TabButton = ({ active, onClick, label, icon: Icon }: any) => (
  <button 
    onClick={onClick}
    className={`pb-4 px-2 flex items-center gap-2.5 border-b-2 transition-all relative ${
      active ? 'border-indigo-400 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'
    }`}
  >
     <Icon className={`w-4 h-4 ${active ? 'text-indigo-400' : 'text-slate-600'}`} />
     <span className="text-[12px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

const PermissionCell = ({ level }: { level: string }) => {
  const isFull = level === 'FULL';
  const isView = level === 'VIEW';
  const isNone = level === 'NONE';

  return (
    <td className="px-2 md:px-8 py-4 md:py-5">
      <div className="flex justify-center">
        <div className={`w-16 md:w-24 py-1 md:py-1.5 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest text-center border ${
          isFull ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
          isView ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' : 
          'bg-slate-100 text-slate-300 border-slate-200'
        }`}>
          {level}
        </div>
      </div>
    </td>
  );
};

const RoleCard = ({ role, count, desc, onEdit }: any) => (
  <div className="bg-white border border-slate-200/60 rounded-[28px] p-8 shadow-sm space-y-6 group hover:border-indigo-200 transition-all">
     <div className="flex items-center justify-between">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-900 font-black">
           {role[0]}
        </div>
        <span className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{count} Users</span>
     </div>
     <div>
        <h4 className="text-[17px] font-black text-slate-900 tracking-tight mb-1.5">{role}</h4>
        <p className="text-[12px] font-medium text-slate-400 leading-relaxed">{desc}</p>
     </div>
     <button 
      onClick={onEdit}
      className="w-full h-[44px] rounded-xl border border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-500 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all flex items-center justify-center gap-2"
     >
        Orchestrate Policy
        <ChevronRight className="w-4 h-4" />
     </button>
  </div>
);

const SecurityMetric = ({ icon: Icon, label, value, status }: any) => (
  <div className="bg-white border border-slate-200/60 rounded-[24px] p-6 shadow-sm flex items-center gap-5">
     <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
        <Icon className="w-6 h-6" />
     </div>
     <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{label}</p>
        <div className="flex items-baseline gap-2">
           <span className="text-lg font-black text-slate-900 tracking-tight">{value}</span>
           {status && <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{status}</span>}
        </div>
     </div>
  </div>
);
