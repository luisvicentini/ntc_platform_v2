import { createSubscriptionCheckoutSession, stripe } from '@/lib/stripe'
import { getActiveSubscriptions } from '@/lib/firebase/subscriptions'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { priceId, customerId, partnerId, partnerLinkId } = await req.json()

    // Validar se todos os campos necessários foram fornecidos
    if (!priceId || !customerId || !partnerId) {
      console.log('Dados recebidos:', { priceId, customerId, partnerId }) // Debug
      return NextResponse.json(
        { error: 'Dados incompletos para criar sessão' },
        { status: 400 }
      )
    }

    // Buscar o customer para obter o userId
    const customer = await stripe.customers.retrieve(customerId)
    const userId = customer.metadata.userId

    // Verificar se já existe uma assinatura ativa para este parceiro
    const activeSubscriptions = await getActiveSubscriptions(userId)
    const hasActiveSubscriptionWithPartner = activeSubscriptions.some(
      sub => sub.partnerId === partnerId
    )

    if (hasActiveSubscriptionWithPartner) {
      return NextResponse.json(
        { error: 'Você já possui uma assinatura ativa com este parceiro' },
        { status: 400 }
      )
    }

    // Verificar se o preço existe no Stripe
    try {
      const price = await stripe.prices.retrieve(priceId)
      if (!price) {
        return NextResponse.json(
          { error: 'Preço não encontrado' },
          { status: 400 }
        )
      }
    } catch (error) {
      console.error('Erro ao verificar preço:', error)
      return NextResponse.json(
        { error: 'Preço inválido' },
        { status: 400 }
      )
    }

    // Criar sessão de checkout
    const session = await createSubscriptionCheckoutSession({
      priceId,
      customerId,
      partnerId,
      partnerLinkId,
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