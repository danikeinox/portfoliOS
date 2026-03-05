import type { NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export async function requireAuthenticatedUser(
  request: NextRequest,
): Promise<string> {
  const authorization = request.headers.get("authorization") || "";

  if (!authorization.startsWith("Bearer ")) {
    throw new Error("MISSING_AUTH_TOKEN");
  }

  const token = authorization.slice(7).trim();
  if (!token) {
    throw new Error("MISSING_AUTH_TOKEN");
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded.uid;
  } catch {
    throw new Error("INVALID_AUTH_TOKEN");
  }
}
