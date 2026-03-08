import { type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { requireAuthenticatedUser } from "@/lib/appstore/auth";
import { ok, fail } from "@/lib/appstore/http";
import { mapApp } from "@/lib/appstore/mappers";
import { APPSTORE_COLLECTIONS } from "@/lib/appstore/paths";
import { appUpdateSchema } from "@/lib/appstore/schemas";

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

function arraysEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}

function bumpPatchVersion(version: string): string {
  const parsed = /^(\d+)\.(\d+)\.(\d+)$/.exec(version.trim());
  if (!parsed) {
    return "1.0.1";
  }

  const major = Number(parsed[1]);
  const minor = Number(parsed[2]);
  const patch = Number(parsed[3]);
  return `${major}.${minor}.${patch + 1}`;
}

function asCode(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "UNKNOWN_ERROR";
}

export async function GET(
  request: NextRequest,
  context: { params: { appId: string } },
) {
  const { appId } = context.params;
  if (!appId) {
    return fail("INVALID_APP_ID", "App id is required", 400);
  }

  try {
    const appDoc = await adminDb
      .collection(APPSTORE_COLLECTIONS.apps)
      .doc(appId)
      .get();

    if (!appDoc.exists) {
      return fail("APP_NOT_FOUND", "App not found", 404);
    }

    const lang = normalizeLanguage(request.nextUrl.searchParams.get("lang"));
    return ok(mapApp(appDoc.data()!, appId, lang));
  } catch (error) {
    console.error("get app detail error:", error);
    return fail(
      "GET_APP_DETAIL_ERROR",
      "Unexpected error fetching app detail",
      500,
    );
  }
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
    const currentDefaultLanguage = normalizeLanguage(appData.defaultLanguage);
    const nextDefaultLanguage = payload.defaultLanguage
      ? normalizeLanguage(payload.defaultLanguage)
      : currentDefaultLanguage;

    const currentTranslations =
      appData.translations && typeof appData.translations === "object"
        ? (appData.translations as {
            es?: { title?: string; description?: string; tags?: string[] };
            en?: { title?: string; description?: string; tags?: string[] };
          })
        : {};

    const mergedTranslations = {
      ...currentTranslations,
      ...(payload.translations ?? {}),
    };

    const localized = buildTranslations({
      title:
        payload.title ??
        currentTranslations[nextDefaultLanguage]?.title ??
        appData.title ??
        "",
      description:
        payload.description ??
        currentTranslations[nextDefaultLanguage]?.description ??
        appData.description ??
        "",
      tags:
        payload.tags ??
        currentTranslations[nextDefaultLanguage]?.tags ??
        (Array.isArray(appData.tags) ? appData.tags : []),
      defaultLanguage: nextDefaultLanguage,
      translations: mergedTranslations,
    });

    const currentLocalized = buildTranslations({
      title: typeof appData.title === "string" ? appData.title : "",
      description:
        typeof appData.description === "string" ? appData.description : "",
      tags: Array.isArray(appData.tags) ? appData.tags : [],
      defaultLanguage: currentDefaultLanguage,
      translations: currentTranslations,
    });

    const currentCategories = Array.isArray(appData.categories)
      ? appData.categories
      : [];
    const nextCategories = payload.categories ?? currentCategories;
    const currentScreenshots = Array.isArray(appData.screenshotsUrls)
      ? appData.screenshotsUrls
      : [];
    const nextScreenshots = payload.screenshotsUrls ?? currentScreenshots;

    const nextCategory =
      payload.category ??
      nextCategories[0] ??
      (typeof appData.category === "string" ? appData.category : "");
    const nextStatus = payload.status ?? appData.status;
    const nextIconUrl =
      payload.iconUrl !== undefined
        ? payload.iconUrl
        : typeof appData.iconUrl === "string"
          ? appData.iconUrl
          : "";
    const nextExternalUrl =
      payload.externalUrl ??
      (typeof appData.externalUrl === "string" ? appData.externalUrl : "");
    const nextReleaseNotes =
      payload.releaseNotes !== undefined
        ? payload.releaseNotes.trim()
        : typeof appData.releaseNotes === "string"
          ? appData.releaseNotes
          : "";
    const nextInAppPurchases =
      payload.inAppPurchases !== undefined
        ? payload.inAppPurchases
        : Boolean(appData.inAppPurchases);
    const nextContainsAds =
      payload.containsAds !== undefined
        ? payload.containsAds
        : Boolean(appData.containsAds);

    const hasContentChanges =
      localized.defaultLanguage !== currentDefaultLanguage ||
      JSON.stringify(localized.translations) !==
        JSON.stringify(currentLocalized.translations) ||
      localized.translations[localized.defaultLanguage].title !==
        (typeof appData.title === "string" ? appData.title : "") ||
      localized.translations[localized.defaultLanguage].description !==
        (typeof appData.description === "string" ? appData.description : "") ||
      !arraysEqual(
        localized.translations[localized.defaultLanguage].tags,
        Array.isArray(appData.tags) ? appData.tags : [],
      ) ||
      nextCategory !==
        (typeof appData.category === "string" ? appData.category : "") ||
      !arraysEqual(nextCategories, currentCategories) ||
      nextStatus !== appData.status ||
      nextIconUrl !==
        (typeof appData.iconUrl === "string" ? appData.iconUrl : "") ||
      nextExternalUrl !==
        (typeof appData.externalUrl === "string" ? appData.externalUrl : "") ||
      !arraysEqual(nextScreenshots, currentScreenshots) ||
      nextReleaseNotes !==
        (typeof appData.releaseNotes === "string"
          ? appData.releaseNotes
          : "") ||
      nextInAppPurchases !== Boolean(appData.inAppPurchases) ||
      nextContainsAds !== Boolean(appData.containsAds);

    const updateData: Record<string, unknown> = {
      ...(payload.title
        ? { title: localized.translations[localized.defaultLanguage].title }
        : {}),
      ...(payload.description
        ? {
            description:
              localized.translations[localized.defaultLanguage].description,
          }
        : {}),
      ...(payload.category
        ? {
            category: payload.category,
            categoryLower: payload.category.toLocaleLowerCase("es-ES"),
          }
        : {}),
      ...(payload.categories ? { categories: payload.categories } : {}),
      ...(payload.status ? { status: payload.status } : {}),
      ...(payload.tags
        ? { tags: localized.translations[localized.defaultLanguage].tags }
        : {}),
      ...(payload.defaultLanguage ||
      payload.translations ||
      payload.title ||
      payload.description ||
      payload.tags
        ? {
            defaultLanguage: localized.defaultLanguage,
            translations: localized.translations,
          }
        : {}),
      ...(payload.iconUrl !== undefined ? { iconUrl: payload.iconUrl } : {}),
      ...(payload.screenshotsUrls
        ? { screenshotsUrls: payload.screenshotsUrls }
        : {}),
      ...(payload.externalUrl ? { externalUrl: payload.externalUrl } : {}),
      ...(payload.releaseNotes !== undefined
        ? { releaseNotes: payload.releaseNotes?.trim() ?? "" }
        : {}),
      ...(payload.inAppPurchases !== undefined
        ? { inAppPurchases: payload.inAppPurchases }
        : {}),
      ...(payload.containsAds !== undefined
        ? { containsAds: payload.containsAds }
        : {}),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const currentVersion =
      typeof appData.version === "string" && appData.version.trim().length > 0
        ? appData.version.trim()
        : "1.0.0";
    const requestedVersion = payload.version?.trim();
    let nextVersion = requestedVersion ?? currentVersion;

    if (hasContentChanges && nextVersion === currentVersion) {
      nextVersion = bumpPatchVersion(currentVersion);
    }

    if (nextVersion !== currentVersion) {
      updateData.version = nextVersion;

      const history = Array.isArray(appData.releaseHistory)
        ? appData.releaseHistory
        : [];

      updateData.releaseHistory = [
        ...history,
        {
          version: nextVersion,
          notes: nextReleaseNotes,
          updatedAt: new Date().toISOString(),
        },
      ].slice(-20);
    }

    await appRef.set(updateData, { merge: true });

    const updatedDoc = await appRef.get();
    return ok(mapApp(updatedDoc.data()!, appId, localized.defaultLanguage));
  } catch (error) {
    console.error("update app error:", error);
    return fail("UPDATE_APP_ERROR", "Unexpected error updating app", 500);
  }
}

