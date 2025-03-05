import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { jwtDecode } from "jwt-decode"
import type { SessionToken } from "@/types/session"

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

    // Apenas master pode listar usuários
    if (session.userType !== "master") {
      return NextResponse.json(
        { error: "Acesso não autorizado" },
        { status: 403 }
      )
    }

    // Buscar todos os usuários ordenados por data de criação
    const usersRef = collection(db, "users")
    const q = query(usersRef, orderBy("createdAt", "desc"))
    const querySnapshot = await getDocs(q)
    
    const users = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // Retornar total de registros junto com os dados
    return NextResponse.json({
      users,
      total: querySnapshot.size
    })

  } catch (error) {
    console.error("Erro ao listar usuários:", error)
    return NextResponse.json(
      { error: "Erro ao listar usuários" },
      { status: 500 }
    )
  }
}
