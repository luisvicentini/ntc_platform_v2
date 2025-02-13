export interface Address {
  cep: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
}

export interface Phone {
  phone: string
  ddi: string
}

export interface EstablishmentType {
  type: string
  category: string
}

export interface Establishment {
  id: string
  partnerId: string
  name: string
  description: string
  phone: Phone
  openingHours: string
  voucherDescription: string
  discountValue: string
  discountRules: string
  usageLimit: string
  voucherAvailability: "unlimited" | "limited"
  voucherQuantity: number
  voucherCooldown: number
  voucherExpiration: number
  lastVoucherGenerated?: { [userId: string]: number }
  images: string[]
  type: EstablishmentType
  address: Address
  rating: number
  totalRatings: number
  isFeatured: boolean
  status: "active" | "inactive"
  createdAt: string
  updatedAt: string
}

export interface GeneratedVoucher {
  code: string
  establishmentId: string
  userId: string
  generatedAt: number
  expiresAt: number
  status: "pending" | "expired"
}
