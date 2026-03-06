import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getCredential() {
  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    return cert({
      projectId,
      clientEmail,
      privateKey,
    });
  }

  console.error(
    "[firebase-admin] Missing FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY. Falling back to application default credentials.",
  );

  return applicationDefault();
}

function getOrInitializeApp() {
  if (getApps().length) {
    return getApps()[0];
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  try {
    return initializeApp({
      credential: getCredential(),
      projectId,
    });
  } catch (error) {
    console.error(
      "[firebase-admin] Failed to initialize with explicit credentials. Retrying with minimal config.",
      error,
    );

    return initializeApp({ projectId });
  }
}

const app = getOrInitializeApp();

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
