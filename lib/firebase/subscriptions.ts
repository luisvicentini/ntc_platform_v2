import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore'

export async function getActiveSubscriptions(memberId: string) {
  const subscriptionsRef = collection(db, 'subscriptions')
  const q = query(
    subscriptionsRef, 
    where('memberId', '==', memberId),
    where('status', '==', 'active')
  )
  const snapshot = await getDocs(q)
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }))
}

export async function getPartnerSubscriptions(partnerId: string) {
  const subscriptionsRef = collection(db, 'subscriptions')
  const q = query(subscriptionsRef, where('partnerId', '==', partnerId))
  const snapshot = await getDocs(q)
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }))
}

export async function getSubscriptionByStripeId(stripeSubscriptionId: string) {
  const subscriptionsRef = collection(db, 'subscriptions')
  const q = query(
    subscriptionsRef, 
    where('stripeSubscriptionId', '==', stripeSubscriptionId)
  )
  const snapshot = await getDocs(q)
  
  if (snapshot.empty) {
    return null
  }

  const doc = snapshot.docs[0]
  return {
    id: doc.id,
    ...doc.data()
  }
}

export async function createSubscription(data: {
  memberId: string
  partnerId: string
  stripeSubscriptionId: string
  status: 'active' | 'inactive'
  partnerLinkId?: string | null
}) {
  const subscriptionData = {
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    type: 'stripe', // Identificar que é uma assinatura do Stripe
  }

  // Verificar se já existe uma assinatura ativa
  const subscriptionsRef = collection(db, 'subscriptions')
  const existingQuery = query(
    subscriptionsRef,
    where('memberId', '==', data.memberId),
    where('partnerId', '==', data.partnerId),
    where('status', '==', 'active')
  )
  
  const existingSnapshot = await getDocs(existingQuery)
  if (!existingSnapshot.empty) {
    throw new Error('Já existe uma assinatura ativa para este Assinante e parceiro')
  }

  // Criar nova assinatura
  const docRef = await addDoc(collection(db, 'subscriptions'), subscriptionData)
  return { id: docRef.id, ...subscriptionData }
}

export async function updateSubscriptionStatus(stripeSubscriptionId: string, status: 'active' | 'inactive') {
  const subscription = await getSubscriptionByStripeId(stripeSubscriptionId)
  
  if (!subscription) {
    throw new Error('Assinatura não encontrada no Firebase')
  }

  const subscriptionRef = doc(db, 'subscriptions', subscription.id)
  await updateDoc(subscriptionRef, {
    status,
    updatedAt: new Date().toISOString(),
    ...(status === 'inactive' ? { canceledAt: new Date().toISOString() } : {})
  })
} 