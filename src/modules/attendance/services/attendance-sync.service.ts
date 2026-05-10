import prisma from "@/lib/prisma";
import { realtimeEmitter } from "@/lib/events/realtime.emitter";
import { 
  RawAttendanceEvent, 
  AttendanceLogType, 
  AttendanceSyncResult 
} from "../domain/attendance.types";

export class AttendanceSyncService {
  /**
   * Process a batch of raw attendance events (Idempotent)
   */
  static async ingestEvents(events: RawAttendanceEvent[]): Promise<AttendanceSyncResult> {
    const result: AttendanceSyncResult = {
      processed: 0,
      duplicates: 0,
      failed: 0,
      errors: []
    };

    for (const event of events) {
      try {
        // 1. Generate Idempotency Key
        const idempotencyKey = `${event.deviceId}:${event.timestamp.getTime()}:${event.externalId}`;

        // 2. Persist Raw Log (Fails if duplicate due to unique constraint)
        const rawLog = await prisma.rawAttendanceLog.create({
          data: {
            deviceId: event.deviceId,
            idempotencyKey,
            externalId: event.externalId,
            timestamp: event.timestamp,
            type: event.type,
            source: event.source,
            rawPayload: event.rawPayload as any,
            status: 'PENDING'
          }
        });

        // 3. Resolve Staff ID
        // In a real system, we might have a mapping table between device-ids and staff-ids
        // For now, we'll try to find an employee with a matching biometric reference or externalId
        const employee = await prisma.employee.findFirst({
          where: { 
            OR: [
              { staffId: event.externalId }, // Assuming externalId maps to staffId for this demo
              { id: event.biometricReference } 
            ]
          }
        });

        if (!employee) {
          await prisma.rawAttendanceLog.update({
            where: { id: rawLog.id },
            data: { status: 'REJECTED' }
          });
          result.failed++;
          continue;
        }

        await prisma.rawAttendanceLog.update({
          where: { id: rawLog.id },
          data: { staffId: employee.id }
        });

        // 4. Update Official Attendance Record (Shift-Aware)
        await this.finalizeAttendanceRecord(employee.id, event);

        // 5. Emit Realtime Event
        realtimeEmitter.emitAttendance({
          type: event.type === AttendanceLogType.CHECK_IN ? 'ATTENDANCE_CHECK_IN' : 'ATTENDANCE_CHECK_OUT',
          payload: {
            employeeId: employee.id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            timestamp: event.timestamp,
            location: event.deviceId,
            source: event.source
          },
          timestamp: new Date()
        });

        result.processed++;
      } catch (err: any) {
        if (err.code === 'P2002') {
          // Unique constraint violation = Duplicate
          result.duplicates++;
        } else {
          result.failed++;
          result.errors.push(err.message);
        }
      }
    }

    return result;
  }

  /**
   * Finalize the attendance record for the day
   * This logic is shift-aware (simplified for MVP)
   */
  private static async finalizeAttendanceRecord(employeeId: string, event: RawAttendanceEvent) {
    const date = new Date(event.timestamp);
    date.setHours(0, 0, 0, 0); // Normalized date for the record

    const record = await prisma.attendanceRecord.findUnique({
      where: { employeeId_date: { employeeId, date } }
    });

    if (event.type === AttendanceLogType.CHECK_IN) {
      // Only update check-in if not already set (keep first check-in of the day)
      if (!record || !record.checkIn) {
        await prisma.attendanceRecord.upsert({
          where: { employeeId_date: { employeeId, date } },
          create: {
            employeeId,
            date,
            checkIn: event.timestamp,
            status: 'PRESENT'
          },
          update: {
            checkIn: event.timestamp,
            status: 'PRESENT'
          }
        });
      }
    } else if (event.type === AttendanceLogType.CHECK_OUT) {
      // Update check-out (keep last check-out of the day)
      await prisma.attendanceRecord.upsert({
        where: { employeeId_date: { employeeId, date } },
        create: {
          employeeId,
          date,
          checkOut: event.timestamp,
          status: 'PRESENT'
        },
        update: {
          checkOut: event.timestamp
        }
      });
    }
  }
}
