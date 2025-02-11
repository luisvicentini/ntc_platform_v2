export interface Establishment {
  id: string
  name: string
  description: string
  address: string
  photoURL?: string
  partnerId: string
  createdAt: string
  updatedAt: string
  averageRating?: number
  totalRatings?: number
}

export interface CreateEstablishmentData {
  name: string
  description: string
  address: string
  photoURL?: string
}

export interface UpdateEstablishmentData {
  name?: string
  description?: string
  address?: string
  photoURL?: string
}

export interface EstablishmentRating {
  id: string
  userId: string
  establishmentId: string
  score: number
  comment?: string
  createdAt: string
  updatedAt: string
  userDisplayName?: string
  userPhotoURL?: string
}
