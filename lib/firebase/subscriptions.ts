import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore'

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
  const q = query(subscriptionsRef, where('stripeSubscriptionId', '==', stripeSubscriptionId))
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

export async function updateSubscriptionStatus(stripeSubscriptionId: string, status: 'active' | 'inactive') {
  // Primeiro busca a assinatura no Firebase pelo ID do Stripe
  const subscription = await getSubscriptionByStripeId(stripeSubscriptionId)
  
  if (!subscription) {
    throw new Error('Assinatura não encontrada no Firebase')
  }

  // Atualiza usando o ID do documento do Firebase
  const subscriptionRef = doc(db, 'subscriptions', subscription.id)
  await updateDoc(subscriptionRef, {
    status,
    updatedAt: new Date().toISOString(),
    ...(status === 'inactive' ? { canceledAt: new Date().toISOString() } : {})
  })
} 