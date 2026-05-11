import prisma from "@/lib/prisma";
import { KPIMetric, ThresholdStatus, OperationalInsight, WorkflowBottleneck } from "../domain/analytics.model";

/**
 * Aggregation Service
 * Computes complex metrics and insights from transactional data.
 */
export class AggregationService {
  /**
   * Compute Workforce KPIs
   */
  static async computeWorkforceKPIs(departmentId?: string): Promise<Record<string, KPIMetric>> {
    const headcount = await prisma.employee.count({
      where: departmentId ? { departmentId } : {}
    });

    // Mock utilization for now, in real life this would check shift hours vs actual
    const utilizationValue = 82.5; 
    
    return {
      headcount: {
        value: headcount,
        label: 'Total Headcount',
        status: 'NORMAL'
      },
      utilization: {
        value: utilizationValue,
        label: 'Workforce Utilization',
        unit: '%',
        trend: 1.2,
        status: utilizationValue < 70 ? 'WARNING' : 'NORMAL'
      }
    };
  }

  /**
   * Compute Attendance Metrics
   */
  static async computeAttendanceCompliance(date: Date): Promise<KPIMetric> {
    const totalEmployees = await prisma.employee.count();
    const attendanceCount = await prisma.attendanceRecord.count({
      where: { date: { equals: date } }
    });

    const compliance = (attendanceCount / totalEmployees) * 100;

    return {
      value: parseFloat(compliance.toFixed(1)),
      label: 'Attendance Compliance',
      unit: '%',
      status: compliance < 85 ? 'CRITICAL' : compliance < 95 ? 'WARNING' : 'NORMAL'
    };
  }

  /**
   * Identify Workflow Bottlenecks
   */
  static async getWorkflowBottlenecks(): Promise<WorkflowBottleneck[]> {
    const departments = await prisma.department.findMany({
      include: { 
        employees: {
          select: { id: true }
        }
      }
    });

    const bottlenecks: WorkflowBottleneck[] = [];

    for (const dept of departments) {
      // Find all workflow instances related to this department's employees
      const employeeIds = dept.employees.map(e => e.id);
      const instances = await prisma.workflowInstance.findMany({
        where: { 
          resourceId: { in: employeeIds },
          currentState: { not: 'COMPLETED' }
        }
      });

      // Simple heuristic: Average time in current state (mocked for demo)
      const avgHours = Math.random() * 48; // In real app, compute from audit logs
      
      bottlenecks.push({
        departmentId: dept.id,
        departmentName: dept.name,
        averageApprovalHours: parseFloat(avgHours.toFixed(1)),
        pendingCount: instances.length,
        rejectionRate: Math.random() * 15,
        status: avgHours > 24 ? 'CRITICAL' : avgHours > 12 ? 'WARNING' : 'NORMAL'
      });
    }

    return bottlenecks.sort((a, b) => b.averageApprovalHours - a.averageApprovalHours);
  }

  /**
   * Generate Operational Insights
   */
  static async generateInsights(): Promise<OperationalInsight[]> {
    const insights: OperationalInsight[] = [];
    const compliance = await this.computeAttendanceCompliance(new Date());

    if (compliance.status === 'CRITICAL') {
      insights.push({
        id: crypto.randomUUID(),
        type: 'COMPLIANCE',
        severity: 'CRITICAL',
        title: 'Low Attendance Compliance',
        message: `Today's attendance is at ${compliance.value}%, which is below the operational threshold of 85%.`,
        suggestedAction: 'Review site attendance logs and contact supervisors.',
        timestamp: new Date()
      });
    }

    const bottlenecks = await this.getWorkflowBottlenecks();
    const criticalBottleneck = bottlenecks.find(b => b.status === 'CRITICAL');
    
    if (criticalBottleneck) {
      insights.push({
        id: crypto.randomUUID(),
        type: 'EFFICIENCY',
        severity: 'WARNING',
        title: 'Workflow Bottleneck Detected',
        message: `The ${criticalBottleneck.departmentName} department has ${criticalBottleneck.pendingCount} pending approvals with an average delay of ${criticalBottleneck.averageApprovalHours} hours.`,
        suggestedAction: 'Escalate pending approvals to HR or Department Head.',
        timestamp: new Date()
      });
    }

    return insights;
  }
}
