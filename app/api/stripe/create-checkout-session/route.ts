import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    // Verificar autenticação
    const cookieStore = cookies()
    const sessionToken = cookieStore.get('session-token')?.value || 
                        request.headers.get('authorization')?.split('Bearer ')[1]

    if (!sessionToken) {
      console.error('Token não encontrado')
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    try {
      // Verificar token
      const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET!) as any
      console.log('Token decodificado:', decoded)

      const { email, userId, priceId, partnerId, partnerLinkId } = await request.json()

      // Validar dados obrigatórios
      if (!priceId || !email || !userId) {
        console.error('Dados obrigatórios faltando:', { priceId, email, userId })
        return NextResponse.json(
          { error: 'Dados incompletos para criar sessão' },
          { status: 400 }
        )
      }

      // Criar ou recuperar cliente no Stripe
      const customer = await stripe.customers.create({
        email,
        metadata: {
          userId: decoded.uid || userId // Usar ID do token se disponível
        }
      })

      console.log('Cliente criado no Stripe:', customer.id)

      // Criar sessão de checkout
      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{
          price: priceId,
          quantity: 1,
        }],
        metadata: {
          userId: decoded.uid || userId,
          partnerId: partnerId || undefined,
          partnerLinkId: partnerLinkId || undefined
        },
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cancel`,
        allow_promotion_codes: true,
        billing_address_collection: 'required',
      })

      console.log('Sessão de checkout criada:', session.id)

      return NextResponse.json({ 
        url: session.url,
        sessionId: session.id
      })

    } catch (tokenError) {
      console.error('Erro na verificação do token:', tokenError)
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

  } catch (error) {
    console.error('Erro ao criar sessão:', error)
    return NextResponse.json(
      { error: 'Erro ao criar sessão de checkout' },
      { status: 500 }
    )
  }
} 