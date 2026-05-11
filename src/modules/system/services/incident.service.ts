import { log } from "@/lib/observability/logger";
import { realtimeEmitter } from "@/lib/events/realtime.emitter";

export enum IncidentSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface Incident {
  id: string;
  type: string;
  severity: IncidentSeverity;
  message: string;
  timestamp: Date;
  metadata?: any;
}

export class IncidentService {
  /**
   * Trigger an operational incident response
   */
  static async reportIncident(incident: Omit<Incident, 'id' | 'timestamp'>) {
    const id = Math.random().toString(36).substring(7);
    const fullIncident: Incident = {
      ...incident,
      id,
      timestamp: new Date()
    };

    log.security(`[INCIDENT][${incident.severity}] ${incident.message}`, 
      incident.severity === IncidentSeverity.CRITICAL ? 'CRITICAL' : 'HIGH_RISK', 
      { incidentId: id, ...incident.metadata }
    );

    // Notify Admins via Real-time
    realtimeEmitter.emitNotification('SYSTEM_ADMIN', {
      title: `OPERATIONAL INCIDENT: ${incident.type}`,
      message: incident.message,
      category: 'SYSTEM',
      priority: incident.severity === IncidentSeverity.CRITICAL ? 'URGENT' : 'NORMAL'
    });

    // If critical, trigger "Degraded Mode" for UI
    if (incident.severity === IncidentSeverity.CRITICAL) {
      this.activateDegradedMode(incident.type);
    }

    return fullIncident;
  }

  private static activateDegradedMode(module: string) {
    log.warn(`DEGRADED MODE ACTIVATED: ${module}`);
    // Emit event to all clients to show maintenance/warning banners
    realtimeEmitter.emit('SYSTEM_DEGRADED', { module });
  }
}
