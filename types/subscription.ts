export interface Subscription {
  id: string
  memberId: string
  partnerId: string
  status: "active" | "inactive"
  expiresAt?: string
  createdAt: string
  updatedAt: string
}

export interface PartnerSubscription extends Subscription {
  partner: {
    id: string
    displayName: string
    email: string
  }
}
