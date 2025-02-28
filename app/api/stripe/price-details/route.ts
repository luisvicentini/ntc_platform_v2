import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const priceId = searchParams.get('priceId')

  if (!priceId) {
    return NextResponse.json(
      { error: 'Price ID é obrigatório' },
      { status: 400 }
    )
  }

  try {
    const price = await stripe.prices.retrieve(priceId, {
      expand: ['product']
    })

    return NextResponse.json(price)
  } catch (error) {
    console.error('Erro ao buscar detalhes do preço:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar detalhes do preço' },
      { status: 500 }
    )
  }
} 