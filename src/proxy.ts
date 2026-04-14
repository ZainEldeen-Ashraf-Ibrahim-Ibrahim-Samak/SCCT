import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { routing } from "@/i18n/routing";
import { detectMaliciousContent } from "@/lib/api-security";

type RateBucket = {
  count: number;
  resetAt: number;
};

declare global {
  var __scctApiRateLimitStore: Map<string, RateBucket> | undefined;
}

const intlMiddleware = createMiddleware(routing);

const rateLimitStore = globalThis.__scctApiRateLimitStore ?? new Map<string, RateBucket>();
if (!globalThis.__scctApiRateLimitStore) {
  globalThis.__scctApiRateLimitStore = rateLimitStore;
}

function readNumberEnv(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(value)));
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return "unknown";
}

function cleanupRateLimitStore(now: number) {
  if (rateLimitStore.size < 5000) return;
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

function getRateLimitConfig(pathname: string) {
  const defaultWindowMs = readNumberEnv("API_RATE_LIMIT_WINDOW_MS", 60_000, 1_000, 86_400_000);
  const defaultMax = readNumberEnv("API_RATE_LIMIT_MAX_REQUESTS", 120, 1, 100_000);

  if (pathname.startsWith("/api/admin")) {
    return {
      windowMs: readNumberEnv("API_RATE_LIMIT_ADMIN_WINDOW_MS", defaultWindowMs, 1_000, 86_400_000),
      maxRequests: readNumberEnv("API_RATE_LIMIT_ADMIN_MAX_REQUESTS", defaultMax, 1, 100_000),
      scope: "admin",
    };
  }

  if (pathname.startsWith("/api/auth")) {
    return {
      windowMs: readNumberEnv("API_RATE_LIMIT_AUTH_WINDOW_MS", defaultWindowMs, 1_000, 86_400_000),
      maxRequests: readNumberEnv("API_RATE_LIMIT_AUTH_MAX_REQUESTS", 30, 1, 100_000),
      scope: "auth",
    };
  }

  return {
    windowMs: readNumberEnv("API_RATE_LIMIT_PUBLIC_WINDOW_MS", defaultWindowMs, 1_000, 86_400_000),
    maxRequests: readNumberEnv("API_RATE_LIMIT_PUBLIC_MAX_REQUESTS", defaultMax, 1, 100_000),
    scope: "public",
  };
}

function applyRateLimit(request: NextRequest) {
  const now = Date.now();
  cleanupRateLimitStore(now);

  const pathname = request.nextUrl.pathname;
  const { windowMs, maxRequests, scope } = getRateLimitConfig(pathname);
  const ip = getClientIp(request);
  const key = `${scope}:${pathname}:${ip}`;

  const existing = rateLimitStore.get(key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      limit: maxRequests,
      remaining: Math.max(0, maxRequests - 1),
      resetAt,
    };
  }

  existing.count += 1;
  rateLimitStore.set(key, existing);

  const remaining = Math.max(0, maxRequests - existing.count);
  return {
    allowed: existing.count <= maxRequests,
    limit: maxRequests,
    remaining,
    resetAt: existing.resetAt,
  };
}

function withRateLimitHeaders(response: NextResponse, rate: { limit: number; remaining: number; resetAt: number }) {
  response.headers.set("X-RateLimit-Limit", String(rate.limit));
  response.headers.set("X-RateLimit-Remaining", String(rate.remaining));
  response.headers.set("X-RateLimit-Reset", String(Math.floor(rate.resetAt / 1000)));
  return response;
}

async function handleApiSecurity(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;

  const pathThreat = detectMaliciousContent(pathname, "path");
  if (pathThreat) {
    return NextResponse.json(
      {
        success: false,
        error: "Potential malicious request path detected",
        code: "MALICIOUS_REQUEST_PATH",
      },
      { status: 400 },
    );
  }

  const querySnapshot: Record<string, string> = {};
  request.nextUrl.searchParams.forEach((value, key) => {
    querySnapshot[key] = value;
  });

  const queryThreat = detectMaliciousContent(querySnapshot, "query");
  if (queryThreat) {
    return NextResponse.json(
      {
        success: false,
        error: "Potential malicious query payload detected",
        code: "MALICIOUS_QUERY_DETECTED",
      },
      { status: 400 },
    );
  }

  const rate = applyRateLimit(request);
  if (!rate.allowed) {
    const retryAfter = Math.max(1, Math.ceil((rate.resetAt - Date.now()) / 1000));
    const response = NextResponse.json(
      {
        success: false,
        error: "Too many requests",
        code: "RATE_LIMITED",
      },
      { status: 429 },
    );
    response.headers.set("Retry-After", String(retryAfter));
    return withRateLimitHeaders(response, rate);
  }

  if (pathname.startsWith("/api/admin")) {
    const secureCookie =
      request.nextUrl.protocol === "https:" || process.env.NODE_ENV === "production";

    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      secureCookie,
    });

    if (!token) {
      const response = NextResponse.json(
        {
          success: false,
          error: "Authentication required",
          code: "UNAUTHORIZED",
        },
        { status: 401 },
      );
      return withRateLimitHeaders(response, rate);
    }

    if (token.role !== "admin") {
      const response = NextResponse.json(
        {
          success: false,
          error: "Insufficient role permissions",
          code: "FORBIDDEN",
        },
        { status: 403 },
      );
      return withRateLimitHeaders(response, rate);
    }
  }

  const next = NextResponse.next();
  return withRateLimitHeaders(next, rate);
}

export default async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api")) {
    return handleApiSecurity(request);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    // Match all pathnames except Next.js internals and static assets.
    "/((?!_next|.*\\..*).*)",
  ],
};
