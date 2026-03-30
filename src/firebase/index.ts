"use client";

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  indexedDBLocalPersistence, // avoids the cross-domain auth/iframe.js (saves ~90 KiB on mobile)
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInAnonymously,
  type Auth,
} from "firebase/auth";
import { 
  initializeAppCheck, 
  ReCaptchaV3Provider 
} from "firebase/app-check";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getFirebaseConfig } from "./config";

// Re-export hooks and providers
export * from "./provider";
export * from "./auth/use-user";
export * from "./firestore/use-collection";
export * from "./firestore/use-doc";
export * from "./client-provider";

let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

function initializeFirebase() {
  const firebaseConfig = getFirebaseConfig();
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    firestore = getFirestore(app);

    // Initialize App Check
    if (typeof window !== 'undefined') {
        const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
        if (siteKey) {
            initializeAppCheck(app, {
                provider: new ReCaptchaV3Provider(siteKey),
                isTokenAutoRefreshEnabled: true
            });
        }
    }

    // indexedDBLocalPersistence uses the browser's IndexedDB directly,
    // avoiding the cross-domain iframe that browserLocalPersistence requires.
    setPersistence(auth, indexedDBLocalPersistence).catch((error) => {
      console.error("Auth persistence setup failed:", error);
    });

    // Only create an anonymous session when there is no restored user.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        signInAnonymously(auth).catch((error) => {
          console.error("Anonymous sign-in failed:", error);
        });
      }
      unsubscribe();
    });
  } else {
    app = getApp();
    auth = getAuth(app);
    firestore = getFirestore(app);
  }
  return { app, auth, firestore };
}

export { initializeFirebase };
