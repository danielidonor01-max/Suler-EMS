"use client";

import React, { useState } from 'react';
import { useAccess } from '@/context/AccessContext';
import {
  User, Mail, Shield, Bell, Lock, Edit3, Check,
  Building2, BadgeCheck, Smartphone, Globe, ChevronRight
} from 'lucide-react';

export default function ProfilePage() {
  const { user, userRole } = useAccess();
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const name = user?.name || 'Employee';
  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  const email = user?.id || 'employee@sulerems.com';
  const role = userRole || 'EMPLOYEE';
  const employeeId = user?.employeeId || '—';
  const departmentId = user?.departmentId || '—';

  const handleSave = (section: string) => {
    setEditingSection(null);
    setSaved(section);
    setTimeout(() => setSaved(null), 2000);
  };

  const roleLabel: Record<string, string> = {
    SUPER_ADMIN: 'Super Administrator',
    HR_ADMIN: 'HR Administrator',
    FINANCE_MANAGER: 'Finance Manager',
    MANAGER: 'Manager',
    EMPLOYEE: 'Employee',
  };

  const sections = [
    {
      id: 'personal',
      icon: User,
      title: 'Personal Details',
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
      fields: [
        { label: 'Full Name', value: name },
        { label: 'Employee ID', value: employeeId },
        { label: 'Department', value: departmentId },
        { label: 'Role', value: roleLabel[role] || role },
      ]
    },
    {
      id: 'contact',
      icon: Mail,
      title: 'Contact & Identity',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      fields: [
        { label: 'Work Email', value: email },
        { label: 'Organization', value: 'Suler Global' },
        { label: 'Hub', value: 'Lagos HQ' },
        { label: 'Contract Type', value: 'Full-Time' },
      ]
    },
  ];

  return (
    <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Hero Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[28px] p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
          <div className="relative z-10 flex items-center gap-6">
            <div className="w-20 h-20 rounded-[20px] bg-indigo-500 flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-indigo-900/30">
              {initials}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-md text-[9px] font-bold uppercase tracking-widest border border-emerald-500/30 flex items-center gap-1">
                  <BadgeCheck className="w-3 h-3" /> Verified
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{role}</span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">{name}</h1>
              <p className="text-[13px] font-medium text-slate-400">{email}</p>
            </div>
          </div>
        </div>

        {/* Detail Sections */}
        {sections.map((section) => {
          const Icon = section.icon;
          const isEditing = editingSection === section.id;
          const isSaved = saved === section.id;
          return (
            <div key={section.id} className="bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl ${section.bg} ${section.border} border flex items-center justify-center ${section.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h2 className="text-[13px] font-bold text-slate-900 uppercase tracking-widest">{section.title}</h2>
                </div>
                <button
                  onClick={() => isEditing ? handleSave(section.id) : setEditingSection(section.id)}
                  className={`flex items-center gap-1.5 px-4 h-8 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                    isSaved
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      : isEditing
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-50 text-slate-500 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {isSaved ? <><Check className="w-3 h-3" /> Saved</> : isEditing ? <><Check className="w-3 h-3" /> Save</> : <><Edit3 className="w-3 h-3" /> Edit</>}
                </button>
              </div>
              <div className="p-7 grid grid-cols-1 md:grid-cols-2 gap-6">
                {section.fields.map((field) => (
                  <div key={field.label} className="space-y-1.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">{field.label}</span>
                    {isEditing && field.label !== 'Employee ID' && field.label !== 'Role' ? (
                      <input
                        defaultValue={field.value}
                        className="w-full px-3 py-2 text-[13px] font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
                      />
                    ) : (
                      <p className="text-[14px] font-bold text-slate-900">{field.value}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Security & Preferences */}
        <div className="bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-sm">
          <div className="flex items-center gap-3 px-7 py-5 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Shield className="w-4 h-4" />
            </div>
            <h2 className="text-[13px] font-bold text-slate-900 uppercase tracking-widest">Security & Preferences</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {[
              { icon: Lock, label: 'Change Password', desc: 'Last changed 30 days ago', action: 'Update' },
              { icon: Smartphone, label: 'Two-Factor Authentication', desc: 'Authenticator app enabled', action: 'Manage' },
              { icon: Bell, label: 'Notification Preferences', desc: 'Email, push & in-app alerts', action: 'Configure' },
              { icon: Globe, label: 'Language & Region', desc: 'English (NG) · UTC+1 Lagos', action: 'Change' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.label} className="w-full flex items-center justify-between px-7 py-4 hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-slate-100 transition-colors">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-left">
                      <p className="text-[13px] font-bold text-slate-900">{item.label}</p>
                      <p className="text-[11px] font-medium text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 group-hover:text-indigo-600 uppercase tracking-widest transition-colors">
                    {item.action}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
