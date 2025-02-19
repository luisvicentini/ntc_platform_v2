import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, addDoc, getDocs, query, where, updateDoc, doc } from "firebase/firestore"
import { jwtDecode } from "jwt-decode"
import type { SessionToken } from "@/types/session"

export async function POST(request: Request) {
  try {
    const sessionToken = request.headers.get("x-session-token")
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: "Sessão inválida" },
        { status: 403 }
      )
    }

    const session = jwtDecode<SessionToken>(sessionToken)
    const { memberId, subscriptions } = await request.json()

    if (!memberId || !subscriptions || !Array.isArray(subscriptions)) {
      return NextResponse.json(
        { error: "Dados inválidos" },
        { status: 400 }
      )
    }

    // Criar as assinaturas
    const subscriptionsRef = collection(db, "subscriptions")
    const createdSubscriptions = []

    for (const sub of subscriptions) {
      const subscriptionData = {
        memberId,
        partnerId: sub.partnerId,
        status: 'active',
        expiresAt: sub.expiresAt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const docRef = await addDoc(subscriptionsRef, subscriptionData)
      createdSubscriptions.push({
        id: docRef.id,
        ...subscriptionData
      })
    }

    return NextResponse.json(createdSubscriptions)
  } catch (error) {
    console.error('Erro na rota de assinaturas:', error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const sessionToken = request.headers.get("x-session-token")
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: "Sessão inválida" },
        { status: 403 }
      )
    }

    const session = jwtDecode<SessionToken>(sessionToken)
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('memberId')
    const partnerId = searchParams.get('partnerId')

    const subscriptionsRef = collection(db, "subscriptions")
    let subscriptionsQuery = query(subscriptionsRef)

    if (memberId) {
      subscriptionsQuery = query(subscriptionsRef, where("memberId", "==", memberId))
    }
    if (partnerId) {
      subscriptionsQuery = query(subscriptionsRef, where("partnerId", "==", partnerId))
    }

    const snapshot = await getDocs(subscriptionsQuery)
    
    // Buscar dados dos parceiros
    const partnerIds = snapshot.docs.map(doc => doc.data().partnerId)
    const usersRef = collection(db, "users")
    const partnersQuery = query(usersRef, where("__name__", "in", partnerIds))
    const partnersSnapshot = await getDocs(partnersQuery)

    // Criar mapa de parceiros para fácil acesso
    const partnersMap = new Map()
    partnersSnapshot.docs.forEach(doc => {
      partnersMap.set(doc.id, {
        id: doc.id,
        displayName: doc.data().displayName,
        email: doc.data().email
      })
    })

    // Combinar dados das assinaturas com dados dos parceiros
    const subscriptions = snapshot.docs.map(doc => {
      const subscriptionData = doc.data()
      const partner = partnersMap.get(subscriptionData.partnerId)
      
      return {
        id: doc.id,
        memberId: subscriptionData.memberId,
        partnerId: subscriptionData.partnerId,
        status: subscriptionData.status,
        expiresAt: subscriptionData.expiresAt,
        createdAt: subscriptionData.createdAt,
        updatedAt: subscriptionData.updatedAt,
        partner: partner // Incluindo dados do parceiro
      }
    })

    return NextResponse.json(subscriptions)
  } catch (error) {
    console.error('Erro na rota de assinaturas:', error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const sessionToken = request.headers.get("x-session-token")
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: "Sessão inválida" },
        { status: 403 }
      )
    }

    const session = jwtDecode<SessionToken>(sessionToken)
    const { id } = await request.json()

    const subscriptionRef = doc(db, "subscriptions", id)
    await updateDoc(subscriptionRef, {
      status: "inactive",
      updatedAt: new Date().toISOString()
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao atualizar assinatura:', error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
