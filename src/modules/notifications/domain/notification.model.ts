import { UUID } from "@/types/common";

export type NotificationType = 'INFO' | 'WARNING' | 'SUCCESS' | 'ACTION';
export type NotificationCategory = 'WORKFLOW' | 'SECURITY' | 'SYSTEM' | 'ATTENDANCE';
export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type NotificationStatus = 
  | 'PENDING' 
  | 'DELIVERED' 
  | 'READ' 
  | 'ARCHIVED' 
  | 'FAILED' 
  | 'DISMISSED';

export interface NotificationModel {
  id: UUID;
  userId: UUID;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;
  status: NotificationStatus;
  resourceId?: string;
  resourceType?: string;
  readAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface NotificationPreferenceModel {
  userId: UUID;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  workflowAlerts: boolean;
  securityAlerts: boolean;
  systemAlerts: boolean;
}

/**
 * System Event Contracts (Domain-Driven)
 */
export type SystemEventType = 
  | 'LEAVE_REQUESTED_EVENT'
  | 'LEAVE_APPROVED_EVENT'
  | 'LEAVE_REJECTED_EVENT'
  | 'LEAVE_CANCELLED_EVENT'
  | 'ATTENDANCE_CORRECTION_SUBMITTED_EVENT'
  | 'SECURITY_AUTH_FAILURE_EVENT'
  | 'SECURITY_POLICY_VIOLATION_EVENT'
  | 'SYSTEM_MAINTENANCE_EVENT'
  | 'STAFF_PROFILE_UPDATED_EVENT';

export interface SystemEventContract<T = any> {
  eventId: UUID;
  type: SystemEventType;
  version: string; // e.g. "1.0"
  source: string;  // e.g. "workflow-engine"
  timestamp: string;
  actorId?: UUID;
  organizationId?: string; // Prepared for multi-tenancy
  resourceId?: string;
  resourceType?: string;
  payload: T;
  correlationId?: string;
}

