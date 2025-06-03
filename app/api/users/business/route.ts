import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where } from "firebase/firestore"
import { jwtDecode } from "jwt-decode"
import type { SessionToken } from "@/types/session"
import type { BusinessUser } from "@/types/user"

export async function GET(request: Request) {
  try {
    const sessionToken = request.headers.get("x-session-token")
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: "Sessão inválida" },
        { status: 403 }
      )
    }

    // Decodificar o token
    const session = jwtDecode<SessionToken>(sessionToken)

    // Apenas master pode listar usuários business
    if (session.userType !== "master") {
      return NextResponse.json(
        { error: "Acesso não autorizado" },
        { status: 403 }
      )
    }

    // Buscar todos os usuários business
    const usersRef = collection(db, "users")
    const businessQuery = query(usersRef, where("userType", "==", "business"))
    const businessSnapshot = await getDocs(businessQuery)

    // Filtrar apenas os não vinculados
    const users = businessSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }) as BusinessUser)
      .filter(user => !user.establishmentId)

    return NextResponse.json(users)

  } catch (error) {
    console.error("Erro ao listar usuários business:", error)
    return NextResponse.json(
      { error: "Erro ao listar usuários business" },
      { status: 500 }
    )
  }
}
