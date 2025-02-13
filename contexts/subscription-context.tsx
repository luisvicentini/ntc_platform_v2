"use client"

import React, { createContext, useContext, useState, useCallback } from "react"
import { toast } from "sonner"
import type { Subscription } from "@/types/subscription"

interface SubscriptionContextType {
  subscriptions: Subscription[]
  loading: boolean
  addSubscription: (memberId: string, partnerId: string) => Promise<void>
  cancelSubscription: (id: string) => Promise<void>
  getPartnerSubscriptions: (partnerId: string) => Promise<Subscription[]>
  getMemberSubscriptions: (memberId: string) => Promise<Subscription[]>
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

export const useSubscription = () => {
  const context = useContext(SubscriptionContext)
  if (!context) {
    throw new Error("useSubscription must be used within a SubscriptionProvider")
  }
  return context
}

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(false)

  const addSubscription = useCallback(async (memberId: string, partnerId: string) => {
    try {
      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ memberId, partnerId }),
        credentials: "include"
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao criar assinatura")
      }

      const newSubscription = await response.json()
      setSubscriptions((prev) => [...prev, newSubscription])
      toast.success("Assinatura criada com sucesso!")
    } catch (error: any) {
      toast.error(error.message)
      throw error
    }
  }, [])

  const cancelSubscription = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/subscriptions/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include"
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao cancelar assinatura")
      }

      setSubscriptions((prev) => 
        prev.map((sub) => 
          sub.id === id ? { ...sub, status: "inactive" } : sub
        )
      )
      toast.success("Assinatura cancelada com sucesso!")
    } catch (error: any) {
      toast.error(error.message)
      throw error
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

  return (
    <SubscriptionContext.Provider
      value={{
        subscriptions,
        loading,
        addSubscription,
        cancelSubscription,
        getPartnerSubscriptions,
        getMemberSubscriptions,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  )
}
