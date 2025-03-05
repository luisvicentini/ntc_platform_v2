import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const email = searchParams.get('email')

    console.log('Buscando assinaturas para:', { userId, email })

    if (!userId) {
      return NextResponse.json(
        { error: 'UserId é obrigatório' },
        { status: 400 }
      )
    }

    // 1. Tentar buscar pela query metadata
    let customers = await stripe.customers.search({
      query: `metadata['userId']:'${userId}'`,
      limit: 1,
    })

    console.log('Clientes encontrados por metadados:', customers.data.length)

    // 2. Se não encontrou, tentar buscar pelo email
    if (customers.data.length === 0 && email) {
      customers = await stripe.customers.list({
        email: email,
        limit: 5
      })
      console.log('Clientes encontrados por email:', customers.data.length)

      // Se encontrou clientes por email, atualizar metadados
      if (customers.data.length > 0) {
        const customer = customers.data[0]
        console.log('Atualizando metadados do cliente:', customer.id)
        
        // Atualizar metadados para incluir userId
        await stripe.customers.update(customer.id, {
          metadata: {
            ...customer.metadata,
            userId: userId
          }
        })
        
        console.log('Metadados atualizados com sucesso')
      }
    }

    // 3. Se ainda não encontrou, verificar se existem assinaturas para esse usuário
    // através de uma busca ampla (isso pode ser lento, mas é um fallback)
    if (customers.data.length === 0) {
      console.log('Realizando busca ampla em assinaturas')
      
      // Buscar todas as assinaturas ativas e verificar metadados
      const subscriptions = await stripe.subscriptions.list({
        status: 'active',
        limit: 100,
        expand: ['data.customer']
      })
      
      console.log(`Verificando ${subscriptions.data.length} assinaturas`)
      
      // Procurar por assinaturas com metadados correspondentes ou email correspondente
      const matchingSubscriptions = subscriptions.data.filter(sub => {
        // Verificar metadados da assinatura
        if (sub.metadata && sub.metadata.userId === userId) {
          return true
        }
        
        // Verificar se o email do cliente corresponde
        const customer = sub.customer as any
        return customer && customer.email === email
      })
      
      if (matchingSubscriptions.length > 0) {
        console.log(`Encontradas ${matchingSubscriptions.length} assinaturas relacionadas`)
        
        // Usar o cliente da primeira assinatura encontrada
        const customer = matchingSubscriptions[0].customer as any
        
        // Atualizar metadados se necessário
        if (!customer.metadata || !customer.metadata.userId) {
          await stripe.customers.update(customer.id, {
            metadata: {
              ...customer.metadata,
              userId: userId
            }
          })
          console.log('Metadados do cliente atualizados')
        }
        
        // Refazer a busca para usar o fluxo normal
        customers = await stripe.customers.list({
          email: customer.email,
          limit: 1
        })
      }
    }

    // Se ainda não encontrou, retornar vazio
    if (customers.data.length === 0) {
      console.log('Nenhum cliente encontrado após todas as tentativas')
      return NextResponse.json({
        subscriptions: [],
        transactions: [],
      })
    }

    const customer = customers.data[0]
    console.log('Customer ID encontrado:', customer.id)

    // Buscar TODAS as assinaturas do cliente
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      limit: 100,
      expand: [
        'data.default_payment_method',
        'data.items.data.price',
      ],
      status: 'all', // Isso garante que pegaremos todas as assinaturas, independente do status
    })

    console.log('[STRIPE] Assinaturas encontradas:', subscriptions.data.length)

    // Buscar produtos para todas as assinaturas
    const subscriptionDetails = await Promise.all(
      subscriptions.data.map(async (sub) => {
        const priceId = sub.items.data[0].price.id
        console.log('Buscando detalhes do preço:', priceId)
        
        const price = await stripe.prices.retrieve(priceId, {
          expand: ['product'],
        })

        return {
          id: sub.id,
          status: sub.status,
          currentPeriodStart: sub.current_period_start,
          currentPeriodEnd: sub.current_period_end,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
          customerId: customer.id,
          priceId: sub.items.data[0].price.id,
          partnerId: sub.metadata.partnerId,
          planName: (price.product as any).name,
          amount: sub.items.data[0].price.unit_amount,
          currency: sub.items.data[0].price.currency,
          interval: sub.items.data[0].price.recurring?.interval,
          intervalCount: sub.items.data[0].price.recurring?.interval_count,
          paymentMethod: sub.default_payment_method ? {
            brand: (sub.default_payment_method as any).card?.brand,
            last4: (sub.default_payment_method as any).card?.last4,
            expiryMonth: (sub.default_payment_method as any).card?.exp_month,
            expiryYear: (sub.default_payment_method as any).card?.exp_year,
          } : null,
          created: sub.created,
          canceledAt: sub.canceled_at,
          endedAt: sub.ended_at,
        }
      })
    )

    console.log('Detalhes das assinaturas processados:', subscriptionDetails.length)

    // Buscar transações
    const charges = await stripe.charges.list({
      customer: customer.id,
      limit: 100,
    })

    const transactions = charges.data.map(charge => ({
      id: charge.id,
      amount: charge.amount,
      currency: charge.currency,
      status: charge.status,
      created: charge.created,
      description: charge.description,
    }))

    console.log('Transações encontradas:', transactions.length)

    return NextResponse.json({
      subscriptions: subscriptionDetails,
      transactions,
    })
  } catch (error) {
    console.error('Erro detalhado ao buscar assinatura:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar assinatura' },
      { status: 500 }
    )
  }
} 