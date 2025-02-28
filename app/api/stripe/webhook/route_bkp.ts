import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/firebase'
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore'

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET
const isDevelopment = process.env.NODE_ENV === 'development'

export async function POST(req: Request) {
  console.log('------------------------')
  console.log('🎯 Webhook recebido')
  console.log('🔐 Secret:', endpointSecret?.substring(0, 10) + '...')
  console.log('🌍 Ambiente:', process.env.NODE_ENV)
  
  try {
    const body = await req.text()
    const signature = headers().get('stripe-signature')
    
    console.log('📝 Headers:', {
      signature: signature?.substring(0, 20) + '...',
      contentType: headers().get('content-type')
    })

    let event

    // Em desenvolvimento, ser mais permissivo
    if (isDevelopment) {
      try {
        if (signature && endpointSecret) {
          event = stripe.webhooks.constructEvent(body, signature, endpointSecret)
          console.log('✅ Evento validado com assinatura')
        } else {
          event = JSON.parse(body)
          console.log('⚠️ Modo desenvolvimento: Evento aceito sem verificação')
        }
      } catch (err: any) {
        // Em desenvolvimento, continuar mesmo com erro de validação
        console.warn('⚠️ Erro na validação, tentando processar mesmo assim:', err.message)
        event = JSON.parse(body)
      }
    } else {
      // Em produção, ser mais rigoroso
      event = stripe.webhooks.constructEvent(body, signature!, endpointSecret!)
    }

    console.log('📦 Evento:', {
      type: event.type,
      id: event.id,
      api_version: event.api_version
    })

    // Processar apenas eventos específicos
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      console.log('💳 Checkout completado:', {
        sessionId: session.id,
        customerId: session.customer,
        amount: session.amount_total,
        status: session.payment_status
      })

      try {
        // Buscar dados necessários
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        const customer = await stripe.customers.retrieve(session.customer as string)
        const price = await stripe.prices.retrieve(subscription.items.data[0].price.id)
        
        console.log('📄 Dados da assinatura:', subscription)
        console.log('👤 Dados do cliente:', customer)
        console.log('💰 Dados do preço:', price)

        // Calcular data de expiração baseada no intervalo do plano
        const interval = price.recurring?.interval || 'month' // fallback para mensal
        const intervalCount = price.recurring?.interval_count || 1
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
            console.warn('⚠️ Intervalo desconhecido:', interval)
            // Usar current_period_end como fallback
            expiresAt = new Date(subscription.current_period_end * 1000)
        }

        // Verificar se já existe no Firebase
        const subscriptionsRef = collection(db, 'subscriptions')
        const q = query(
          subscriptionsRef,
          where('stripeSubscriptionId', '==', subscription.id)
        )
        const existingDocs = await getDocs(q)

        if (!existingDocs.empty) {
          console.log('⚠️ Assinatura já existe no Firebase')
          return NextResponse.json({ received: true })
        }

        // Criar assinatura no Firebase
        const subscriptionData = {
          memberId: customer.metadata.userId,
          partnerId: subscription.metadata.partnerId,
          stripeSubscriptionId: subscription.id,
          status: subscription.status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          expiresAt: expiresAt.toISOString(),
          type: 'stripe',
          partnerLinkId: subscription.metadata.partnerLinkId || null,
          priceId: subscription.items.data[0].price.id,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
          interval: interval,
          intervalCount: intervalCount
        }

        const docRef = await addDoc(subscriptionsRef, subscriptionData)
        console.log('✅ Assinatura criada no Firebase:', docRef.id)

        // Criar vínculo membro-parceiro
        const memberPartnersRef = collection(db, 'memberPartners')
        const memberPartnerData = {
          memberId: customer.metadata.userId,
          partnerId: subscription.metadata.partnerId,
          status: 'active',
          stripeSubscriptionId: subscription.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          expiresAt: expiresAt.toISOString(),
          partnerLinkId: subscription.metadata.partnerLinkId || null
        }

        const mpDoc = await addDoc(memberPartnersRef, memberPartnerData)
        console.log('✅ Vínculo membro-parceiro criado:', mpDoc.id)
      } catch (error) {
        console.error('❌ Erro ao processar checkout:', error)
        return NextResponse.json(
          { error: 'Erro ao processar checkout' },
          { status: 500 }
        )
      }
    }

    // Aceitar o evento mesmo que não seja processado
    return NextResponse.json({ received: true })

  } catch (error: any) {
    console.error('❌ Erro geral:', error.message)
    return NextResponse.json(
      { error: 'Erro interno no servidor' },
      { status: 500 }
    )
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
} 