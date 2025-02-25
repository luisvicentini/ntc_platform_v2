interface Member {
  id: string
  firebaseUid: string
  displayName: string
  email: string
  phone: string
  photoURL?: string
  subscription: {
    id?: string
    createdAt: string
    expiresAt: string
    status: string
  }
} 