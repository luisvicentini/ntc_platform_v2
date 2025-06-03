import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const webhooks = await stripe.webhookEndpoints.list()
    const expectedUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/webhook`
    
    console.log('Webhooks configurados:', webhooks.data)
    console.log('URL esperada:', expectedUrl)
    
    // Verificar se existe webhook configurado para a URL correta
    const configuredWebhook = webhooks.data.find(
      webhook => webhook.url === expectedUrl
    )
    
    if (!configuredWebhook) {
      // Se não existir, criar o webhook
      const webhook = await stripe.webhookEndpoints.create({
        url: expectedUrl,
        enabled_events: [
          'checkout.session.completed',
          'customer.subscription.created',
          'customer.subscription.updated',
          'customer.subscription.deleted'
        ],
      })
      
      console.log('✅ Novo webhook criado:', webhook)
      
      return NextResponse.json({
        message: 'Webhook criado com sucesso',
        webhook
      })
    }

    return NextResponse.json({
      message: 'Webhook já configurado',
      webhook: configuredWebhook
    })
  } catch (error) {
    console.error('Erro ao verificar/criar webhook:', error)
    return NextResponse.json(
      { error: 'Erro ao configurar webhook' },
      { status: 500 }
    )
  }
} 