"use client"

import { useEffect, useState } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { useAuth } from "@/firebase/provider"
import { useQuery, useQueryClient } from "@tanstack/react-query"

export function useUser() {
  const auth = useAuth()
  const queryClient = useQueryClient()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    if (!auth) return
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      // When the user changes, we need to invalidate any queries that depend on the user.
      queryClient.invalidateQueries()
    })
    return () => unsubscribe()
  }, [auth, queryClient])

  return useQuery({
    queryKey: ["user", user?.uid],
    queryFn: async () => {
      if (user) {
        return user
      }
      return null
    },
    initialData: user,
    enabled: !!auth,
  })
}
