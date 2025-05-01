export interface Subscription {
  id: string
  memberId: string
  partnerId: string
  status: "active" | "inactive" | "ativa" | "iniciada" | "paid" | "trialing"
  expiresAt?: string
  createdAt: string
  updatedAt: string
  
  // Campos adicionais usados pelo sistema
  partnerName?: string
  partnerEmail?: string
  
  // Campos adicionais da Lastlink
  userId?: string
  userEmail?: string
  provider?: string
  type?: string
  planName?: string
  planInterval?: string
  planIntervalCount?: number
  price?: number
  startDate?: string
  endDate?: string
}

export interface PartnerSubscription extends Subscription {
  partner: {
    id: string
    displayName: string
    email: string
  }
}
