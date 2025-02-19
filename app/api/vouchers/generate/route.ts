import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, addDoc, getDocs, query, where, Timestamp } from "firebase/firestore"
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

    // Decodificar o token
    const session = jwtDecode<SessionToken>(sessionToken)

    // Apenas membros podem gerar vouchers
    if (session.userType !== "member") {
      return NextResponse.json(
        { error: "Apenas membros podem gerar vouchers" },
        { status: 403 }
      )
    }

    const { establishmentId } = await request.json()

    // Verificar se o estabelecimento existe
    const establishmentsRef = collection(db, "establishments")
    const establishmentDoc = await getDocs(query(establishmentsRef, where("__name__", "==", establishmentId)))

    if (establishmentDoc.empty) {
      return NextResponse.json(
        { error: "Estabelecimento não encontrado" },
        { status: 404 }
      )
    }

    const establishmentData = establishmentDoc.docs[0].data()

    // Verificar se o membro tem assinatura ativa com o parceiro
    const subscriptionsRef = collection(db, "subscriptions")
    const now = Timestamp.now()
    
    const subscriptionQuery = query(
      subscriptionsRef,
      where("memberId", "==", session.uid),
      where("partnerId", "==", establishmentData.partnerId),
      where("status", "==", "active")
    )
    
    const subscriptionDoc = await getDocs(subscriptionQuery)

    // Se não encontrar assinatura ativa, tentar buscar por data de expiração
    if (subscriptionDoc.empty) {
      const allSubscriptionsQuery = query(
        subscriptionsRef,
        where("memberId", "==", session.uid),
        where("partnerId", "==", establishmentData.partnerId)
      )
      
      const allSubscriptions = await getDocs(allSubscriptionsQuery)
      
      const activeSubscription = allSubscriptions.docs.find(doc => {
        const data = doc.data()
        const expiresAt = data.expiresAt?.toDate()
        return expiresAt && expiresAt > new Date()
      })

      if (!activeSubscription) {
        return NextResponse.json(
          { error: "Você não tem uma assinatura ativa com este parceiro" },
          { status: 403 }
        )
      }
    }

    // Gerar código do voucher
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    // Salvar voucher com todas as relações necessárias
    const voucher = {
      code,
      memberId: session.uid,
      establishmentId,
      partnerId: establishmentData.partnerId,
      businessId: establishmentData.businessId,
      status: "pending",
      generatedAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(expiresAt),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }

    const docRef = await addDoc(collection(db, "vouchers"), voucher)

    return NextResponse.json({
      id: docRef.id,
      ...voucher,
      code
    })
  } catch (error) {
    console.error("Erro ao gerar voucher:", error)
    return NextResponse.json(
      { error: "Erro ao gerar voucher" },
      { status: 500 }
    )
  }
}
