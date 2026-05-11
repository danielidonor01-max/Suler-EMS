import prisma from '@/lib/prisma';

/**
 * Service for managing security events and identity auditing.
 */
export class AuthService {
  /**
   * Records a login attempt (success or failure).
   */
  static async recordLoginAttempt(data: {
    email: string;
    success: boolean;
    ipAddress?: string;
    userAgent?: string;
    userId?: string;
    correlationId?: string;
  }) {
    return prisma.loginAttempt.create({
      data: {
        email: data.email,
        success: data.success,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        userId: data.userId,
        correlationId: data.correlationId,
      }
    });
  }

  /**
   * Records a high-level security event.
   */
  static async recordSecurityEvent(data: {
    type: 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'SESSION_EXPIRED' | 'PERMISSION_DENIED';
    userId?: string;
    description: string;
    metadata?: any;
    ipAddress?: string;
    correlationId?: string;
  }) {
    return prisma.securityEvent.create({
      data: {
        type: data.type,
        userId: data.userId,
        description: data.description,
        metadata: data.metadata || {},
        ipAddress: data.ipAddress,
        correlationId: data.correlationId,
      }
    });
  }
}
