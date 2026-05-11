import { EventEmitter } from 'events';

/**
 * Lightweight in-memory emitter for Realtime updates.
 * Used by API routes to listen for specific user events.
 */
class RealtimeEmitter extends EventEmitter {
  /**
   * Emit a notification event for a specific user
   */
  emitNotification(userId: string, notification: any) {
    this.emit(`notification:${userId}`, notification);
  }

  /**
   * Listen for user notifications
   */
  onNotification(userId: string, callback: (notification: any) => void) {
    this.on(`notification:${userId}`, callback);
  }

  /**
   * Stop listening for notifications
   */
  offNotification(userId: string, callback: (notification: any) => void) {
    this.off(`notification:${userId}`, callback);
  }

  /**
   * Emit a communication event (Message, Status, Typing, etc.)
   */
  emitCommunication(userId: string, event: any) {
    this.emit(`communication:${userId}`, event);
  }

  /**
   * Listen for communication events
   */
  onCommunication(userId: string, callback: (event: any) => void) {
    this.on(`communication:${userId}`, callback);
  }

  /**
   * Stop listening for communication
   */
  offCommunication(userId: string, callback: (event: any) => void) {
    this.off(`communication:${userId}`, callback);
  }

  /**
   * Emit an attendance activity event (Check-in, Check-out)
   */
  emitAttendance(event: any) {
    this.emit('attendance_activity', event);
  }

  /**
   * Listen for attendance activity
   */
  onAttendance(callback: (event: any) => void) {
    this.on('attendance_activity', callback);
  }

  /**
   * Stop listening for attendance
   */
  offAttendance(callback: (event: any) => void) {
    this.off('attendance_activity', callback);
  }
}

export const realtimeEmitter = new RealtimeEmitter();
