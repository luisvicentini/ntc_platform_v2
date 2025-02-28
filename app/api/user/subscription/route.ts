import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    console.log('Buscando assinaturas para userId:', userId)

    if (!userId) {
      return NextResponse.json(
        { error: 'UserId é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar customer pelo userId de forma mais flexível
    const customers = await stripe.customers.search({
      query: `metadata['userId']:'${userId}'`,
      limit: 1,
    })

    console.log('Clientes encontrados:', customers.data.length)

    if (customers.data.length === 0) {
      return NextResponse.json({
        subscriptions: [],
        transactions: [],
      })
    }

    const customer = customers.data[0]
    console.log('Customer ID:', customer.id)

    // Buscar TODAS as assinaturas do cliente
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      limit: 100,
      expand: [
        'data.default_payment_method',
        'data.items.data.price',
      ],
      status: 'all', // Isso garante que pegaremos todas as assinaturas, independente do status
    })

    console.log('[STRIPE] Assinaturas encontradas:', subscriptions.data.length)

    // Buscar produtos para todas as assinaturas
    const subscriptionDetails = await Promise.all(
      subscriptions.data.map(async (sub) => {
        const priceId = sub.items.data[0].price.id
        console.log('Buscando detalhes do preço:', priceId)
        
        const price = await stripe.prices.retrieve(priceId, {
          expand: ['product'],
        })

        return {
          id: sub.id,
          status: sub.status,
          currentPeriodStart: sub.current_period_start,
          currentPeriodEnd: sub.current_period_end,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
          customerId: customer.id,
          priceId: sub.items.data[0].price.id,
          partnerId: sub.metadata.partnerId,
          planName: (price.product as any).name,
          amount: sub.items.data[0].price.unit_amount,
          currency: sub.items.data[0].price.currency,
          interval: sub.items.data[0].price.recurring?.interval,
          intervalCount: sub.items.data[0].price.recurring?.interval_count,
          paymentMethod: sub.default_payment_method ? {
            brand: (sub.default_payment_method as any).card?.brand,
            last4: (sub.default_payment_method as any).card?.last4,
            expiryMonth: (sub.default_payment_method as any).card?.exp_month,
            expiryYear: (sub.default_payment_method as any).card?.exp_year,
          } : null,
          created: sub.created,
          canceledAt: sub.canceled_at,
          endedAt: sub.ended_at,
        }
      })
    )

    console.log('Detalhes das assinaturas processados:', subscriptionDetails.length)

    // Buscar transações
    const charges = await stripe.charges.list({
      customer: customer.id,
      limit: 100,
    })

    const transactions = charges.data.map(charge => ({
      id: charge.id,
      amount: charge.amount,
      currency: charge.currency,
      status: charge.status,
      created: charge.created,
      description: charge.description,
    }))

    console.log('Transações encontradas:', transactions.length)

    return NextResponse.json({
      subscriptions: subscriptionDetails,
      transactions,
    })
  } catch (error) {
    console.error('Erro detalhado ao buscar assinatura:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar assinatura' },
      { status: 500 }
    )
  }
} 