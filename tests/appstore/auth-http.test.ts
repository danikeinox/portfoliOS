import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/firebase-admin", () => ({
  adminAuth: {
    verifyIdToken: vi.fn(),
  },
}));

import { adminAuth } from "@/lib/firebase-admin";
import {
  getOptionalAuthenticatedUser,
  requireAuthenticatedUser,
} from "@/lib/appstore/auth";
import { fail, ok } from "@/lib/appstore/http";

describe("appstore auth/http helpers", () => {
  it("requires bearer auth token", async () => {
    const request = new NextRequest("http://localhost:3000/api/x", {
      headers: {},
    });

    await expect(requireAuthenticatedUser(request)).rejects.toThrow(
      "MISSING_AUTH_TOKEN",
    );
  });

  it("returns uid for valid token", async () => {
    vi.mocked(adminAuth.verifyIdToken).mockResolvedValue({
      uid: "u1",
    } as never);
    const request = new NextRequest("http://localhost:3000/api/x", {
      headers: { authorization: "Bearer token" },
    });

    const uid = await requireAuthenticatedUser(request);
    expect(uid).toBe("u1");
  });

  it("returns null for invalid optional token", async () => {
    vi.mocked(adminAuth.verifyIdToken).mockRejectedValue(
      new Error("bad token"),
    );
    const request = new NextRequest("http://localhost:3000/api/x", {
      headers: { authorization: "Bearer bad" },
    });

    const uid = await getOptionalAuthenticatedUser(request);
    expect(uid).toBeNull();
  });

  it("returns standard http payloads", async () => {
    const success = ok({ hello: "world" }, 201);
    expect(success.status).toBe(201);
    const successJson = await success.json();
    expect(successJson.success).toBe(true);

    const error = fail("BAD", "Bad request", 400, { field: "x" });
    expect(error.status).toBe(400);
    const errorJson = await error.json();
    expect(errorJson.success).toBe(false);
    expect(errorJson.error.code).toBe("BAD");
  });
});
