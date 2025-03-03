import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"

export async function POST(request: Request) {
  try {
    const { priceId, partnerId, partnerLinkId, email, customer_data, planName } = await request.json()
    
    console.log('Dados recebidos na API:', {
      priceId,
      partnerId,
      partnerLinkId,
      email,
      customer_data,
      planName
    })

    if (!priceId || !partnerId) {
      console.error('Dados obrigatórios faltando:', { priceId, partnerId })
      return NextResponse.json(
        { error: 'Dados incompletos para criar sessão' },
        { status: 400 }
      )
    }

    try {
      // Criar o customer primeiro
      const customer = await stripe.customers.create({
        email: customer_data.email,
        phone: customer_data.phone
      })

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
        metadata: {
          partnerId,
          partnerLinkId: partnerLinkId || ''
        },
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?customer_email=${encodeURIComponent(customer_data.email)}&customer_name=${encodeURIComponent(customer_data.email.split('@')[0])}&plan_name=${encodeURIComponent(planName)}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancel`,
      })

      console.log('Sessão criada com sucesso:', {
        sessionId: session.id,
        url: session.url
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