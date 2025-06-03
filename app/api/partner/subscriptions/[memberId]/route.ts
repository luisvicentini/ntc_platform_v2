import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where } from "firebase/firestore"
import { jwtDecode } from "jwt-decode"
import type { SessionToken } from "@/types/session"

export async function GET(
  request: Request,
  { params }: { params: { memberId: string } }
) {
  try {
    const sessionToken = request.headers.get("x-session-token")
    if (!sessionToken) {
      return NextResponse.json(
        { error: "Sessão inválida" },
        { status: 403 }
      )
    }

    const session = jwtDecode<SessionToken>(sessionToken)
    if (session.userType !== "partner") {
      return NextResponse.json(
        { error: "Acesso não autorizado" },
        { status: 403 }
      )
    }

    // Primeiro buscar o documento do usuário parceiro
    const usersRef = collection(db, "users")
    const partnerQuery = query(usersRef, where("firebaseUid", "==", session.uid))
    const partnerSnapshot = await getDocs(partnerQuery)
    
    if (partnerSnapshot.empty) {
      return NextResponse.json(
        { error: "Parceiro não encontrado" },
        { status: 404 }
      )
    }

    const partnerId = partnerSnapshot.docs[0].id

    // Buscar assinaturas usando o ID do documento do parceiro
    const subscriptionsRef = collection(db, "subscriptions")
    const subscriptionsQuery = query(
      subscriptionsRef,
      where("memberId", "==", params.memberId),
      where("partnerId", "==", partnerId)
    )

    const subscriptionsSnapshot = await getDocs(subscriptionsQuery)
    
    if (subscriptionsSnapshot.empty) {
      return NextResponse.json(
        { error: "Assinatura não encontrada" },
        { status: 404 }
      )
    }

    // Ordenar as assinaturas por data de criação (mais recente primeiro)
    const subscriptions = subscriptionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    // Pegar a assinatura mais recente
    const subscription = subscriptions[0]

    return NextResponse.json({ subscription })

  } catch (error) {
    console.error("Erro ao buscar assinatura:", error)
    return NextResponse.json(
      { error: "Erro ao buscar assinatura" },
      { status: 500 }
    )
  }
} 