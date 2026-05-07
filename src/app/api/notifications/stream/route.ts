import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth.config";
import { realtimeEmitter } from "@/lib/events/realtime.emitter";

/**
 * Unified SSE Endpoint for Realtime Operations
 * Handles both Notifications and Communication events.
 * GET /api/notifications/stream
 */
export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Function to send data to the client
      const sendEvent = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // 1. Send initial heartbeat
      sendEvent({ type: 'HEARTBEAT', timestamp: new Date() });

      // 2. Listen for Notifications
      const onNotification = (notification: any) => {
        sendEvent({ type: 'NOTIFICATION', data: notification });
      };

      // 3. Listen for Communication (Messages, Presence, Typing)
      const onCommunication = (event: any) => {
        sendEvent({ type: 'COMMUNICATION', data: event });
      };

      // 4. Listen for Attendance Activity
      const onAttendance = (event: any) => {
        sendEvent({ type: 'ATTENDANCE', data: event });
      };

      realtimeEmitter.onNotification(userId, onNotification);
      realtimeEmitter.onCommunication(userId, onCommunication);
      realtimeEmitter.onAttendance(onAttendance);

      // 5. Heartbeat every 30 seconds to keep connection alive
      const heartbeatInterval = setInterval(() => {
        sendEvent({ type: 'HEARTBEAT', timestamp: new Date() });
      }, 30000);

      // 6. Cleanup on close
      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeatInterval);
        realtimeEmitter.offNotification(userId, onNotification);
        realtimeEmitter.offCommunication(userId, onCommunication);
        realtimeEmitter.offAttendance(onAttendance);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
