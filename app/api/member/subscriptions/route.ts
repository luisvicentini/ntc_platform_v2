import { db } from '@/lib/firebase'
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { memberId, subscriptions } = await req.json()

    // Verificar se já existe vínculo ativo com o parceiro
    const memberPartnersRef = collection(db, 'memberPartners')
    const existingSubscriptions = []

    for (const sub of subscriptions) {
      const q = query(
        memberPartnersRef,
        where('memberId', '==', memberId),
        where('partnerId', '==', sub.partnerId),
        where('status', '==', 'active')
      )
      const snapshot = await getDocs(q)
      if (!snapshot.empty) {
        existingSubscriptions.push(sub.partnerId)
      }
    }

    if (existingSubscriptions.length > 0) {
      return NextResponse.json(
        { error: 'Já existe vínculo ativo com um ou mais parceiros' },
        { status: 400 }
      )
    }

    // Criar novos vínculos
    const newSubscriptions = []
    for (const sub of subscriptions) {
      const subscriptionData = {
        memberId,
        partnerId: sub.partnerId,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expiresAt: sub.expiresAt || null,
        stripeSubscriptionId: sub.stripeSubscriptionId || null // Adicionar ID da assinatura do Stripe
      }

      const docRef = await addDoc(memberPartnersRef, subscriptionData)
      newSubscriptions.push({ id: docRef.id, ...subscriptionData })
    }

    return NextResponse.json({ subscriptions: newSubscriptions })
  } catch (error) {
    console.error('Erro ao adicionar assinaturas:', error)
    return NextResponse.json(
      { error: 'Erro ao processar assinaturas' },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const memberId = searchParams.get('memberId')

    if (!memberId) {
      return NextResponse.json(
        { error: 'ID do membro não fornecido' },
        { status: 400 }
      )
    }

    console.log('Buscando assinaturas para memberId:', memberId) // Debug

    // Buscar tanto na coleção memberPartners quanto na subscriptions
    const memberPartnersRef = collection(db, 'memberPartners')
    const subscriptionsRef = collection(db, 'subscriptions')

    // Buscar em memberPartners
    const mpQuery = query(
      memberPartnersRef,
      where('memberId', '==', memberId),
      where('status', '==', 'active')
    )
    
    const mpSnapshot = await getDocs(mpQuery)
    const memberPartners = mpSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    console.log('Vínculos encontrados em memberPartners:', memberPartners) // Debug

    // Buscar em subscriptions
    const subQuery = query(
      subscriptionsRef,
      where('memberId', '==', memberId),
      where('status', '==', 'active')
    )
    
    const subSnapshot = await getDocs(subQuery)
    const subscriptions = subSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    console.log('Assinaturas encontradas em subscriptions:', subscriptions) // Debug

    // Combinar os resultados, removendo duplicatas por partnerId
    const allSubscriptions = [...memberPartners, ...subscriptions]
    const uniqueSubscriptions = Array.from(
      new Map(allSubscriptions.map(item => [item.partnerId, item])).values()
    )

    console.log('Assinaturas únicas combinadas:', uniqueSubscriptions) // Debug

    return NextResponse.json({ subscriptions: uniqueSubscriptions })
  } catch (error) {
    console.error('Erro ao buscar assinaturas:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar assinaturas' },
      { status: 500 }
    )
  }
} 