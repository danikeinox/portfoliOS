import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const text = readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(join(root, ".env.local"));
loadEnvFile(join(root, ".env"));

const projectId =
  process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error("Missing FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY");
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId,
  });
}

const db = getFirestore();
const docRef = db.collection("blog").doc("comomas-launch");

const content = [
  "ComoMás es mi nueva app para planificar el menú semanal sin quebraderos de cabeza: desayuno, comida y cena adaptados a tu presupuesto, alergias y forma de cocinar.",
  "El problema es familiar: acabar pidiendo lo mismo, saltarse el presupuesto o improvisar a última hora. ComoMás genera un plan semanal y te acompaña hasta la compra.",
  "Puedes personalizar alérgenos, tipo de cocina y equipamiento; ver la lista de la compra con precios reales de supermercados (Mercadona, Lidl, Aldi…); controlar macros y calorías; y desbloquear extras con ComoMás Premium.",
  "Stack: TypeScript, Expo / React Native, Express, PostgreSQL + Drizzle, Zod, RevenueCat y EAS para el camino a App Store y Google Play.",
  "La landing ya está en https://www.comomas.com y el lanzamiento en stores es inminente. También está publicada como startup en la app Portfolio de danielcabrera.es.",
].join("\n\n");

const coverImage = "https://cdn.danielcabrera.es/img/ComoMas_Project_Image.webp";
const images = [
  "https://cdn.danielcabrera.es/img/ComoMas_Gallery_Landing.png",
  "https://cdn.danielcabrera.es/img/ComoMas_Gallery_Planificador.png",
  "https://cdn.danielcabrera.es/img/ComoMas_Gallery_Compra.png",
  "https://cdn.danielcabrera.es/img/ComoMas_Gallery_Ajustes.png",
  "https://cdn.danielcabrera.es/img/ComoMas_Gallery_Nutricion.png",
  "https://cdn.danielcabrera.es/img/ComoMas_Gallery_Premium.png",
];

const existing = await docRef.get();
const createdAt = existing.exists && existing.data()?.createdAt
  ? existing.data().createdAt
  : Timestamp.now();

await docRef.set(
  {
    title: "Lanzando ComoMás: menús semanales a tu presupuesto",
    author: "Daniel Cabrera",
    content,
    coverImage,
    images,
    createdAt,
  },
  { merge: true },
);

console.log("Upserted blog/comomas-launch");
