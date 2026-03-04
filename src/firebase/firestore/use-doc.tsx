"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  onSnapshot,
  doc,
  type DocumentReference,
  type DocumentData,
  type FirestoreError,
} from "firebase/firestore"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useUser } from "@/firebase/auth/use-user"
import { errorEmitter } from "../error-emitter"
import { FirestorePermissionError } from "../errors"

function useStableDocRef(docRef: DocumentReference | null) {
  const ref = useRef<DocumentReference | null>(docRef)
  if (docRef) {
    if (ref.current?.path !== docRef.path) {
      ref.current = docRef
    }
  }
  return ref.current
}

export function useDoc(docRef: DocumentReference | null, deps: any[] = []) {
  const stableDocRef = useStableDocRef(docRef)
  const queryClient = useQueryClient()
  const { data: user } = useUser()
  const [error, setError] = useState<FirestoreError | null>(null)

  const queryKey = useMemo(
    () => (stableDocRef ? [stableDocRef.path, user?.uid, ...deps] : null),
    [stableDocRef, user?.uid, deps]
  )

  useEffect(() => {
    if (!stableDocRef) return

    const unsubscribe = onSnapshot(
      stableDocRef,
      (snapshot) => {
        const data = snapshot.exists()
          ? { id: snapshot.id, ...snapshot.data() }
          : null
        queryClient.setQueryData(queryKey!, data)
        setError(null)
      },
      (err) => {
        const permissionError = new FirestorePermissionError({
          path: stableDocRef.path,
          operation: "get",
        })
        errorEmitter.emit("permission-error", permissionError)
        setError(err)
        console.error("Firestore Error in useDoc:", err)
      }
    )

    return () => unsubscribe()
  }, [stableDocRef, queryClient, queryKey])

  const { data, isLoading } = useQuery<DocumentData | null>({
    queryKey: queryKey!,
    enabled: !!stableDocRef,
    staleTime: Infinity,
  })

  return { data, loading: isLoading, error }
}
