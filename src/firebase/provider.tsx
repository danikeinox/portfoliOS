"use client"

import { createContext, useContext } from "react"
import { type FirebaseApp } from "firebase/app"
import { type Auth } from "firebase/auth"
import { type Firestore } from "firebase/firestore"

interface FirebaseContextType {
  app: FirebaseApp
  auth: Auth
  firestore: Firestore
}

// Nullable context: undefined when Firebase hasn't initialized yet.
// Hooks return null instead of throwing so components can guard gracefully.
const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined)

export const FirebaseProvider = ({
  children,
  ...props
}: {
  children: React.ReactNode
} & FirebaseContextType) => {
  return (
    <FirebaseContext.Provider value={props}>
      {children}
    </FirebaseContext.Provider>
  )
}

export const useFirebaseApp = () => {
  const context = useContext(FirebaseContext)
  return context?.app ?? null
}

export const useAuth = () => {
  const context = useContext(FirebaseContext)
  return context?.auth ?? null
}

export const useFirestore = () => {
  const context = useContext(FirebaseContext)
  return context?.firestore ?? null
}
