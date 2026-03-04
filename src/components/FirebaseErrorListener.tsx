"use client"

import { useEffect } from "react"
import { errorEmitter } from "@/firebase/error-emitter"
import { useToast } from "@/hooks/use-toast"
import { FirestorePermissionError } from "@/firebase/errors"

// This is a client component that listens for Firestore permission errors
// and displays them in a toast. It's used in the FirebaseProvider.
export function FirebaseErrorListener() {
  const { toast } = useToast()

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      console.error("Firestore Permission Error:", error.toContextObject())

      toast({
        variant: "destructive",
        title: "Firestore Permission Denied",
        description: error.message,
        duration: 10000,
      })

      // In a real app, you might want to throw the error to an error boundary
      // to display a more comprehensive error screen.
      // For this portfolio, we'll just log it and show a toast.
    }

    errorEmitter.on("permission-error", handleError)

    return () => {
      errorEmitter.off("permission-error", handleError)
    }
  }, [toast])

  return null
}
