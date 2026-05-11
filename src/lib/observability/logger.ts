import winston from 'winston';
import { AsyncLocalStorage } from 'async_hooks';

// Centralized Redaction Rules
const SENSITIVE_FIELDS = ['nin', 'bvn', 'tin', 'password', 'token', 'secret', 'pensionNumber'];

const redact = winston.format((info) => {
  const result = { ...info };
  
  // Recursively redact sensitive fields from metadata
  const redactObject = (obj: any) => {
    for (const key in obj) {
      if (SENSITIVE_FIELDS.includes(key.toLowerCase())) {
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        redactObject(obj[key]);
      }
    }
  };

  if (result.metadata) redactObject(result.metadata);
  return result;
});

// AsyncLocalStorage for Correlation ID propagation
export const correlationContext = new AsyncLocalStorage<{ correlationId: string }>();

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    redact(),
    winston.format.json()
  ),
  defaultMeta: { service: 'suler-ems' },
  transports: [
    new winston.transports.Console()
  ]
});

/**
 * Enterprise Structured Logger
 */
export const log = {
  info: (message: string, metadata?: any) => {
    const context = correlationContext.getStore();
    logger.info(message, { metadata, correlationId: context?.correlationId });
  },
  warn: (message: string, metadata?: any) => {
    const context = correlationContext.getStore();
    logger.warn(message, { metadata, correlationId: context?.correlationId });
  },
  error: (message: string, error?: any, metadata?: any) => {
    const context = correlationContext.getStore();
    logger.error(message, { 
      error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
      metadata, 
      correlationId: context?.correlationId 
    });
  },
  security: (message: string, severity: 'INFO' | 'WARNING' | 'HIGH_RISK' | 'CRITICAL', metadata?: any) => {
    const context = correlationContext.getStore();
    logger.info(`[SECURITY][${severity}] ${message}`, { 
      metadata, 
      correlationId: context?.correlationId,
      isSecurityEvent: true,
      severity 
    });
  },
  sla: (metricName: string, durationMs: number, metadata?: any) => {
    const context = correlationContext.getStore();
    logger.info(`[SLA] ${metricName}`, { 
      metricName, 
      durationMs, 
      metadata, 
      correlationId: context?.correlationId,
      isSlaMetric: true 
    });
  }
};
