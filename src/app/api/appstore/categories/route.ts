import { type NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { APPSTORE_COLLECTIONS } from "@/lib/appstore/paths";
import { ok, fail } from "@/lib/appstore/http";

type CategoryCount = {
  category: string;
  count: number;
};

export async function GET(request: NextRequest) {
  const query =
    request.nextUrl.searchParams.get("q")?.trim().toLocaleLowerCase("es-ES") ??
    "";

  try {
    const snapshot = await adminDb
      .collection(APPSTORE_COLLECTIONS.apps)
      .where("status", "==", "published")
      .limit(250)
      .get();

    const counters = new Map<string, number>();

    snapshot.docs.forEach((doc) => {
      const categories = doc.data()?.categories;

      if (Array.isArray(categories) && categories.length > 0) {
        categories.forEach((category) => {
          if (typeof category !== "string") {
            return;
          }

          const key = category.trim();
          if (!key) {
            return;
          }

          counters.set(key, (counters.get(key) ?? 0) + 1);
        });
        return;
      }

      const fallback = doc.data()?.category;
      if (typeof fallback === "string" && fallback.trim()) {
        const key = fallback.trim();
        counters.set(key, (counters.get(key) ?? 0) + 1);
      }
    });

    const categories: CategoryCount[] = [...counters.entries()]
      .map(([category, count]) => ({ category, count }))
      .filter((item) =>
        query ? item.category.toLocaleLowerCase("es-ES").includes(query) : true,
      )
      .sort(
        (a, b) =>
          b.count - a.count || a.category.localeCompare(b.category, "es"),
      );

    return ok({ categories: categories.slice(0, 50) });
  } catch (error) {
    console.error("list categories error:", error);
    return fail(
      "LIST_CATEGORIES_ERROR",
      "Unexpected error fetching categories",
      500,
    );
  }
}
