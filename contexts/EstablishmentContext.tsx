"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import type { Establishment, GeneratedVoucher } from "@/types/establishment"

interface EstablishmentContextType {
  establishments: Establishment[]
  generatedVouchers: GeneratedVoucher[]
  loading: boolean
  addEstablishment: (establishment: Omit<Establishment, "id" | "partnerId" | "status" | "createdAt" | "updatedAt" | "rating" | "totalRatings" | "isFeatured">) => Promise<void>
  updateEstablishment: (id: string, establishment: Partial<Establishment>) => Promise<void>
  generateVoucher: (establishmentId: string, userId: string) => Promise<string | null>
  canGenerateVoucher: (establishmentId: string, userId: string) => boolean
  getNextVoucherTime: (establishmentId: string, userId: string) => number | null
  getUserVouchers: (userId: string) => GeneratedVoucher[]
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
  const [establishments, setEstablishments] = useState<Establishment[]>([])
  const [generatedVouchers, setGeneratedVouchers] = useState<GeneratedVoucher[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const refreshEstablishments = useCallback(async () => {
    try {
      setLoading(true)
      let url = "/api/establishments"

      // Adicionar parâmetros baseado no tipo de usuário
      if (user) {
        if (user.userType === "partner") {
          url += `?partnerId=${user.uid}`
        } else if (user.userType === "member") {
          url += `?memberId=${user.uid}`
        }
      }

      const response = await fetch(url, {
        credentials: "include"
      })
      
      if (!response.ok) {
        throw new Error("Erro ao carregar estabelecimentos")
      }

      const data = await response.json()
      setEstablishments(data)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    refreshEstablishments()
  }, [refreshEstablishments])

  // Check for expired vouchers every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setGeneratedVouchers((prev) =>
        prev.map((voucher) => ({
          ...voucher,
          status: Date.now() >= voucher.expiresAt ? "expired" : voucher.status,
        })),
      )
    }, 60000)

    return () => clearInterval(interval)
  }, [])

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
    async (establishmentId: string, userId: string): Promise<string | null> => {
      const establishment = establishments.find((e) => e.id === establishmentId)
      if (!establishment || !canGenerateVoucher(establishmentId, userId)) return null

      const code = Math.random().toString(36).substring(2, 8).toUpperCase()
      const now = Date.now()

      // Add to generated vouchers
      const newVoucher: GeneratedVoucher = {
        code,
        establishmentId,
        userId,
        generatedAt: now,
        expiresAt: now + establishment.voucherExpiration * 60 * 60 * 1000,
        status: "pending",
      }

      setGeneratedVouchers((prev) => [...prev, newVoucher])

      // Update last generated timestamp
      setEstablishments((prev) =>
        prev.map((est) => {
          if (est.id === establishmentId) {
            return {
              ...est,
              lastVoucherGenerated: {
                ...est.lastVoucherGenerated,
                [userId]: now,
              },
            }
          }
          return est
        }),
      )

      return code
    },
    [establishments],
  )

  const canGenerateVoucher = useCallback(
    (establishmentId: string, userId: string): boolean => {
      const establishment = establishments.find((e) => e.id === establishmentId)
      if (!establishment) return false

      const lastGenerated = establishment.lastVoucherGenerated?.[userId]
      if (!lastGenerated) return true

      const cooldownMs = establishment.voucherCooldown * 60 * 60 * 1000
      return Date.now() - lastGenerated >= cooldownMs
    },
    [establishments],
  )

  const getNextVoucherTime = useCallback(
    (establishmentId: string, userId: string): number | null => {
      const establishment = establishments.find((e) => e.id === establishmentId)
      if (!establishment) return null

      const lastGenerated = establishment.lastVoucherGenerated?.[userId]
      if (!lastGenerated) return null

      const cooldownMs = establishment.voucherCooldown * 60 * 60 * 1000
      const nextAvailable = lastGenerated + cooldownMs
      return nextAvailable
    },
    [establishments],
  )

  const getUserVouchers = useCallback(
    (userId: string): GeneratedVoucher[] => {
      return generatedVouchers.filter((v) => v.userId === userId)
    },
    [generatedVouchers],
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
        generatedVouchers,
        loading,
        addEstablishment,
        updateEstablishment,
        generateVoucher,
        canGenerateVoucher,
        getNextVoucherTime,
        getUserVouchers,
        toggleFeatured,
        refreshEstablishments,
      }}
    >
      {children}
    </EstablishmentContext.Provider>
  )
}
