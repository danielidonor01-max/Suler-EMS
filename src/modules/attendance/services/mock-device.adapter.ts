import { 
  DeviceAdapter, 
  DeviceType, 
  RawAttendanceEvent, 
  AttendanceLogType, 
  SourceClassification 
} from "../domain/attendance.types";

/**
 * MockDeviceAdapter
 * Simulates a biometric device for testing and architectural validation.
 */
export class MockDeviceAdapter implements DeviceAdapter {
  type = DeviceType.ZKTECO;
  private isConnected = false;

  async connect(): Promise<boolean> {
    this.isConnected = true;
    console.log(`[MockDeviceAdapter] Connected to simulated ${this.type} hardware.`);
    return true;
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    console.log(`[MockDeviceAdapter] Disconnected.`);
  }

  async fetchLogs(since?: Date): Promise<RawAttendanceEvent[]> {
    if (!this.isConnected) throw new Error("Device not connected");

    // Simulate some logs
    return [
      {
        deviceId: 'mock-device-1',
        externalId: '101',
        timestamp: new Date(),
        type: AttendanceLogType.CHECK_IN,
        source: SourceClassification.BIOMETRIC,
        rawPayload: { original_hex: '0x123', biometric_score: 0.98 },
        biometricReference: 'FP-001'
      }
    ];
  }

  async getHealth() {
    return {
      status: this.isConnected ? 'ONLINE' : 'OFFLINE',
      uptime: 99.9,
      latency: 45 // ms
    };
  }
}
