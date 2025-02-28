import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
})

export const createStripeCustomer = async (email: string, metadata: { userId: string, partnerId?: string }) => {
  return await stripe.customers.create({
    email,
    metadata,
  })
}

export async function createSubscriptionCheckoutSession({
  priceId,
  customerId,
  partnerId,
  partnerLinkId,
  successUrl,
  cancelUrl,
}: {
  priceId: string
  customerId: string
  partnerId: string
  partnerLinkId?: string
  successUrl: string
  cancelUrl: string
}) {
  try {
    console.log('Criando sessão com:', { priceId, customerId, partnerId }) // Debug

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
          adjustable_quantity: {
            enabled: false,
          },
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        partnerId,
        partnerLinkId: partnerLinkId || '',
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    })

    return session
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error)
    throw error
  }
}

export const getSubscription = async (subscriptionId: string) => {
  return await stripe.subscriptions.retrieve(subscriptionId)
}

export const cancelSubscription = async (subscriptionId: string) => {
  return await stripe.subscriptions.cancel(subscriptionId)
}

export const listTransactions = async (customerId: string) => {
  return await stripe.charges.list({
    customer: customerId,
    limit: 10,
  })
}

export const WEBHOOK_URL = `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/webhook` 