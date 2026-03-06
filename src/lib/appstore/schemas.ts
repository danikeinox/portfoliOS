import { z } from "zod";
import { APPSTORE_CATEGORY_REGEX } from "@/lib/appstore/contracts";
import {
  normalizeWhitespace,
  sanitizeCategory,
  toTitleCase,
} from "@/lib/appstore/categories";

export const nicknameSchema = z
  .string()
  .min(3, "Nickname must have at least 3 characters")
  .max(30, "Nickname must have at most 30 characters")
  .regex(/^[A-Za-zÀ-ÖØ-öø-ÿÑñ0-9 ]+$/, "Nickname contains invalid characters")
  .transform((value) => normalizeWhitespace(value));

export const upsertProfileSchema = z.object({
  nickname: nicknameSchema,
  displayName: z
    .string()
    .min(2)
    .max(60)
    .transform((value) => normalizeWhitespace(value)),
  bio: z
    .string()
    .max(240)
    .transform((value) => normalizeWhitespace(value))
    .optional(),
  avatarUrl: z.string().url().max(300).optional(),
});

const categorySchema = z
  .string()
  .min(2, "Category must have at least 2 characters")
  .max(50, "Category must have at most 50 characters")
  .transform((value) => toTitleCase(value))
  .refine(
    (value) => APPSTORE_CATEGORY_REGEX.test(value),
    "Category contains invalid characters",
  );

const categoriesSchema = z
  .array(categorySchema)
  .min(1, "At least one category is required")
  .max(5, "You can add up to 5 categories")
  .transform((values) => {
    const deduped = new Set<string>();
    for (const value of values) {
      deduped.add(value);
    }
    return [...deduped].slice(0, 5);
  });

const screenshotsSchema = z.array(z.string().url().max(300)).max(8).default([]);

const httpsUrlSchema = z
  .string()
  .url("External URL must be a valid URL")
  .max(300)
  .refine((value) => value.startsWith("https://"), {
    message: "External URL must start with https://",
  });

const appCreatePayloadSchema = z.object({
  title: z
    .string()
    .min(2)
    .max(80)
    .transform((value) => normalizeWhitespace(value)),
  description: z
    .string()
    .min(10)
    .max(1200)
    .transform((value) => normalizeWhitespace(value)),
  category: categorySchema.optional(),
  categories: categoriesSchema,
  status: z.enum(["draft", "published"]).default("draft"),
  tags: z
    .array(
      z
        .string()
        .min(1)
        .max(20)
        .transform((value) => normalizeWhitespace(value)),
    )
    .max(8)
    .default([]),
  iconUrl: z.string().url().max(300).optional(),
  screenshotsUrls: screenshotsSchema,
  externalUrl: httpsUrlSchema,
});

export const appCreateSchema = appCreatePayloadSchema.transform((payload) => {
  const category = payload.category ?? payload.categories[0];
  return {
    ...payload,
    category,
  };
});

export const appUpdateSchema = appCreatePayloadSchema
  .partial()
  .transform((payload) => {
    if (payload.category) {
      return payload;
    }

    if (payload.categories && payload.categories.length > 0) {
      return {
        ...payload,
        category: payload.categories[0],
      };
    }

    return payload;
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const appListQuerySchema = z.object({
  ownerId: z.string().min(1).optional(),
  category: z
    .string()
    .optional()
    .transform((value) => (value ? sanitizeCategory(value).value : value))
    .refine(
      (value) => !value || APPSTORE_CATEGORY_REGEX.test(value),
      "Invalid category filter",
    ),
  status: z.enum(["draft", "published"]).optional(),
  sort: z.enum(["recent", "downloads"]).default("recent"),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const publicProfileQuerySchema = z.object({
  nickname: nicknameSchema,
});

export const followActionSchema = z.object({
  targetNickname: nicknameSchema,
});
