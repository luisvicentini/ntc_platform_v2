import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where } from "firebase/firestore"
import { jwtDecode } from "jwt-decode"
import type { SessionToken } from "@/types/session"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Apenas usuários master e o próprio parceiro podem ver seus membros
    if (session.userType !== "master" && session.uid !== params.id) {
      return NextResponse.json(
        { error: "Acesso não autorizado" },
        { status: 403 }
      )
    }

    // Buscar assinaturas ativas do parceiro
    const subscriptionsRef = collection(db, "subscriptions")
    const subscriptionsQuery = query(
      subscriptionsRef,
      where("partnerId", "==", params.id),
      where("status", "==", "active")
    )
    const subscriptionsSnapshot = await getDocs(subscriptionsQuery)

    // Se não houver assinaturas, retornar array vazio
    if (subscriptionsSnapshot.empty) {
      return NextResponse.json([])
    }

    // Buscar dados dos membros
    const memberIds = subscriptionsSnapshot.docs.map(doc => doc.data().memberId)
    const usersRef = collection(db, "users")
    const membersQuery = query(usersRef, where("__name__", "in", memberIds))
    const membersSnapshot = await getDocs(membersQuery)

    // Mapear dados dos membros com suas assinaturas
    const members = membersSnapshot.docs.map(doc => {
      const memberData = doc.data()
      const subscription = subscriptionsSnapshot.docs.find(s => s.data().memberId === doc.id)
      const subscriptionData = subscription?.data()

      return {
        id: doc.id,
        displayName: memberData.displayName,
        email: memberData.email,
        photoURL: memberData.photoURL,
        status: memberData.status,
        expiresAt: subscriptionData?.expiresAt,
        createdAt: memberData.createdAt,
        updatedAt: memberData.updatedAt
      }
    })

    return NextResponse.json(members)

  } catch (error) {
    console.error("Erro ao buscar membros:", error)
    return NextResponse.json(
      { error: "Erro ao buscar membros" },
      { status: 500 }
    )
  }
}
