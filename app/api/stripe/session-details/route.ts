import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json()
    
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer']
    })
    
    return NextResponse.json(session)
  } catch (error) {
    console.error('Erro ao buscar detalhes da sessão:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar detalhes' },
      { status: 500 }
    )
  }
} 