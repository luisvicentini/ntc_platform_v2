import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"

export async function POST(request: Request) {
  try {
    const { priceId, partnerId, partnerLinkId, email, customer_data, planName, userId } = await request.json()
    
    console.log('Dados recebidos na API:', {
      priceId,
      partnerId,
      partnerLinkId,
      email,
      customer_data,
      planName,
      userId
    })

    if (!priceId || !partnerId) {
      console.error('Dados obrigatórios faltando:', { priceId, partnerId })
      return NextResponse.json(
        { error: 'Dados incompletos para criar sessão' },
        { status: 400 }
      )
    }

    try {
      // Extrair userId do token se disponível
      let userIdFromToken = null
      const cookieStore = cookies()
      const sessionToken = cookieStore.get('__session')?.value
      
      if (sessionToken) {
        try {
          const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET || 'fallback-secret-key') as any
          userIdFromToken = decoded.uid
          console.log('ID do usuário extraído do token:', userIdFromToken)
        } catch (tokenError) {
          console.error('Erro ao decodificar token, mas continuando:', tokenError)
        }
      }

      // Usar o userId da requisição ou do token
      const effectiveUserId = userId || userIdFromToken

      // Criar o customer primeiro, agora com userId nos metadados
      const customer = await stripe.customers.create({
        email: customer_data.email || email,
        phone: customer_data.phone,
        metadata: {
          userId: effectiveUserId // Esta é a parte crucial que faltava
        }
      })

      console.log('Cliente criado com metadados:', {
        customerId: customer.id,
        metadata: customer.metadata
      })

      // Preparar metadados para sessão e assinatura
      const metadata = {
        partnerId: partnerId || '',
        partnerLinkId: partnerLinkId || '',
        userId: effectiveUserId // Adicionar userId aos metadados da sessão
      }

      // Criar a sessão usando o customer criado
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{
          price: priceId,
          quantity: 1,
        }],
        customer: customer.id,
        phone_number_collection: {
          enabled: true
        },
        metadata: metadata,
        subscription_data: {
          metadata: metadata // Isso garante que os metadados sejam transferidos para a assinatura
        },
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?customer_email=${encodeURIComponent(customer_data.email || email)}&customer_name=${encodeURIComponent((customer_data.email || email).split('@')[0])}&plan_name=${encodeURIComponent(planName || 'Assinatura')}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancel`,
      })

      console.log('Sessão criada com sucesso:', {
        sessionId: session.id,
        url: session.url,
        metadata: session.metadata
      })

      return NextResponse.json({ url: session.url })

    } catch (stripeError: any) {
      console.error('Erro do Stripe:', {
        type: stripeError.type,
        message: stripeError.message,
        code: stripeError.code
      })
      
      return NextResponse.json(
        { error: `Erro do Stripe: ${stripeError.message}` },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json(
      { error: 'Erro ao criar sessão de checkout' },
      { status: 500 }
    )
  }
} 