"use client"

import { useEffect, useState, useCallback } from "react"

export interface CreditBalance {
  balance: number
  monthlyLimit: number
  resetDate?: string
}

export function useCredits() {
  const [credits, setCredits] = useState<CreditBalance | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/credits/balance")
      if (res.ok) setCredits(await res.json())
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { credits, loading, refresh }
}
