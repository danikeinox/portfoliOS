import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/google", () => ({
  getGoogleCalendarClient: vi.fn(),
}));

import { getGoogleCalendarClient } from "@/lib/google";
import { POST } from "@/app/api/create-event/route";

function buildRequest(body: unknown, headers?: Record<string, string>) {
  return new NextRequest("http://localhost:3000/api/create-event", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost:3000",
      "x-forwarded-for": "10.1.1.1",
      ...(headers ?? {}),
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/create-event", () => {
  it("returns 415 for non json body", async () => {
    const request = new NextRequest("http://localhost:3000/api/create-event", {
      method: "POST",
      headers: {
        origin: "http://localhost:3000",
        "x-forwarded-for": "10.1.1.2",
      },
      body: "hello",
    });

    const response = await POST(request);
    expect(response.status).toBe(415);
  });

  it("returns 400 for invalid payload", async () => {
    const response = await POST(
      buildRequest({
        summary: "",
        startDateTime: "invalid",
        guestEmail: "bad",
      }),
    );

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.code).toBe("INVALID_INPUT");
  });

  it("creates event for valid payload", async () => {
    const insert = vi.fn().mockResolvedValue({
      data: { id: "evt-1", htmlLink: "https://calendar.google.com/event/1" },
    });

    vi.mocked(getGoogleCalendarClient).mockReturnValue({
      CALENDAR_ID: "cal-1",
      calendar: {
        events: { insert },
      },
    } as never);

    const response = await POST(
      buildRequest({
        summary: "Demo",
        description: "Desc",
        startDateTime: new Date().toISOString(),
        guestEmail: "guest@example.com",
      }),
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(insert).toHaveBeenCalledTimes(1);
  });
});
