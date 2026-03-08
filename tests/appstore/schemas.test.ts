import { describe, expect, it } from "vitest";
import {
  appCreateSchema,
  appUpdateSchema,
  nicknameSchema,
  upsertProfileSchema,
} from "@/lib/appstore/schemas";

describe("appstore schemas", () => {
  it("validates nickname and profile", () => {
    expect(() => nicknameSchema.parse("User 01")).not.toThrow();
    const parsed = upsertProfileSchema.parse({
      nickname: "Demo User",
      displayName: "Demo",
      bio: "Bio",
      avatarUrl: "https://example.com/avatar.png",
    });
    expect(parsed.nickname).toBe("Demo User");
  });

  it("creates app payload with default category", () => {
    const parsed = appCreateSchema.parse({
      title: "App",
      description: "Descripcion valida para la app demo",
      categories: ["Productividad"],
      externalUrl: "https://example.com/app",
    });

    expect(parsed.category).toBe("Productividad");
    expect(parsed.defaultLanguage).toBe("es");
  });

  it("requires update payload to include at least one field", () => {
    const result = appUpdateSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
