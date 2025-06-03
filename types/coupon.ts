export type CouponStatus = 'active' | 'used' | 'expired'

export interface Coupon {
  id: string
  code: string
  discount: number
  establishmentId: string
  validUntil: string
  status: CouponStatus
  createdAt: string
  updatedAt: string
  description?: string
  maxUses?: number
  currentUses?: number
}

export interface CreateCouponData {
  code: string
  discount: number
  establishmentId: string
  validUntil: string
  description?: string
  maxUses?: number
}

export interface UpdateCouponData {
  status?: CouponStatus
  validUntil?: string
  description?: string
  maxUses?: number
}

export interface UsedCoupon {
  id: string
  couponId: string
  userId: string
  establishmentId: string
  usedAt: string
  discount: number
}
