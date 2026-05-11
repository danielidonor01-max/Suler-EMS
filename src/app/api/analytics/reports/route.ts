import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth.config';
import { ReportingService } from '@/modules/analytics/services/reporting.service';

/**
 * Analytics Reporting API
 * Handles report job creation and status retrieval.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { type, format, parameters } = body;

    if (!type || !format) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = await ReportingService.createJob(
      session.user.id,
      type,
      format,
      parameters
    );

    if (result.success) {
      return NextResponse.json({ success: true, data: result.data });
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    // Security: Only allow fetching own jobs unless SuperAdmin
    if (userId !== session.user.id && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const jobs = await ReportingService.getUserJobs(userId || session.user.id);
    return NextResponse.json({ success: true, data: jobs });
  } catch (err: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
