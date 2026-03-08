import type { DocumentData } from "firebase-admin/firestore";
import type {
  AppLanguage,
  AppLocalizedFields,
  AppStoreApp,
  UserProfile,
} from "@/lib/appstore/contracts";

function toIsoString(value: unknown): string {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }

  if (typeof value === "string") {
    return value;
  }

  return new Date().toISOString();
}

export function mapUserProfile(data: DocumentData): UserProfile {
  return {
    uid: data.uid,
    nickname: data.nickname,
    nicknameLower: data.nicknameLower,
    displayName: data.displayName,
    bio: data.bio,
    avatarUrl: data.avatarUrl,
    followersCount:
      typeof data.followersCount === "number" ? data.followersCount : 0,
    followingCount:
      typeof data.followingCount === "number" ? data.followingCount : 0,
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  };
}

function normalizeLanguage(value: unknown): AppLanguage {
  return value === "en" ? "en" : "es";
}

function normalizeLocalizedFields(
  value: unknown,
): AppLocalizedFields | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const candidate = value as {
    title?: unknown;
    description?: unknown;
    tags?: unknown;
  };

  if (typeof candidate.title !== "string") {
    return undefined;
  }

  if (typeof candidate.description !== "string") {
    return undefined;
  }

  return {
    title: candidate.title,
    description: candidate.description,
    tags: Array.isArray(candidate.tags)
      ? candidate.tags.filter(
          (item): item is string => typeof item === "string",
        )
      : [],
  };
}

export function mapApp(
  data: DocumentData,
  id: string,
  language?: AppLanguage,
): AppStoreApp {
  const releaseHistoryRaw = Array.isArray(data.releaseHistory)
    ? data.releaseHistory
    : [];

  const defaultLanguage = normalizeLanguage(data.defaultLanguage);
  const translationsRaw =
    data.translations && typeof data.translations === "object"
      ? (data.translations as Record<string, unknown>)
      : {};

  const translations: Partial<Record<AppLanguage, AppLocalizedFields>> = {};
  const esTranslation = normalizeLocalizedFields(translationsRaw.es);
  const enTranslation = normalizeLocalizedFields(translationsRaw.en);

  if (esTranslation) {
    translations.es = esTranslation;
  }

  if (enTranslation) {
    translations.en = enTranslation;
  }

  const requestedLanguage = language ?? defaultLanguage;
  const fallbackTitle = typeof data.title === "string" ? data.title : "";
  const fallbackDescription =
    typeof data.description === "string" ? data.description : "";
  const fallbackTags = Array.isArray(data.tags) ? data.tags : [];

  const activeTranslation =
    translations[requestedLanguage] ?? translations[defaultLanguage];

  return {
    id,
    ownerId: data.ownerId,
    ownerNickname: data.ownerNickname,
    title: activeTranslation?.title ?? fallbackTitle,
    description: activeTranslation?.description ?? fallbackDescription,
    category: data.category,
    categoryLower: data.categoryLower,
    categories: Array.isArray(data.categories)
      ? data.categories
      : [data.category].filter((value) => typeof value === "string"),
    status: data.status,
    tags: activeTranslation?.tags ?? fallbackTags,
    defaultLanguage,
    translations,
    iconUrl: data.iconUrl,
    screenshotsUrls: Array.isArray(data.screenshotsUrls)
      ? data.screenshotsUrls
      : [],
    externalUrl: typeof data.externalUrl === "string" ? data.externalUrl : "",
    version: typeof data.version === "string" ? data.version : "1.0.0",
    releaseNotes:
      typeof data.releaseNotes === "string" ? data.releaseNotes : undefined,
    inAppPurchases: data.inAppPurchases === true,
    containsAds: data.containsAds === true,
    releaseHistory: releaseHistoryRaw.reduce<
      Array<{ version: string; notes?: string; updatedAt: string }>
    >((acc, item) => {
      if (!item || typeof item !== "object") {
        return acc;
      }

      const candidate = item as {
        version?: unknown;
        notes?: unknown;
        updatedAt?: unknown;
      };

      if (typeof candidate.version !== "string") {
        return acc;
      }

      acc.push({
        version: candidate.version,
        notes:
          typeof candidate.notes === "string" ? candidate.notes : undefined,
        updatedAt: toIsoString(candidate.updatedAt),
      });

      return acc;
    }, []),
    downloadCount:
      typeof data.downloadCount === "number"
        ? data.downloadCount
        : typeof data.downloadsCount === "number"
          ? data.downloadsCount
          : 0,
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  };
}
