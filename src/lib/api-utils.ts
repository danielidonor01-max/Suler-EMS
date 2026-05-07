import { NextResponse } from 'next/server';
import { ApiError } from '@/modules/common/contracts/repository.contract';

/**
 * Standardized API Error Response
 */
export function errorResponse(
  code: string, 
  message: string, 
  status: number = 500,
  correlationId?: string
) {
  const err: ApiError = {
    code,
    message,
    correlationId: correlationId || crypto.randomUUID()
  };
  
  return NextResponse.json(err, { status });
}

/**
 * Standardized API Success Response
 */
export function successResponse<T>(data: T, correlationId?: string) {
  return NextResponse.json({
    success: true,
    data,
    correlationId: correlationId || crypto.randomUUID()
  });
}
