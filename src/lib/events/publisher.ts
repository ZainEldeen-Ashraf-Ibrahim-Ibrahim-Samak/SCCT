import { redis } from "@/lib/redis";
import { logger } from "@/lib/dev-logger";

export interface AdminNotification {
  type: "NEW_SUBMISSION" | "SYSTEM_ALERT";
  title: string;
  message: string;
  timestamp: string;
  link?: string;
}

export const ADMIN_CHANNEL = "admin_notifications";

export const NotificationPublisher = {
  async notifyAdmins(notification: Omit<AdminNotification, "timestamp">) {
    if (!redis) {
      logger.warn("Redis client not configured. Notifications disabled.");
      return;
    }

    const payload: AdminNotification = {
      ...notification,
      timestamp: new Date().toISOString(),
    };

    try {
      // Use a list for event streaming since Upstash REST does not support blocking SUBSCRIBE
      await redis.rpush(ADMIN_CHANNEL, JSON.stringify(payload));
      // Keep only last 100 notifications
      await redis.ltrim(ADMIN_CHANNEL, -100, -1);
    } catch (error) {
      logger.error("Failed to publish notification to Upstash Redis", error);
    }
  }
};
