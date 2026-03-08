import { NextResponse, type NextRequest } from "next/server";

type RateLimitOptions = {
  key: string;
  windowMs: number;
  maxRequests: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

function clientIpFromRequest(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}

function cleanupExpired(now: number) {
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

export function applyRateLimit(
  request: NextRequest,
  options: RateLimitOptions,
): NextResponse | null {
  const now = Date.now();
  cleanupExpired(now);

  const ip = clientIpFromRequest(request);
  const bucketKey = `${options.key}:${ip}`;
  const current = rateLimitStore.get(bucketKey);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(bucketKey, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return null;
  }

  if (current.count >= options.maxRequests) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((current.resetAt - now) / 1000),
    );

    return NextResponse.json(
      {
        code: "RATE_LIMITED",
        error: "Too many requests. Please try again later.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSeconds),
        },
      },
    );
  }

  current.count += 1;
  rateLimitStore.set(bucketKey, current);
  return null;
}

export function enforceSameOrigin(request: NextRequest): NextResponse | null {
  const origin = request.headers.get("origin");
  if (!origin) {
    return null;
  }

  if (origin !== request.nextUrl.origin) {
    return NextResponse.json(
      {
        code: "FORBIDDEN_ORIGIN",
        error: "Request origin is not allowed.",
      },
      { status: 403 },
    );
  }

  return null;
}

export function requireJsonContentType(
  request: NextRequest,
): NextResponse | null {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json(
      {
        code: "INVALID_CONTENT_TYPE",
        error: "Content-Type must be application/json.",
      },
      { status: 415 },
    );
  }

  return null;
}

export async function parseJsonBody<T>(
  request: NextRequest,
): Promise<{ data: T } | { error: NextResponse }> {
  try {
    const data = (await request.json()) as T;
    return { data };
  } catch {
    return {
      error: NextResponse.json(
        {
          code: "INVALID_JSON",
          error: "Request body must be valid JSON.",
        },
        { status: 400 },
      ),
    };
  }
}
