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
    const firebaseInstances = initializeFirebase()
    setFirebase(firebaseInstances)
  }, [])

  if (!firebase) {
    // You can show a loading spinner here
    return null
  }

  return (
    <QueryClientProvider client={queryClient}>
      <FirebaseProvider
        app={firebase.app}
        auth={firebase.auth}
        firestore={firebase.firestore}
      >
        <FirebaseErrorListener />
        {children}
      </FirebaseProvider>
    </QueryClientProvider>
  )
}
