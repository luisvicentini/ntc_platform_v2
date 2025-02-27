import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { subscriptionId, cancelationType } = await req.json()

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'ID da assinatura é obrigatório' },
        { status: 400 }
      )
    }

    if (cancelationType === 'immediate') {
      // Cancela imediatamente
      const subscription = await stripe.subscriptions.cancel(subscriptionId)
      return NextResponse.json({ subscription })
    } else {
      // Cancela no final do período
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      })
      return NextResponse.json({ subscription })
    }
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error)
    return NextResponse.json(
      { error: 'Erro ao cancelar assinatura' },
      { status: 500 }
    )
  }
} 