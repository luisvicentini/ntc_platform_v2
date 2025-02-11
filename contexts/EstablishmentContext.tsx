"use client"

import React, { createContext, useContext, useState, useCallback } from "react"

interface GeneratedVoucher {
  code: string
  establishmentId: string
  userId: string
  generatedAt: number
  expiresAt: number
  status: "pending" | "expired"
}

export interface Establishment {
  id: string
  name: string
  address: string
  description: string
  phone: string
  openingHours: string
  voucherDescription: string
  discountValue: string
  discountRules: string
  usageLimit: string
  voucherAvailability: "unlimited" | "limited"
  voucherQuantity: number
  voucherCooldown: number
  voucherExpiration: number // in hours
  lastVoucherGenerated?: { [userId: string]: number }
  images: string[]
  type: string
  location: string
  rating: number
  totalRatings: number
  isFeatured: boolean // New property
}

interface EstablishmentContextType {
  establishments: Establishment[]
  generatedVouchers: GeneratedVoucher[]
  addEstablishment: (establishment: Omit<Establishment, "id">) => void
  updateEstablishment: (id: string, establishment: Partial<Establishment>) => void
  generateVoucher: (establishmentId: string, userId: string) => string | null
  canGenerateVoucher: (establishmentId: string, userId: string) => boolean
  getNextVoucherTime: (establishmentId: string, userId: string) => number | null
  getUserVouchers: (userId: string) => GeneratedVoucher[]
  toggleFeatured: (id: string) => void // New function
}

const EstablishmentContext = createContext<EstablishmentContextType | undefined>(undefined)

export const useEstablishment = () => {
  const context = useContext(EstablishmentContext)
  if (!context) {
    throw new Error("useEstablishment must be used within an EstablishmentProvider")
  }
  return context
}

// Update test establishments to include isFeatured
const testEstablishments: Establishment[] = [
  {
    id: "1",
    name: "Niva's Lanches",
    address: "Rua A, 123 - Centro",
    description: "Dizem que temos o melhor Bauru de Limeira. Venha experimentar e comprove você mesmo!",
    phone: "(19) 3441-2504",
    openingHours: "Segunda a Sábado das 18h às 23h",
    voucherDescription: "10% de desconto em qualquer lanche",
    discountValue: "10%",
    discountRules: "Válido apenas para lanches, não inclui bebidas",
    usageLimit: "1 voucher por pessoa por dia",
    voucherAvailability: "unlimited",
    voucherQuantity: 0,
    voucherCooldown: 24,
    voucherExpiration: 48, // 48 hours
    images: [
      "https://www.minhareceita.com.br/app/uploads/2022/06/pernil650.jpg",
      "https://f.i.uol.com.br/fotografia/2022/03/23/1648057448623b5c68a161b_1648057448_3x2_md.jpg",
      "https://guiadacozinha.com.br/wp-content/uploads/2005/01/sanduichebauru.jpg",
    ],
    type: "Lanchonete",
    location: "Limeira/SP",
    rating: 4.5,
    totalRatings: 100,
    isFeatured: false,
  },
  {
    id: "2",
    name: "Pizzaria Bella",
    address: "Av. B, 456 - Jardim Glória",
    description: "As melhores pizzas da cidade, com ingredientes frescos e de qualidade.",
    phone: "(19) 3441-3333",
    openingHours: "Terça a Domingo das 18h às 23h",
    voucherDescription: "Pizza grande por preço de média",
    discountValue: "20%",
    discountRules: "Válido apenas para pizzas grandes, não inclui bebidas",
    usageLimit: "1 voucher por mesa",
    voucherAvailability: "limited",
    voucherQuantity: 50,
    voucherCooldown: 12,
    voucherExpiration: 24, // 24 hours
    images: [
      "https://www.receitas-sem-fronteiras.com/media/59de0b6a55d6d_crop.jpeg/rh/sanduiche-de-pernil-especial.jpg",
      "https://i0.statig.com.br/bancodeimagens/2r/5g/l7/2r5gl73lyxqlpxwoodysu86q5.jpg",
    ],
    type: "Pizzaria",
    location: "Limeira/SP",
    rating: 4.7,
    totalRatings: 150,
    isFeatured: true,
  },
  {
    id: "3",
    name: "Café Central",
    address: "Rua C, 789 - Centro",
    description: "O melhor café da região, com grãos selecionados e torrados artesanalmente.",
    phone: "(19) 3441-4444",
    openingHours: "Segunda a Sábado das 7h às 20h",
    voucherDescription: "Café expresso grátis na compra de qualquer bolo",
    discountValue: "100% no café expresso",
    discountRules: "Válido apenas para café expresso, limite de um por pessoa",
    usageLimit: "1 voucher por dia",
    voucherAvailability: "unlimited",
    voucherQuantity: 0,
    voucherCooldown: 24,
    voucherExpiration: 24, // 24 hours
    images: [
      "https://f.i.uol.com.br/fotografia/2022/03/23/1648057448623b5c68a161b_1648057448_3x2_md.jpg",
      "https://www.minhareceita.com.br/app/uploads/2022/06/pernil650.jpg",
    ],
    type: "Cafeteria",
    location: "Limeira/SP",
    rating: 4.8,
    totalRatings: 200,
    isFeatured: false,
  },
]

export const EstablishmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [establishments, setEstablishments] = useState<Establishment[]>(testEstablishments)
  const [generatedVouchers, setGeneratedVouchers] = useState<GeneratedVoucher[]>([])

  // Check for expired vouchers every minute
  React.useEffect(() => {
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

  const addEstablishment = useCallback((establishment: Omit<Establishment, "id">) => {
    setEstablishments((prev) => [
      ...prev,
      {
        ...establishment,
        id: Date.now().toString(),
        lastVoucherGenerated: {},
        totalRatings: 0,
        isFeatured: false,
      },
    ])
  }, [])

  const updateEstablishment = useCallback((id: string, updatedFields: Partial<Establishment>) => {
    setEstablishments((prev) => prev.map((est) => (est.id === id ? { ...est, ...updatedFields } : est)))
  }, [])

  const generateVoucher = useCallback(
    (establishmentId: string, userId: string): string | null => {
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

  const toggleFeatured = useCallback((id: string) => {
    setEstablishments((prev) => prev.map((est) => (est.id === id ? { ...est, isFeatured: !est.isFeatured } : est)))
  }, [])

  return (
    <EstablishmentContext.Provider
      value={{
        establishments,
        generatedVouchers,
        addEstablishment,
        updateEstablishment,
        generateVoucher,
        canGenerateVoucher,
        getNextVoucherTime,
        getUserVouchers,
        toggleFeatured, // Add this new function to the context
      }}
    >
      {children}
    </EstablishmentContext.Provider>
  )
}

