"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  onSnapshot,
  query,
  collection,
  where,
  type Query,
  type DocumentData,
  type FirestoreError,
} from "firebase/firestore"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useUser } from "@/firebase/auth/use-user"
import { errorEmitter } from "../error-emitter"
import { FirestorePermissionError } from "../errors"

function useStableQuery(q: Query | null) {
  const queryRef = useRef<Query | null>(q)

  if (q) {
    const qString = (q as any)._query?.path?.segments.join('/');
    const qRefString = queryRef.current ? (queryRef.current as any)._query?.path?.segments.join('/') : "";
    if (qString !== qRefString) {
      queryRef.current = q
    }
  }
  return queryRef.current
}

export function useCollection(query: Query | null, deps: any[] = []) {
  const stableQuery = useStableQuery(query)
  const queryClient = useQueryClient()
  const { data: user } = useUser()
  const [error, setError] = useState<FirestoreError | null>(null)

  const queryKey = useMemo(() => {
    if (!stableQuery) return null;
    // Use the query path for a unique key
    const path = (stableQuery as any)._query?.path?.segments.join('/');
    return path ? [path, user?.uid, ...deps] : null;
  }, [stableQuery, user?.uid, deps]);

  useEffect(() => {
    if (!stableQuery || !queryKey) return

    const unsubscribe = onSnapshot(
      stableQuery,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        queryClient.setQueryData(queryKey, data)
        setError(null)
      },
      (err) => {
        const permissionError = new FirestorePermissionError({
          path: (stableQuery as any)._query.path.segments.join("/"),
          operation: "list",
        })
        errorEmitter.emit("permission-error", permissionError)
        setError(err)
        console.error("Firestore Error in useCollection:", err)
      }
    )

    return () => unsubscribe()
  }, [stableQuery, queryClient, queryKey])

  const { data, isLoading } = useQuery<DocumentData[]>({
    queryKey: queryKey!,
    enabled: !!stableQuery,
    staleTime: Infinity,
    queryFn: () => new Promise(() => {}), // Prevent "no queryFn" error, data is set by onSnapshot
  })

  return { data, loading: isLoading, error }
}
