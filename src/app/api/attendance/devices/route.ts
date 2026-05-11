import { NextRequest } from 'next/server';
import { DeviceService } from '@/modules/attendance/services/device.service';
import { successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  try {
    const devices = await DeviceService.getDevices();
    return successResponse(devices);
  } catch (err: any) {
    return errorResponse('FETCH_ERROR', err.message, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const device = await DeviceService.registerDevice(body);
    return successResponse(device);
  } catch (err: any) {
    return errorResponse('REGISTER_ERROR', err.message, 500);
  }
}
