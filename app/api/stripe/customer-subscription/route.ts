import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function POST(req: Request) {
  try {
    const { userId } = await req.json()

    // Buscar cliente pelo userId
    const customers = await stripe.customers.search({
      query: `metadata['userId']:'${userId}'`,
    })

    if (!customers.data.length) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }

    // Buscar assinaturas do cliente
    const subscriptions = await stripe.subscriptions.list({
      customer: customers.data[0].id,
      limit: 1,
      status: 'active'
    })

    if (!subscriptions.data.length) {
      return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 })
    }

    return NextResponse.json({ 
      subscriptionId: subscriptions.data[0].id,
      customerId: customers.data[0].id,
      status: subscriptions.data[0].status
    })

  } catch (error) {
    console.error('Erro ao buscar assinatura:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar assinatura' },
      { status: 500 }
    )
  }
} 