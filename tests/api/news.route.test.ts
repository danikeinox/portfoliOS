import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/news/route";

describe("GET /api/news", () => {
  it("returns 500 when NEWS_API_KEY is missing", async () => {
    vi.stubEnv("NEWS_API_KEY", "");

    const request = new NextRequest(
      "http://localhost:3000/api/news?locale=es",
      {
        method: "GET",
        headers: {
          origin: "http://localhost:3000",
          "x-forwarded-for": "10.1.1.4",
        },
      },
    );

    const response = await GET(request);
    expect(response.status).toBe(500);
  });

  it("returns normalized data when provider succeeds", async () => {
    vi.stubEnv("NEWS_API_KEY", "demo-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: [{ uuid: "n1", title: "Title" }] }),
      }),
    );

    const request = new NextRequest(
      "http://localhost:3000/api/news?locale=en",
      {
        method: "GET",
        headers: {
          origin: "http://localhost:3000",
          "x-forwarded-for": "10.1.1.5",
        },
      },
    );

    const response = await GET(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data[0].uuid).toBe("n1");
  });
});
