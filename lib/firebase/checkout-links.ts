import { db } from '@/lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { stripe } from '@/lib/stripe'

export interface CheckoutPartnerLink {
  id: string
  partnerId: string
  partnerName: string
  planName: string
  description: string
  priceId: string
  price: number
  interval: string
  intervalCount: number
  code: string
}

export async function getCheckoutLinkByCode(code: string): Promise<CheckoutPartnerLink | null> {
  try {
    const linksRef = collection(db, 'partnerLinks')
    const q = query(linksRef, where('code', '==', code))
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      return null
    }

    const doc = querySnapshot.docs[0]
    const linkData = doc.data()

    // Buscar dados do Stripe
    const price = await stripe.prices.retrieve(linkData.priceId)
    const product = await stripe.products.retrieve(price.product as string)

    return {
      id: doc.id,
      partnerId: linkData.partnerId,
      partnerName: linkData.name,
      planName: product.name,
      description: product.description || '',
      priceId: linkData.priceId,
      price: price.unit_amount ? price.unit_amount / 100 : 0,
      interval: price.recurring?.interval || 'month',
      intervalCount: price.recurring?.interval_count || 1,
      code: linkData.code
    }
  } catch (error) {
    console.error('Erro ao buscar link:', error)
    return null
  }
} 