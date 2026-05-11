import { UUID } from "@/types/common";

export type ForecastGranularity = 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type AnomalySeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type RecommendationCategory = 'STAFFING' | 'EFFICIENCY' | 'COMPLIANCE' | 'SECURITY';

export interface ForecastDataPoint {
  date: string;
  actual?: number;
  predicted: number;
  confidenceUpper?: number;
  confidenceLower?: number;
}

export interface WorkforceProjection {
  departmentId: string;
  departmentName: string;
  currentHeadcount: number;
  projectedNeed: number;
  gap: number;
  trend: ForecastDataPoint[];
}

export interface OperationalRiskModel {
  scope: 'ORGANIZATION' | 'DEPARTMENT';
  scopeId?: string;
  burnoutRisk: number; // 0.0 to 1.0
  complianceRisk: number;
  operationalRisk: number;
  overallScore: number;
  signals: string[]; // Explainable signals
}

export interface AnomalyModel {
  id: UUID;
  type: 'ATTENDANCE_FRAUD' | 'WORKFLOW_STAGNATION' | 'AUTH_ABUSE' | 'ABNORMAL_SPIKE';
  severity: AnomalySeverity;
  description: string;
  evidence: Record<string, any>;
  timestamp: Date;
  isResolved: boolean;
}

export interface RecommendationModel {
  id: UUID;
  category: RecommendationCategory;
  title: string;
  message: string;
  reasoning: string; // Refinement: Explainability
  suggestedAction?: string;
  impactScore: number; // 0.0 to 1.0
  status: 'ACTIVE' | 'APPLIED' | 'DISMISSED';
}
