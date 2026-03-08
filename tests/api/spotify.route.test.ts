import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

async function loadSpotifyGet() {
  const module = await import("@/app/api/spotify/route");
  return module.GET;
}

describe("GET /api/spotify", () => {
  it("returns 500 when spotify env vars are missing", async () => {
    vi.stubEnv("SPOTIFY_CLIENT_ID", "");
    vi.stubEnv("SPOTIFY_CLIENT_SECRET", "");
    vi.stubEnv("SPOTIFY_REFRESH_TOKEN", "");
    vi.resetModules();

    const GET = await loadSpotifyGet();
    const request = new NextRequest(
      "http://localhost:3000/api/spotify?action=now-playing",
      {
        method: "GET",
        headers: {
          origin: "http://localhost:3000",
          "x-forwarded-for": "10.1.1.9",
        },
      },
    );

    const response = await GET(request);
    expect(response.status).toBe(500);
  });

  it("returns 400 for invalid action", async () => {
    vi.stubEnv("SPOTIFY_CLIENT_ID", "cid");
    vi.stubEnv("SPOTIFY_CLIENT_SECRET", "secret");
    vi.stubEnv("SPOTIFY_REFRESH_TOKEN", "rt");
    vi.resetModules();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify({ access_token: "token" }),
      }),
    );

    const GET = await loadSpotifyGet();
    const request = new NextRequest(
      "http://localhost:3000/api/spotify?action=bad-action",
      {
        method: "GET",
        headers: {
          origin: "http://localhost:3000",
          "x-forwarded-for": "10.1.1.10",
        },
      },
    );

    const response = await GET(request);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.code).toBe("INVALID_SPOTIFY_QUERY");
  });
});
