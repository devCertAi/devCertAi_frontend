/**
 * useCredits.ts — Hook for accessing user credit balance
 *
 * Features:
 * - Auto-fetches on mount
 * - Refetch after exam/project actions
 * - Exposes helpers: canTakeExam, canEvalProject, isPremium
 */

import { useState, useEffect, useCallback } from 'react'
import api from '@/services/api'
import { useAuthStore } from '@/store/authStore'

export interface CreditBucket {
  used: number
  limit: number
  bonus: number
  remaining: number
}

export interface CreditBalance {
  skill: CreditBucket
  project: CreditBucket
  unlimited: boolean
  bonusExpiresAt: string | null
  purchasedExpiresAt: string | null
  cycleResetAt: string | null
}

const EMPTY_BALANCE: CreditBalance = {
  skill: { used: 0, limit: 0, bonus: 0, remaining: 0 },
  project: { used: 0, limit: 0, bonus: 0, remaining: 0 },
  unlimited: false,
  bonusExpiresAt: null,
  purchasedExpiresAt: null,
  cycleResetAt: null,
}

let _cachedBalance: CreditBalance | null = null
let _listeners: Array<(b: CreditBalance) => void> = []

function notifyListeners(b: CreditBalance) {
  _cachedBalance = b
  _listeners.forEach(fn => fn(b))
}

export async function refreshCredits(): Promise<CreditBalance | null> {
  try {
    const { data } = await api.get('/credits')
    const balance: CreditBalance = data.data?.credits ?? data.credits
    notifyListeners(balance)
    return balance
  } catch {
    return null
  }
}

export function useCredits() {
  const { user, isAuthenticated } = useAuthStore()
  const [balance, setBalance] = useState<CreditBalance>(_cachedBalance ?? EMPTY_BALANCE)
  const [loading, setLoading] = useState(!_cachedBalance)

  useEffect(() => {
    const listener = (b: CreditBalance) => setBalance(b)
    _listeners.push(listener)
    return () => { _listeners = _listeners.filter(l => l !== listener) }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      setBalance(EMPTY_BALANCE)
      setLoading(false)
      return
    }
    if (_cachedBalance) {
      setBalance(_cachedBalance)
      setLoading(false)
      return
    }
    setLoading(true)
    refreshCredits().finally(() => setLoading(false))
  }, [isAuthenticated, user?.id])

  const refetch = useCallback(() => {
    setLoading(true)
    return refreshCredits().finally(() => setLoading(false))
  }, [])

  const isPremium = user?.isPremium ?? false

  return {
    balance,
    loading,
    refetch,
    isPremium,
    // Conveniences — no plan is unlimited, so these always reflect the
    // real balance returned by the API.
    canTakeExam: balance.skill.remaining > 0,
    canEvalProject: balance.project.remaining > 0,
    skillRemaining: balance.skill.remaining,
    projectRemaining: balance.project.remaining,
  }
}
