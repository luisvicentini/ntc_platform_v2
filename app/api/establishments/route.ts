import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, addDoc, getDocs, query, where } from "firebase/firestore"
import { jwtDecode } from "jwt-decode"

import type { SessionToken } from "@/types/session"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    // Obter o token da sessão do header
    const sessionToken = request.headers.get("x-session-token")
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: "Sessão inválida" },
        { status: 403 }
      )
    }

    // Decodificar o token
    const session = jwtDecode<SessionToken>(sessionToken)

    if (session.userType !== "partner") {
      return NextResponse.json(
        { error: "Apenas parceiros podem criar estabelecimentos" },
        { status: 403 }
      )
    }

    const partnerId = session.uid

    // Criar estabelecimento
    const establishmentData = {
      ...body,
      partnerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rating: 0,
      totalRatings: 0,
      isFeatured: false,
      status: "active"
    }

    const docRef = await addDoc(collection(db, "establishments"), establishmentData)

    return NextResponse.json({
      id: docRef.id,
      ...establishmentData
    })

  } catch (error) {
    console.error("Erro ao criar estabelecimento:", error)
    return NextResponse.json(
      { error: "Erro ao criar estabelecimento" },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const partnerId = searchParams.get("partnerId")
    const memberId = searchParams.get("memberId")

    let establishmentsQuery

    if (partnerId) {
      // Buscar estabelecimentos de um parceiro específico
      establishmentsQuery = query(
        collection(db, "establishments"), 
        where("partnerId", "==", partnerId)
      )
    } else if (memberId) {
      // Buscar estabelecimentos dos parceiros que o membro é assinante
      const subscriptionsRef = collection(db, "subscriptions")
      const subscriptionsQuery = query(subscriptionsRef, where("memberId", "==", memberId))
      const subscriptionsSnapshot = await getDocs(subscriptionsQuery)
      
      const partnerIds = subscriptionsSnapshot.docs.map(doc => doc.data().partnerId)
      
      if (partnerIds.length === 0) {
        return NextResponse.json([])
      }

      establishmentsQuery = query(
        collection(db, "establishments"), 
        where("partnerId", "in", partnerIds)
      )
    } else {
      // Buscar todos os estabelecimentos
      establishmentsQuery = collection(db, "establishments")
    }

    const querySnapshot = await getDocs(establishmentsQuery)
    const establishments = querySnapshot.docs.map(doc => ({
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
