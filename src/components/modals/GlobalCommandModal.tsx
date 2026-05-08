"use client";

import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  UserPlus, 
  Megaphone, 
  Building2, 
  ShieldCheck, 
  DollarSign, 
  Activity, 
  Zap,
  ArrowRight,
  Target,
  BrainCircuit,
  Settings
} from 'lucide-react';
import { Modal } from '../common/Modal';
import Link from 'next/link';

interface GlobalCommandModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalCommandModal: React.FC<GlobalCommandModalProps> = ({ isOpen, onClose }) => {
  const [search, setSearch] = useState('');

  const ACTIONS = [
    { 
      group: 'IDENTITY & ACCESS',
      items: [
        { name: 'Invite New User', icon: UserPlus, desc: 'Provision a new organizational identity', href: '/admin/provisioning', color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { name: 'Edit Role Policy', icon: ShieldCheck, desc: 'Modify global permission matrix', href: '/admin/iam', color: 'text-emerald-600', bg: 'bg-emerald-50' },
      ]
    },
    { 
      group: 'STRATEGIC DIRECTIVES',
      items: [
        { name: 'Dispatch Broadcast', icon: Megaphone, desc: 'Send targeted governance directive', href: '/admin/broadcast', color: 'text-rose-600', bg: 'bg-rose-50' },
        { name: 'Executive Command', icon: Zap, desc: 'Access the high-authority ECC', href: '/admin/ecc', color: 'text-amber-600', bg: 'bg-amber-50' },
      ]
    },
    { 
      group: 'ORGANIZATIONAL STRUCTURE',
      items: [
        { name: 'Establish New Hub', icon: Building2, desc: 'Define regional operational branch', href: '/admin/organization', color: 'text-blue-600', bg: 'bg-blue-50' },
        { name: 'Define Department', icon: Target, desc: 'Add new functional unit to hub', href: '/admin/organization', color: 'text-purple-600', bg: 'bg-purple-50' },
      ]
    }
  ];

  const filteredActions = ACTIONS.map(group => ({
    ...group,
    items: group.items.filter(item => 
      item.name.toLowerCase().includes(search.toLowerCase()) || 
      item.desc.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(group => group.items.length > 0);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Organizational Actions" 
      subtitle="High-Velocity Command Center"
      size="lg"
    >
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-4">
         {/* Search Command Bar */}
         <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
            <input 
              type="text" 
              placeholder="What do you want to do? (e.g. 'Invite', 'Broadcast', 'Hub')..."
              className="w-full h-[64px] bg-slate-50 border border-slate-100 rounded-[24px] pl-14 pr-6 text-[15px] font-bold text-slate-900 placeholder:text-slate-300 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
         </div>

         {/* Action Registry */}
         <div className="space-y-10 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredActions.length > 0 ? (
              filteredActions.map((group) => (
                <div key={group.group} className="space-y-4">
                   <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] px-1">{group.group}</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {group.items.map((item) => (
                        <Link 
                          key={item.name} 
                          href={item.href}
                          onClick={onClose}
                          className="flex items-center gap-4 p-5 bg-white border border-slate-100 rounded-[20px] hover:border-indigo-200 hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer"
                        >
                           <div className={`w-12 h-12 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center shrink-0`}>
                              <item.icon className="w-6 h-6" />
                           </div>
                           <div className="flex-1">
                              <p className="text-[14px] font-black text-slate-900 tracking-tight leading-none mb-1.5">{item.name}</p>
                              <p className="text-[11px] font-medium text-slate-400 leading-tight">{item.desc}</p>
                           </div>
                           <ArrowRight className="w-4 h-4 text-slate-200 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                        </Link>
                      ))}
                   </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                 <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-200">
                    <Search className="w-8 h-8" />
                 </div>
                 <div className="space-y-1">
                    <p className="text-[15px] font-black text-slate-900 tracking-tight">No actions found</p>
                    <p className="text-[12px] font-medium text-slate-400">Try searching for 'Invite', 'Broadcast', or 'Role'</p>
                 </div>
              </div>
            )}
         </div>

         {/* Quick Intelligence Shortcuts */}
         <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-2 text-slate-400 hover:text-slate-900 cursor-pointer transition-colors">
                  <BrainCircuit className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Team Intel</span>
               </div>
               <div className="flex items-center gap-2 text-slate-400 hover:text-slate-900 cursor-pointer transition-colors">
                  <Settings className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Org Settings</span>
               </div>
            </div>
            <p className="text-[10px] font-bold text-slate-300 italic">ESC to Close</p>
         </div>
      </div>
    </Modal>
  );
};
