"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { NotificationModel } from '@/modules/notifications/domain/notification.model';

/**
 * Enterprise Realtime Hook
 * Connects to the SSE notification stream and manages incoming pushes.
 */
export function useRealtime() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<NotificationModel[]>([]);
  const [lastNotification, setLastNotification] = useState<NotificationModel | null>(null);
  const [lastCommunication, setLastCommunication] = useState<any>(null);
  const [lastAttendance, setLastAttendance] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

  useEffect(() => {
    if (!session?.user) return;

    let eventSource: EventSource | null = null;
    let retryCount = 0;
    const maxRetries = 5;
    let timeoutId: NodeJS.Timeout;

    const connect = () => {
      if (retryCount >= maxRetries) {
        setConnectionStatus('disconnected');
        console.error('[SSE] Max retries reached');
        return;
      }

      setConnectionStatus('connecting');
      eventSource = new EventSource('/api/notifications/stream');

      eventSource.onopen = () => {
        setConnectionStatus('connected');
        retryCount = 0;
        console.log('[SSE] Connected');
      };

      eventSource.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        
        // Handle Notifications
        if (payload.type === 'NOTIFICATION') {
          const newNotification = payload.data as NotificationModel;
          setNotifications(prev => [newNotification, ...prev]);
          setLastNotification(newNotification);
          
          if (Notification.permission === 'granted') {
            new Notification(newNotification.title, { body: newNotification.message });
          }
        }

        // Handle Communication (Messages, Presence, Typing)
        if (payload.type === 'COMMUNICATION') {
          setLastCommunication(payload.data);
        }

        // Handle Attendance
        if (payload.type === 'ATTENDANCE') {
          setLastAttendance(payload.data);
        }
      };

      eventSource.onerror = () => {
        setConnectionStatus('disconnected');
        eventSource?.close();
        
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
        retryCount++;
        console.warn(`[SSE] Connection lost. Retrying in ${delay}ms (Attempt ${retryCount}/${maxRetries})`);
        timeoutId = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      eventSource?.close();
      clearTimeout(timeoutId);
    };
  }, [session]);

  return {
    notifications,
    lastNotification,
    lastCommunication,
    lastAttendance,
    setNotifications,
    connectionStatus
  };
}
