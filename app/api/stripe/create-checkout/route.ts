import { createSubscriptionCheckoutSession, stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { priceId, customerId, partnerId } = await req.json()

    // Verificar se já existe uma assinatura ativa
    const existingSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    })

    if (existingSubscriptions.data.length > 0) {
      return NextResponse.json(
        { 
          error: 'Já existe uma assinatura ativa para este usuário. Por favor, cancele a assinatura atual antes de criar uma nova.' 
        }, 
        { status: 400 }
      )
    }

    const session = await createSubscriptionCheckoutSession({
      priceId,
      customerId,
      partnerId,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/member/profile?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/member/profile`,
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error('Erro ao criar sessão:', error)
    return NextResponse.json(
      { error: 'Erro ao criar sessão de checkout' }, 
      { status: 500 }
    )
  }
} 