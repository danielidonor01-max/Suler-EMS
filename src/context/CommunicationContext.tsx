"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useActivity } from './ActivityContext';
import { useAccess } from './AccessContext';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
  readBy: string[];
}

export interface Conversation {
  id: string;
  type: 'DM' | 'GROUP' | 'BROADCAST';
  title: string;
  participants: string[]; // User IDs
  lastMessage?: string;
  lastMessageAt?: string;
  scope?: 'TEAM' | 'DEPARTMENT' | 'HUB' | 'GLOBAL';
  unreadCount: number;
}

interface CommunicationContextType {
  conversations: Conversation[];
  messages: Message[];
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  sendMessage: (conversationId: string, content: string) => void;
  createConversation: (participants: string[], title?: string, type?: 'DM' | 'GROUP') => string;
  postBroadcast: (title: string, content: string, scope: 'TEAM' | 'DEPARTMENT' | 'HUB' | 'GLOBAL') => void;
  markAsRead: (conversationId: string) => void;
  openDMWithUser: (userId: string, userName: string) => void;
  openGroupChat: (groupId: string, groupName: string) => void;
}

const CommunicationContext = createContext<CommunicationContextType | undefined>(undefined);

const MOCK_CONVERSATIONS: Conversation[] = [
  { id: 'C1', type: 'GROUP', title: 'Lagos Ops Team', participants: ['U1', 'U2', 'U3'], lastMessage: 'The payroll run is ready for review.', lastMessageAt: new Date().toISOString(), scope: 'HUB', unreadCount: 2 },
  { id: 'C2', type: 'DM', title: 'Sarah Williams', participants: ['U1', 'U2'], lastMessage: 'Thanks for the update!', lastMessageAt: new Date().toISOString(), unreadCount: 0 },
  { id: 'B1', type: 'BROADCAST', title: 'System Maintenance Alert', participants: [], lastMessage: 'Scheduled maintenance this Sunday at 2 AM.', lastMessageAt: new Date().toISOString(), scope: 'GLOBAL', unreadCount: 1 },
];

const MOCK_MESSAGES: Message[] = [
  { id: 'M1', conversationId: 'C1', senderId: 'U2', senderName: 'Sarah Williams', content: 'The payroll run is ready for review.', createdAt: new Date().toISOString(), readBy: ['U1'] },
  { id: 'M2', conversationId: 'C2', senderId: 'U2', senderName: 'Sarah Williams', content: 'Thanks for the update!', createdAt: new Date().toISOString(), readBy: ['U1'] },
];

export const CommunicationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const { pushActivity } = useActivity();
  const { user, userRole } = useAccess();

  useEffect(() => {
    const saved = localStorage.getItem('suler_comms_v1');
    if (saved) {
      const { conversations: c, messages: m } = JSON.parse(saved);
      setConversations(c);
      setMessages(m);
    }
  }, []);

  const save = (c: Conversation[], m: Message[]) => {
    localStorage.setItem('suler_comms_v1', JSON.stringify({ conversations: c, messages: m }));
  };

  const sendMessage = (conversationId: string, content: string) => {
    const newMessage: Message = {
      id: `M-${Date.now()}`,
      conversationId,
      senderId: user?.employeeId || 'SYSTEM',
      senderName: user?.name || 'Administrator',
      content,
      createdAt: new Date().toISOString(),
      readBy: [user?.employeeId || 'SYSTEM']
    };

    const nextMessages = [...messages, newMessage];
    const nextConversations = conversations.map(c => 
      c.id === conversationId ? { ...c, lastMessage: content, lastMessageAt: newMessage.createdAt } : c
    );

    setMessages(nextMessages);
    setConversations(nextConversations);
    save(nextConversations, nextMessages);
  };

  const createConversation = (participants: string[], title?: string, type: 'DM' | 'GROUP' = 'DM') => {
    const id = `C-${Date.now()}`;
    const newConv: Conversation = {
      id,
      type,
      title: title || (type === 'DM' ? 'Direct Message' : 'New Group'),
      participants: Array.from(new Set([...participants, user?.employeeId || ''])),
      unreadCount: 0
    };

    const nextConversations = [newConv, ...conversations];
    setConversations(nextConversations);
    save(nextConversations, messages);
    
    if (type === 'GROUP') {
      pushActivity({
        type: 'SYSTEM',
        label: 'Collaboration Group Created',
        message: `New communication group [${newConv.title}] established by ${user?.name}.`,
        author: userRole,
        status: 'SUCCESS'
      } as any);
    }

    return id;
  };

  const postBroadcast = (title: string, content: string, scope: 'TEAM' | 'DEPARTMENT' | 'HUB' | 'GLOBAL') => {
    const id = `B-${Date.now()}`;
    const newBroadcast: Conversation = {
      id,
      type: 'BROADCAST',
      title,
      participants: [],
      scope,
      lastMessage: content,
      lastMessageAt: new Date().toISOString(),
      unreadCount: 1
    };

    const nextConversations = [newBroadcast, ...conversations];
    setConversations(nextConversations);
    save(nextConversations, messages);

    pushActivity({
      type: 'GOVERNANCE',
      label: 'Institutional Broadcast Dispatched',
      message: `System-wide announcement [${title}] broadcasted to all users in [${scope}] scope.`,
      author: userRole,
      status: 'SUCCESS'
    } as any);
  };

  const markAsRead = (conversationId: string) => {
    setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, unreadCount: 0 } : c));
  };

  const openDMWithUser = (userId: string, userName: string) => {
    const existing = conversations.find(c => c.type === 'DM' && c.participants.includes(userId));
    if (existing) {
      setActiveConversationId(existing.id);
    } else {
      const newId = createConversation([userId], userName, 'DM');
      setActiveConversationId(newId);
    }
  };

  const openGroupChat = (groupId: string, groupName: string) => {
    const existing = conversations.find(c => c.id === groupId || (c.type === 'GROUP' && c.title === groupName));
    if (existing) {
      setActiveConversationId(existing.id);
    } else {
      const newId = createConversation([], groupName, 'GROUP');
      setActiveConversationId(newId);
    }
  };

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
      openGroupChat
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
