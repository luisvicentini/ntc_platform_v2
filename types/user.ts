export interface UserProfile {
  id: string
  displayName: string
  email: string
  photoURL?: string
  phoneNumber?: string
  bio?: string
  createdAt: string
  updatedAt: string
  userType: 'member' | 'business' | 'partner' | 'master'
  status: 'active' | 'inactive' | 'expired'
  establishmentIds?: string[] // Para usuários business
  establishmentId?: string // Último estabelecimento vinculado
  partnerId?: string // Para usuários member
}

export interface BusinessUser extends UserProfile {
  userType: 'business'
  establishmentIds: string[]
  establishmentId: string // Último estabelecimento vinculado
}

export interface MemberUser extends UserProfile {
  userType: 'member'
  partnerId?: string
}

export interface PartnerUser extends UserProfile {
  userType: 'partner'
}

export interface MasterUser extends UserProfile {
  userType: 'master'
}

export interface UpdateUserProfileData {
  displayName?: string
  photoURL?: string
  phoneNumber?: string
  bio?: string
  establishmentId?: string
  partnerId?: string
}

export interface UserListResponse {
  users: UserProfile[]
  total: number
  page: number
  perPage: number
  totalPages: number
}
