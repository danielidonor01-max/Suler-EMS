"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Send, 
  Paperclip, 
  MoreVertical, 
  Phone, 
  Video, 
  User, 
  Users, 
  Megaphone, 
  CheckCheck,
  Plus,
  ArrowLeft,
  ShieldAlert,
  MessageSquare,
  Lock
} from 'lucide-react';
import { Conversation, Message, useCommunication } from '@/context/CommunicationContext';
import { useAccess } from '@/context/AccessContext';
import { format } from 'date-fns';

export const ConversationList = ({ onSelect, activeId, filterTab }: { 
  onSelect: (id: string) => void, 
  activeId: string | null,
  filterTab: 'inbox' | 'dm' | 'groups' | 'broadcasts'
}) => {
  const { conversations } = useCommunication();
  const [search, setSearch] = useState('');

  const filtered = conversations.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase());
    if (filterTab === 'inbox') return matchesSearch;
    if (filterTab === 'dm') return c.type === 'DM' && matchesSearch;
    if (filterTab === 'groups') return c.type === 'GROUP' && matchesSearch;
    if (filterTab === 'broadcasts') return c.type === 'BROADCAST' && matchesSearch;
    return matchesSearch;
  });

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-full md:w-[320px] shrink-0">
      <div className="p-4 border-b border-slate-100 space-y-4">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Messages</h2>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-indigo-500" />
          <input
            type="text"
            aria-label="Search conversations"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 pl-10 pr-4 text-[13px] font-medium text-slate-900 outline-none focus:bg-white focus:border-indigo-200 transition-all"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {filtered.map(c => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`w-full flex items-center gap-3 p-3 rounded-[18px] transition-all relative group ${
              activeId === c.id ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-slate-50'
            }`}
          >
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
              activeId === c.id ? 'bg-white border-indigo-100 text-indigo-600' : 'bg-slate-100 border-slate-200 text-slate-400'
            }`}>
              {c.type === 'DM' ? <User className="w-5 h-5" /> : c.type === 'GROUP' ? <Users className="w-5 h-5" /> : <Megaphone className="w-5 h-5" />}
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="flex justify-between items-center mb-0.5">
                <span className={`text-[13px] font-bold truncate ${activeId === c.id ? 'text-indigo-900' : 'text-slate-900'}`}>{c.title}</span>
                {c.lastMessageAt && <span className="text-[10px] text-slate-400 whitespace-nowrap">{format(new Date(c.lastMessageAt), 'HH:mm')}</span>}
              </div>
              <p className="text-[11px] text-slate-400 truncate font-medium">{c.lastMessage || 'Start a conversation'}</p>
            </div>
            {c.unreadCount > 0 && (
              <div className="absolute right-3 bottom-3 min-w-[18px] h-[18px] bg-indigo-600 rounded-full flex items-center justify-center px-1">
                <span className="text-[9px] font-bold text-white leading-none">{c.unreadCount}</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export const ChatWindow = ({ conversationId }: { conversationId: string }) => {
  const { conversations, messages, sendMessage, markAsRead } = useCommunication();
  const { user } = useAccess();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const conversation = conversations.find(c => c.id === conversationId);
  const activeMessages = messages.filter(m => m.conversationId === conversationId);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    if (conversationId) markAsRead(conversationId);
  }, [activeMessages, conversationId]);

  if (!conversation) return (
    <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-8 text-center space-y-4">
      <div className="w-20 h-20 rounded-[32px] bg-white border border-slate-200 flex items-center justify-center text-slate-300 shadow-sm">
        <MessageSquare className="w-10 h-10" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-slate-900">Select a conversation</h3>
        <p className="text-[13px] text-slate-400 max-w-[300px] mt-1">Pick a teammate or group from the left to start collaborating in real-time.</p>
      </div>
    </div>
  );

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(conversationId, input.trim());
    setInput('');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative">
      {/* Header */}
      <div className="h-[72px] border-b border-slate-100 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-[12px] shadow-sm">
            {conversation.title[0]}
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-slate-900 tracking-tight leading-none mb-1">{conversation.title}</h3>
            <div className="flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Now</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <button type="button" aria-label="Start voice call" className="w-9 h-9 flex items-center justify-center hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-all"><Phone className="w-4 h-4" /></button>
          <button type="button" aria-label="Start video call" className="w-9 h-9 flex items-center justify-center hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-all"><Video className="w-4 h-4" /></button>
          <button type="button" aria-label="More options" className="w-9 h-9 flex items-center justify-center hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-all"><MoreVertical className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/30">
        {activeMessages.map((m, i) => {
          // Messages persist senderId = User.id (NOT employeeId). The
          // CommunicationContext rewrite (Phase 3) aligned this with the DB.
          const isOwn = m.senderId === user?.id;
          return (
            <div key={m.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2`}>
              {!isOwn && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1.5">{m.senderName}</span>}
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-sm text-[13px] font-medium leading-relaxed ${
                isOwn ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-900 rounded-tl-none'
              }`}>
                {m.content}
              </div>
              <div className={`flex items-center gap-2 mt-1.5 px-1`}>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{format(new Date(m.createdAt), 'HH:mm')}</span>
                {isOwn && <CheckCheck className="w-3 h-3 text-indigo-500" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-100">
        <div className="flex items-end gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:border-indigo-300 focus-within:bg-white transition-all">
          <button type="button" aria-label="Attach file" className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors"><Paperclip className="w-5 h-5" /></button>
          <textarea
            rows={1}
            aria-label="Message"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            className="flex-1 bg-transparent border-none outline-none py-2.5 text-[13px] font-medium text-slate-900 placeholder:text-slate-400 resize-none max-h-[120px]"
          />
          <button
            type="button"
            aria-label="Send message"
            onClick={handleSend}
            disabled={!input.trim()}
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
              input.trim() ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const BroadcastPanel = () => {
  const { postBroadcast, conversations } = useCommunication();
  const { checkPermission, userRole } = useAccess();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [scope, setScope] = useState<'TEAM' | 'DEPARTMENT' | 'HUB' | 'GLOBAL'>('GLOBAL');
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  // Received broadcasts come from the context as BROADCAST-typed conversations
  // (synthesized from /api/communication/announcements).
  const receivedBroadcasts = conversations.filter(c => c.type === 'BROADCAST');

  const handlePost = async () => {
    if (!title || !content) return;
    setPosting(true);
    setPostError(null);
    try {
      await postBroadcast(title, content, scope);
      setTitle('');
      setContent('');
    } catch (err) {
      setPostError(err instanceof Error ? err.message : 'Failed to dispatch broadcast');
    } finally {
      setPosting(false);
    }
  };

  // Gate by the canonical permission rather than hard-coded role names. This
  // means custom roles can be granted communication:broadcast in /admin/roles
  // without code changes.
  const canPost = checkPermission('communication:broadcast' as any).allowed;
  const allowedScopes = (): Array<'TEAM' | 'DEPARTMENT' | 'HUB' | 'GLOBAL'> => {
    if (!canPost) return [];
    if (userRole === 'SUPER_ADMIN') return ['GLOBAL', 'HUB', 'DEPARTMENT', 'TEAM'];
    if (userRole === 'HR_ADMIN') return ['GLOBAL', 'DEPARTMENT'];
    if (userRole === 'FINANCE_MANAGER') return ['GLOBAL', 'DEPARTMENT'];
    if (userRole === 'MANAGER') return ['TEAM'];
    // Custom role with the permission granted but no role-specific scope
    // mapping yet — default to TEAM only.
    return ['TEAM'];
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in max-w-2xl">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-indigo-600" />
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Announcements</h2>
        </div>
        <p className="text-[13px] font-medium text-slate-400 leading-relaxed">
          {canPost
            ? 'Dispatch platform-wide alerts and high-priority announcements to specific institutional levels.'
            : 'Active broadcasts targeted at you, your department, and your role.'}
        </p>
      </div>

      {/* Received broadcasts */}
      {receivedBroadcasts.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Broadcasts ({receivedBroadcasts.length})</p>
          {receivedBroadcasts.map(b => (
            <div key={b.id} className="bg-white p-5 rounded-[20px] border border-slate-200 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-[14px] font-bold text-slate-900">{b.title}</h3>
                  <p className="text-[13px] text-slate-600 mt-1.5 leading-relaxed">{b.lastMessage}</p>
                </div>
                <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-indigo-50 text-indigo-700 shrink-0">
                  {b.scope}
                </span>
              </div>
              {b.lastMessageAt && (
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3">
                  {format(new Date(b.lastMessageAt), 'MMM d, HH:mm')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {!canPost && receivedBroadcasts.length === 0 && (
        <div className="p-12 border-2 border-dashed border-slate-200 rounded-[24px] flex flex-col items-center justify-center text-center text-[13px] text-slate-500">
          <Megaphone className="w-6 h-6 text-slate-300 mb-3" />
          No active broadcasts.
        </div>
      )}

      {!canPost && receivedBroadcasts.length > 0 && null}

      {canPost && (
      <div className="space-y-6 bg-white p-8 rounded-[32px] border border-slate-200 shadow-premium">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Announcement Scope</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {allowedScopes().map(s => (
              <button
                type="button"
                aria-label={`Select scope ${s}`}
                key={s}
                onClick={() => setScope(s as any)}
                className={`h-11 rounded-xl border text-[11px] font-bold transition-all ${
                  scope === s ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Headline</label>
          <input aria-label="Headline" 
            type="text" 
            placeholder="e.g. System Maintenance, New Policy Update..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-[13px] font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-200 transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Payload Content</label>
          <textarea aria-label="Payload Content" 
            rows={4}
            placeholder="Provide detailed instructions or information..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[13px] font-medium text-slate-900 outline-none focus:bg-white focus:border-indigo-200 transition-all resize-none"
          />
        </div>

        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-[11px] font-medium text-amber-700 leading-relaxed">
            Broadcasts are immutable and will trigger high-priority push notifications for all targeted users.
          </p>
        </div>

        {postError && (
          <div className="px-4 py-3 rounded-[12px] bg-rose-50 border border-rose-100 text-[12px] text-rose-700">{postError}</div>
        )}

        <button
          type="button"
          onClick={handlePost}
          disabled={!title || !content || posting}
          className="w-full h-[52px] bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl text-[12px] font-bold uppercase tracking-wider transition-all shadow-premium flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" /> {posting ? 'Dispatching…' : 'Dispatch Broadcast'}
        </button>
      </div>
      )}
    </div>
  );
};
