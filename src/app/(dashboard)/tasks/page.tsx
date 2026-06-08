"use client";

import React, { useMemo, useState } from 'react';
import { useAccess } from '@/context/AccessContext';
import { usePayroll } from '@/context/PayrollContext';
import { useLeave } from '@/context/LeaveContext';
import { Permissions } from '@/modules/auth/domain/permission.model';
import {
  CheckCircle2, Clock, Target, AlertTriangle,
  DollarSign, Calendar, User, ChevronRight,
  Inbox, ArrowRight, Zap
} from 'lucide-react';

type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';
type TaskStatus = 'PENDING' | 'DONE';

interface Task {
  id: string;
  title: string;
  description: string;
  type: 'PAYROLL_APPROVAL' | 'LEAVE_APPROVAL' | 'ONBOARDING' | 'REVIEW';
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  actionLabel: string;
  actionHref: string;
}

const priorityConfig: Record<TaskPriority, { label: string; color: string; bg: string; border: string }> = {
  HIGH:   { label: 'High',   color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-100'    },
  MEDIUM: { label: 'Medium', color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-100'  },
  LOW:    { label: 'Low',    color: 'text-slate-500',  bg: 'bg-slate-50',  border: 'border-slate-200'  },
};

const typeIcon: Record<Task['type'], React.ElementType> = {
  PAYROLL_APPROVAL: DollarSign,
  LEAVE_APPROVAL:   Calendar,
  ONBOARDING:       User,
  REVIEW:           Target,
};

const typeColor: Record<Task['type'], string> = {
  PAYROLL_APPROVAL: 'bg-emerald-50 border-emerald-100 text-emerald-600',
  LEAVE_APPROVAL:   'bg-indigo-50  border-indigo-100  text-indigo-600',
  ONBOARDING:       'bg-sky-50     border-sky-100     text-sky-600',
  REVIEW:           'bg-purple-50  border-purple-100  text-purple-600',
};

export default function MyTasksPage() {
  const { user, userRole, checkPermission } = useAccess();
  const { payrollRuns } = usePayroll();
  const { requests: leaveRequests } = useLeave();
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const canApproveLeave    = checkPermission(Permissions.LEAVE_APPROVE).allowed;
  const canApprovePayroll  = checkPermission(Permissions.PAYROLL_APPROVE).allowed;
  const canManageWorkforce = checkPermission(Permissions.WORKFORCE_CREATE).allowed;

  // Build tasks dynamically from real context data + role permissions
  const tasks: Task[] = useMemo(() => {
    const list: Task[] = [];

    if (canApprovePayroll) {
      const draftRuns = payrollRuns.filter(r => r.status === 'REVIEWED');
      draftRuns.forEach(run => {
        list.push({
          id: `PAY-${run.id}`,
          title: `Review Payroll · ${run.period}`,
          description: `${run.entries.length} employee entries · Total Net: ₦${run.totalNet.toLocaleString('en-NG')}`,
          type: 'PAYROLL_APPROVAL',
          priority: 'HIGH',
          status: 'PENDING',
          dueDate: 'End of month',
          actionLabel: 'Review & Approve',
          actionHref: '/payroll/register',
        });
      });

      // Pending DRAFT runs also need attention
      const pendingDrafts = payrollRuns.filter(r => r.status === 'DRAFT');
      pendingDrafts.forEach(run => {
        list.push({
          id: `PAY-DRAFT-${run.id}`,
          title: `Finalise Payroll Draft · ${run.period}`,
          description: `${run.entries.length} entries awaiting review`,
          type: 'PAYROLL_APPROVAL',
          priority: 'MEDIUM',
          status: 'PENDING',
          actionLabel: 'Open Register',
          actionHref: '/payroll/register',
        });
      });
    }

    // Dynamic Leave Approvals
    if (userRole === 'MANAGER' || userRole === 'SUPER_ADMIN') {
      const pendingForManager = leaveRequests.filter(r => r.currentState === 'SUBMITTED');
      pendingForManager.forEach(req => {
        list.push({
          id: `LV-TASK-${req.id}`,
          title: `Approve Leave: ${req.employeeName}`,
          description: `${req.type} · ${req.days} days requested (${req.startDate} to ${req.endDate}). Reason: ${req.reason}`,
          type: 'LEAVE_APPROVAL',
          priority: 'HIGH',
          status: 'PENDING',
          actionLabel: 'Review Request',
          actionHref: '/leave/admin',
        });
      });
    }

    if (canApproveLeave || userRole === 'HR_ADMIN' || userRole === 'SUPER_ADMIN') {
      const pendingForHR = leaveRequests.filter(r => r.currentState === 'MANAGER_APPROVED');
      pendingForHR.forEach(req => {
        list.push({
          id: `LV-TASK-${req.id}`,
          title: `HR Final Approval: ${req.employeeName}`,
          description: `${req.type} · ${req.days} days requested (${req.startDate} to ${req.endDate}). Approved by Manager.`,
          type: 'LEAVE_APPROVAL',
          priority: 'HIGH',
          status: 'PENDING',
          actionLabel: 'Review Request',
          actionHref: '/leave/admin',
        });
      });
    }

    if (canManageWorkforce) {
      list.push({
        id: 'ONBOARD-001',
        title: 'Onboarding Checklist Incomplete',
        description: '2 new employees have pending document uploads in their profiles',
        type: 'ONBOARDING',
        priority: 'MEDIUM',
        status: 'PENDING',
        actionLabel: 'Open Workforce',
        actionHref: '/employees',
      });
    }

    // Personal tasks for all employees
    list.push({
      id: 'SELF-001',
      title: 'Complete Your Profile',
      description: 'Add your next-of-kin details and confirm your contact information',
      type: 'REVIEW',
      priority: 'LOW',
      status: 'PENDING',
      actionLabel: 'Go to Profile',
      actionHref: '/profile',
    });

    return list;
  }, [payrollRuns, canApprovePayroll, canApproveLeave, canManageWorkforce]);

  const activeTasks  = tasks.filter(t => !completed.has(t.id));
  const doneTasks    = tasks.filter(t =>  completed.has(t.id));
  const highCount    = activeTasks.filter(t => t.priority === 'HIGH').length;

  const handleDone = (id: string) => setCompleted(prev => new Set([...prev, id]));

  return (
    <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Tasks</h1>
          <p className="text-[13px] font-medium text-slate-400 mt-1">
            <span className="text-slate-600 font-bold">{user?.name || 'Employee'}</span>
            {' · '}<span className="font-bold">{userRole}</span> · Pending actions &amp; approvals inbox
          </p>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Active Tasks',  value: activeTasks.length, color: 'text-indigo-600 bg-indigo-50 border-indigo-100', icon: Target },
            { label: 'High Priority', value: highCount,          color: 'text-red-600   bg-red-50    border-red-100',    icon: AlertTriangle },
            { label: 'Completed',     value: doneTasks.length,   color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: CheckCircle2 },
          ].map(k => {
            const Icon = k.icon;
            return (
              <div key={k.label} className={`p-5 rounded-[20px] border ${k.color} space-y-2`}>
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-70">{k.label}</p>
                  <Icon className="w-4 h-4 opacity-40" />
                </div>
                <p className="text-3xl font-black">{k.value}</p>
              </div>
            );
          })}
        </div>

        {/* High Priority Banner */}
        {highCount > 0 && (
          <div className="flex items-center gap-4 px-6 py-4 bg-red-50 border border-red-100 rounded-[16px]">
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center text-red-500 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <p className="text-[13px] font-bold text-red-700">
              You have <span className="text-red-600">{highCount} high-priority {highCount === 1 ? 'task' : 'tasks'}</span> requiring immediate action.
            </p>
          </div>
        )}

        {/* Active Tasks */}
        {activeTasks.length === 0 ? (
          <div className="p-16 border-2 border-dashed border-slate-200 rounded-[28px] flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">All Caught Up!</h3>
            <p className="text-[13px] text-slate-400 mt-1 max-w-xs">No pending tasks or approvals. Check back after new payroll runs or leave requests are submitted.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Active · {activeTasks.length}</h2>
            {activeTasks.map(task => {
              const TypeIcon = typeIcon[task.type];
              const pri = priorityConfig[task.priority];
              return (
                <div
                  key={task.id}
                  className="bg-white border border-slate-200 rounded-[20px] p-6 flex items-center justify-between gap-5 shadow-sm hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${typeColor[task.type]}`}>
                      <TypeIcon className="w-4 h-4" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[14px] font-black text-slate-900">{task.title}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest border ${pri.bg} ${pri.color} ${pri.border}`}>
                          {pri.label}
                        </span>
                      </div>
                      <p className="text-[12px] text-slate-500 font-medium max-w-sm">{task.description}</p>
                      {task.dueDate && (
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600">
                          <Clock className="w-3 h-3" /> Due: {task.dueDate}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleDone(task.id)}
                      title="Mark as done"
                      className="w-9 h-9 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 text-slate-400 flex items-center justify-center transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <a
                      href={task.actionHref}
                      className="flex items-center gap-1.5 px-4 h-9 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all"
                    >
                      {task.actionLabel}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Completed Tasks */}
        {doneTasks.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Completed · {doneTasks.length}</h2>
            {doneTasks.map(task => {
              const TypeIcon = typeIcon[task.type];
              return (
                <div key={task.id} className="bg-slate-50 border border-slate-100 rounded-[20px] p-5 flex items-center gap-4 opacity-60">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-slate-600 line-through">{task.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Marked complete</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
