"use client"

import { createContext, useContext, useState, useCallback } from "react"
import { toast } from "sonner"

interface Subscription {
  id: string
  partnerId: string
  memberId: string
  status: "active" | "inactive"
  expiresAt?: string
  partner: {
    displayName: string
    email: string
  }
}

interface SubscriptionContextData {
  subscriptions: Subscription[]
  loading: boolean
  addSubscriptions: (memberId: string, subscriptionsData: any[]) => Promise<void>
  cancelSubscription: (subscriptionId: string) => Promise<void>
  getPartnerSubscriptions: (partnerId: string) => Promise<Subscription[]>
  getMemberSubscriptions: (memberId: string) => Promise<Subscription[]>
  getMemberEstablishments: (memberId: string) => Promise<any[]>
}

const SubscriptionContext = createContext({} as SubscriptionContextData)

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(false)

  const addSubscriptions = useCallback(async (memberId: string, subscriptionsData: any[]) => {
    try {
      setLoading(true)
      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          memberId,
          subscriptions: subscriptionsData
        }),
        credentials: "include"
      })

      if (!response.ok) {
        throw new Error("Erro ao adicionar assinaturas")
      }

      const data = await response.json()
      setSubscriptions(prev => [...prev, ...data])
      return data
    } catch (error: any) {
      toast.error(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const cancelSubscription = useCallback(async (subscriptionId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/subscriptions/${subscriptionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "inactive" }),
        credentials: "include"
      })

      if (!response.ok) {
        throw new Error("Erro ao cancelar assinatura")
      }

      setSubscriptions(prev => 
        prev.map(sub => 
          sub.id === subscriptionId 
            ? { ...sub, status: "inactive" }
            : sub
        )
      )
    } catch (error: any) {
      toast.error(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const getMemberSubscriptions = useCallback(async (memberId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/subscriptions?memberId=${memberId}`, {
        credentials: "include"
      })

      if (!response.ok) {
        throw new Error("Erro ao carregar assinaturas")
      }

      const data = await response.json()
      setSubscriptions(data)
      return data
    } catch (error: any) {
      toast.error(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const getPartnerSubscriptions = useCallback(async (partnerId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/subscriptions?partnerId=${partnerId}`, {
        credentials: "include"
      })

      if (!response.ok) {
        throw new Error("Erro ao carregar assinaturas")
      }

      const data = await response.json()
      setSubscriptions(data)
      return data
    } catch (error: any) {
      toast.error(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const getMemberEstablishments = useCallback(async (memberId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/establishments/member/${memberId}`, {
        credentials: "include"
      })

      if (!response.ok) {
        throw new Error("Erro ao carregar estabelecimentos")
      }

      const data = await response.json()
      return data
    } catch (error: any) {
      toast.error(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <SubscriptionContext.Provider
      value={{
        subscriptions,
        loading,
        addSubscriptions,
        cancelSubscription,
        getPartnerSubscriptions,
        getMemberSubscriptions,
        getMemberEstablishments
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  )
}

export const useSubscription = () => {
  const context = useContext(SubscriptionContext)
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider')
  }
  return context
}
