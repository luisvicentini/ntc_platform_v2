import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, addDoc, getDocs, query, where } from "firebase/firestore"
import { jwtDecode } from "jwt-decode"
import type { SessionToken } from "@/types/session"

export async function POST(request: Request) {
  try {
    const { memberId, partnerId } = await request.json()
    const sessionToken = request.headers.get("x-session-token")
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: "Sessão inválida" },
        { status: 403 }
      )
    }

    // Decodificar o token
    const session = jwtDecode<SessionToken>(sessionToken)

    // Apenas usuários master podem criar assinaturas
    if (session.userType !== "master") {
      return NextResponse.json(
        { error: "Apenas administradores podem vincular Assinantes a parceiros" },
        { status: 403 }
      )
    }

    // Verificar se o Assinante existe
    const membersRef = collection(db, "users")
    const memberQuery = query(membersRef, where("uid", "==", memberId))
    const memberSnapshot = await getDocs(memberQuery)

    if (memberSnapshot.empty) {
      return NextResponse.json(
        { error: "Assinante não encontrado" },
        { status: 404 }
      )
    }

    const memberData = memberSnapshot.docs[0].data()
    if (memberData.userType !== "member") {
      return NextResponse.json(
        { error: "Usuário não é um Assinante" },
        { status: 400 }
      )
    }

    // Verificar se o parceiro existe
    const partnerQuery = query(membersRef, where("uid", "==", partnerId))
    const partnerSnapshot = await getDocs(partnerQuery)

    if (partnerSnapshot.empty) {
      return NextResponse.json(
        { error: "Parceiro não encontrado" },
        { status: 404 }
      )
    }

    const partnerData = partnerSnapshot.docs[0].data()
    if (partnerData.userType !== "partner") {
      return NextResponse.json(
        { error: "Usuário não é um parceiro" },
        { status: 400 }
      )
    }

    // Verificar se já existe uma assinatura ativa
    const subscriptionsRef = collection(db, "subscriptions")
    const existingQuery = query(
      subscriptionsRef,
      where("memberId", "==", memberId),
      where("partnerId", "==", partnerId),
      where("status", "==", "active")
    )
    const existingSnapshot = await getDocs(existingQuery)

    if (!existingSnapshot.empty) {
      return NextResponse.json(
        { error: "Assinante já está vinculado a este parceiro" },
        { status: 400 }
      )
    }

    // Criar assinatura
    const subscriptionData = {
      memberId,
      partnerId,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const docRef = await addDoc(collection(db, "subscriptions"), subscriptionData)

    return NextResponse.json({
      id: docRef.id,
      ...subscriptionData
    })

  } catch (error) {
    console.error("Erro ao criar assinatura:", error)
    return NextResponse.json(
      { error: "Erro ao criar assinatura" },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get("memberId")
    const partnerId = searchParams.get("partnerId")

    const subscriptionsRef = collection(db, "subscriptions")
    let subscriptionsQuery

    if (memberId) {
      subscriptionsQuery = query(
        subscriptionsRef,
        where("memberId", "==", memberId),
        where("status", "==", "active")
      )
    } else if (partnerId) {
      subscriptionsQuery = query(
        subscriptionsRef,
        where("partnerId", "==", partnerId),
        where("status", "==", "active")
      )
    } else {
      subscriptionsQuery = query(subscriptionsRef)
    }

    const querySnapshot = await getDocs(subscriptionsQuery)
    const subscriptions = []

    for (const doc of querySnapshot.docs) {
      const subscriptionData = doc.data()
      
      // Buscar dados do parceiro
      const partnersRef = collection(db, "users")
      const partnerQuery = query(partnersRef, where("__name__", "==", subscriptionData.partnerId))
      const partnerSnapshot = await getDocs(partnerQuery)
      
      if (!partnerSnapshot.empty) {
        const partnerData = partnerSnapshot.docs[0].data()
        subscriptions.push({
          id: doc.id,
          ...subscriptionData,
          partner: {
            id: subscriptionData.partnerId,
            displayName: partnerData.displayName,
            email: partnerData.email
          }
        })
      }
    }

    return NextResponse.json(subscriptions)

  } catch (error) {
    console.error("Erro ao buscar assinaturas:", error)
    return NextResponse.json(
      { error: "Erro ao buscar assinaturas" },
      { status: 500 }
    )
  }
}
