import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { email, userId } = await req.json()

    if (!email || !userId) {
      return NextResponse.json(
        { error: 'Email e userId são obrigatórios' },
        { status: 400 }
      )
    }

    // Procurar cliente existente por userId usando search
    const existingCustomers = await stripe.customers.search({
      query: `metadata['userId']:'${userId}'`,
      limit: 1,
    })

    if (existingCustomers.data.length > 0) {
      return NextResponse.json({
        customerId: existingCustomers.data[0].id,
      })
    }

    // Se não encontrou, criar novo cliente
    const customer = await stripe.customers.create({
      email,
      metadata: {
        userId: userId.toString(),
      },
    })

    return NextResponse.json({
      customerId: customer.id,
    })

  } catch (error) {
    console.error('Erro ao criar/buscar cliente:', error)
    return NextResponse.json(
      { error: 'Erro ao processar cliente' },
      { status: 500 }
    )
  }
} 