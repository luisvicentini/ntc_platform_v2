import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore'
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
  lastlinkUrl?: string
  checkoutType?: 'stripe' | 'lastlink'
}

export async function getCheckoutLinkByCode(code: string): Promise<CheckoutPartnerLink | null> {
  try {
    const linksRef = collection(db, 'partnerLinks')
    const q = query(linksRef, where('code', '==', code))
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      return null
    }

    const docData = querySnapshot.docs[0]
    const linkData = docData.data()
    
    // Verificar se é um link Lastlink (priceId começa com "lastlink_")
    const isLastlink = linkData.priceId.startsWith('lastlink_')
    let planName = ""
    let description = ""
    let priceValue = 0
    let interval = "month"
    let intervalCount = 1
    let lastlinkUrl = undefined
    
    // Buscar dados do parceiro para obter informações de checkout
    const usersRef = collection(db, 'users')
    const partnerQuery = query(usersRef, where('uid', '==', linkData.partnerId))
    const partnerSnapshot = await getDocs(partnerQuery)
    let checkoutType: 'stripe' | 'lastlink' | undefined = undefined
    
    if (!partnerSnapshot.empty) {
      const partnerData = partnerSnapshot.docs[0].data()
      const checkoutOptions = partnerData.checkoutOptions || {}
      
      // Determinar o tipo de checkout com base nas configurações do parceiro
      if (isLastlink || (checkoutOptions.lastlinkEnabled && !checkoutOptions.stripeEnabled)) {
        checkoutType = 'lastlink'
      } else if (checkoutOptions.stripeEnabled) {
        checkoutType = 'stripe'
      }
      
      // Se for Lastlink, buscar dados do plano nas configurações do parceiro
      if (isLastlink && checkoutOptions.lastlinkPlans) {
        // Extrair o nome do plano do priceId (lastlink_nome_do_plano)
        const planId = linkData.priceId.replace('lastlink_', '').replace(/_/g, ' ')
        
        const plan = checkoutOptions.lastlinkPlans.find(
          (p: any) => p.name.toLowerCase() === planId.toLowerCase()
        )
        
        if (plan) {
          planName = plan.name
          description = plan.description || ""
          interval = plan.interval || "month"
          lastlinkUrl = plan.link
          
          // Estimar preço com base no intervalo (isso é só um exemplo)
          switch (interval) {
            case 'year':
              priceValue = 1188
              intervalCount = 12
              break
            case 'semester':
              priceValue = 594
              intervalCount = 6
              break
            case 'quarter':
              priceValue = 297
              intervalCount = 3
              break
            default:
              priceValue = 99
              intervalCount = 1
          }
        }
      }
    }
    
    // Se não for Lastlink ou não encontrarmos os dados do plano, buscar no Stripe
    if (!isLastlink || !planName) {
      try {
        const stripePrice = await stripe.prices.retrieve(linkData.priceId)
        const product = await stripe.products.retrieve(stripePrice.product as string)
        
        planName = product.name
        description = product.description || ''
        priceValue = stripePrice.unit_amount ? stripePrice.unit_amount / 100 : 0
        interval = stripePrice.recurring?.interval || "month"
        intervalCount = stripePrice.recurring?.interval_count || 1
      } catch (error) {
        // Se falhar a busca no Stripe e for Lastlink, usar dados padrão
        if (isLastlink) {
          planName = "Plano de Assinatura"
          description = "Acesso a todos os benefícios"
        } else {
          console.error('Erro ao buscar produto no Stripe:', error)
          return null
        }
      }
    }

    return {
      id: docData.id,
      partnerId: linkData.partnerId,
      partnerName: linkData.name,
      planName,
      description,
      priceId: linkData.priceId,
      price: priceValue,
      interval,
      intervalCount,
      code: linkData.code,
      lastlinkUrl,
      checkoutType
    }
  } catch (error) {
    console.error('Erro ao buscar link:', error)
    return null
  }
} 