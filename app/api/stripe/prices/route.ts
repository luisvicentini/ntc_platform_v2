import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product'],
    })

    return NextResponse.json({
      prices: prices.data,
    })
  } catch (error) {
    console.error('Erro ao buscar preços:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar preços' },
      { status: 500 }
    )
  }
} 