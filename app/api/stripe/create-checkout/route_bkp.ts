import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  console.log('🔄 Iniciando criação de checkout')
  try {
    // O token está disponível através do __session cookie
    // O middleware já verifica a autenticação e adiciona o token no header
    const cookieStore = cookies()
    const sessionToken = cookieStore.get('__session')?.value
    
    // Extrair userId do token
    let userId = null
    
    if (sessionToken) {
      try {
        const decoded = jwt.verify(
          sessionToken, 
          process.env.JWT_SECRET || 'fallback-secret-key'
        ) as any
        userId = decoded.uid
        console.log('ID do usuário do token:', userId)
      } catch (tokenError) {
        console.error('Erro ao decodificar token:', tokenError)
      }
    }
    
    // Extrair dados da requisição
    const data = await request.json()
    console.log('Dados recebidos:', data)
    
    // Validação mínima
    if (!data.email || !data.priceId) {
      console.error('❌ Dados incompletos:', data)
      return NextResponse.json(
        { error: 'Dados incompletos para checkout' },
        { status: 400 }
      )
    }
    
    // Usar o userId do token ou da requisição
    const userIdToUse = userId || data.userId || 'temp-user'
    console.log('userId que será usado:', userIdToUse)
    
    // Criar cliente no Stripe
    console.log('Criando cliente com email:', data.email)
    const customer = await stripe.customers.create({
      email: data.email,
      metadata: {
        userId: userIdToUse // Importante: este é o userId que será buscado depois
      }
    })
    console.log('✅ Cliente criado:', customer.id)
    
    // Preparar os metadados
    const metadata = {
      userId: userIdToUse,
    }
    
    // Adicionar metadados do partner se existirem
    if (data.partnerId) {
      metadata['partnerId'] = data.partnerId
    }
    
    if (data.partnerLinkId) {
      metadata['partnerLinkId'] = data.partnerLinkId
    }
    
    console.log('Metadados que serão enviados:', metadata)
    
    // Criar sessão de checkout
    console.log('Criando sessão com priceId:', data.priceId)
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: data.priceId,
          quantity: 1,
        },
      ],
      metadata: metadata, // Usar os metadados preparados
      subscription_data: {
        metadata: metadata // Importante: também definir os metadados na assinatura
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cancel`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    })
    
    console.log('✅ Sessão criada:', session.id)
    console.log('URL da sessão:', session.url)
    
    return NextResponse.json({
      url: session.url,
      sessionId: session.id
    })
    
  } catch (error: any) {
    console.error('❌ Erro no checkout:', error.message)
    console.error(error.stack)
    return NextResponse.json(
      { error: 'Erro ao processar checkout: ' + error.message },
      { status: 500 }
    )
  }
} 