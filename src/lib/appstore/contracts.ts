export const APPSTORE_CATEGORY_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿÑñ0-9 ]+$/;

export type AppStoreApiSuccess<T> = {
  success: true;
  data: T;
};

export type AppStoreApiError = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type AppStoreApiResponse<T> = AppStoreApiSuccess<T> | AppStoreApiError;

export type UserProfile = {
  uid: string;
  nickname: string;
  nicknameLower: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  followersCount: number;
  followingCount: number;
  createdAt: string;
  updatedAt: string;
};

export type SocialRelationStatus =
  | "self"
  | "not_following"
  | "following"
  | "friends";

export type PublicDeveloperProfile = UserProfile & {
  relation: SocialRelationStatus;
  isOwner: boolean;
};

export type AppLanguage = "es" | "en";

export type AppLocalizedFields = {
  title: string;
  description: string;
  tags: string[];
};

export type AppStoreApp = {
  id: string;
  ownerId: string;
  ownerNickname: string;
  title: string;
  description: string;
  category: string;
  categoryLower: string;
  categories: string[];
  status: "draft" | "published";
  tags: string[];
  defaultLanguage: AppLanguage;
  translations: Partial<Record<AppLanguage, AppLocalizedFields>>;
  iconUrl?: string;
  screenshotsUrls: string[];
  externalUrl: string;
  version: string;
  releaseNotes?: string;
  inAppPurchases: boolean;
  containsAds: boolean;
  releaseHistory: Array<{
    version: string;
    notes?: string;
    updatedAt: string;
  }>;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
};

export type NicknameAvailability = {
  nickname: string;
  nicknameLower: string;
  available: boolean;
};
