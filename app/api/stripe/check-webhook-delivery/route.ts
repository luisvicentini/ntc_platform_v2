import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json()
    
    // Buscar eventos relacionados à sessão
    const events = await stripe.events.list({
      type: 'checkout.session.completed',
      created: {
        // Últimos 5 minutos
        gte: Math.floor(Date.now() / 1000) - 300
      }
    })
    
    const event = events.data.find(
      e => e.data.object.id === sessionId
    )
    
    return NextResponse.json({
      found: !!event,
      event: event || null
    })
  } catch (error) {
    console.error('Erro ao verificar entrega do webhook:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar webhook' },
      { status: 500 }
    )
  }
} 