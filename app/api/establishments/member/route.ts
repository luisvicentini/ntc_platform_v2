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

    if (session.userType !== "member") {
      return NextResponse.json(
        { error: "Acesso não autorizado" },
        { status: 403 }
      )
    }

    // Buscar assinaturas ativas do Assinante
    const subscriptionsRef = collection(db, "subscriptions")
    const subscriptionsQuery = query(
      subscriptionsRef,
      where("memberId", "==", session.uid),
      where("status", "==", "active")
    )
    const subscriptionsSnapshot = await getDocs(subscriptionsQuery)

    // Se não houver assinaturas, retornar array vazio
    if (subscriptionsSnapshot.empty) {
      return NextResponse.json([])
    }

    // Obter IDs dos parceiros das assinaturas ativas
    const partnerIds = subscriptionsSnapshot.docs.map(doc => doc.data().partnerId)

    // Buscar estabelecimentos dos parceiros
    const establishmentsRef = collection(db, "establishments")
    const establishmentsQuery = query(
      establishmentsRef,
      where("partnerId", "in", partnerIds),
      where("status", "==", "active")
    )
    const establishmentsSnapshot = await getDocs(establishmentsQuery)

    const establishments = establishmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    return NextResponse.json(establishments)

  } catch (error) {
    console.error("Erro ao buscar estabelecimentos:", error)
    return NextResponse.json(
      { error: "Erro ao buscar estabelecimentos" },
      { status: 500 }
    )
  }
}
