import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/firebase'
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore'

export async function POST(req: Request) {
  try {
    const { subscriptionId } = await req.json()
    console.log('🔄 Sincronizando assinatura:', subscriptionId)

    // Buscar dados do Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const customer = await stripe.customers.retrieve(subscription.customer as string)

    console.log('📄 Dados recuperados:', {
      subscription: subscription.id,
      customer: customer.id,
      metadata: {
        userId: customer.metadata.userId,
        partnerId: subscription.metadata.partnerId
      }
    })

    // Verificar se já existe
    const subscriptionsRef = collection(db, 'subscriptions')
    const q = query(
      subscriptionsRef,
      where('stripeSubscriptionId', '==', subscription.id)
    )
    const existingDocs = await getDocs(q)

    if (!existingDocs.empty) {
      console.log('⚠️ Assinatura já existe:', subscription.id)
      return NextResponse.json({ 
        status: 'exists',
        message: 'Assinatura já existe no banco de dados'
      })
    }

    // Criar assinatura
    const subscriptionData = {
      memberId: customer.metadata.userId,
      partnerId: subscription.metadata.partnerId,
      stripeSubscriptionId: subscription.id,
      status: subscription.status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      type: 'stripe',
      partnerLinkId: subscription.metadata.partnerLinkId || null,
      priceId: subscription.items.data[0].price.id,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString()
    }

    const docRef = await addDoc(subscriptionsRef, subscriptionData)
    console.log('✅ Assinatura criada:', docRef.id)

    // Criar vínculo membro-parceiro
    const memberPartnersRef = collection(db, 'memberPartners')
    const memberPartnerData = {
      memberId: customer.metadata.userId,
      partnerId: subscription.metadata.partnerId,
      status: 'active',
      stripeSubscriptionId: subscription.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      partnerLinkId: subscription.metadata.partnerLinkId || null
    }

    const mpDoc = await addDoc(memberPartnersRef, memberPartnerData)
    console.log('✅ Vínculo membro-parceiro criado:', mpDoc.id)

    return NextResponse.json({ 
      status: 'success',
      subscriptionId: docRef.id,
      memberPartnerId: mpDoc.id
    })

  } catch (error) {
    console.error('❌ Erro na sincronização:', error)
    return NextResponse.json(
      { 
        status: 'error',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
} 