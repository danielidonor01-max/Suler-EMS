"use client";

import React from 'react';
import { 
  Bell, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  Target, 
  ShieldCheck,
  MoreVertical,
  Activity,
  ArrowRight
} from 'lucide-react';
import { useCommunication } from '@/context/CommunicationContext';
import { useActivity } from '@/context/ActivityContext';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
  const { conversations, markAsRead } = useCommunication();
  const broadcasts = conversations.filter(c => c.type === 'BROADCAST');
  const { activities } = useActivity();
  const router = useRouter();

  // Combine relevant events into a unified notification stream
  const systemNotifications = activities.slice(0, 10).map(a => ({
    id: a.id,
    type: 'SYSTEM',
    title: a.action,
    description: `Action performed by ${a.user} in ${a.module || 'System'}`,
    time: a.timestamp,
    icon: Activity,
    color: 'text-slate-400',
    bg: 'bg-slate-50'
  }));

  const broadcastNotifications = broadcasts.map(b => ({
    id: b.id,
    type: 'BROADCAST',
    title: b.title,
    description: (b.lastMessage || '').substring(0, 80) + '...',
    time: b.lastMessageAt || new Date().toISOString(),
    icon: Target,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50'
  }));

  const allNotifications = [...systemNotifications, ...broadcastNotifications]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return (
    <div className="section-breathing max-w-[1000px] mx-auto animate-in space-y-10">
      
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Enterprise Alerts</h1>
          <p className="text-[13px] font-medium text-slate-400">Centralized governance monitoring and institutional broadcasts.</p>
        </div>
        <button 
          onClick={() => allNotifications.forEach(n => n.type === 'BROADCAST' && markAsRead(n.id))}
          className="px-5 h-10 bg-white border border-slate-200 text-slate-600 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          Mark all as read
        </button>
      </div>

      {/* Notification Stream */}
      <div className="space-y-4">
        {allNotifications.length > 0 ? (
          allNotifications.map((n) => (
            <div 
              key={n.id} 
              className="group bg-white p-5 rounded-[24px] border border-slate-200 hover:border-slate-300 transition-all flex items-start gap-5 relative"
            >
              <div className={`w-12 h-12 rounded-2xl ${n.bg} ${n.color} flex items-center justify-center shrink-0`}>
                <n.icon className="w-6 h-6" />
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">{n.title}</h3>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-bold uppercase tracking-widest">{new Date(n.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
                <p className="text-[13px] text-slate-500 leading-relaxed pr-10">{n.description}</p>
                
                <div className="pt-3 flex items-center gap-4">
                   <button 
                     onClick={() => n.type === 'BROADCAST' ? router.push('/messages?tab=broadcasts') : router.push('/governance')}
                     className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.15em] flex items-center gap-1.5 hover:gap-2 transition-all"
                   >
                     View Details <ArrowRight className="w-3 h-3" />
                   </button>
                   <span className="text-[9px] font-bold text-slate-200 uppercase tracking-widest">Type: {n.type}</span>
                </div>
              </div>

              <button className="absolute top-5 right-5 p-2 text-slate-300 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-all">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          ))
        ) : (
          <div className="h-[400px] flex flex-col items-center justify-center bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
             <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 mb-4 shadow-sm">
                <Bell className="w-8 h-8" />
             </div>
             <h3 className="text-lg font-bold text-slate-900">No Pending Alerts</h3>
             <p className="text-[13px] text-slate-400 mt-2">Your enterprise notification stream is currently clear.</p>
          </div>
        )}
      </div>

    </div>
  );
}
