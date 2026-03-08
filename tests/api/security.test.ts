import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import {
  applyRateLimit,
  enforceSameOrigin,
  parseJsonBody,
  requireJsonContentType,
} from "@/lib/api/security";

describe("api security helper", () => {
  it("enforces same origin when provided", async () => {
    const request = new NextRequest("http://localhost:3000/api/x", {
      headers: { origin: "http://evil.local" },
    });

    const response = enforceSameOrigin(request);
    expect(response?.status).toBe(403);
  });

  it("validates json content type", async () => {
    const request = new NextRequest("http://localhost:3000/api/x", {
      method: "POST",
      body: "test",
      headers: { "content-type": "text/plain" },
    });

    const response = requireJsonContentType(request);
    expect(response?.status).toBe(415);
  });

  it("returns parsed json body", async () => {
    const request = new NextRequest("http://localhost:3000/api/x", {
      method: "POST",
      body: JSON.stringify({ hello: "world" }),
      headers: { "content-type": "application/json" },
    });

    const parsed = await parseJsonBody<{ hello: string }>(request);
    expect("data" in parsed).toBe(true);
    if ("data" in parsed) {
      expect(parsed.data.hello).toBe("world");
    }
  });

  it("applies in-memory rate limit", async () => {
    const baseRequest = new NextRequest("http://localhost:3000/api/x", {
      headers: { "x-forwarded-for": "192.168.1.100" },
    });

    const options = {
      key: "test-limiter",
      windowMs: 60_000,
      maxRequests: 1,
    };

    const first = await applyRateLimit(baseRequest, options);
    expect(first).toBeNull();

    const second = await applyRateLimit(baseRequest, options);
    expect(second?.status).toBe(429);
  });
});
