export interface PartnerSalesLink {
  id: string
  partnerId: string
  code: string // código único para o link
  name: string // nome identificador do link
  priceId: string // ID do preço no Stripe
  createdAt: string
  updatedAt: string
  clicks: number
  conversions: number
}

export interface PartnerSubscriptionStats {
  totalSubscriptions: number
  activeSubscriptions: number
  revenue: number
  lastSubscriptionDate: string
} 