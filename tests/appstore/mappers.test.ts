import { describe, expect, it } from "vitest";
import { mapApp, mapUserProfile } from "@/lib/appstore/mappers";

describe("appstore mappers", () => {
  it("maps user profile with defaults", () => {
    const mapped = mapUserProfile({
      uid: "u1",
      nickname: "nick",
      nicknameLower: "nick",
      displayName: "Nick",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    } as never);

    expect(mapped.followersCount).toBe(0);
    expect(mapped.followingCount).toBe(0);
  });

  it("maps app using selected translation and fallback", () => {
    const mapped = mapApp(
      {
        ownerId: "u1",
        ownerNickname: "nick",
        title: "Titulo ES",
        description: "Descripcion ES",
        category: "Productividad",
        categoryLower: "productividad",
        categories: ["Productividad"],
        status: "published",
        tags: ["tag-es"],
        defaultLanguage: "es",
        translations: {
          es: {
            title: "Titulo ES",
            description: "Descripcion ES",
            tags: ["tag-es"],
          },
          en: {
            title: "Title EN",
            description: "Description EN",
            tags: ["tag-en"],
          },
        },
        externalUrl: "https://example.com",
        screenshotsUrls: [],
        releaseHistory: [{ version: "1.0.0", updatedAt: "2026-01-01" }],
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      } as never,
      "app-1",
      "en",
    );

    expect(mapped.title).toBe("Title EN");
    expect(mapped.tags).toEqual(["tag-en"]);
    expect(mapped.version).toBe("1.0.0");
  });
});
