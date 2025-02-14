import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore"
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

    // Apenas membros podem acessar esta rota
    if (session.userType !== "member") {
      return NextResponse.json(
        { error: "Acesso não autorizado" },
        { status: 403 }
      )
    }

    // Buscar o usuário para obter os partners vinculados
    const userDoc = await getDoc(doc(db, "users", session.uid))
    if (!userDoc.exists()) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    const userData = userDoc.data()
    const partnerIds = Array.isArray(userData.partnerIds) ? userData.partnerIds : [userData.partnerId].filter(Boolean)

    if (partnerIds.length === 0) {
      return NextResponse.json([])
    }

    // Buscar estabelecimentos dos partners vinculados
    const establishmentsRef = collection(db, "establishments")
    const establishmentsSnapshot = await getDocs(query(establishmentsRef, where("partnerId", "in", partnerIds)))

    const establishments = establishmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    return NextResponse.json(establishments)

  } catch (error) {
    console.error("Erro ao listar estabelecimentos do membro:", error)
    return NextResponse.json(
      { error: "Erro ao listar estabelecimentos" },
      { status: 500 }
    )
  }
}
