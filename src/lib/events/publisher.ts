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
  },

  async notifyClientStatusChange(token: string, status: string) {
    if (!redis) return;
    
    const channel = `submission_updates:${token}`;
    const payload = {
      type: "STATUS_CHANGED",
      status,
      timestamp: new Date().toISOString(),
    };

    try {
      await redis.rpush(channel, JSON.stringify(payload));
      await redis.ltrim(channel, -10, -1); // Keep only last few for the specific client
      // Set expiration so we don't leak memory in Redis
      await redis.expire(channel, 60 * 60 * 24); // 24 hours
    } catch (error) {
      logger.error("Failed to publish client update signal", { token, error });
    }
  }
};
