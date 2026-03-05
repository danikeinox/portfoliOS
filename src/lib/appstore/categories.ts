import { APPSTORE_CATEGORY_REGEX } from "@/lib/appstore/contracts";

export function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function toTitleCase(value: string): string {
  return normalizeWhitespace(value)
    .toLocaleLowerCase("es-ES")
    .split(" ")
    .map((part) =>
      part ? `${part[0].toLocaleUpperCase("es-ES")}${part.slice(1)}` : part,
    )
    .join(" ");
}

export function sanitizeCategory(value: string): {
  valid: boolean;
  value: string;
} {
  const normalized = toTitleCase(value);
  return {
    valid: APPSTORE_CATEGORY_REGEX.test(normalized),
    value: normalized,
  };
}

export function toCategoryLower(value: string): string {
  return normalizeWhitespace(value).toLocaleLowerCase("es-ES");
}
