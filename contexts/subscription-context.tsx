"use client"

import React, { createContext, useContext, useState, useCallback } from "react"
import { toast } from "sonner"
import type { Subscription } from "@/types/subscription"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface SubscriptionContextData {
  subscriptions: Subscription[]
  loading: boolean
  addSubscriptions: (memberId: string, subscriptions: { partnerId: string, expiresAt?: string }[]) => Promise<void>
  cancelSubscription: (id: string) => Promise<void>
  getPartnerSubscriptions: (partnerId: string) => Promise<Subscription[]>
  getMemberSubscriptions: (memberId: string) => Promise<Subscription[]>
  loadMemberSubscriptions: (memberId: string) => Promise<void>
  checkActiveSubscription: (memberId: string, partnerId: string) => Promise<boolean>
}

const SubscriptionContext = createContext({} as SubscriptionContextData)

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(false)

  const loadMemberSubscriptions = useCallback(async (memberId: string) => {
    try {
      const subscriptionsRef = collection(db, "subscriptions")
      const subscriptionsQuery = query(
        subscriptionsRef,
        where("memberId", "==", memberId)
      )
      const snapshot = await getDocs(subscriptionsQuery)
      
      const subscriptionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      setSubscriptions(subscriptionsData)
    } catch (error) {
      console.error("Erro ao carregar assinaturas:", error)
      throw error
    }
  }, [])

  const checkActiveSubscription = useCallback(async (memberId: string, partnerId: string) => {
    try {
      const subscriptionsRef = collection(db, "subscriptions")
      const activeQuery = query(
        subscriptionsRef,
        where("memberId", "==", memberId),
        where("partnerId", "==", partnerId),
        where("status", "==", "active")
      )
      
      const activeSnapshot = await getDocs(activeQuery)
      return !activeSnapshot.empty
    } catch (error) {
      console.error("Erro ao verificar assinatura:", error)
      return false
    }
  }, [])

  const addSubscriptions = useCallback(async (memberId: string, subscriptions: { partnerId: string, expiresAt?: string }[]) => {
    try {
      const response = await fetch("/api/subscriptions/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          subscriptions: subscriptions.map(s => ({
            ...s,
            memberId,
            status: "active"
          }))
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao criar assinaturas")
      }

      toast.success("Assinaturas atualizadas com sucesso!")
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
        },
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
      const response = await fetch(`/api/subscriptions?partnerId=${partnerId}`, {
        credentials: "include"
      })

      if (!response.ok) {
        throw new Error("Erro ao carregar assinaturas")
      }

      const data = await response.json()
      return data
    } catch (error: any) {
      toast.error(error.message)
      throw error
    }
  }, [])

  const getMemberSubscriptions = useCallback(async (memberId: string) => {
    try {
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
    }
  }, [])

  return (
    <SubscriptionContext.Provider value={{
      subscriptions,
      loading,
      addSubscriptions,
      cancelSubscription,
      getPartnerSubscriptions,
      getMemberSubscriptions,
      loadMemberSubscriptions,
      checkActiveSubscription
    }}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export const useSubscription = () => useContext(SubscriptionContext)



