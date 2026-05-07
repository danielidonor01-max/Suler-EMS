import prisma from "@/lib/prisma";

export class ReconciliationService {
  /**
   * Request an attendance correction
   */
  static async requestCorrection(params: {
    employeeId: string;
    date: Date;
    requestedStatus: string;
    reason: string;
    actorId: string;
    originalStatus?: string;
  }) {
    const { employeeId, date, requestedStatus, reason, actorId, originalStatus } = params;

    // 1. Create Reconciliation Record
    return prisma.attendanceReconciliation.create({
      data: {
        employeeId,
        date,
        requestedStatus,
        reason,
        actorId,
        originalStatus,
        status: 'PENDING',
        metadata: {
          requestedAt: new Date(),
          source: 'MANUAL_OVERRIDE'
        }
      }
    });
  }

  /**
   * Approve a reconciliation request
   */
  static async approve(reconciliationId: string, approverId: string) {
    const reconciliation = await prisma.attendanceReconciliation.findUnique({
      where: { id: reconciliationId },
      include: { employee: true }
    });

    if (!reconciliation) throw new Error("Reconciliation not found");

    // 1. Update Attendance Record
    const date = new Date(reconciliation.date);
    date.setHours(0, 0, 0, 0);

    await prisma.attendanceRecord.upsert({
      where: {
        employeeId_date: {
          employeeId: reconciliation.employeeId,
          date
        }
      },
      create: {
        employeeId: reconciliation.employeeId,
        date,
        status: reconciliation.requestedStatus
      },
      update: {
        status: reconciliation.requestedStatus
      }
    });

    // 2. Finalize Reconciliation
    return prisma.attendanceReconciliation.update({
      where: { id: reconciliationId },
      data: {
        status: 'APPROVED',
        metadata: {
          ...(reconciliation.metadata as any),
          approvedAt: new Date(),
          approvedBy: approverId
        }
      }
    });
  }

  /**
   * Get pending reconciliation queue
   */
  static async getPendingQueue() {
    return prisma.attendanceReconciliation.findMany({
      where: { status: 'PENDING' },
      include: {
        employee: {
          select: { firstName: true, lastName: true, staffId: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
