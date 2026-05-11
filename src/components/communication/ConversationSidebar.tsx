'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Users,
  Zap,
  Search,
  Plus,
  Circle,
  Hash,
  ShieldAlert,
  Settings
} from 'lucide-react';

interface Conversation {
  id: string;
  classification: string;
  name?: string;
  lastMessageAt: string;
  members: any[];
  messages: any[];
}

interface ConversationSidebarProps {
  onSelect: (conversation: Conversation) => void;
  selectedId?: string;
}

const ConversationSidebar: React.FC<ConversationSidebarProps> = ({ onSelect, selectedId }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => { fetchConversations(); }, []);

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/communication/conversations');
      const data = await res.json();
      if (data.success) setConversations(data.data);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(c =>
    (c.name || '').toLowerCase().includes(filter.toLowerCase()) ||
    c.classification.toLowerCase().includes(filter.toLowerCase())
  );

  const getClassificationIcon = (classification: string) => {
    switch (classification) {
      case 'DIRECT':     return <Circle className="w-3 h-3 text-emerald-600" fill="currentColor" />;
      case 'DEPARTMENT': return <Users className="w-3 h-3 text-indigo-600" />;
      case 'WORKFLOW':   return <Zap className="w-3 h-3 text-amber-500" />;
      case 'ESCALATION': return <ShieldAlert className="w-3 h-3 text-rose-600" />;
      default:           return <Hash className="w-3 h-3 text-slate-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-80">
      {/* Header */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            Collaboration
          </h2>
          <button className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors">
            <Plus className="w-5 h-5" />
          </button>
        </div>
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {loading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-16 animate-pulse bg-slate-100 rounded-xl mb-2" />
          ))
        ) : (
          <AnimatePresence>
            {filteredConversations.map((conv) => (
              <motion.button
                key={conv.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                onClick={() => onSelect(conv)}
                className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all duration-200 text-left ${
                  selectedId === conv.id
                    ? 'bg-indigo-50 border border-indigo-200'
                    : 'hover:bg-slate-50 border border-transparent hover:border-slate-200'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                  selectedId === conv.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {(conv.name || 'U')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-semibold text-slate-800 truncate text-sm">
                      {conv.name || 'Direct Message'}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                      {new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {getClassificationIcon(conv.classification)}
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                      {conv.classification}
                    </span>
                  </div>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-100">
        <button className="w-full flex items-center gap-3 p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all">
          <Settings className="w-4 h-4" />
          <span className="text-sm font-medium">Chat Settings</span>
        </button>
      </div>
    </div>
  );
};

export default ConversationSidebar;
