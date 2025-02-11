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
}

export interface UpdateUserProfileData {
  displayName?: string
  photoURL?: string
  phoneNumber?: string
  bio?: string
}
