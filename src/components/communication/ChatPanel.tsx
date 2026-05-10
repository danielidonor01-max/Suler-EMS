'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Check,
  CheckCheck,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useRealtime } from '@/hooks/useRealtime';
import { useSession } from 'next-auth/react';

interface Message {
  id: string;
  content: string;
  senderId: string;
  sender: { name: string };
  status: string;
  createdAt: string;
  isEdited: boolean;
}

interface ChatPanelProps {
  conversationId: string;
  conversationName?: string;
  classification: string;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ conversationId, conversationName, classification }) => {
  const { data: session } = useSession();
  const { lastCommunication } = useRealtime();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchHistory(); }, [conversationId]);

  useEffect(() => {
    if (lastCommunication) handleRealtimeEvent(lastCommunication);
  }, [lastCommunication]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/communication/conversations/${conversationId}/messages`);
      const data = await res.json();
      if (data.success) setMessages(data.data.reverse());
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRealtimeEvent = (event: any) => {
    if (event.payload.conversationId !== conversationId) return;
    switch (event.type) {
      case 'MESSAGE_RECEIVED':
        setMessages(prev => [...prev, event.payload]);
        updateMessageStatus(event.payload.id, 'READ');
        break;
      case 'MESSAGE_STATUS_UPDATED':
        setMessages(prev => prev.map(m =>
          m.id === event.payload.messageId ? { ...m, status: event.payload.status } : m
        ));
        break;
      case 'TYPING_STARTED':
        setTypingUsers(prev => [...new Set([...prev, event.payload.userName])]);
        break;
      case 'TYPING_STOPPED':
        setTypingUsers(prev => prev.filter(u => u !== event.payload.userName));
        break;
    }
  };

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const sendMessage = async () => {
    if (!inputValue.trim()) return;
    const optimisticId = `opt-${Date.now()}`;
    const newMessage = {
      id: optimisticId,
      content: inputValue,
      senderId: session?.user?.id || '',
      sender: { name: session?.user?.name || 'Me' },
      status: 'SENT',
      createdAt: new Date().toISOString(),
      isEdited: false
    };
    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    sendTypingStatus(false);
    try {
      const res = await fetch(`/api/communication/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: inputValue })
      });
      const data = await res.json();
      if (data.success) setMessages(prev => prev.map(m => m.id === optimisticId ? data.data : m));
    } catch {
      setMessages(prev => prev.map(m => m.id === optimisticId ? { ...m, status: 'FAILED' } : m));
    }
  };

  const updateMessageStatus = async (messageId: string, status: string) => {
    try {
      await fetch(`/api/communication/messages/${messageId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const sendTypingStatus = async (isTyping: boolean) => {
    try {
      await fetch('/api/communication/presence/typing', {
        method: 'POST',
        body: JSON.stringify({ conversationId, isTyping })
      });
    } catch {}
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SENT':      return <Check className="w-3 h-3 text-slate-400" />;
      case 'DELIVERED': return <CheckCheck className="w-3 h-3 text-slate-400" />;
      case 'READ':      return <CheckCheck className="w-3 h-3 text-indigo-600" />;
      case 'FAILED':    return <AlertCircle className="w-3 h-3 text-rose-500" />;
      default:          return <Clock className="w-3 h-3 text-slate-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
            {(conversationName || 'C')[0]}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 leading-tight">{conversationName || 'Conversation'}</h3>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{classification}</span>
          </div>
        </div>
        <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderId === session?.user?.id;
            const showSender = idx === 0 || messages[idx - 1].senderId !== msg.senderId;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                {!isMe && showSender && (
                  <span className="text-xs font-bold text-slate-500 mb-1 ml-1">{msg.sender.name}</span>
                )}
                <div className={`relative max-w-[80%]`}>
                  <div className={`px-4 py-3 rounded-2xl ${
                    isMe
                      ? 'bg-indigo-600 text-white rounded-tr-sm'
                      : 'bg-white text-slate-800 rounded-tl-sm border border-slate-200 shadow-sm'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <div className={`flex items-center gap-1 mt-1 justify-end ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                      <span className="text-[10px]">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isMe && getStatusIcon(msg.status)}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      <AnimatePresence>
        {typingUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="px-6 py-2 bg-slate-50 border-t border-slate-100"
          >
            <span className="text-xs text-slate-400 italic flex items-center gap-2">
              <span className="flex gap-1">
                <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
              {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
          <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <Paperclip className="w-5 h-5" />
          </button>
          <textarea
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              sendTypingStatus(e.target.value.length > 0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
            }}
            placeholder="Type your message..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-slate-900 placeholder:text-slate-400 py-2 resize-none max-h-32 min-h-[40px] outline-none"
          />
          <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <Smile className="w-5 h-5" />
          </button>
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim()}
            className={`p-2 rounded-xl transition-all ${
              inputValue.trim()
                ? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700'
                : 'bg-slate-200 text-slate-400 opacity-60'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-2 text-center uppercase tracking-widest font-bold">
          Operations-First Communication • Suler EMS
        </p>
      </div>
    </div>
  );
};

export default ChatPanel;
