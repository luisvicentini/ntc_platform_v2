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

    // Buscar estabelecimentos que não estão vinculados a nenhum usuário
    const usersRef = collection(db, "users")
    const usersQuery = query(usersRef, where("userType", "==", "business"))
    const usersSnapshot = await getDocs(usersQuery)

    // Pegar IDs dos estabelecimentos já vinculados
    const linkedEstablishmentIds = usersSnapshot.docs
      .map(doc => doc.data().establishmentId)
      .filter(Boolean)

    // Buscar todos os estabelecimentos
    const establishmentsRef = collection(db, "establishments")
    const establishmentsSnapshot = await getDocs(establishmentsRef)

    // Filtrar apenas os estabelecimentos não vinculados
    const availableEstablishments = establishmentsSnapshot.docs
      .filter(doc => !linkedEstablishmentIds.includes(doc.id))
      .map(doc => ({
        id: doc.id,
        ...doc.data()
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
