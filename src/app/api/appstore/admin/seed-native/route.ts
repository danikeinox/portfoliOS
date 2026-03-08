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
    iconUrl: "https://s6.imgcdn.dev/YrGrbT.png",
  },
  {
    id: "spotify",
    title: "Spotify",
    category: "Música",
    description: "Toda tu música y podcasts en un solo lugar.",
    iconUrl: "https://s6.imgcdn.dev/YrG9y2.png",
  },
  {
    id: "notes",
    title: "Notas",
    category: "Productividad",
    description: "Escribe, organiza y guarda tus ideas.",
    iconUrl: "https://s6.imgcdn.dev/YrGGNw.png",
  },
  {
    id: "settings",
    title: "Ajustes",
    category: "Utilidades",
    description: "Configura tu sistema operativo web.",
    iconUrl: "https://s6.imgcdn.dev/YrGAfy.png",
  },
  {
    id: "calendar",
    title: "Calendario",
    category: "Productividad",
    description: "Gestiona tus eventos y organiza tu tiempo.",
    iconUrl: "https://s6.imgcdn.dev/YrGtNS.png",
  },
  {
    id: "weather",
    title: "Tiempo",
    category: "Utilidades",
    description: "Consulta el clima en tiempo real y tu pronóstico diario.",
    iconUrl: "https://s6.imgcdn.dev/YrGVXH.png",
  },
  {
    id: "photos",
    title: "Fotos",
    category: "Creatividad",
    description: "Revive y organiza tus recuerdos en alta calidad.",
    iconUrl: "https://s6.imgcdn.dev/YrGSBt.png",
  },
  {
    id: "camera",
    title: "Cámara",
    category: "Creatividad",
    description: "Captura momentos al instante con una experiencia fluida.",
    iconUrl: "https://s6.imgcdn.dev/YrG7Xa.png",
  },
];

function isValidUrl(value: unknown): value is string {
  return typeof value === "string" && /^https?:\/\//.test(value);
}

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

    const appRefs = nativeApps.map((app) =>
      adminDb.collection(APPSTORE_COLLECTIONS.apps).doc(app.id),
    );
    const existingDocs = await Promise.all(appRefs.map((ref) => ref.get()));

    const batch = adminDb.batch();

    for (let index = 0; index < nativeApps.length; index += 1) {
      const app = nativeApps[index];
      const appRef = appRefs[index];
      const existingData = existingDocs[index]?.data() as
        | { iconUrl?: unknown; screenshotsUrls?: unknown }
        | undefined;

      const iconUrl = isValidUrl(existingData?.iconUrl)
        ? existingData.iconUrl
        : app.iconUrl;
      const screenshotsUrls = Array.isArray(existingData?.screenshotsUrls)
        ? existingData.screenshotsUrls.filter((item): item is string =>
            isValidUrl(item),
          )
        : [];

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
          iconUrl,
          screenshotsUrls,
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
