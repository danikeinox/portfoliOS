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
  if (context === undefined) {
    throw new Error("useFirebaseApp must be used within a FirebaseProvider")
  }
  return context.app
}

export const useAuth = () => {
  const context = useContext(FirebaseContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within a FirebaseProvider")
  }
  return context.auth
}

export const useFirestore = () => {
  const context = useContext(FirebaseContext)
  if (context === undefined) {
    throw new Error("useFirestore must be used within a FirebaseProvider")
  }
  return context.firestore
}
