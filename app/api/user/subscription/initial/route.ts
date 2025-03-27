import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, addDoc, query, where, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore"

// Interface de assinatura inicial
interface InitialSubscriptionData {
  userId: string
  userEmail: string
  partnerId: string
  partnerLinkId?: string
  planName?: string
  price?: number
  interval?: string
  utmParams?: Record<string, string>
  status: string
}

export async function POST(request: Request) {
  try {
    // Extrair dados da requisição
    const data: InitialSubscriptionData = await request.json()
    
    // Validar dados obrigatórios
    if (!data.userId || !data.userEmail || !data.partnerId) {
      return NextResponse.json(
        { error: "Dados insuficientes para criar registro de assinatura" },
        { status: 400 }
      )
    }
    
    // Adicionar timestamp e formatação
    const subscriptionData = {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      provider: 'lastlink',
      source: 'checkout_preview',
      // Garantir que o status seja "iniciada" independente do que foi enviado
      status: 'iniciada'
    }
    
    console.log("Criando registro de assinatura inicial:", subscriptionData)
    
    // Verificar se já existe uma assinatura para este usuário e parceiro
    const subscriptionsRef = collection(db, 'subscriptions')
    const q = query(
      subscriptionsRef,
      where('userId', '==', data.userId),
      where('partnerId', '==', data.partnerId),
      where('status', '==', 'iniciada')
    )
    
    const existingSnapshot = await getDocs(q)
    
    // Se existir, atualize-a em vez de criar uma nova
    if (!existingSnapshot.empty) {
      const existingDoc = existingSnapshot.docs[0]
      await updateDoc(doc(db, 'subscriptions', existingDoc.id), {
        ...subscriptionData,
        updatedAt: new Date().toISOString(),
      })
      
      console.log(`Assinatura existente atualizada com ID: ${existingDoc.id}`)
      
      return NextResponse.json({
        success: true,
        id: existingDoc.id,
        message: "Assinatura inicial atualizada com sucesso"
      })
    }
    
    // Criar nova assinatura
    const docRef = await addDoc(subscriptionsRef, subscriptionData)
    console.log(`Nova assinatura inicial criada com ID: ${docRef.id}`)
    
    // Responder com sucesso
    return NextResponse.json({
      success: true,
      id: docRef.id,
      message: "Assinatura inicial criada com sucesso"
    })
  } catch (error) {
    console.error("Erro ao criar assinatura inicial:", error)
    return NextResponse.json(
      { error: "Erro interno ao processar solicitação" },
      { status: 500 }
    )
  }
}

// Endpoint para buscar assinaturas iniciadas
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const userEmail = searchParams.get('userEmail')
    
    if (!userId && !userEmail) {
      return NextResponse.json(
        { error: "É necessário fornecer userId ou userEmail" },
        { status: 400 }
      )
    }
    
    // Buscar assinaturas iniciadas
    const subscriptionsRef = collection(db, 'subscriptions')
    let q
    
    if (userId) {
      q = query(
        subscriptionsRef,
        where('userId', '==', userId),
        where('status', '==', 'iniciada')
      )
    } else {
      q = query(
        subscriptionsRef,
        where('userEmail', '==', userEmail),
        where('status', '==', 'iniciada')
      )
    }
    
    const snapshot = await getDocs(q)
    
    // Transformar dados para resposta
    const subscriptions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    return NextResponse.json({ subscriptions })
  } catch (error) {
    console.error("Erro ao buscar assinaturas iniciadas:", error)
    return NextResponse.json(
      { error: "Erro interno ao buscar assinaturas" },
      { status: 500 }
    )
  }
}

// Endpoint para limpar assinaturas antigas
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: "É necessário fornecer userId" },
        { status: 400 }
      )
    }
    
    // Buscar assinaturas antigas iniciadas (mais de 24h)
    const oneDayAgo = new Date()
    oneDayAgo.setHours(oneDayAgo.getHours() - 24)
    
    const subscriptionsRef = collection(db, 'subscriptions')
    const q = query(
      subscriptionsRef,
      where('userId', '==', userId),
      where('status', '==', 'iniciada')
    )
    
    const snapshot = await getDocs(q)
    
    // Deletar assinaturas antigas
    let deletedCount = 0
    for (const doc of snapshot.docs) {
      const data = doc.data()
      const createdAt = new Date(data.createdAt)
      
      if (createdAt < oneDayAgo) {
        await deleteDoc(doc.ref)
        deletedCount++
      }
    }
    
    return NextResponse.json({
      success: true,
      deletedCount,
      message: `${deletedCount} assinaturas antigas removidas`
    })
  } catch (error) {
    console.error("Erro ao limpar assinaturas antigas:", error)
    return NextResponse.json(
      { error: "Erro interno ao limpar assinaturas" },
      { status: 500 }
    )
  }
} 