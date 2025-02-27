import { stripe } from '@/lib/stripe'
import { updateSubscriptionStatus } from '@/lib/firebase/subscriptions'
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

    let stripeSubscription

    try {
      if (cancelationType === 'immediate') {
        // Cancela imediatamente no Stripe
        stripeSubscription = await stripe.subscriptions.cancel(subscriptionId)
        
        // Atualiza status no Firebase
        await updateSubscriptionStatus(subscriptionId, 'inactive')
      } else {
        // Cancela no final do período
        stripeSubscription = await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        })
      }

      return NextResponse.json({ subscription: stripeSubscription })
    } catch (error) {
      console.error('Erro detalhado ao cancelar assinatura:', error)
      
      if (error instanceof Error && error.message === 'Assinatura não encontrada no Firebase') {
        return NextResponse.json(
          { error: 'Assinatura não encontrada no sistema' },
          { status: 404 }
        )
      }

      throw error // Re-throw para ser pego pelo catch externo
    }
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error)
    return NextResponse.json(
      { error: 'Erro ao cancelar assinatura' },
      { status: 500 }
    )
  }
} 