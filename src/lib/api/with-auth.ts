import { auth } from "@/lib/auth/auth.config";
import { errorResponse } from "@/lib/api-utils";
import { AuthService } from "@/lib/auth/auth.service";
import { NextRequest } from "next/server";

type AuthHandler = (req: NextRequest, session: any, context?: any) => Promise<Response>;

/**
 * Enterprise API Protection Wrapper
 * Ensures valid session, attaches correlation ID, and logs security events.
 * Supports optional route context (dynamic params) as a third argument.
 */
export function withAuth(handler: AuthHandler) {
  return async (req: NextRequest, context?: any) => {
    const correlationId = crypto.randomUUID();
    const session = await auth();

    if (!session) {
      await AuthService.recordSecurityEvent({
        type: 'PERMISSION_DENIED',
        description: `Unauthorized API access attempt to ${req.nextUrl.pathname}`,
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
        correlationId
      });
      
      return errorResponse("UNAUTHORIZED", "Valid session required", 401, correlationId);
    }

    try {
      return await handler(req, session, context);
    } catch (error: any) {
      console.error(`[API ERROR] ${correlationId}:`, error);
      return errorResponse("INTERNAL_ERROR", error.message, 500, correlationId);
    }
  };
}
