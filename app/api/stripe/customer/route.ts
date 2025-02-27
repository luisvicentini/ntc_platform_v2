import { createStripeCustomer, stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { email, userId, partnerId } = await req.json()

    // Buscar customer existente
    const customers = await stripe.customers.search({
      query: `metadata['userId']:'${userId}'`,
      limit: 1,
    })

    let customer

    if (customers.data.length > 0) {
      customer = customers.data[0]
      
      // Atualizar metadata se necessário
      if (partnerId && !customer.metadata.partnerId) {
        customer = await stripe.customers.update(customer.id, {
          metadata: {
            ...customer.metadata,
            partnerId,
          },
        })
      }
    } else {
      // Criar novo customer
      customer = await createStripeCustomer(email, {
        userId,
        partnerId,
      })
    }

    return NextResponse.json({ customerId: customer.id })
  } catch (error) {
    console.error('Erro ao criar/atualizar customer:', error)
    return NextResponse.json(
      { error: 'Erro ao processar customer' },
      { status: 500 }
    )
  }
} 