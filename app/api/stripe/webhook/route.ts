import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/firebase'
import { collection, addDoc, getDocs, query, where, doc, updateDoc } from 'firebase/firestore'
import Stripe from 'stripe'

// Forçar modo desenvolvimento para testes locais
const isDevelopment = true // process.env.NODE_ENV === 'development'
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

const calculateExpirationDate = (subscription: any) => {
  const interval = subscription.items.data[0].price.recurring.interval
  const intervalCount = subscription.items.data[0].price.recurring.interval_count || 1
  let expiresAt = new Date()

  switch(interval) {
    case 'day':
      expiresAt.setDate(expiresAt.getDate() + intervalCount)
      break
    case 'week':
      expiresAt.setDate(expiresAt.getDate() + (intervalCount * 7))
      break
    case 'month':
      expiresAt.setMonth(expiresAt.getMonth() + intervalCount)
      break
    case 'year':
      expiresAt.setFullYear(expiresAt.getFullYear() + intervalCount)
      break
    default:
      // Fallback para current_period_end do Stripe
      expiresAt = new Date(subscription.current_period_end * 1000)
  }

  return expiresAt
}

export async function POST(req: Request) {
  console.log('------------------------')
  console.log('🎯 Webhook recebido')
  console.log('🔐 Secret:', endpointSecret?.substring(0, 10) + '...')
  console.log('🌍 NODE_ENV:', process.env.NODE_ENV)
  console.log('⚙️ isDevelopment:', isDevelopment)
  
  try {
    const body = await req.text()
    const signature = headers().get('stripe-signature')!
    
    console.log('📝 Headers completos:', Object.fromEntries(headers().entries()))
    console.log('📝 Body preview:', body.substring(0, 100) + '...')

    let event: Stripe.Event

    // Sempre aceitar o payload em desenvolvimento
    if (isDevelopment) {
      try {
        event = JSON.parse(body)
        console.log('⚠️ Desenvolvimento: Aceitando payload sem verificação')
      } catch (err: any) {
        console.error('❌ Erro ao parsear body:', err.message)
        return NextResponse.json(
          { error: 'Invalid JSON payload' },
          { status: 400 }
        )
      }
    } else {
      try {
        event = stripe.webhooks.constructEvent(body, signature, endpointSecret!)
      } catch (err: any) {
        console.error('❌ Erro na validação do webhook:', err.message)
        return NextResponse.json(
          { error: `Webhook Error: ${err.message}` },
          { status: 401 }
        )
      }
    }

    // Log do evento completo para debug
    console.log('📦 Evento completo:', JSON.stringify(event, null, 2))

    // Processar evento de checkout concluído
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      // Verificar se é uma compra de assinatura
      if (session.mode === 'subscription') {
        const subscriptionId = session.subscription as string
        const customerId = session.customer as string

        // Buscar dados da assinatura e cliente
        const [subscription, customer] = await Promise.all([
          stripe.subscriptions.retrieve(subscriptionId),
          stripe.customers.retrieve(customerId)
        ])

        // Dados para a assinatura
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
          currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
          expiresAt: new Date(subscription.current_period_end * 1000).toISOString()
        }

        // Criar assinatura no Firestore
        const subscriptionsRef = collection(db, 'subscriptions')
        await addDoc(subscriptionsRef, subscriptionData)

        // Criar vínculo membro-parceiro
        const memberPartnersRef = collection(db, 'memberPartners')
        const memberPartnerData = {
          memberId: customer.metadata.userId,
          partnerId: subscription.metadata.partnerId,
          status: 'active',
          stripeSubscriptionId: subscription.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          partnerLinkId: subscription.metadata.partnerLinkId || null,
          expiresAt: new Date(subscription.current_period_end * 1000).toISOString()
        }

        await addDoc(memberPartnersRef, memberPartnerData)
      }
    }

    // Processar evento de atualização de assinatura
    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription

      // Atualizar status da assinatura no Firestore
      const q = query(collection(db, 'subscriptions'), where('stripeSubscriptionId', '==', subscription.id))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        const subscriptionDoc = querySnapshot.docs[0]
        await updateDoc(doc(db, 'subscriptions', subscriptionDoc.id), {
          status: subscription.status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
          expiresAt: new Date(subscription.current_period_end * 1000).toISOString(),
          updatedAt: new Date().toISOString()
        })
      }
    }

    // Sempre retornar 200 em desenvolvimento
    return NextResponse.json({ 
      received: true,
      environment: isDevelopment ? 'development' : 'production',
      eventType: event.type
    })

  } catch (error: any) {
    console.error('❌ Erro geral:', error)
    // Em desenvolvimento, retornar mais detalhes do erro
    return NextResponse.json(
      { 
        error: 'Erro interno no servidor',
        details: isDevelopment ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
} 