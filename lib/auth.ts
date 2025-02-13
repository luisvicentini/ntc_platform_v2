import { headers } from "next/headers"
import { jwtDecode } from "jwt-decode"

interface SessionToken {
  uid: string
  userType: string
  email: string
  exp: number
}

export function getSessionUser() {
  const headersList = headers()
  const sessionToken = headersList.get("x-session-token")

  if (!sessionToken) {
    return null
  }

  try {
    const decoded = jwtDecode<SessionToken>(sessionToken)
    
    // Verificar se o token expirou
    if (decoded.exp * 1000 < Date.now()) {
      return null
    }

    return {
      uid: decoded.uid,
      userType: decoded.userType,
      email: decoded.email
    }
  } catch (error) {
    console.error("Erro ao decodificar token:", error)
    return null
  }
}
