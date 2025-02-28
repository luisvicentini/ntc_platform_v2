import { createSubscriptionCheckoutSession, stripe } from '@/lib/stripe'
import { getActiveSubscriptions } from '@/lib/firebase/subscriptions'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { priceId, partnerId, partnerLinkId } = await req.json()

    if (!priceId || !partnerId) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    // Criar sessão de checkout sem customerId para usuários não logados
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cancel`,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      metadata: {
        partnerId,
        partnerLinkId: partnerLinkId || '',
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error)
    return NextResponse.json(
      { error: 'Erro ao criar sessão de checkout' },
      { status: 500 }
    )
  }
} 