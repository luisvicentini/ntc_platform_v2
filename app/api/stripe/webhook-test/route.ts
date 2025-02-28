import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/response'

export async function GET() {
  try {
    // Listar webhooks configurados
    const webhooks = await stripe.webhookEndpoints.list()
    
    // URL esperada do webhook
    const expectedUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/webhook`
    
    console.log('Webhooks configurados:', webhooks.data)
    console.log('URL esperada:', expectedUrl)
    
    // Verificar se existe webhook configurado para a URL correta
    const configuredWebhook = webhooks.data.find(
      webhook => webhook.url === expectedUrl
    )
    
    if (!configuredWebhook) {
      return NextResponse.json({
        error: 'Webhook não configurado',
        expectedUrl,
        currentWebhooks: webhooks.data.map(w => ({
          url: w.url,
          status: w.status,
          enabled_events: w.enabled_events
        }))
      })
    }

    return NextResponse.json({
      success: true,
      webhook: {
        id: configuredWebhook.id,
        url: configuredWebhook.url,
        status: configuredWebhook.status,
        enabled_events: configuredWebhook.enabled_events
      }
    })
  } catch (error) {
    console.error('Erro ao verificar webhooks:', error)
    return NextResponse.json({ error: 'Erro ao verificar webhooks' }, { status: 500 })
  }
} 