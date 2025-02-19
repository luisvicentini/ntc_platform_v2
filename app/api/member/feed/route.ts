import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, getDoc, doc } from "firebase/firestore"
import { jwtDecode } from "jwt-decode"
import type { SessionToken } from "@/types/session"

export async function GET(request: Request) {
  try {
    const sessionToken = request.headers.get("x-session-token")
    if (!sessionToken) {
      return NextResponse.json({ error: "Sessão inválida" }, { status: 403 })
    }

    const session = jwtDecode<SessionToken>(sessionToken)
    console.log("[Member Feed] Session:", session)

    if (session.userType !== "member") {
      return NextResponse.json(
        { error: "Apenas membros podem acessar o feed" },
        { status: 403 }
      )
    }

    // 1. Verificar os dados do banco
    console.log("[Member Feed] Verificando dados do banco...")
    
    // 1.1 Verificar assinaturas
    const subscriptionsRef = collection(db, "subscriptions")
    const subscriptionsQuery = query(
      subscriptionsRef,
      where("memberId", "==", session.uid)
    )
    const subscriptionsSnapshot = await getDocs(subscriptionsQuery)
    
    console.log("[Member Feed] Assinaturas encontradas:", subscriptionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })))

    if (subscriptionsSnapshot.empty) {
      return NextResponse.json({ 
        establishments: [],
        total: 0
      })
    }

    // 1.2 Verificar partners
    const partnerIds = subscriptionsSnapshot.docs.map(doc => doc.data().partnerId)
    const partners = []
    
    for (const partnerId of partnerIds) {
      const partnerDoc = await getDoc(doc(db, "users", partnerId))
      if (partnerDoc.exists()) {
        partners.push({
          id: partnerDoc.id,
          ...partnerDoc.data()
        })
      }
    }
    
    console.log("[Member Feed] Partners encontrados:", partners)

    // 1.3 Verificar estabelecimentos
    const establishments = []
    for (const partnerId of partnerIds) {
      const establishmentsRef = collection(db, "establishments")
      const establishmentsQuery = query(
        establishmentsRef,
        where("partner", "==", partnerId) // Alterado de partnerId para partner
      )
      
      const establishmentsSnapshot = await getDocs(establishmentsQuery)
      console.log(`[Member Feed] Estabelecimentos do partner ${partnerId}:`, establishmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })))
      
      establishments.push(...establishmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })))
    }

    console.log("[Member Feed] Total de estabelecimentos:", establishments)

    return NextResponse.json({
      establishments,
      total: establishments.length,
      debug: {
        memberId: session.uid,
        subscriptions: subscriptionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })),
        partners,
        establishments
      }
    })

  } catch (error) {
    console.error("[Member Feed] Error:", error)
    return NextResponse.json(
      { error: "Erro ao buscar feed" },
      { status: 500 }
    )
  }
}