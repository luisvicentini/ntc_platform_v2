"use client"

import React, { createContext, useContext, useState, useCallback } from "react"
import { toast } from "sonner"
import type { Subscription } from "@/types/subscription"
import { collection, getDocs, query, where, addDoc, doc, deleteDoc, updateDoc } from "firebase/firestore"
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
  removeSubscription: (memberId: string, partnerId: string) => Promise<void>
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

  const addSubscriptions = useCallback(async (memberId: string, subscriptionsData: any[]) => {
    try {
      const subscriptionsRef = collection(db, "subscriptions")
      
      // Buscar assinaturas existentes usando diretamente o Firestore
      const existingQuery = query(
        subscriptionsRef,
        where("memberId", "==", memberId),
        where("status", "==", "active")
      )
      const existingSnapshot = await getDocs(existingQuery)
      const existingSubscriptions = existingSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      // Para cada assinatura nova
      for (const subscription of subscriptionsData) {
        // Verificar se já existe
        const existing = existingSubscriptions.find(
          s => s.partnerId === subscription.partnerId
        )
        
        if (existing) {
          // Atualizar existente
          await updateDoc(doc(db, "subscriptions", existing.id), {
            expiresAt: subscription.expiresAt,
            updatedAt: new Date().toISOString()
          })
        } else {
          // Criar nova
          await addDoc(subscriptionsRef, {
            memberId,
            partnerId: subscription.partnerId,
            status: "active",
            expiresAt: subscription.expiresAt,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
        }
      }
    } catch (error) {
      console.error("Erro ao adicionar assinaturas:", error)
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

  const removeSubscription = useCallback(async (memberId: string, partnerId: string) => {
    try {
      const subscriptionsRef = collection(db, "subscriptions")
      const q = query(
        subscriptionsRef,
        where("memberId", "==", memberId),
        where("partnerId", "==", partnerId),
        where("status", "==", "active")
      )
      
      const snapshot = await getDocs(q)
      
      if (snapshot.empty) {
        throw new Error("Assinatura não encontrada")
      }

      const subscriptionDoc = snapshot.docs[0]
      
      // Atualizar status para inativo ao invés de deletar
      await updateDoc(doc(db, "subscriptions", subscriptionDoc.id), {
        status: "inactive",
        updatedAt: new Date().toISOString(),
        canceledAt: new Date().toISOString()
      })

      // Atualizar estado local
      setSubscriptions(prev => 
        prev.map(sub => 
          sub.id === subscriptionDoc.id 
            ? { ...sub, status: "inactive" }
            : sub
        )
      )
    } catch (error) {
      console.error("Erro ao remover assinatura:", error)
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
      checkActiveSubscription,
      removeSubscription
    }}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export const useSubscription = () => useContext(SubscriptionContext)



