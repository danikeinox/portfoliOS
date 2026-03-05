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
  createdAt: string;
  updatedAt: string;
};

export type AppStoreApp = {
  id: string;
  ownerId: string;
  ownerNickname: string;
  title: string;
  description: string;
  category: string;
  categoryLower: string;
  status: "draft" | "published";
  tags: string[];
  iconUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export type NicknameAvailability = {
  nickname: string;
  nicknameLower: string;
  available: boolean;
};
