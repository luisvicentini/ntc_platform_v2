export interface StripeSubscription {
  id: string
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid'
  currentPeriodEnd: number
  currentPeriodStart: number
  cancelAtPeriodEnd: boolean
  partnerId?: string
  priceId: string
  customerId: string
  // Propriedades opcionais para compatibilidade com Lastlink
  provider?: 'stripe' | 'lastlink'
  orderId?: string
  planName?: string
  amount?: number
  currency?: string
  interval?: string
  intervalCount?: number
  created?: number
  paymentMethod?: {
    brand: string
    last4: string
    expiryMonth: number
    expiryYear: number
  }
}

// Interface expandida para suportar os dois tipos de assinaturas
export interface ExtendedSubscription extends StripeSubscription {
  provider: 'stripe' | 'lastlink'
  orderId?: string
  planName: string
  amount: number
  currency: string
  interval: string
  intervalCount: number
  created: number
}

export interface StripePrice {
  id: string
  nickname: string
  unit_amount: number
  currency: string
  recurring: {
    interval: 'month' | 'year'
    interval_count: number
  }
}

export interface StripeTransaction {
  id: string
  amount: number
  currency: string
  status: string
  created: number
  description?: string
  provider?: 'stripe' | 'lastlink'
} 