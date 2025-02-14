export interface Voucher {
  id: string
  code: string
  memberId: string
  establishmentId: string
  status: "pending" | "used" | "expired"
  generatedAt: string
  expiresAt: string
  usedAt?: string
  createdAt: string
  updatedAt: string
}
