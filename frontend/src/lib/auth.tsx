"use client"

import { useSession, signOut } from "@/lib/auth-client"
import { useRouter } from "next/navigation"

// Legacy session shape kept for backwards compatibility with api.ts helpers.
export interface LocalSession {
  access_token: string
  user_id: string
  email: string
  role: string
}

// Compatibility shim — delegates to Better Auth.
export function useAuth() {
  const { data: session, isPending: loading } = useSession()
  const router = useRouter()

  return {
    session: session
      ? {
          access_token: session.session.token,
          user_id: session.user.id,
          email: session.user.email,
          role: "owner",
        }
      : null,
    loading,
    accessToken: session?.session.token ?? null,
    signOut: async () => {
      await signOut()
      router.replace("/")
    },
    setSession: () => {}, // no-op — Better Auth manages sessions
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
