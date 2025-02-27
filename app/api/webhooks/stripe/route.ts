import { headers } from 'next/headers'
import { NextResponse } from 'next/response'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/firebase'
import { doc, setDoc, updateDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore'
import { incrementLinkConversions } from '@/lib/firebase/partner-links'

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  const body = await req.text()
  const sig = headers().get('stripe-signature')

  let event

  try {
    event = stripe.webhooks.constructEvent(body, sig!, endpointSecret)
  } catch (err: any) {
    console.error('Erro no webhook:', err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const subscriptionId = session.subscription as string
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const partnerId = subscription.metadata.partnerId
        const partnerLinkId = subscription.metadata.partnerLinkId
        const customerId = session.customer as string
        const customer = await stripe.customers.retrieve(customerId)
        const userId = customer.metadata.userId

        // Criar assinatura no Firebase
        const subscriptionData = {
          memberId: userId,
          partnerId: partnerId,
          stripeSubscriptionId: subscriptionId,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        await addDoc(collection(db, 'subscriptions'), subscriptionData)

        // Incrementar conversões do link se existir
        if (partnerLinkId) {
          await incrementLinkConversions(partnerLinkId)
        }

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const stripeSubscriptionId = subscription.id
        
        // Buscar assinatura no Firebase
        const subscriptionsRef = collection(db, 'subscriptions')
        const q = query(subscriptionsRef, where('stripeSubscriptionId', '==', stripeSubscriptionId))
        const snapshot = await getDocs(q)
        
        if (!snapshot.empty) {
          const subscriptionDoc = snapshot.docs[0]
          await updateDoc(doc(db, 'subscriptions', subscriptionDoc.id), {
            status: subscription.status === 'active' ? 'active' : 'inactive',
            updatedAt: new Date().toISOString(),
          })
        }
        
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const stripeSubscriptionId = subscription.id

        // Buscar e atualizar assinatura no Firebase
        const subscriptionsRef = collection(db, 'subscriptions')
        const q = query(subscriptionsRef, where('stripeSubscriptionId', '==', stripeSubscriptionId))
        const snapshot = await getDocs(q)
        
        if (!snapshot.empty) {
          const subscriptionDoc = snapshot.docs[0]
          await updateDoc(doc(db, 'subscriptions', subscriptionDoc.id), {
            status: 'inactive',
            updatedAt: new Date().toISOString(),
            canceledAt: new Date().toISOString(),
          })
        }

        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Erro ao processar webhook:', error)
    return NextResponse.json(
      { error: 'Erro ao processar webhook' },
      { status: 500 }
    )
  }
} 