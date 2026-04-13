import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { ADMIN_CHANNEL } from "@/lib/events/publisher";

export const dynamic = "force-dynamic";

export async function GET() {
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      const sendEvent = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Initial connection
      sendEvent({ type: "CONNECTION_ESTABLISHED" });

      if (!redis) {
        controller.close();
        return;
      }

      let active = true;
      let lastChecked = Date.now();

      // Simple pseudo-polling loop for SSE over Upstash REST 
      // since true TCP SUBSCRIBE isn't natively supported on serverless HTTP clients.
      const interval = setInterval(async () => {
        if (!active) return;
        try {
          // Fetch newest events 
          const rawEvents = await redis.lrange(ADMIN_CHANNEL, -5, -1);
          if (rawEvents && Array.isArray(rawEvents)) {
            for (const evStr of rawEvents) {
              const ev = typeof evStr === "string" ? JSON.parse(evStr) : evStr;
              const evTime = new Date(ev.timestamp).getTime();
              // Only send if it's new
              if (evTime > lastChecked) {
                sendEvent(ev);
                lastChecked = evTime;
              }
            }
          }
        } catch (e) {
          // Silent catch to prevent closing stream randomly
        }
      }, 5000);

      // Cleanup
      requestAnimationFrame = () => {};
      const cleanup = () => {
        active = false;
        clearInterval(interval);
      };

      // Detect stream close
      const reader = stream.getReader();
      reader.closed.catch(cleanup).finally(cleanup);
    }
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
