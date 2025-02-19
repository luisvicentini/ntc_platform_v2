"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import type { Establishment, AvailableEstablishment } from "@/types/establishment"

interface EstablishmentContextType {
  establishments: (Establishment | AvailableEstablishment)[]
  setEstablishments: React.Dispatch<React.SetStateAction<(Establishment | AvailableEstablishment)[]>>
  loading: boolean
  addEstablishment: (establishment: Omit<Establishment, "id" | "partnerId" | "status" | "createdAt" | "updatedAt" | "rating" | "totalRatings" | "isFeatured">) => Promise<void>
  updateEstablishment: (id: string, establishment: Partial<Establishment>) => Promise<void>
  generateVoucher: (establishmentId: string) => Promise<string | null>
  canGenerateVoucher: (establishmentId: string, userId: string) => Promise<boolean>
  getNextVoucherTime: (establishmentId: string, userId: string) => Promise<Date | null>
  toggleFeatured: (id: string) => Promise<void>
  refreshEstablishments: () => Promise<void>
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
  const { user } = useAuth()

  const refreshEstablishments = useCallback(async () => {
    try {
      setLoading(true)
      // Deixar a lógica de busca para os componentes específicos
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }, [user])

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

  const generateVoucher = useCallback(
    async (establishmentId: string): Promise<string | null> => {
      try {
        const response = await fetch("/api/vouchers/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ establishmentId }),
          credentials: "include"
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Erro ao gerar voucher")
        }

        const data = await response.json()
        return data.code

      } catch (error: any) {
        toast.error(error.message)
        return null
      }
    },
    [],
  )

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
        },
        body: JSON.stringify({ isFeatured: !establishment.isFeatured }),
        credentials: "include"
      })

      if (!response.ok) {
        throw new Error("Erro ao atualizar destaque")
      }

      setEstablishments((prev) => 
        prev.map((est) => (est.id === id ? { ...est, isFeatured: !est.isFeatured } : est))
      )
    } catch (error: any) {
      toast.error(error.message)
    }
  }, [establishments])

  return (
    <EstablishmentContext.Provider
      value={{
        establishments,
        setEstablishments,
        loading,
        addEstablishment,
        updateEstablishment,
        generateVoucher,
        canGenerateVoucher,
        getNextVoucherTime,
        toggleFeatured,
        refreshEstablishments,
      }}
    >
      {children}
    </EstablishmentContext.Provider>
  )
}
