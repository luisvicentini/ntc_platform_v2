"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import type { Establishment, AvailableEstablishment } from "@/types/establishment"
import { doc, runTransaction } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface EstablishmentContextType {
  establishments: (Establishment | AvailableEstablishment)[]
  loading: boolean
  addEstablishment: (establishment: Omit<Establishment, "id" | "partnerId" | "status" | "createdAt" | "updatedAt" | "rating" | "totalRatings" | "isFeatured">) => Promise<void>
  updateEstablishment: (id: string, establishment: Partial<Establishment>) => Promise<void>
  generateVoucher: (establishmentId: string) => Promise<string | null>
  canGenerateVoucher: (establishmentId: string, userId: string) => Promise<boolean>
  getNextVoucherTime: (establishmentId: string, userId: string) => Promise<Date | null>
  toggleFeatured: (id: string) => Promise<void>
  refreshEstablishments: (forceRefresh?: boolean) => Promise<void>
  updateEstablishmentRating: (establishmentId: string, newRating: number) => Promise<boolean>
  copyEstablishment: (id: string) => Promise<void>
}

const EstablishmentContext = createContext<EstablishmentContextType | undefined>(undefined)

export const useEstablishment = () => {
  const context = useContext(EstablishmentContext)
  if (!context) {
    throw new Error("useEstablishment must be used within an EstablishmentProvider")
  }
  return context
}

