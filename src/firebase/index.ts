"use client"

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app"
import {
  getAuth,
  signInAnonymously,
  type Auth,
} from "firebase/auth"
import {
  getFirestore,
  type Firestore,
} from "firebase/firestore"
import { getFirebaseConfig } from "./config"

// Re-export hooks and providers
export * from "./provider"
export * from "./auth/use-user"
export * from "./firestore/use-collection"
export * from "./firestore/use-doc"
export * from './client-provider';

let app: FirebaseApp
let auth: Auth
let firestore: Firestore

function initializeFirebase() {
  const firebaseConfig = getFirebaseConfig()
  if (!getApps().length) {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    firestore = getFirestore(app)
    
    // Sign in anonymously
    signInAnonymously(auth).catch((error) => {
        console.error("Anonymous sign-in failed:", error);
    });

  } else {
    app = getApp()
    auth = getAuth(app)
    firestore = getFirestore(app)
  }
  return { app, auth, firestore }
}

export { initializeFirebase }
