import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/google", () => ({
  getGoogleCalendarClient: vi.fn(),
}));

import { getGoogleCalendarClient } from "@/lib/google";
import { GET } from "@/app/api/get-events/route";

describe("GET /api/get-events", () => {
  it("returns events list", async () => {
    vi.mocked(getGoogleCalendarClient).mockReturnValue({
      CALENDAR_ID: "cal-id",
      calendar: {
        events: {
          list: vi.fn().mockResolvedValue({
            data: {
              items: [
                {
                  id: "1",
                  summary: "Meeting",
                  start: { dateTime: new Date().toISOString() },
                  end: { dateTime: new Date().toISOString() },
                  htmlLink: "https://calendar.google.com/event/1",
                },
              ],
            },
          }),
        },
      },
    } as never);

    const request = new NextRequest("http://localhost:3000/api/get-events", {
      method: "GET",
      headers: {
        origin: "http://localhost:3000",
        "x-forwarded-for": "10.1.1.3",
      },
    });

    const response = await GET(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(Array.isArray(json.events)).toBe(true);
    expect(json.events[0].id).toBe("1");
  });
});