export const EstablishmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [establishments, setEstablishments] = useState<(Establishment | AvailableEstablishment)[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const auth = useAuth()
  const [dataLoaded, setDataLoaded] = useState(false)

  const refreshEstablishments = useCallback(async (forceRefresh = false) => {
    if (!auth.user) {
      console.log('Usuário não autenticado. Ignorando carregamento de estabelecimentos.');
      return;
    }

    if (dataLoaded && !forceRefresh) {
      console.log('Dados já carregados. Use forceRefresh para recarregar.');
      return;
    }

    try {
      setLoading(true)
      let url = "/api/member/feed"

      if (auth.user.userType === "partner") {
        url = "/api/establishments"
      }

      const response = await fetch(url, {
        headers: {
          "x-session-token": localStorage.getItem("session_token") || ""
        },
        credentials: "include"
      })
      
      if (!response.ok) {
        throw new Error("Erro ao carregar estabelecimentos")
      }

      const data = await response.json()
      setEstablishments(auth.user.userType === "partner" ? data : data.establishments)
      setDataLoaded(true)
    } catch (error: any) {
      console.error("Erro ao carregar estabelecimentos:", error)
      setError("Erro ao carregar estabelecimentos")
    } finally {
      setLoading(false)
    }
  }, [auth.user, dataLoaded])

  useEffect(() => {
    if (auth.user) {
      setDataLoaded(false)
      refreshEstablishments()
    }
  }, [auth.user])

  const addEstablishment = useCallback(async (establishment: Omit<Establishment, "id" | "partnerId" | "status" | "createdAt" | "updatedAt" | "rating" | "totalRatings" | "isFeatured">) => {
    try {
      const response = await fetch("/api/establishments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(establishment),
        credentials: "include"
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao criar estabelecimento")
      }

      const newEstablishment = await response.json()
      setEstablishments((prev) => [...prev, newEstablishment])
      toast.success("Estabelecimento criado com sucesso!")
    } catch (error: any) {
      toast.error(error.message)
      throw error
    }
  }, [])

  const updateEstablishment = useCallback(async (id: string, updatedFields: Partial<Establishment>) => {
    try {
      const response = await fetch(`/api/establishments/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-session-token": localStorage.getItem("session_token") || ""
        },
        body: JSON.stringify(updatedFields),
        credentials: "include"
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao atualizar estabelecimento")
      }

      const updatedEstablishment = await response.json()
      setEstablishments((prev) => 
        prev.map((est) => (est.id === id ? updatedEstablishment : est))
      )
      toast.success("Estabelecimento atualizado com sucesso!")
    } catch (error: any) {
      toast.error(error.message)
      throw error
    }
  }, [])

  const generateVoucher = useCallback(async (establishmentId: string) => {
    try {
      if (!auth.user?.userType || auth.user.userType !== 'member') {
        console.log('Auth state:', {
          userType: auth.user?.userType,
          uid: auth.user?.uid
        })
        throw new Error("Acesso não autorizado")
      }

      const response = await fetch("/api/vouchers/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          establishmentId,
          uid: auth.user.uid,
          userType: auth.user.userType
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Erro ao gerar voucher")
      }

      toast.success(`Voucher gerado: ${data.code}`)
      return data.code

    } catch (error: any) {
      console.error('Erro na geração:', error)
      toast.error(error.message)
      throw error
    }
  }, [auth])

  const canGenerateVoucher = useCallback(
    async (establishmentId: string, userId: string): Promise<boolean> => {
      try {
        const response = await fetch(`/api/vouchers/cooldown?establishmentId=${establishmentId}`, {
          credentials: "include"
        })

        if (!response.ok) {
          return false
        }

        const data = await response.json()
        return data.canGenerate
      } catch (error) {
        console.error("Erro ao verificar cooldown:", error)
        return false
      }
    },
    [],
  )

  const getNextVoucherTime = useCallback(
    async (establishmentId: string, userId: string): Promise<Date | null> => {
      try {
        const response = await fetch(`/api/vouchers/cooldown?establishmentId=${establishmentId}`, {
          credentials: "include"
        })

        if (!response.ok) {
          return null
        }

        const data = await response.json()
        return data.nextAvailable ? new Date(data.nextAvailable) : null
      } catch (error) {
        console.error("Erro ao buscar próximo horário disponível:", error)
        return null
      }
    },
    [],
  )

  const toggleFeatured = useCallback(async (id: string) => {
    try {
      const establishment = establishments.find(e => e.id === id)
      if (!establishment) return

      const response = await fetch(`/api/establishments/${id}/featured`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-token": localStorage.getItem("session_token") || ""
        },
        body: JSON.stringify({ isFeatured: !establishment.isFeatured }),
        credentials: "include"
      })

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao atualizar destaque")
      }

      setEstablishments((prev) => 
        prev.map((est) => (est.id === id ? { ...est, isFeatured: !est.isFeatured } : est))
      )
    } catch (error: any) {
      console.error("Erro ao atualizar destaque:", error);
      toast.error(error.message)
      throw error;
    }
  }, [establishments])

  const updateEstablishmentRating = useCallback(async (
    establishmentId: string, 
    newRating: number
  ) => {
    try {
      const establishmentRef = doc(db, "establishments", establishmentId)
      
      await runTransaction(db, async (transaction) => {
        const establishmentDoc = await transaction.get(establishmentRef)
        
        if (!establishmentDoc.exists()) {
          throw new Error("Estabelecimento não encontrado")
        }

        const data = establishmentDoc.data()
        const newTotalRatings = (data.totalRatings || 0) + 1
        const currentRating = data.rating || 0
        const averageRating = ((currentRating * (newTotalRatings - 1)) + newRating) / newTotalRatings

        transaction.update(establishmentRef, {
          rating: Number(averageRating.toFixed(1)),
          totalRatings: newTotalRatings,
        })

        // Atualiza o estado local
        setEstablishments(prev => 
          prev.map(est => 
            est.id === establishmentId 
              ? { 
                  ...est, 
                  rating: Number(averageRating.toFixed(1)), 
                  totalRatings: newTotalRatings 
                }
              : est
          )
        )
      })

      return true
    } catch (error) {
      console.error("Erro ao atualizar avaliação:", error)
      return false
    }
  }, [])

  const copyEstablishment = useCallback(async (id: string) => {
    try {
      const establishment = establishments.find(e => e.id === id)
      if (!establishment) {
        throw new Error("Estabelecimento não encontrado")
      }

      // Criando uma cópia do estabelecimento com um novo nome
      const {
        id: _id,
        partnerId: _partnerId,
        status: _status,
        createdAt: _createdAt,
        updatedAt: _updatedAt,
        rating: _rating,
        totalRatings: _totalRatings,
        isFeatured: _isFeatured,
        ...copyData
      } = establishment

      // Adicionando "(Cópia)" ao nome e definindo status como "inactive"
      const newEstablishmentData = {
        ...copyData,
        name: `${establishment.name} (Cópia)`,
        status: "inactive" // Garantir que o estabelecimento seja criado desativado
      }

      // Chamando a função de adicionar estabelecimento com os dados copiados
      await addEstablishment(newEstablishmentData)
      
      toast.success("Estabelecimento copiado com sucesso!")
    } catch (error: any) {
      toast.error(error.message || "Erro ao copiar estabelecimento")
      throw error
    }
  }, [establishments, addEstablishment])

  return (
    <EstablishmentContext.Provider
      value={{
        establishments,
        loading,
        addEstablishment,
        updateEstablishment,
        generateVoucher,
        canGenerateVoucher,
        getNextVoucherTime,
        toggleFeatured,
        refreshEstablishments,
        updateEstablishmentRating,
        copyEstablishment
      }}
    >
      {children}
    </EstablishmentContext.Provider>
  )
}
