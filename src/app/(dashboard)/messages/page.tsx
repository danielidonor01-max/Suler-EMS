"use client";

import React, { useState, useEffect } from 'react';
import { 
  Inbox, 
  User, 
  Users, 
  Megaphone, 
  Search,
  Plus,
  Settings,
  MoreVertical
} from 'lucide-react';
import { RouteGuard } from '@/components/common/RouteGuard';
import { useCommunication } from '@/context/CommunicationContext';
import { ConversationList, ChatWindow, BroadcastPanel } from '@/components/messaging/ChatComponents';
import { useSearchParams } from 'next/navigation';

export default function MessagesPage() {
  const { activeConversationId, setActiveConversationId, conversations, openDMWithUser, openGroupChat } = useCommunication();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'inbox' | 'dm' | 'groups' | 'broadcasts'>('inbox');

  // Handle deep linking from URL (e.g. /messages?id=EMP001&name=John)
  useEffect(() => {
    const userId = searchParams.get('id');
    const userName = searchParams.get('name');
    const type = searchParams.get('type');
    const tabParam = searchParams.get('tab');

    if (tabParam === 'broadcasts') {
      setActiveTab('broadcasts');
      setActiveConversationId(null);
    } else if (userId && userName) {
      if (type === 'GROUP') {
        openGroupChat(userId, userName);
        setActiveTab('groups');
      } else {
        openDMWithUser(userId, userName);
        setActiveTab('dm');
      }
    }
  }, [searchParams, openDMWithUser, openGroupChat, setActiveConversationId]);

  const tabs = [
    { id: 'inbox', label: 'All Inbox', icon: Inbox },
    { id: 'dm', label: 'Direct', icon: User },
    { id: 'groups', label: 'Groups', icon: Users },
    { id: 'broadcasts', label: 'Broadcasts', icon: Megaphone },
  ];

  return (
    <RouteGuard allowedRoles={['SUPER_ADMIN', 'HR_ADMIN', 'FINANCE_MANAGER', 'HUB_MANAGER', 'MANAGER', 'EMPLOYEE']}>
      <div className="h-[calc(100vh-72px)] bg-white flex overflow-hidden">
        
        {/* Rail 1: Category Navigation */}
        <div className="w-[72px] md:w-[240px] bg-slate-900 shrink-0 border-r border-slate-800 flex flex-col p-3 gap-8">
          <div className="px-3 pt-2">
            <h1 className="hidden md:block text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Communications</h1>
            <div className="space-y-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id as any); setActiveConversationId(null); }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                    activeTab === tab.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <tab.icon className="w-5 h-5 shrink-0" />
                  <span className="hidden md:block text-[13px] font-bold tracking-tight">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto px-3 pb-4">
             <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                <Settings className="w-5 h-5 shrink-0" />
                <span className="hidden md:block text-[13px] font-bold tracking-tight">Preferences</span>
             </button>
          </div>
        </div>

        {/* Rail 2: Conversation List */}
        {activeTab !== 'broadcasts' ? (
          <div className="flex flex-1 overflow-hidden">
             <ConversationList 
               activeId={activeConversationId} 
               onSelect={setActiveConversationId} 
               filterTab={activeTab} 
             />

             {/* Rail 3: Chat Window */}
             <ChatWindow conversationId={activeConversationId || ''} />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto bg-slate-50/50 custom-scrollbar">
             <BroadcastPanel />
          </div>
        )}

      </div>
    </RouteGuard>
  );
}
