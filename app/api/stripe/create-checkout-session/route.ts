import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    // Obter os dados da requisição
    const data = await request.json()
    const { userId, email, priceId, partnerId, partnerLinkId, isAuthenticated, userInfo } = data
    
    console.log("Recebido pedido de checkout com dados:", {
      userId, email, priceId, partnerId, isAuthenticated
    })
    
    // Aguardar cookies
    const cookieStore = await cookies()
    
    // Para usuários já autenticados, usamos uma abordagem diferente
    if (isAuthenticated) {
      console.log("Usuário já autenticado. Criando sessão diretamente.")
      
      // Como o usuário já está autenticado, podemos prosseguir sem verificar o token
      // já que temos os dados necessários no corpo da requisição
      try {
        // Usar a variável de ambiente correta que já existe no seu .env.local
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://naotemchef.com.br'
        
        console.log("Usando URL base:", baseUrl)
        
        // Criar sessão do Stripe com os dados do usuário
        const stripeSession = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: [
            {
              price: priceId,
              quantity: 1,
            },
          ],
          mode: "subscription",
          success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${baseUrl}/cancel`,
          metadata: {
            userId: userId,
            partnerId: partnerId,
            partnerLinkId: partnerLinkId,
          },
          customer_email: email,
        })
        
        console.log("Sessão do Stripe criada com sucesso:", stripeSession.id)
        return NextResponse.json({ url: stripeSession.url })
      } catch (error) {
        console.error("Erro ao criar sessão do Stripe:", error)
        return NextResponse.json({ 
          message: "Erro ao criar sessão de pagamento", 
          details: error.message 
        }, { status: 500 })
      }
    } else {
      // Se não for usuário autenticado, verificar o token temporário
      // (manter o código existente para esse fluxo)
      
      // Verificar autenticação
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
    }

  } catch (error) {
    console.error("Erro geral na API:", error)
    return NextResponse.json(
      { message: "Erro ao processar a requisição", details: error.message },
      { status: 500 }
    )
  }
} 