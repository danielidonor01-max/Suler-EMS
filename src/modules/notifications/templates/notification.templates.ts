import { SystemEventType } from "../domain/notification.model";

export interface NotificationTemplate {
  title: (payload: any) => string;
  message: (payload: any) => string;
}

/**
 * Enterprise Notification Template Registry
 * Centralizes all copy and formatting logic.
 */
export const NotificationTemplates: Record<SystemEventType, NotificationTemplate> = {
  LEAVE_REQUESTED_EVENT: {
    title: (p) => `Leave Approval Required`,
    message: (p) => `${p.requesterName} submitted a ${p.leaveType || 'leave'} request for ${p.days} days.`
  },
  LEAVE_APPROVED_EVENT: {
    title: (p) => `Leave Approved`,
    message: (p) => `Your leave request for ${p.startDate} has been approved.`
  },
  LEAVE_REJECTED_EVENT: {
    title: (p) => `Leave Rejected`,
    message: (p) => `Your leave request was not approved. Reason: ${p.reason || 'Not specified'}.`
  },
  LEAVE_CANCELLED_EVENT: {
    title: (p) => `Leave Cancelled`,
    message: (p) => `The leave request for ${p.startDate} has been cancelled.`
  },
  ATTENDANCE_CORRECTION_SUBMITTED_EVENT: {
    title: (p) => `Attendance Correction`,
    message: (p) => `${p.staffName} requested an attendance correction for ${p.date}.`
  },
  SECURITY_AUTH_FAILURE_EVENT: {
    title: (p) => `Security Alert: Login Failure`,
    message: (p) => `Multiple failed login attempts detected for ${p.email}.`
  },
  SECURITY_POLICY_VIOLATION_EVENT: {
    title: (p) => `Security Alert: Policy Violation`,
    message: (p) => `An unauthorized access attempt was detected: ${p.description}.`
  },
  SYSTEM_MAINTENANCE_EVENT: {
    title: (p) => `System Maintenance`,
    message: (p) => `Scheduled maintenance will occur on ${p.date}.`
  },
  STAFF_PROFILE_UPDATED_EVENT: {
    title: (p) => `Staff Profile Updated`,
    message: (p) => `Profile for ${p.staffName} has been updated.`
  }
};
