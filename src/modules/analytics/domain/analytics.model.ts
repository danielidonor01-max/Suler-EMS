import { UUID } from "@/types/common";

export type AnalyticsGranularity = 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
export type ThresholdStatus = 'NORMAL' | 'WARNING' | 'CRITICAL';

export interface KPIMetric {
  value: number;
  label: string;
  unit?: string;
  trend?: number; // Percentage change from previous period
  status: ThresholdStatus;
}

export interface OperationalInsight {
  id: string;
  type: 'EFFICIENCY' | 'COMPLIANCE' | 'SECURITY' | 'UTILIZATION';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  suggestedAction?: string;
  timestamp: Date;
}

export interface AnalyticsSnapshotModel {
  id: UUID;
  type: 'WORKFORCE' | 'ATTENDANCE' | 'WORKFLOW' | 'SECURITY';
  granularity: AnalyticsGranularity;
  calculationVersion: string;
  timestamp: Date;
  kpis: Record<string, KPIMetric>;
  insights: OperationalInsight[];
  metadata?: Record<string, any>;
}

export interface WorkflowBottleneck {
  departmentId: string;
  departmentName: string;
  averageApprovalHours: number;
  pendingCount: number;
  rejectionRate: number;
  status: ThresholdStatus;
}

/**
 * Report Domain Models
 */
export type ReportType = 
  | 'WORKFORCE_COMPOSITION'
  | 'ATTENDANCE_COMPLIANCE'
  | 'LEAVE_UTILIZATION'
  | 'WORKFLOW_EFFICIENCY'
  | 'SECURITY_AUDIT';

export interface ReportJobModel {
  id: UUID;
  userId: UUID;
  type: ReportType;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  format: 'CSV' | 'PDF';
  downloadUrl?: string;
  createdAt: Date;
  completedAt?: Date;
}
