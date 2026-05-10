import prisma from "@/lib/prisma";
import { DeviceTrustLevel, DeviceType } from "../domain/attendance.types";
import { realtimeEmitter } from "@/lib/events/realtime.emitter";

export class DeviceService {
  /**
   * Register a new hardware device
   */
  static async registerDevice(params: {
    name: string;
    serialNumber: string;
    type: DeviceType;
    location?: string;
    ipAddress?: string;
  }) {
    return prisma.biometricDevice.create({
      data: {
        ...params,
        status: 'ONLINE',
        trustLevel: DeviceTrustLevel.TRUSTED
      }
    });
  }

  /**
   * Update device health metrics
   */
  static async updateHealth(deviceId: string, metrics: { 
    latency: number; 
    uptime: number;
    status: string;
  }) {
    return prisma.biometricDevice.update({
      where: { id: deviceId },
      data: {
        status: metrics.status,
        lastHeartbeat: new Date(),
        healthMetrics: metrics as any,
        lastSeenAt: new Date()
      }
    });
  }

  /**
   * Detect clock drift between device and server
   */
  static async reportClockDrift(deviceId: string, deviceTime: Date) {
    const serverTime = new Date();
    const driftSeconds = Math.floor((deviceTime.getTime() - serverTime.getTime()) / 1000);
    
    const oldDevice = await prisma.biometricDevice.findUnique({ where: { id: deviceId } });
    
    let trustLevel = DeviceTrustLevel.TRUSTED;
    if (Math.abs(driftSeconds) > 300) { // 5 minutes
      trustLevel = DeviceTrustLevel.DEGRADED;
    }

    const device = await prisma.biometricDevice.update({
      where: { id: deviceId },
      data: { 
        clockDriftSeconds: driftSeconds,
        trustLevel
      }
    });

    if (oldDevice?.trustLevel === DeviceTrustLevel.TRUSTED && trustLevel === DeviceTrustLevel.DEGRADED) {
      realtimeEmitter.emitNotification('SYSTEM_ADMIN', {
        title: 'Hardware Clock Drift Detected',
        message: `Device ${device.name} has excessive clock drift (${driftSeconds}s). Trust level degraded.`,
        category: 'HARDWARE',
        priority: 'URGENT'
      });
    }

    return device;
  }

  /**
   * List all monitored devices
   */
  static async getDevices() {
    return prisma.biometricDevice.findMany({
      orderBy: { lastSeenAt: 'desc' }
    });
  }

  /**
   * Update device trust level
   */
  static async updateTrustLevel(deviceId: string, trustLevel: DeviceTrustLevel) {
    const device = await prisma.biometricDevice.update({
      where: { id: deviceId },
      data: { trustLevel }
    });

    // Notify System Admins
    // We can use a notification service or emit a system event
    realtimeEmitter.emitNotification('SYSTEM_ADMIN', {
      title: 'Device Trust Update',
      message: `Device ${device.name} (${device.serialNumber}) is now ${trustLevel}.`,
      category: 'HARDWARE',
      priority: trustLevel === DeviceTrustLevel.TRUSTED ? 'NORMAL' : 'URGENT'
    });

    return device;
  }
}
