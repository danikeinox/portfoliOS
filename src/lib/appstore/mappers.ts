import type { DocumentData } from "firebase-admin/firestore";
import type { AppStoreApp, UserProfile } from "@/lib/appstore/contracts";

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

export function mapApp(data: DocumentData, id: string): AppStoreApp {
  return {
    id,
    ownerId: data.ownerId,
    ownerNickname: data.ownerNickname,
    title: data.title,
    description: data.description,
    category: data.category,
    categoryLower: data.categoryLower,
    categories: Array.isArray(data.categories)
      ? data.categories
      : [data.category].filter((value) => typeof value === "string"),
    status: data.status,
    tags: Array.isArray(data.tags) ? data.tags : [],
    iconUrl: data.iconUrl,
    screenshotsUrls: Array.isArray(data.screenshotsUrls)
      ? data.screenshotsUrls
      : [],
    externalUrl: typeof data.externalUrl === "string" ? data.externalUrl : "",
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
