import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/weather/route";

describe("GET /api/weather", () => {
  it("returns 400 when search action misses q", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/weather?action=search",
      {
        method: "GET",
        headers: {
          origin: "http://localhost:3000",
          "x-forwarded-for": "10.1.1.6",
        },
      },
    );

    const response = await GET(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.code).toBe("INVALID_WEATHER_QUERY");
  });

  it("returns results for search action", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [{ name: "Madrid", latitude: 40.4, longitude: -3.7 }],
        }),
      }),
    );

    const request = new NextRequest(
      "http://localhost:3000/api/weather?action=search&q=madrid&lang=es",
      {
        method: "GET",
        headers: {
          origin: "http://localhost:3000",
          "x-forwarded-for": "10.1.1.7",
        },
      },
    );

    const response = await GET(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.results[0].name).toBe("Madrid");
  });

  it("returns forecast payload", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          timezone: "Europe/Madrid",
          current: { temperature_2m: 20 },
          hourly: { time: [] },
          daily: { time: [] },
        }),
      }),
    );

    const request = new NextRequest(
      "http://localhost:3000/api/weather?action=forecast&lat=40.4&lon=-3.7",
      {
        method: "GET",
        headers: {
          origin: "http://localhost:3000",
          "x-forwarded-for": "10.1.1.8",
        },
      },
    );

    const response = await GET(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.location.latitude).toBe(40.4);
  });
});
