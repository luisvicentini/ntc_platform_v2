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

export const createSubscriptionCheckoutSession = async ({
  priceId,
  customerId,
  successUrl,
  cancelUrl,
  partnerId,
}: {
  priceId: string
  customerId: string
  successUrl: string
  cancelUrl: string
  partnerId: string
}) => {
  return await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      partnerId,
    },
  })
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