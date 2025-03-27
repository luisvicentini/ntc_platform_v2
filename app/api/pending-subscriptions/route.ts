import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, addDoc, query, where, getDocs, doc, getDoc } from "firebase/firestore"

// Interface para as assinaturas pendentes
interface PendingSubscriptionData {
  userId?: string
  userEmail?: string
  partnerId: string
  partnerLinkId?: string
  token?: string
  expiresAt: string
  createdAt: string
}

export async function POST(request: Request) {
  try {
    // Extrair dados do corpo da requisição
    const data: PendingSubscriptionData = await request.json()
    
    // Validar dados obrigatórios
    if ((!data.userId && !data.userEmail) || !data.partnerId) {
      return NextResponse.json(
        { error: "Dados insuficientes para criar assinatura pendente" },
        { status: 400 }
      )
    }
    
    if (!data.expiresAt) {
      // Padrão: 1 hora a partir de agora
      data.expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    }
    
    if (!data.createdAt) {
      data.createdAt = new Date().toISOString()
    }
    
    console.log("Salvando assinatura pendente:", data)
    
    // Salvar no Firestore
    const pendingSubscriptionsRef = collection(db, "pending_subscriptions")
    const docRef = await addDoc(pendingSubscriptionsRef, data)
    
    console.log(`Assinatura pendente salva com ID: ${docRef.id}`)
    
    return NextResponse.json({
      success: true,
      id: docRef.id,
      message: "Assinatura pendente criada com sucesso"
    })
  } catch (error) {
    console.error("Erro ao criar assinatura pendente:", error)
    return NextResponse.json(
      { error: "Erro interno ao criar assinatura pendente" },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const userEmail = searchParams.get("userEmail")
    
    if (!userId && !userEmail) {
      return NextResponse.json(
        { error: "É necessário fornecer userId ou userEmail" },
        { status: 400 }
      )
    }
    
    // Buscar assinaturas pendentes
    const pendingSubscriptionsRef = collection(db, "pending_subscriptions")
    let q;
    
    if (userId) {
      q = query(
        pendingSubscriptionsRef,
        where("userId", "==", userId),
        where("expiresAt", ">", new Date().toISOString())
      )
    } else {
      q = query(
        pendingSubscriptionsRef,
        where("userEmail", "==", userEmail),
        where("expiresAt", ">", new Date().toISOString())
      )
    }
    
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      return NextResponse.json({ pendingSubscriptions: [] })
    }
    
    // Transformar dados
    const pendingSubscriptions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    return NextResponse.json({ pendingSubscriptions })
  } catch (error) {
    console.error("Erro ao buscar assinaturas pendentes:", error)
    return NextResponse.json(
      { error: "Erro interno ao buscar assinaturas pendentes" },
      { status: 500 }
    )
  }
} 