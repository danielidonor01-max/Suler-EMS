"use client";

/**
 * CommunicationContext (v3 — API-backed)
 *
 * Public surface unchanged: ChatComponents and the /messages page do not need
 * code changes (except `senderId` comparison — see ChatComponents update).
 *
 * Internally:
 *   - conversations loaded from /api/communication/conversations every 10s
 *   - messages loaded from /api/communication/conversations/:id/messages every 5s while a thread is active
 *   - sendMessage POSTs and revalidates
 *   - createConversation / openDMWithUser POSTs and revalidates
 *   - postBroadcast posts an Announcement (Phase 3 keeps "BROADCAST" as a
 *     conversation-shaped item synthesized from announcements so the UI tabs
 *     keep working without restructure)
 *   - markAsRead just optimistically zeroes unreadCount; server already marks
 *     read on the message-history fetch.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useActivity } from './ActivityContext';
import { useAccess } from './AccessContext';
import { apiFetcher, apiMutate } from '@/lib/api/fetcher';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;       // User.id (NOT employeeId) — matches messaging.service.ts
  senderName: string;
  content: string;
  createdAt: string;
  readBy: string[];
}

export interface Conversation {
  id: string;
  type: 'DM' | 'GROUP' | 'BROADCAST';
  title: string;
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: string;
  scope?: 'TEAM' | 'DEPARTMENT' | 'HUB' | 'GLOBAL';
  unreadCount: number;
}

interface AnnouncementRow {
  id: string;
  title: string;
  content: string;
  category: 'GLOBAL' | 'DEPARTMENT' | 'ROLE';
  scopeId?: string | null;
  createdAt: string;
  author?: { name?: string | null };
}

interface CommunicationContextType {
  conversations: Conversation[];
  messages: Message[];
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  createConversation: (participants: string[], title?: string, type?: 'DM' | 'GROUP') => Promise<string>;
  postBroadcast: (title: string, content: string, scope: 'TEAM' | 'DEPARTMENT' | 'HUB' | 'GLOBAL') => Promise<void>;
  markAsRead: (conversationId: string) => void;
  openDMWithUser: (userId: string, userName: string) => Promise<void>;
  openGroupChat: (groupId: string, groupName: string) => Promise<void>;
  refreshAll: () => Promise<void>;
}

const CommunicationContext = createContext<CommunicationContextType | undefined>(undefined);

const CONV_POLL_MS = 10_000;
const MSG_POLL_MS = 5_000;

export const CommunicationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, userRole } = useAccess();
  const { pushActivity } = useActivity();

  const [apiConversations, setApiConversations] = useState<Conversation[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  // --- Polling: conversations + announcements ---
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function load() {
      try {
        const [convs, anns] = await Promise.all([
          apiFetcher<Conversation[]>('/api/communication/conversations'),
          apiFetcher<AnnouncementRow[]>('/api/communication/announcements'),
        ]);
        if (cancelled) return;
        setApiConversations(convs);
        setAnnouncements(anns);
      } catch {
        // silent — UI will show empty
      }
    }
    load();
    const t = setInterval(load, CONV_POLL_MS);
    return () => { cancelled = true; clearInterval(t); };
  }, [user]);

  // --- Polling: messages for the active conversation ---
  useEffect(() => {
    if (!activeConversationId) return;
    let cancelled = false;
    async function loadMessages() {
      try {
        const list = await apiFetcher<Message[]>(`/api/communication/conversations/${activeConversationId}/messages`);
        if (cancelled) return;
        // Service returns desc-by-createdAt; UI renders ascending so reverse here.
        setMessages(prev => {
          const otherConvs = prev.filter(m => m.conversationId !== activeConversationId);
          return [...otherConvs, ...list.slice().reverse()];
        });
      } catch {
        // silent
      }
    }
    loadMessages();
    const t = setInterval(loadMessages, MSG_POLL_MS);
    return () => { cancelled = true; clearInterval(t); };
  }, [activeConversationId]);

  // Mark conv as read locally when opened — server is also notified by the
  // message-history fetch (auto markAsRead in the route).
  useEffect(() => {
    if (!activeConversationId) return;
    setApiConversations(prev =>
      prev.map(c => c.id === activeConversationId ? { ...c, unreadCount: 0 } : c),
    );
  }, [activeConversationId]);

  // Synthesize announcement rows as BROADCAST-typed conversations so the
  // existing /messages "Broadcasts" tab UI continues to work.
  const broadcastsAsConversations = useMemo<Conversation[]>(() => {
    return announcements.map(a => ({
      id: `ann_${a.id}`,
      type: 'BROADCAST' as const,
      title: a.title,
      participants: [],
      lastMessage: a.content,
      lastMessageAt: a.createdAt,
      scope: a.category === 'GLOBAL' ? 'GLOBAL'
           : a.category === 'DEPARTMENT' ? 'DEPARTMENT'
           : 'TEAM',
      unreadCount: 0,
    }));
  }, [announcements]);

  const conversations = useMemo(
    () => [...apiConversations, ...broadcastsAsConversations]
            .sort((a, b) => (b.lastMessageAt ?? '').localeCompare(a.lastMessageAt ?? '')),
    [apiConversations, broadcastsAsConversations],
  );

  const refreshAll = useCallback(async () => {
    if (!user) return;
    try {
      const [convs, anns] = await Promise.all([
        apiFetcher<Conversation[]>('/api/communication/conversations'),
        apiFetcher<AnnouncementRow[]>('/api/communication/announcements'),
      ]);
      setApiConversations(convs);
      setAnnouncements(anns);
    } catch { /* swallow */ }
  }, [user]);

  const sendMessage = useCallback(async (conversationId: string, content: string) => {
    if (!user || !content.trim()) return;
    // Optimistic insert.
    const optimistic: Message = {
      id: `tmp-${Date.now()}`,
      conversationId,
      senderId: user.id,
      senderName: user.name ?? 'You',
      content: content.trim(),
      createdAt: new Date().toISOString(),
      readBy: [user.id],
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      const persisted = await apiMutate<{ content: string }, Message>(
        `/api/communication/conversations/${conversationId}/messages`,
        'POST',
        { content: content.trim() },
      );
      // Replace optimistic with persisted (same id substitution by content + ts).
      setMessages(prev => prev.map(m => m.id === optimistic.id ? persisted : m));
      // Move conversation to top of list with new lastMessage.
      setApiConversations(prev => prev.map(c =>
        c.id === conversationId ? { ...c, lastMessage: content, lastMessageAt: persisted.createdAt } : c,
      ));
    } catch (err) {
      // Roll back optimistic on failure.
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      throw err;
    }
  }, [user]);

  const createConversation = useCallback(async (participants: string[], title?: string, type: 'DM' | 'GROUP' = 'DM') => {
    if (type === 'DM' && participants[0]) {
      const conv = await apiMutate<{ type: string; targetId: string }, { id: string }>(
        '/api/communication/conversations',
        'POST',
        { type: 'DM', targetId: participants[0] },
      );
      await refreshAll();
      return conv.id;
    }
    // Groups: department channels are created via syncDepartmentChannel; ad-hoc
    // group creation is out-of-scope for Phase 3. Fall back to no-op + activity.
    pushActivity({
      type: 'SYSTEM',
      label: 'Group Channel Requested',
      message: `Ad-hoc group creation isn't wired yet. Use department channels instead.`,
      author: userRole,
      status: 'WARNING',
    } as any);
    return '';
  }, [refreshAll, pushActivity, userRole]);

  const postBroadcast = useCallback(async (title: string, content: string, scope: 'TEAM' | 'DEPARTMENT' | 'HUB' | 'GLOBAL') => {
    // Map UI scope → API category. TEAM and HUB collapse to DEPARTMENT for now.
    const category = scope === 'GLOBAL' ? 'GLOBAL'
                   : scope === 'DEPARTMENT' || scope === 'TEAM' || scope === 'HUB' ? 'DEPARTMENT'
                   : 'GLOBAL';
    try {
      await apiMutate('/api/communication/announcements', 'POST', {
        title,
        content,
        category,
        // For department scope, scopeId would be required — skip for now until
        // the UI exposes a picker. Falls back to GLOBAL behavior server-side
        // if scopeId is missing for DEPARTMENT/ROLE.
      });
      await refreshAll();
      pushActivity({
        type: 'GOVERNANCE',
        label: 'Institutional Broadcast Dispatched',
        message: `Announcement [${title}] published (${scope}).`,
        author: userRole,
        status: 'SUCCESS',
      } as any);
    } catch (err) {
      pushActivity({
        type: 'SYSTEM',
        label: 'Broadcast Failed',
        message: err instanceof Error ? err.message : 'Unknown error',
        author: userRole,
        status: 'FAILURE',
      } as any);
      throw err;
    }
  }, [refreshAll, pushActivity, userRole]);

  const markAsRead = useCallback((conversationId: string) => {
    setApiConversations(prev => prev.map(c => c.id === conversationId ? { ...c, unreadCount: 0 } : c));
  }, []);

  const openDMWithUser = useCallback(async (userId: string, _userName: string) => {
    // Try existing local match first to avoid a roundtrip.
    const existing = apiConversations.find(c => c.type === 'DM' && c.participants.includes(userId));
    if (existing) {
      setActiveConversationId(existing.id);
      return;
    }
    try {
      const conv = await apiMutate<{ type: string; targetId: string }, { id: string }>(
        '/api/communication/conversations',
        'POST',
        { type: 'DM', targetId: userId },
      );
      await refreshAll();
      setActiveConversationId(conv.id);
    } catch {
      // swallow — context UI will simply not open the thread
    }
  }, [apiConversations, refreshAll]);

  const openGroupChat = useCallback(async (groupId: string, _groupName: string) => {
    // Phase 3 treats group channels as pre-existing (department channels seeded
    // by ChannelService.syncDepartmentChannel). Select by id if present.
    const existing = apiConversations.find(c => c.id === groupId);
    if (existing) {
      setActiveConversationId(existing.id);
      return;
    }
    // No ad-hoc group creation yet — see createConversation note.
    pushActivity({
      type: 'SYSTEM',
      label: 'Group Channel Not Found',
      message: `Requested channel ${groupId} does not exist yet. Department channels are synced automatically.`,
      author: userRole,
      status: 'WARNING',
    } as any);
  }, [apiConversations, pushActivity, userRole]);

  return (
    <CommunicationContext.Provider value={{
      conversations,
      messages,
      activeConversationId,
      setActiveConversationId,
      sendMessage,
      createConversation,
      postBroadcast,
      markAsRead,
      openDMWithUser,
      openGroupChat,
      refreshAll,
    }}>
      {children}
    </CommunicationContext.Provider>
  );
};

export const useCommunication = () => {
  const context = useContext(CommunicationContext);
  if (!context) throw new Error('useCommunication must be used within a CommunicationProvider');
  return context;
};
