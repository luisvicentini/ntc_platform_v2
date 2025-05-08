"use client"

import React, { createContext, useContext, useState, useCallback } from "react"
import { toast } from "sonner"
import type { Subscription } from "@/types/subscription"
import { collection, getDocs, query, where, addDoc, doc, deleteDoc, updateDoc, getDoc, setDoc } from "firebase/firestore"
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
      const memberPartnersRef = collection(db, "memberPartners")
      const now = new Date()
      
      // Buscar informações do usuário para obter o email
      const userRef = doc(db, "users", memberId)
      const userDoc = await getDoc(userRef)
      const userData = userDoc.exists() ? userDoc.data() : {}
      const userEmail = userData.email || ''
      
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
        
        // Buscar informações do parceiro
        const partnerRef = doc(db, "users", subscription.partnerId)
        const partnerDoc = await getDoc(partnerRef)
        const partnerData = partnerDoc.exists() ? partnerDoc.data() : {}
        const partnerName = partnerData.displayName || partnerData.name || "Parceiro não identificado"
        const partnerEmail = partnerData.email || ""
        
        if (existing) {
          // Atualizar existente
          await updateDoc(doc(db, "subscriptions", existing.id), {
            expiresAt: subscription.expiresAt,
            updatedAt: now.toISOString(),
            endDate: subscription.expiresAt,
            partnerName,
            partnerEmail
          })
          
          // Verificar se já existe em memberPartners
          const mpQuery = query(
            memberPartnersRef,
            where("memberId", "==", memberId),
            where("partnerId", "==", subscription.partnerId)
          )
          const mpSnapshot = await getDocs(mpQuery)
          
          if (!mpSnapshot.empty) {
            // Atualizar memberPartners existente
            await updateDoc(doc(memberPartnersRef, mpSnapshot.docs[0].id), {
              expiresAt: subscription.expiresAt,
              updatedAt: now.toISOString(),
              status: "active"
            })
          } else {
            // Criar novo em memberPartners
            await addDoc(memberPartnersRef, {
              memberId,
              userId: memberId,
              partnerId: subscription.partnerId,
              status: "active",
              createdAt: now.toISOString(),
              updatedAt: now.toISOString(),
              expiresAt: subscription.expiresAt,
              userEmail: userEmail.toLowerCase(),
              planName: "Plano Manual",
              planInterval: "manual",
              planIntervalCount: 1,
              price: 0,
              provider: "admin_panel",
              type: "manual",
              startDate: now.toISOString()
            })
          }
        } else {
          // Criar nova assinatura
          const newSubscriptionRef = doc(subscriptionsRef)
          const subscriptionId = newSubscriptionRef.id
          
          // Dados completos para assinatura
          const subscriptionData = {
            id: subscriptionId,
            userId: memberId,
            memberId,
            partnerId: subscription.partnerId,
            partnerName,
            partnerEmail,
            transactionId: null,
            planName: "Plano Manual",
            planInterval: "manual",
            planIntervalCount: 1,
            price: 0,
            startDate: now.toISOString(),
            endDate: subscription.expiresAt,
            status: "active",
            paymentMethod: "manual",
            provider: "admin_panel",
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            type: "manual",
            userEmail: userEmail.toLowerCase(),
            expiresAt: subscription.expiresAt
          }
          
          // Salvar assinatura
          await setDoc(newSubscriptionRef, subscriptionData)
          
          // Criar memberPartners
          await addDoc(memberPartnersRef, {
            memberId,
            userId: memberId,
            partnerId: subscription.partnerId,
            status: "active",
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            expiresAt: subscription.expiresAt,
            userEmail: userEmail.toLowerCase(),
            planName: "Plano Manual",
            planInterval: "manual",
            planIntervalCount: 1,
            price: 0,
            provider: "admin_panel",
            type: "manual",
            startDate: now.toISOString(),
            subscriptionId
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
      console.log("Buscando assinaturas para membro:", memberId)
      
      // 1. Buscar primeiro pela API (que vai buscar apenas por memberId)
      let subscriptionsData: Subscription[] = []
      
      try {
        const response = await fetch(`/api/subscriptions?memberId=${memberId}`, {
          credentials: "include"
        })
  
        if (response.ok) {
          const apiData = await response.json()
          subscriptionsData = apiData
          console.log("Assinaturas encontradas pela API:", subscriptionsData.length)
        }
      } catch (apiError) {
        console.error("Erro ao buscar assinaturas pela API:", apiError)
      }
      
      // 2. Buscar diretamente no Firestore para garantir que pegamos todas as variações 
      try {
        const subscriptionsRef = collection(db, "subscriptions")
        
        // Buscar por memberId
        const memberIdQuery = query(
          subscriptionsRef,
          where("memberId", "==", memberId)
        )
        
        const memberIdSnapshot = await getDocs(memberIdQuery)
        
        const memberIdResults = memberIdSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          partnerName: doc.data().partnerName || "Parceiro não identificado", 
          partnerEmail: doc.data().partnerEmail || ""
        })) as Subscription[]
        
        console.log("Assinaturas encontradas por memberId:", memberIdResults.length)
        
        // Buscar por userId (para compatibilidade com webhook da Lastlink)
        const userIdQuery = query(
          subscriptionsRef,
          where("userId", "==", memberId) // memberId é na verdade o userId neste contexto
        )
        
        const userIdSnapshot = await getDocs(userIdQuery)
        
        const userIdResults = userIdSnapshot.docs.map(doc => {
          // Informações do parceiro
          let partnerName = doc.data().partnerName
          let partnerEmail = doc.data().partnerEmail
          
          // Se não tiver nome do parceiro, tentamos extrair de outros campos
          if (!partnerName) {
            partnerName = "Parceiro não identificado"
          }
          
          return {
            id: doc.id,
            ...doc.data(),
            memberId: doc.data().memberId || memberId, // Garantir que memberId esteja presente
            partnerName, 
            partnerEmail: partnerEmail || ""
          }
        }) as Subscription[]
        
        console.log("Assinaturas encontradas por userId:", userIdResults.length)
        
        // Combinar resultados sem duplicações (por id da assinatura)
        const combinedResults = [...subscriptionsData]
        
        // Adicionar resultados do memberId se não existirem
        memberIdResults.forEach(sub => {
          if (!combinedResults.some(existing => existing.id === sub.id)) {
            combinedResults.push(sub)
          }
        })
        
        // Adicionar resultados do userId se não existirem
        userIdResults.forEach(sub => {
          if (!combinedResults.some(existing => existing.id === sub.id)) {
            combinedResults.push(sub)
          }
        })
        
        console.log("Total de assinaturas após combinar:", combinedResults.length)
        
        // 3. Buscar informações dos parceiros para enriquecer os dados
        for (const sub of combinedResults) {
          if (sub.partnerId && (!sub.partnerName || sub.partnerName === "Parceiro não identificado")) {
            try {
              const partnerRef = doc(db, "users", sub.partnerId)
              const partnerDoc = await getDoc(partnerRef)
              
              if (partnerDoc.exists()) {
                const data = partnerDoc.data()
                sub.partnerName = data.displayName || data.name || data.businessName || "Parceiro não identificado"
                sub.partnerEmail = data.email || ""
              }
            } catch (error) {
              console.error(`Erro ao buscar informações do parceiro ${sub.partnerId}:`, error)
            }
          }
        }
        
        setSubscriptions(combinedResults)
        return combinedResults
      } catch (firestoreError) {
        console.error("Erro ao buscar assinaturas no Firestore:", firestoreError)
      }
      
      // Se chegou até aqui, usamos os dados que temos
      setSubscriptions(subscriptionsData)
      return subscriptionsData
    } catch (error: any) {
      console.error("Erro ao carregar assinaturas:", error)
      toast.error("Erro ao carregar assinaturas")
      return []
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



