import { type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { requireAuthenticatedUser } from "@/lib/appstore/auth";
import { ok, fail } from "@/lib/appstore/http";
import { mapApp } from "@/lib/appstore/mappers";
import { APPSTORE_COLLECTIONS } from "@/lib/appstore/paths";
import { appCreateSchema, appListQuerySchema } from "@/lib/appstore/schemas";

type AppLanguage = "es" | "en";

function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) {
    return [];
  }

  const clean = tags
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  return [...new Set(clean)].slice(0, 8);
}

function normalizeLanguage(value: unknown): AppLanguage {
  return value === "en" ? "en" : "es";
}

function buildTranslations(payload: {
  title: string;
  description: string;
  tags: string[];
  defaultLanguage: AppLanguage;
  translations?: {
    es?: { title?: string; description?: string; tags?: string[] };
    en?: { title?: string; description?: string; tags?: string[] };
  };
}) {
  const defaultLanguage = normalizeLanguage(payload.defaultLanguage);
  const secondaryLanguage: AppLanguage = defaultLanguage === "es" ? "en" : "es";
  const base = {
    title: payload.title.trim(),
    description: payload.description.trim(),
    tags: normalizeTags(payload.tags),
  };

  const secondarySource = payload.translations?.[secondaryLanguage];
  const secondary = {
    title: secondarySource?.title?.trim() || base.title,
    description: secondarySource?.description?.trim() || base.description,
    tags: normalizeTags(secondarySource?.tags).length
      ? normalizeTags(secondarySource?.tags)
      : base.tags,
  };

  return {
    defaultLanguage,
    translations: {
      [defaultLanguage]: base,
      [secondaryLanguage]: secondary,
    },
  } as const;
}

function asCode(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "UNKNOWN_ERROR";
}

function isMissingIndexError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeCode =
    "code" in error ? String((error as { code?: unknown }).code) : "";
  const maybeMessage =
    "message" in error ? String((error as { message?: unknown }).message) : "";

  return (
    maybeCode.includes("failed-precondition") ||
    maybeCode === "9" ||
    /requires an index|missing index|failed precondition/i.test(maybeMessage)
  );
}

function extractIndexUrl(error: unknown): string | null {
  if (!error || typeof error !== "object") {
    return null;
  }

  const maybeMessage =
    "message" in error ? String((error as { message?: unknown }).message) : "";
  const match = maybeMessage.match(
    /https:\/\/console\.firebase\.google\.com\/[^\s)]+/i,
  );
  return match ? match[0] : null;
}

export async function GET(request: NextRequest) {
  const parsed = appListQuerySchema.safeParse({
    ownerId: request.nextUrl.searchParams.get("ownerId") ?? undefined,
    category: request.nextUrl.searchParams.get("category") ?? undefined,
    status: request.nextUrl.searchParams.get("status") ?? undefined,
    sort: request.nextUrl.searchParams.get("sort") ?? undefined,
    limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    lang: request.nextUrl.searchParams.get("lang") ?? undefined,
  });

  if (!parsed.success) {
    return fail(
      "INVALID_APP_LIST_QUERY",
      "Invalid query params",
      400,
      parsed.error.flatten(),
    );
  }

  const { ownerId, category, status, sort, limit, lang } = parsed.data;

  const orderField = sort === "downloads" ? "downloadCount" : "updatedAt";

  try {
    let query: FirebaseFirestore.Query = adminDb.collection(
      APPSTORE_COLLECTIONS.apps,
    );

    if (ownerId) {
      query = query.where("ownerId", "==", ownerId);
    }

    if (category) {
      query = query.where("category", "==", category);
    }

    if (status) {
      query = query.where("status", "==", status);
    }

    const snapshot = await query.orderBy(orderField, "desc").limit(limit).get();
    const apps = snapshot.docs.map((doc) => mapApp(doc.data(), doc.id, lang));

    return ok({ apps, count: apps.length });
  } catch (error) {
    if (isMissingIndexError(error)) {
      try {
        const fallbackLimit = Math.max(limit * 6, 120);
        const fallbackSnapshot = await adminDb
          .collection(APPSTORE_COLLECTIONS.apps)
          .orderBy(orderField, "desc")
          .limit(fallbackLimit)
          .get();

        const filtered = fallbackSnapshot.docs
          .filter((doc) => {
            const data = doc.data();

            if (ownerId && data.ownerId !== ownerId) {
              return false;
            }

            if (category && data.category !== category) {
              return false;
            }

            if (status && data.status !== status) {
              return false;
            }

            return true;
          })
          .slice(0, limit)
          .map((doc) => mapApp(doc.data(), doc.id, lang));

        const response = ok({ apps: filtered, count: filtered.length });
        response.headers.set("x-appstore-index-fallback", "1");
        const indexUrl = extractIndexUrl(error);
        if (indexUrl) {
          response.headers.set("x-appstore-index-url", indexUrl);
        }
        return response;
      } catch (fallbackError) {
        console.error("list apps fallback error:", fallbackError);
      }
    }

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
    return fail(
      code,
      code === "INVALID_AUTH_TOKEN"
        ? "Invalid auth token"
        : "Missing auth token",
      401,
    );
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
  const parsed = appCreateSchema.safeParse(body);

  if (!parsed.success) {
    return fail(
      "INVALID_APP_PAYLOAD",
      "Invalid app payload",
      400,
      parsed.error.flatten(),
    );
  }

  try {
    const userDoc = await adminDb
      .collection(APPSTORE_COLLECTIONS.users)
      .doc(uid)
      .get();

    if (!userDoc.exists) {
      return fail(
        "PROFILE_REQUIRED",
        "User profile must exist before creating apps",
        400,
      );
    }

    const userData = userDoc.data()!;
    const appRef = adminDb.collection(APPSTORE_COLLECTIONS.apps).doc();

    const payload = parsed.data;
    const normalizedReleaseNotes = payload.releaseNotes?.trim() || "";
    const localized = buildTranslations({
      title: payload.title,
      description: payload.description,
      tags: payload.tags,
      defaultLanguage: payload.defaultLanguage,
      translations: payload.translations,
    });

    await appRef.set({
      ownerId: uid,
      ownerNickname: userData.nickname,
      title: localized.translations[localized.defaultLanguage].title,
      description:
        localized.translations[localized.defaultLanguage].description,
      category: payload.category,
      categoryLower: payload.category.toLocaleLowerCase("es-ES"),
      categories: payload.categories,
      status: payload.status,
      tags: localized.translations[localized.defaultLanguage].tags,
      defaultLanguage: localized.defaultLanguage,
      translations: localized.translations,
      iconUrl: payload.iconUrl ?? "",
      screenshotsUrls: payload.screenshotsUrls,
      externalUrl: payload.externalUrl,
      version: payload.version,
      releaseNotes: normalizedReleaseNotes,
      inAppPurchases: payload.inAppPurchases,
      containsAds: payload.containsAds,
      releaseHistory: [
        {
          version: payload.version,
          notes: normalizedReleaseNotes,
          updatedAt: new Date().toISOString(),
        },
      ],
      downloadCount: 0,
      downloadsCount: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const createdDoc = await appRef.get();
    return ok(
      mapApp(createdDoc.data()!, appRef.id, localized.defaultLanguage),
      201,
    );
  } catch (error) {
    console.error("create app error:", error);
    return fail("CREATE_APP_ERROR", "Unexpected error creating app", 500);
  }
}
