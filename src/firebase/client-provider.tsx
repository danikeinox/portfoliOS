"use client"

import { useState, useEffect } from "react"
import { initializeFirebase } from "."
import { FirebaseProvider } from "./provider"
import { type FirebaseApp } from "firebase/app"
import { type Auth } from "firebase/auth"
import { type Firestore } from "firebase/firestore"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { FirebaseErrorListener } from "@/components/FirebaseErrorListener"

const queryClient = new QueryClient()

export const FirebaseClientProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [firebase, setFirebase] = useState<{
    app: FirebaseApp
    auth: Auth
    firestore: Firestore
  } | null>(null)

  useEffect(() => {
    // Defer Firebase init to after first paint so LCP element renders immediately.
    // Firebase auth & Firestore are only needed on user interaction (apps, login).
    // requestIdleCallback is used when available (Chrome/Edge); Safari falls back to setTimeout.
    let cancelled = false

    const init = () => {
      if (cancelled) return
      const firebaseInstances = initializeFirebase()
      setFirebase(firebaseInstances)
    }

    if (typeof requestIdleCallback !== "undefined") {
      const id = requestIdleCallback(init, { timeout: 3000 })
      return () => {
        cancelled = true
        cancelIdleCallback(id)
      }
    } else {
      // Safari < 16.4 fallback
      const id = setTimeout(init, 0)
      return () => {
        cancelled = true
        clearTimeout(id)
      }
    }
  }, [])

  // Render children immediately — Firebase context is injected once ready.
  // Components that depend on auth/firestore already guard against null context.
  return (
    <QueryClientProvider client={queryClient}>
      {firebase ? (
        <FirebaseProvider
          app={firebase.app}
          auth={firebase.auth}
          firestore={firebase.firestore}
        >
          <FirebaseErrorListener />
          {children}
        </FirebaseProvider>
      ) : (
        children
      )}
    </QueryClientProvider>
  )
}
