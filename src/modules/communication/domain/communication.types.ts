/**
 * Communication Domain Types
 * Enterprise-grade collaboration structures for Suler EMS.
 */

export enum ConversationClassification {
  DIRECT = 'DIRECT',
  DEPARTMENT = 'DEPARTMENT',
  WORKFLOW = 'WORKFLOW',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  ESCALATION = 'ESCALATION',
  SYSTEM = 'SYSTEM'
}

export enum MessageStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED'
}

export enum MessageType {
  TEXT = 'TEXT',
  SYSTEM = 'SYSTEM',
  ATTACHMENT = 'ATTACHMENT'
}

export enum AnnouncementPriority {
  NORMAL = 'NORMAL',
  URGENT = 'URGENT'
}

export interface MessageAttachment {
  id: string;
  name: string;
  type: string; // mime type
  size: number;
  url: string;
  thumbnailUrl?: string;
  metadata?: Record<string, any>;
}

export interface MessageMetadata {
  attachments?: MessageAttachment[];
  mentions?: string[]; // User IDs
  sourceContext?: {
    resourceId?: string;
    resourceType?: string;
    action?: string;
    link?: string;
  };
  [key: string]: any;
}

export interface CommunicationEvent {
  type: 'MESSAGE_RECEIVED' | 'MESSAGE_STATUS_UPDATED' | 'TYPING_STARTED' | 'TYPING_STOPPED' | 'PRESENCE_UPDATED' | 'ANNOUNCEMENT_PUBLISHED';
  payload: any;
  userId: string; // Target user
  timestamp: Date;
}

export interface PresenceState {
  userId: string;
  status: 'ONLINE' | 'AWAY' | 'OFFLINE';
  lastActive: Date;
  isTyping?: boolean;
  conversationId?: string; // If typing in a specific conversation
}
