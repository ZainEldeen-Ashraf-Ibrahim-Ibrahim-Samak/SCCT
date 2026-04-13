"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Bell } from "lucide-react";
import { AdminNotification } from "@/lib/events/publisher";
import Link from "next/link";

export function LiveNotifications() {
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout;
    
    function connect() {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const eventSource = new EventSource("/api/admin/events");
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === "CONNECTION_ESTABLISHED") {
            // console.log("SSE connected");
            return;
          }

          const notification = data as AdminNotification;

          toast.custom((t) => (
            <div className="flex items-start gap-4 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg w-[350px]">
              <div className="bg-primary/10 text-primary p-2 rounded-full mt-0.5">
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="font-semibold text-sm">{notification.title}</p>
                <p className="text-xs text-zinc-500 whitespace-pre-wrap">{notification.message}</p>
                
                {notification.link && (
                  <div className="pt-2">
                    <Link 
                      href={notification.link}
                      onClick={() => toast.dismiss(t)} 
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      View Details &rarr;
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ), { duration: 6000 });

        } catch (e) {
          console.error("Failed to parse SSE event", e);
        }
      };

      eventSource.onerror = (err) => {
        eventSource.close();
        // Reconnect after 3s
        reconnectTimeout = setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return null; // pure headless background component
}
