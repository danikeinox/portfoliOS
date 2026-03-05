import { type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { requireAuthenticatedUser } from "@/lib/appstore/auth";
import { ok, fail } from "@/lib/appstore/http";
import { mapApp } from "@/lib/appstore/mappers";
import { APPSTORE_COLLECTIONS } from "@/lib/appstore/paths";
import { appUpdateSchema } from "@/lib/appstore/schemas";

function asCode(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "UNKNOWN_ERROR";
}

export async function PATCH(
  request: NextRequest,
  context: { params: { appId: string } },
) {
  let uid: string;

  try {
    uid = await requireAuthenticatedUser(request);
  } catch (error) {
    const code = asCode(error);
    return fail(
      code,
      code === "INVALID_AUTH_TOKEN"
        ? "Invalid auth token"
        : "Missing auth token",
      401,
    );
  }

  const { appId } = context.params;
  if (!appId) {
    return fail("INVALID_APP_ID", "App id is required", 400);
  }

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return fail(
      "INVALID_CONTENT_TYPE",
      "Content-Type must be application/json",
      415,
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = appUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return fail(
      "INVALID_APP_UPDATE",
      "Invalid app update payload",
      400,
      parsed.error.flatten(),
    );
  }

  try {
    const appRef = adminDb.collection(APPSTORE_COLLECTIONS.apps).doc(appId);
    const appDoc = await appRef.get();

    if (!appDoc.exists) {
      return fail("APP_NOT_FOUND", "App not found", 404);
    }

    const appData = appDoc.data()!;
    if (appData.ownerId !== uid) {
      return fail("FORBIDDEN", "You cannot edit this app", 403);
    }

    const payload = parsed.data;

    await appRef.set(
      {
        ...(payload.title ? { title: payload.title } : {}),
        ...(payload.description ? { description: payload.description } : {}),
        ...(payload.category
          ? {
              category: payload.category,
              categoryLower: payload.category.toLocaleLowerCase("es-ES"),
            }
          : {}),
        ...(payload.status ? { status: payload.status } : {}),
        ...(payload.tags ? { tags: payload.tags } : {}),
        ...(payload.iconUrl !== undefined ? { iconUrl: payload.iconUrl } : {}),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    const updatedDoc = await appRef.get();
    return ok(mapApp(updatedDoc.data()!, appId));
  } catch (error) {
    console.error("update app error:", error);
    return fail("UPDATE_APP_ERROR", "Unexpected error updating app", 500);
  }
}
