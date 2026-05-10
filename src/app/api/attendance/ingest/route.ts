import { NextRequest, NextResponse } from 'next/server';
import { AttendanceSyncService } from '@/modules/attendance/services/attendance-sync.service';
import { DeviceService } from '@/modules/attendance/services/device.service';
import { RawAttendanceEvent } from '@/modules/attendance/domain/attendance.types';
import { successResponse, errorResponse } from '@/lib/api-utils';

/**
 * Hardware Ingestion Endpoint
 * Receives raw attendance logs from devices/adapters.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { deviceId, logs, deviceTime } = body;

    if (!deviceId || !logs || !Array.isArray(logs)) {
      return errorResponse('INVALID_PAYLOAD', 'DeviceId and logs array are required', 400);
    }

    // 1. Report Clock Drift if device time is provided
    if (deviceTime) {
      await DeviceService.reportClockDrift(deviceId, new Date(deviceTime));
    }

    // 2. Map payload to Domain Events
    const events: RawAttendanceEvent[] = logs.map(log => ({
      deviceId,
      externalId: log.externalId,
      timestamp: new Date(log.timestamp),
      type: log.type,
      source: log.source || 'BIOMETRIC',
      rawPayload: log,
      biometricReference: log.biometricReference
    }));

    // 3. Process Ingestion Pipeline
    const result = await AttendanceSyncService.ingestEvents(events);

    // 4. Update Device Health (Simplified)
    await DeviceService.updateHealth(deviceId, {
      status: 'ONLINE',
      uptime: 100,
      latency: 50 // ms
    });

    return successResponse(result);
  } catch (err: any) {
    console.error('Ingestion failed:', err);
    return errorResponse('INGESTION_ERROR', err.message, 500);
  }
}
