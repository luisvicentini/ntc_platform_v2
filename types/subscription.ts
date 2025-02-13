export interface Subscription {
  id: string
  memberId: string
  partnerId: string
  status: "active" | "inactive"
  createdAt: string
  updatedAt: string
}
