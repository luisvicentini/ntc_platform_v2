export interface StripeSubscription {
  id: string
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid'
  currentPeriodEnd: number
  currentPeriodStart: number
  cancelAtPeriodEnd: boolean
  partnerId?: string
  priceId: string
  customerId: string
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
} 