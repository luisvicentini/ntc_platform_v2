import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where, getDoc, doc } from "firebase/firestore"
import { jwtDecode } from "jwt-decode"
import type { SessionToken } from "@/types/session"

export async function GET(
  request: Request,
  { params }: { params: { partnerId: string } }
) {
  try {
    const sessionToken = request.headers.get("x-session-token")
    if (!sessionToken) {
      return NextResponse.json({ error: "Sessão inválida" }, { status: 403 })
    }

    const session = jwtDecode<SessionToken>(sessionToken)
    console.log("[Partner Members] Session:", session)

    if (session.userType !== "partner") {
      return NextResponse.json(
        { error: "Acesso não autorizado" },
        { status: 403 }
      )
    }

    // 1. Verificar dados do banco
    console.log("[Partner Members] Verificando dados do banco...")
    
    // 1.1 Verificar assinaturas
    const subscriptionsRef = collection(db, "subscriptions")
    const subscriptionsQuery = query(
      subscriptionsRef,
      where("partner", "==", session.uid) // Alterado de partnerId para partner
    )
    
    const subscriptionsSnapshot = await getDocs(subscriptionsQuery)
    console.log("[Partner Members] Assinaturas encontradas:", subscriptionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })))

    if (subscriptionsSnapshot.empty) {
      return NextResponse.json({ members: [], total: 0 })
    }

    // 1.2 Buscar membros
    const memberIds = [...new Set(subscriptionsSnapshot.docs.map(doc => doc.data().memberId))]
    const members = []

    for (const memberId of memberIds) {
      const memberDoc = await getDoc(doc(db, "users", memberId))
      if (memberDoc.exists()) {
        members.push({
          id: memberDoc.id,
          ...memberDoc.data()
        })
      }
    }

    console.log("[Partner Members] Membros encontrados:", members)

    return NextResponse.json({
      members,
      total: members.length,
      debug: {
        partnerId: session.uid,
        subscriptions: subscriptionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })),
        members
      }
    })

  } catch (error) {
    console.error("[Partner Members] Error:", error)
    return NextResponse.json(
      { error: "Erro ao buscar membros" },
      { status: 500 }
    )
  }
} 