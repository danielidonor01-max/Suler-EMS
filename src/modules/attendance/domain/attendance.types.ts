/**
 * Attendance Domain Types
 * Enterprise-grade hardware integration structures for Suler EMS.
 */

export enum DeviceTrustLevel {
  TRUSTED = 'TRUSTED',
  DEGRADED = 'DEGRADED',
  UNVERIFIED = 'UNVERIFIED',
  OFFLINE = 'OFFLINE',
  COMPROMISED = 'COMPROMISED'
}

export enum SourceClassification {
  BIOMETRIC = 'BIOMETRIC',
  MOBILE = 'MOBILE',
  WEB = 'WEB',
  MANUAL = 'MANUAL',
  API = 'API'
}

export enum AttendanceLogType {
  CHECK_IN = 'CHECK_IN',
  CHECK_OUT = 'CHECK_OUT',
  BREAK_IN = 'BREAK_IN',
  BREAK_OUT = 'BREAK_OUT'
}

export enum DeviceType {
  ZKTECO = 'ZKTECO',
  HIKVISION = 'HIKVISION',
  SUPREMA = 'SUPREMA',
  MOBILE = 'MOBILE',
  WEB = 'WEB'
}

export interface RawAttendanceEvent {
  deviceId: string;
  externalId: string; // Employee ID on device
  timestamp: Date;
  type: AttendanceLogType;
  source: SourceClassification;
  rawPayload: Record<string, any>;
  biometricReference?: string; // Fingerprint ID or Card Number
}

export interface AttendanceSyncResult {
  processed: number;
  duplicates: number;
  failed: number;
  errors: string[];
}

export interface DeviceAdapter {
  type: DeviceType;
  connect(): Promise<boolean>;
  disconnect(): Promise<void>;
  fetchLogs(since?: Date): Promise<RawAttendanceEvent[]>;
  getHealth(): Promise<{ status: string; uptime: number; latency: number }>;
}

export interface AttendanceActivityEvent {
  type: 'ATTENDANCE_CHECK_IN' | 'ATTENDANCE_CHECK_OUT' | 'DEVICE_STATUS_CHANGED';
  payload: any;
  timestamp: Date;
}