export async function POST(
  _request: NextRequest,
  context: { params: { appId: string } },
) {
  const { appId } = context.params;

  if (!appId) {
    return fail("INVALID_APP_ID", "App id is required", 400);
  }

  try {
    const appRef = adminDb.collection(APPSTORE_COLLECTIONS.apps).doc(appId);
    const appDoc = await appRef.get();

    if (!appDoc.exists) {
      return fail("APP_NOT_FOUND", "App not found", 404);
    }

    await appRef.set(
      {
        downloadCount: FieldValue.increment(1),
        downloadsCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    const updatedDoc = await appRef.get();
    const lang = normalizeLanguage(_request.nextUrl.searchParams.get("lang"));
    return ok(mapApp(updatedDoc.data()!, appId, lang));
  } catch (error) {
    console.error("install app error:", error);
    return fail("INSTALL_APP_ERROR", "Unexpected error installing app", 500);
  }
}

export async function DELETE(
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

  try {
    const appRef = adminDb.collection(APPSTORE_COLLECTIONS.apps).doc(appId);
    const appDoc = await appRef.get();

    if (!appDoc.exists) {
      return fail("APP_NOT_FOUND", "App not found", 404);
    }

    const appData = appDoc.data();
    if (!appData || appData.ownerId !== uid) {
      return fail("FORBIDDEN", "You cannot delete this app", 403);
    }

    await appRef.delete();
    return ok({ deleted: true, appId });
  } catch (error) {
    console.error("delete app error:", error);
    return fail("DELETE_APP_ERROR", "Unexpected error deleting app", 500);
  }
}
