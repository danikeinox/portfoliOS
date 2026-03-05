import { type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { requireAuthenticatedUser } from "@/lib/appstore/auth";
import { ok, fail } from "@/lib/appstore/http";
import { mapApp } from "@/lib/appstore/mappers";
import { APPSTORE_COLLECTIONS } from "@/lib/appstore/paths";
import { appCreateSchema, appListQuerySchema } from "@/lib/appstore/schemas";

function asCode(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "UNKNOWN_ERROR";
}

export async function GET(request: NextRequest) {
  const parsed = appListQuerySchema.safeParse({
    ownerId: request.nextUrl.searchParams.get("ownerId") ?? undefined,
    category: request.nextUrl.searchParams.get("category") ?? undefined,
    status: request.nextUrl.searchParams.get("status") ?? undefined,
    limit: request.nextUrl.searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return fail("INVALID_APP_LIST_QUERY", "Invalid query params", 400, parsed.error.flatten());
  }

  const { ownerId, category, status, limit } = parsed.data;

  try {
    let query: FirebaseFirestore.Query = adminDb.collection(APPSTORE_COLLECTIONS.apps);

    if (ownerId) {
      query = query.where("ownerId", "==", ownerId);
    }

    if (category) {
      query = query.where("category", "==", category);
    }

    if (status) {
      query = query.where("status", "==", status);
    }

    const snapshot = await query.orderBy("updatedAt", "desc").limit(limit).get();
    const apps = snapshot.docs.map((doc) => mapApp(doc.data(), doc.id));

    return ok({ apps, count: apps.length });
  } catch (error) {
    console.error("list apps error:", error);
    return fail("LIST_APPS_ERROR", "Unexpected error fetching apps", 500);
  }
}

export async function POST(request: NextRequest) {
  let uid: string;

  try {
    uid = await requireAuthenticatedUser(request);
  } catch (error) {
    const code = asCode(error);
    return fail(code, code === "INVALID_AUTH_TOKEN" ? "Invalid auth token" : "Missing auth token", 401);
  }

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return fail("INVALID_CONTENT_TYPE", "Content-Type must be application/json", 415);
  }

  const body = await request.json().catch(() => null);
  const parsed = appCreateSchema.safeParse(body);

  if (!parsed.success) {
    return fail("INVALID_APP_PAYLOAD", "Invalid app payload", 400, parsed.error.flatten());
  }

  try {
    const userDoc = await adminDb.collection(APPSTORE_COLLECTIONS.users).doc(uid).get();

    if (!userDoc.exists) {
      return fail("PROFILE_REQUIRED", "User profile must exist before creating apps", 400);
    }

    const userData = userDoc.data()!;
    const appRef = adminDb.collection(APPSTORE_COLLECTIONS.apps).doc();

    const payload = parsed.data;
    await appRef.set({
      ownerId: uid,
      ownerNickname: userData.nickname,
      title: payload.title,
      description: payload.description,
      category: payload.category,
      categoryLower: payload.category.toLocaleLowerCase("es-ES"),
      status: payload.status,
      tags: payload.tags,
      iconUrl: payload.iconUrl ?? "",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const createdDoc = await appRef.get();
    return ok(mapApp(createdDoc.data()!, appRef.id), 201);
  } catch (error) {
    console.error("create app error:", error);
    return fail("CREATE_APP_ERROR", "Unexpected error creating app", 500);
  }
}
