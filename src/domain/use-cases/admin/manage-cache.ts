"use server";

import { redis, cacheInvalidatePattern } from "@/lib/redis";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function checkAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized: Only admins can perform this action");
  }
  return session;
}

/**
 * Fetches statistics from Redis for dashboard visualization.
 */
export async function getCacheStats() {
  await checkAdmin();
  
  if (!redis) {
    return {
      available: false,
      totalKeys: 0,
      segments: []
    };
  }

  try {
    // Scan for high-level segments
    const [_, formKeys] = await redis.scan(0, { match: "form:*", count: 1000 });
    const [__, fieldKeys] = await redis.scan(0, { match: "fields:*", count: 1000 });
    const [___, listKeys] = await redis.scan(0, { match: "submissions:list:*", count: 1000 });
    const [____, subKeys] = await redis.scan(0, { match: "submission:*", count: 1000 });
    const [_____, countKeys] = await redis.scan(0, { match: "submissions:counts", count: 1000 });

    const total = formKeys.length + fieldKeys.length + listKeys.length + subKeys.length + countKeys.length;

    return {
      available: true,
      totalKeys: total,
      segments: [
        { label: "Forms & Templates", count: formKeys.length + fieldKeys.length, color: "blue" },
        { label: "Submissions Hub", count: listKeys.length + countKeys.length, color: "green" },
        { label: "Active Client Sessions", count: subKeys.length, color: "purple" }
      ]
    };
  } catch (error) {
    console.error("Failed to fetch cache stats", error);
    return { available: false, totalKeys: 0, segments: [] };
  }
}

/**
 * Clears specific segments of the application cache.
 */
export async function clearCacheGroup(type: "all" | "forms" | "submissions") {
  await checkAdmin();
  
  if (!redis) return { success: false, message: "Redis not configured" };

  try {
    if (type === "all") {
      await redis.flushdb();
    } else if (type === "forms") {
      await cacheInvalidatePattern("form:*");
      await cacheInvalidatePattern("fields:*");
    } else if (type === "submissions") {
      await cacheInvalidatePattern("submissions:*");
      await cacheInvalidatePattern("submission:*");
    }

    revalidatePath("/admin", "layout");
    return { success: true, message: `Cache segment '${type}' cleared successfully.` };
  } catch (error) {
    console.error(`Failed to clear cache group: ${type}`, error);
    return { success: false, message: "Execution error during cache cleanup." };
  }
}
