import { stripe } from '@/lib/stripe'

export async function checkWebhookEndpoint() {
  try {
    const webhooks = await stripe.webhookEndpoints.list()
    console.log('Webhooks configurados no Stripe:', webhooks.data)
    
    // Verificar se o webhook para /api/stripe/webhook está configurado
    const webhookUrl = process.env.NEXT_PUBLIC_APP_URL + '/api/stripe/webhook'
    const found = webhooks.data.find(webhook => webhook.url === webhookUrl)
    
    if (!found) {
      console.error('❌ Webhook não encontrado para URL:', webhookUrl)
      console.log('É necessário configurar o webhook no painel do Stripe para:', webhookUrl)
    } else {
      console.log('✅ Webhook encontrado:', found)
      console.log('Eventos configurados:', found.enabled_events)
    }
    
    return found
  } catch (error) {
    console.error('Erro ao verificar webhooks:', error)
    return null
  }
} 