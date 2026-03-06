import { type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { requireAuthenticatedUser } from "@/lib/appstore/auth";
import { ok, fail } from "@/lib/appstore/http";
import { APPSTORE_COLLECTIONS } from "@/lib/appstore/paths";

type NativeSeedItem = {
  id: string;
  title: string;
  category: string;
  description: string;
  iconUrl: string;
};

const nativeApps: NativeSeedItem[] = [
  {
    id: "safari",
    title: "Safari",
    category: "Utilidades",
    description: "Explora la web con velocidad y privacidad.",
    iconUrl: "tu-icono-safari",
  },
  {
    id: "spotify",
    title: "Spotify",
    category: "Música",
    description: "Toda tu música y podcasts en un solo lugar.",
    iconUrl: "tu-icono-spotify",
  },
  {
    id: "notes",
    title: "Notas",
    category: "Productividad",
    description: "Escribe, organiza y guarda tus ideas.",
    iconUrl: "tu-icono-notas",
  },
  {
    id: "settings",
    title: "Ajustes",
    category: "Utilidades",
    description: "Configura tu sistema operativo web.",
    iconUrl: "tu-icono-ajustes",
  },
  {
    id: "calendar",
    title: "Calendario",
    category: "Productividad",
    description: "Gestiona tus eventos y organiza tu tiempo.",
    iconUrl: "tu-icono-calendario",
  },
];

function asCode(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "UNKNOWN_ERROR";
}

export async function POST(request: NextRequest) {
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

  try {
    const userDoc = await adminDb
      .collection(APPSTORE_COLLECTIONS.users)
      .doc(uid)
      .get();

    if (!userDoc.exists) {
      return fail(
        "PROFILE_REQUIRED",
        "User profile must exist before seeding native apps",
        400,
      );
    }

    const userData = userDoc.data()!;
    const ownerNickname = userData.nickname as string;

    const batch = adminDb.batch();

    for (const app of nativeApps) {
      const appRef = adminDb.collection(APPSTORE_COLLECTIONS.apps).doc(app.id);
      batch.set(
        appRef,
        {
          ownerId: uid,
          ownerNickname,
          title: app.title,
          description: app.description,
          category: app.category,
          categoryLower: app.category.toLocaleLowerCase("es-ES"),
          categories: [app.category],
          status: "published",
          tags: [app.category, "Nativa"],
          iconUrl: app.iconUrl,
          screenshotsUrls: [],
          externalUrl: `https://native.app/${app.id}`,
          downloadCount: 0,
          downloadsCount: 0,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }

    await batch.commit();

    return ok({
      seeded: nativeApps.length,
      ids: nativeApps.map((item) => item.id),
    });
  } catch (error) {
    console.error("seed native apps error:", error);
    return fail(
      "SEED_NATIVE_APPS_ERROR",
      "Unexpected error seeding native apps",
      500,
    );
  }
}
