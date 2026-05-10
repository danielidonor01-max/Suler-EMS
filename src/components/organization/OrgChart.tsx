"use client";

import React, { useMemo } from 'react';
import { useWorkforce, Employee } from '@/context/WorkforceContext';
import { 
  Building2, 
  MapPin, 
  Briefcase, 
  User, 
  ShieldCheck,
  ChevronRight,
  Target
} from 'lucide-react';

import { useOrganization } from '@/context/OrganizationContext';

export const OrgChart: React.FC = () => {
  const { employees } = useWorkforce();
  const { currentHub } = useOrganization();

  // Grouping logic for hierarchy
  const hierarchy = useMemo(() => {
    const hubs: Record<string, any> = {};

    employees.filter(emp => currentHub === 'All Regions' || emp.hub === currentHub).forEach(emp => {
      const hubName = emp.hub;
      const deptName = emp.department || 'Operations';
      
      if (!hubs[hubName]) {
        hubs[hubName] = { name: hubName, departments: {} };
      }
      
      if (!hubs[hubName].departments[deptName]) {
        hubs[hubName].departments[deptName] = { name: deptName, roles: { Manager: [], Staff: [] } };
      }

      // Simple promotion logic for visualization: role 'Operations Manager' or 'HR Admin' are "Managers"
      const isManager = emp.role.includes('Manager') || emp.role.includes('Admin');
      const category = isManager ? 'Manager' : 'Staff';
      
      hubs[hubName].departments[deptName].roles[category].push(emp);
    });

    return Object.values(hubs);
  }, [employees]);

  return (
    <div className="space-y-12 pb-20">
      
      {/* Root node */}
      <div className="flex flex-col items-center">
         <div className="bg-slate-900 text-white p-6 rounded-[24px] shadow-xl border-4 border-white ring-1 ring-slate-200 flex flex-col items-center gap-2 w-[240px]">
            <Building2 className="w-6 h-6 text-indigo-400" />
            <h3 className="text-[13px] font-black uppercase tracking-[0.2em]">Suler Global</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enterprise Headquarters</p>
         </div>
         <div className="w-px h-12 bg-slate-200" />
      </div>

      {/* Hubs Layer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
         {hierarchy.map((hub, hubIdx) => (
            <div key={hubIdx} className="flex flex-col items-center">
               <div className="bg-white p-5 rounded-[20px] shadow-premium border border-slate-200 flex flex-col items-center gap-2 w-full max-w-[280px]">
                  <MapPin className="w-5 h-5 text-slate-400" />
                  <h4 className="text-[14px] font-bold text-slate-900 tracking-tight">{hub.name}</h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Regional Hub</p>
               </div>
               <div className="w-px h-10 bg-slate-200" />
               
               {/* Departments Layer */}
               <div className="w-full space-y-8">
                  {Object.values(hub.departments).map((dept: any, deptIdx) => (
                     <div key={deptIdx} className="flex flex-col items-center">
                        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-center gap-3 w-full">
                           <Briefcase className="w-4 h-4 text-indigo-500" />
                           <div>
                              <h5 className="text-[12px] font-bold text-indigo-900 leading-none mb-1">{dept.name}</h5>
                              <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">{dept.roles.Manager.length + dept.roles.Staff.length} Members</p>
                           </div>
                        </div>
                        <div className="w-px h-6 bg-indigo-100" />

                        {/* Roles Layer: Management & Staff */}
                        <div className="w-full grid grid-cols-1 gap-4 pl-4 border-l-2 border-indigo-50 ml-4">
                           
                           {/* Management Cluster */}
                           {dept.roles.Manager.length > 0 && (
                             <div className="space-y-2">
                                <div className="flex items-center gap-2 text-indigo-900 opacity-60">
                                   <ShieldCheck className="w-3 h-3" />
                                   <span className="text-[9px] font-bold uppercase tracking-widest">Leadership</span>
                                </div>
                                {dept.roles.Manager.map((emp: Employee) => (
                                  <NodeCard key={emp.id} employee={emp} isManager={true} />
                                ))}
                             </div>
                           )}

                           {/* Staff Cluster */}
                           {dept.roles.Staff.length > 0 && (
                             <div className="space-y-2">
                                <div className="flex items-center gap-2 text-slate-400">
                                   <User className="w-3 h-3" />
                                   <span className="text-[9px] font-bold uppercase tracking-widest">Operations</span>
                                </div>
                                {dept.roles.Staff.map((emp: Employee) => (
                                  <NodeCard key={emp.id} employee={emp} isManager={false} />
                                ))}
                             </div>
                           )}

                        </div>
                     </div>
                  ))}
               </div>
            </div>
         ))}
      </div>
    </div>
  );
};

const NodeCard = ({ employee, isManager }: { employee: Employee, isManager: boolean }) => (
  <div className={`p-4 rounded-xl border transition-all hover:shadow-md ${
    isManager 
      ? 'bg-slate-900 text-white border-slate-800' 
      : 'bg-white text-slate-900 border-slate-100 shadow-sm'
  }`}>
    <div className="flex items-center justify-between gap-3">
       <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold ${
            isManager ? 'bg-indigo-600' : 'bg-slate-50 border border-slate-100 text-slate-400'
          }`}>
             {employee.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
             <h6 className="text-[13px] font-bold tracking-tight leading-none mb-1">{employee.name}</h6>
             <p className={`text-[9px] font-bold uppercase tracking-widest ${isManager ? 'text-indigo-400' : 'text-slate-400'}`}>
                {employee.designation || employee.role}
             </p>
          </div>
       </div>
       {isManager && <Target className="w-3.5 h-3.5 text-indigo-400" />}
    </div>
  </div>
);
