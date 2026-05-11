import prisma from "@/lib/prisma";
import { ReportType, ReportJobModel } from "../domain/analytics.model";
import { Result } from "@/types/api";
import { UUID } from "@/types/common";
import { inngest } from "@/lib/inngest/client";

/**
 * Reporting Service
 * Handles data preparation for exports and async job management.
 */
export class ReportingService {
  /**
   * Create a new reporting job (Enterprise Async)
   */
  static async createJob(userId: UUID, type: ReportType, format: 'CSV' | 'PDF', parameters?: any): Promise<Result<ReportJobModel>> {
    try {
      // 1. Audit: Track report generation request
      console.log(`[AUDIT] Report Requested: ${type} by ${userId}`);

      const job = await prisma.reportJob.create({
        data: {
          userId,
          type,
          format,
          parameters: parameters || {},
          status: 'PENDING',
          schemaVersion: '1.0',
          generatedByVersion: '1.0'
        }
      });

      // 2. Trigger Durable Background Worker via Inngest
      await inngest.send({
        name: "report/generation.requested",
        data: {
          jobId: job.id,
          userId,
          type,
          format,
          parameters
        }
      });

      return { success: true, data: job as unknown as ReportJobModel };
    } catch (err: any) {
      console.error(`[ERROR] Failed to initiate report job: ${err.message}`);
      return { success: false, error: { code: 'REPORT_INIT_ERROR', message: err.message } };
    }
  }

  /**
   * Get Report Data (Role-Aware & Snapshot-Ready)
   * Enhanced with Nigerian Identity fields.
   */
  static async getReportData(type: ReportType, userId: string, role: string): Promise<any[]> {
    switch (type) {
      case 'WORKFORCE_COMPOSITION':
        return prisma.employee.findMany({
          select: { 
            staffId: true, 
            firstName: true, 
            lastName: true,
            email: true,
            jobTitle: true,
            status: true,
            nin: true, // Nigerian Identity
            pensionPFA: true, // Nigerian Compliance
            department: { select: { name: true } } 
          },
          // If Manager, only show their department
          ...(role === 'MANAGER' ? { where: { department: { managerId: userId } } } : {})
        });
      
      case 'ATTENDANCE_COMPLIANCE':
        return prisma.attendanceRecord.findMany({
          take: 500,
          orderBy: { date: 'desc' }
        });

      default:
        return [];
    }
  }

  /**
   * Get Recent Jobs for a User
   */
  static async getUserJobs(userId: string): Promise<ReportJobModel[]> {
    const jobs = await prisma.reportJob.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    return jobs as unknown as ReportJobModel[];
  }
}
