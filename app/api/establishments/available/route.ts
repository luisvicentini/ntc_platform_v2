import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where } from "firebase/firestore"
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

    // Apenas master pode listar estabelecimentos disponíveis
    if (session.userType !== "master") {
      return NextResponse.json(
        { error: "Acesso não autorizado" },
        { status: 403 }
      )
    }

    // Buscar todos os estabelecimentos ativos
    const establishmentsRef = collection(db, "establishments")
    const establishmentsQuery = query(
      establishmentsRef, 
      where("status", "!=", "inactive")
    )
    const establishmentsSnapshot = await getDocs(establishmentsQuery)

    const availableEstablishments = establishmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      address: doc.data().address,
      // Adicione outros campos necessários aqui
    }))

    return NextResponse.json(availableEstablishments)

  } catch (error) {
    console.error("Erro ao listar estabelecimentos disponíveis:", error)
    return NextResponse.json(
      { error: "Erro ao listar estabelecimentos disponíveis" },
      { status: 500 }
    )
  }
}
