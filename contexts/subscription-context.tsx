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
  checkActiveSubscriptionByEmail: (email: string) => Promise<boolean>
  hasAnyActiveSubscription: (userId?: string, email?: string) => Promise<boolean>
}

const SubscriptionContext = createContext({} as SubscriptionContextData)

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(false)

  const loadMemberSubscriptions = useCallback(async (memberId: string) => {
    try {
      console.log("Carregando assinaturas para o membro:", memberId);
      setLoading(true);
      
      const subscriptionsRef = collection(db, "subscriptions")
      const subscriptionsQuery = query(
        subscriptionsRef,
        where("memberId", "==", memberId)
      )
      const snapshot = await getDocs(subscriptionsQuery)
      
      // Garantir que todos os campos necessários estejam presentes
      const subscriptionsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          memberId: data.memberId || memberId,
          partnerId: data.partnerId || '',
          status: data.status || 'inactive',
          expiresAt: data.expiresAt,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          ...data // Manter outros campos que possam existir
        } as Subscription;
      });

      console.log(`Encontradas ${subscriptionsData.length} assinaturas`);
      
      // Usar função de estado para comparar com o valor atual
      setSubscriptions(currentSubscriptions => {
        const hasChanges = JSON.stringify(subscriptionsData) !== JSON.stringify(currentSubscriptions);
        return hasChanges ? subscriptionsData : currentSubscriptions;
      });
      
      setLoading(false);
    } catch (error) {
      console.error("Erro ao carregar assinaturas:", error)
      setLoading(false);
      throw error
    }
  }, []) // Sem dependências para evitar o ciclo

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

  const checkActiveSubscriptionByEmail = useCallback(async (email: string) => {
    try {
      if (!email) return false;
      
      console.log("Verificando assinatura pelo email:", email);
      
      const subscriptionsRef = collection(db, "subscriptions")
      const emailQuery = query(
        subscriptionsRef,
        where("userEmail", "==", email.toLowerCase())
      )
      
      const emailSnapshot = await getDocs(emailQuery)
      
      // Verificar se há assinaturas ativas
      const activeStatuses = ["active", "ativa", "iniciada", "paid", "trialing"];
      const hasActiveSubscription = emailSnapshot.docs.some(doc => {
        const data = doc.data();
        return activeStatuses.includes(String(data.status));
      });
      
      return hasActiveSubscription;
    } catch (error) {
      console.error("Erro ao verificar assinatura por email:", error)
      return false
    }
  }, [])

  const hasAnyActiveSubscription = useCallback(async (userId?: string, email?: string) => {
    try {
      if (!userId && !email) return false;
      
      console.log("Verificando assinatura para usuário:", userId || email);
      
      // Assinaturas que consideramos como ativas
      const activeStatuses = ["active", "ativa", "iniciada", "paid", "trialing"];
      
      // Consultar por ID do usuário se disponível
      if (userId) {
        // Primeiramente, verificar nas assinaturas locais já carregadas
        const localActiveSubscription = subscriptions.some(sub => 
          activeStatuses.includes(String(sub.status))
        );
        
        if (localActiveSubscription) {
          console.log("Assinatura ativa encontrada localmente");
          return true;
        }
        
        // Se não encontrou localmente, verificar no Firestore
        const subscriptionsRef = collection(db, "subscriptions");
        
        const byMemberIdQuery = query(
          subscriptionsRef,
          where("memberId", "==", userId)
        );
        
        const byUserIdQuery = query(
          subscriptionsRef,
          where("userId", "==", userId)
        );
        
        const memberIdSnapshot = await getDocs(byMemberIdQuery);
        const userIdSnapshot = await getDocs(byUserIdQuery);
        
        const hasActiveMemberIdSub = memberIdSnapshot.docs.some(doc => {
          const data = doc.data();
          return activeStatuses.includes(String(data.status));
        });
        
        const hasActiveUserIdSub = userIdSnapshot.docs.some(doc => {
          const data = doc.data();
          return activeStatuses.includes(String(data.status));
        });
        
        if (hasActiveMemberIdSub || hasActiveUserIdSub) {
          console.log("Assinatura ativa encontrada por ID do usuário");
          return true;
        }
      }
      
      // Consultar por email se disponível
      if (email) {
        const subscriptionsRef = collection(db, "subscriptions");
        
        const byEmailQuery = query(
          subscriptionsRef,
          where("userEmail", "==", email.toLowerCase())
        );
        
        const byEmailSnapshot = await getDocs(byEmailQuery);
        
        const hasActiveEmailSub = byEmailSnapshot.docs.some(doc => {
          const data = doc.data();
          return activeStatuses.includes(String(data.status));
        });
        
        if (hasActiveEmailSub) {
          console.log("Assinatura ativa encontrada por email");
          return true;
        }
      }
      
      // Nenhuma assinatura ativa encontrada
      return false;
      
    } catch (error) {
      console.error("Erro ao verificar assinaturas:", error);
      return false;
    }
  }, [subscriptions])

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
      
      // Garantir que todos os campos necessários estejam presentes
      const existingSubscriptions = existingSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          memberId: data.memberId || memberId,
          partnerId: data.partnerId || '',
          status: data.status || 'inactive',
          expiresAt: data.expiresAt,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          ...data // Manter outros campos que possam existir
        } as Subscription;
      });
      
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
      removeSubscription,
      checkActiveSubscriptionByEmail,
      hasAnyActiveSubscription
    }}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export const useSubscription = () => useContext(SubscriptionContext)



