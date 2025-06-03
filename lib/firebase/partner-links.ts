import { db } from '@/lib/firebase'
import { collection, addDoc, query, where, getDocs, updateDoc, doc, increment, getDoc } from 'firebase/firestore'
import { nanoid } from 'nanoid'

// Interface para os dados do link
interface PartnerLinkData {
  partnerId: string
  code: string
  name: string
  priceId: string
  price?: number
  clicks: number
  conversions: number
  createdAt: string
  updatedAt: string
  lastlinkUrl?: string
  lastlinkPlanId?: string
  planName?: string
  checkoutType?: 'stripe' | 'lastlink'
  interval?: string
  intervalCount?: number
  description?: string
  partnerName?: string
  [key: string]: any // Para permitir campos adicionais
}

// Interface para o link de vendas do parceiro (utilizada na função getPartnerLinkByCode)
export interface PartnerSalesLink extends PartnerLinkData {
  id: string
}

// Função para buscar os planos Lastlink do parceiro
export async function getPartnerLastlinkPlans(partnerId: string) {
  try {
    const userRef = doc(db, 'users', partnerId)
    const userSnap = await getDoc(userRef)
    
    if (!userSnap.exists()) return []
    
    const userData = userSnap.data()
    return userData.checkoutOptions?.lastlinkPlans || []
  } catch (error) {
    console.error('Erro ao buscar planos Lastlink:', error)
    return []
  }
}

export async function createPartnerLink(
  partnerId: string, 
  name: string, 
  priceId: string, 
  planId?: string,
  additionalData?: {
    price?: number,
    interval?: string,
    description?: string,
    planName?: string,
    intervalCount?: number
  }
) {
  try {
    const code = nanoid(8) // Gera um código único de 8 caracteres
    
    // Dados básicos do link
    const linkData: PartnerLinkData = {
      partnerId,
      code,
      name,
      priceId,
      clicks: 0,
      conversions: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    // Aplicar dados adicionais se fornecidos
    if (additionalData) {
      console.log('Aplicando dados adicionais ao link:', additionalData)
      Object.assign(linkData, additionalData)
    }
    
    // Se o priceId começa com "lastlink_", precisamos buscar a URL correta do plano
    if (priceId.startsWith('lastlink_') && partnerId) {
      console.log('Link do tipo Lastlink, buscando URL do plano...')
      
      // Buscar dados do parceiro para obter os planos disponíveis
      const partnerRef = doc(db, 'users', partnerId)
      const partnerSnap = await getDoc(partnerRef)
      
      if (partnerSnap.exists()) {
        const partnerData = partnerSnap.data()
        const lastlinkPlans = partnerData.checkoutOptions?.lastlinkPlans || []
        
        let selectedPlan = null
        
        // Primeiro, tentar encontrar pelo planId, se fornecido
        if (planId) {
          selectedPlan = lastlinkPlans.find((plan: any) => plan.id === planId)
          console.log('Plano encontrado pelo planId:', selectedPlan)
        }
        
        // Se não encontrou pelo ID ou não forneceu ID, buscar pelo nome derivado do priceId
        if (!selectedPlan) {
          const planName = priceId.replace('lastlink_', '').replace(/_/g, ' ')
          
          // Buscar plano que corresponda ao nome (tentando diferentes abordagens)
          selectedPlan = lastlinkPlans.find((plan: any) => {
            const planNameLower = plan.name.toLowerCase()
            const searchNameLower = planName.toLowerCase()
            return planNameLower === searchNameLower || 
                   planNameLower.includes(searchNameLower) || 
                   searchNameLower.includes(planNameLower)
          })
          
          console.log('Plano encontrado pelo nome:', selectedPlan)
        }
        
        // Se encontrou um plano, adicionar a URL ao link
        if (selectedPlan) {
          linkData.lastlinkUrl = selectedPlan.link
          // Verificar se o plano tem um ID antes de atribuir
          if (selectedPlan.id) {
            linkData.lastlinkPlanId = selectedPlan.id
          } else {
            // Gerar um ID temporário se o plano não tiver ID
            const tempId = `temp_plan_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`
            console.log(`Plano não tem ID, gerando ID temporário: ${tempId}`)
            linkData.lastlinkPlanId = tempId
          }
          
          // Apenas definir valores se não foram fornecidos nos additionalData
          if (!linkData.planName) linkData.planName = selectedPlan.name
          if (!linkData.checkoutType) linkData.checkoutType = 'lastlink'
          
          // Adicionar outras informações úteis se disponíveis e não fornecidas nos additionalData
          if (selectedPlan.price && !linkData.price) linkData.price = selectedPlan.price
          if (selectedPlan.interval && !linkData.interval) linkData.interval = selectedPlan.interval
          if (selectedPlan.description && !linkData.description) linkData.description = selectedPlan.description
          if (selectedPlan.intervalCount && !linkData.intervalCount) linkData.intervalCount = selectedPlan.intervalCount
          
          console.log('Dados do plano Lastlink associados ao link:', {
            url: selectedPlan.link,
            planId: selectedPlan.id,
            name: selectedPlan.name,
            price: linkData.price
          })
        } else {
          // Se não encontrou plano específico mas tem planos, usar o primeiro
          if (lastlinkPlans.length > 0) {
            const defaultPlan = lastlinkPlans[0]
            linkData.lastlinkUrl = defaultPlan.link
            
            // Verificar se o plano tem um ID antes de atribuir
            if (defaultPlan.id) {
              linkData.lastlinkPlanId = defaultPlan.id
            } else {
              // Gerar um ID temporário se o plano não tiver ID
              const tempId = `temp_plan_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`
              console.log(`Plano padrão não tem ID, gerando ID temporário: ${tempId}`)
              linkData.lastlinkPlanId = tempId
            }
            
            linkData.planName = defaultPlan.name
            linkData.checkoutType = 'lastlink'
            
            // Adicionar outras informações úteis
            if (defaultPlan.price) linkData.price = defaultPlan.price
            if (defaultPlan.interval) linkData.interval = defaultPlan.interval
            if (defaultPlan.description) linkData.description = defaultPlan.description
            if (defaultPlan.intervalCount) linkData.intervalCount = defaultPlan.intervalCount
            
            console.log('Plano específico não encontrado, usando o primeiro disponível:', defaultPlan.name)
          } else {
            console.log('Nenhum plano Lastlink disponível para o parceiro')
          }
        }
      }
    }
    
    // Adicionar a partnerName quando possível
    try {
      const partnerRef = doc(db, 'users', partnerId)
      const partnerSnap = await getDoc(partnerRef)
      
      if (partnerSnap.exists()) {
        const partnerData = partnerSnap.data()
        linkData.partnerName = partnerData.name || partnerData.displayName || partnerData.businessName || 'Parceiro'
      }
    } catch (error) {
      console.error('Erro ao buscar nome do parceiro:', error)
    }

    const docRef = await addDoc(collection(db, 'partnerLinks'), linkData)
    
    // Após criar o link, atualizar o plano Lastlink para associá-lo a este link
    if (linkData.lastlinkPlanId) {
      try {
        // Buscar dados do parceiro novamente
        const partnerRef = doc(db, 'users', partnerId)
        const partnerSnap = await getDoc(partnerRef)
        
        if (partnerSnap.exists()) {
          const partnerData = partnerSnap.data()
          const lastlinkPlans = partnerData.checkoutOptions?.lastlinkPlans || []
          
          // Encontrar o plano correto para atualizar
          const planIndex = lastlinkPlans.findIndex((plan: any) => plan.id === linkData.lastlinkPlanId)
          
          if (planIndex !== -1) {
            // Se o plano não tem array linkedLinkIds, criar um
            if (!lastlinkPlans[planIndex].linkedLinkIds) {
              lastlinkPlans[planIndex].linkedLinkIds = []
            }
            
            // Adicionar o ID do link ao array linkedLinkIds do plano
            lastlinkPlans[planIndex].linkedLinkIds.push(docRef.id)
            
            // Atualizar o documento do parceiro
            await updateDoc(partnerRef, {
              [`checkoutOptions.lastlinkPlans.${planIndex}.linkedLinkIds`]: lastlinkPlans[planIndex].linkedLinkIds
            })
            
            console.log('Link associado ao plano Lastlink:', {
              linkId: docRef.id,
              planId: linkData.lastlinkPlanId
            })
          } else {
            // Se não encontrou o plano pelo ID, pode ser um ID temporário
            // Vamos apenas continuar sem atualizar os planos
            console.log(`Plano com ID ${linkData.lastlinkPlanId} não encontrado para atualização, possivelmente um ID temporário`)
          }
        }
      } catch (error) {
        console.error('Erro ao atualizar o plano com o novo link:', error)
      }
    }
    
    return { id: docRef.id, ...linkData }
  } catch (error) {
    console.error('Erro ao criar link de parceiro:', error)
    throw error
  }
}

export async function getPartnerLinks(partnerId: string) {
  const linksRef = collection(db, 'partnerLinks')
  const q = query(linksRef, where('partnerId', '==', partnerId))
  const snapshot = await getDocs(q)
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }))
}

export async function incrementLinkClicks(linkId: string) {
  const linkRef = doc(db, 'partnerLinks', linkId)
  await updateDoc(linkRef, {
    clicks: increment(1),
    updatedAt: new Date().toISOString()
  })
}

export async function incrementLinkConversions(linkId: string) {
  const linkRef = doc(db, 'partnerLinks', linkId)
  await updateDoc(linkRef, {
    conversions: increment(1),
    updatedAt: new Date().toISOString()
  })
}

export async function getPartnerLinkByCode(code: string) {
  const linksRef = collection(db, 'partnerLinks')
  const q = query(linksRef, where('code', '==', code))
  const snapshot = await getDocs(q)
  
  if (snapshot.empty) {
    return null
  }

  const doc = snapshot.docs[0]
  return {
    id: doc.id,
    ...doc.data()
  } as PartnerSalesLink
}

export async function updatePartnerLinkPriceId(linkId: string, priceId: string) {
  const linkRef = doc(db, 'partnerLinks', linkId)
  await updateDoc(linkRef, {
    priceId,
    updatedAt: new Date().toISOString()
  })
}

export async function updateAllPartnerLinksWithDefaultPrice(partnerId: string, defaultPriceId: string) {
  const linksRef = collection(db, 'partnerLinks')
  const q = query(
    linksRef, 
    where('partnerId', '==', partnerId),
    where('priceId', '==', null)
  )
  
  const snapshot = await getDocs(q)
  
  const updatePromises = snapshot.docs.map(doc => 
    updateDoc(doc.ref, {
      priceId: defaultPriceId,
      updatedAt: new Date().toISOString()
    })
  )
  
  await Promise.all(updatePromises)
  return snapshot.docs.length
}

/**
 * Define um link como padrão do sistema
 */
export async function setDefaultLink(linkId: string) {
  try {
    // Primeiro, remove a marcação de padrão de qualquer link existente
    const defaultQuery = query(
      collection(db, "partnerLinks"),
      where("isDefault", "==", true)
    )
    
    const defaultLinksSnapshot = await getDocs(defaultQuery)
    
    // Remover flag padrão de todos os links
    const updatePromises = defaultLinksSnapshot.docs.map(doc => 
      updateDoc(doc.ref, { isDefault: false })
    )
    
    await Promise.all(updatePromises)
    
    // Agora, marca o novo link como padrão
    const linkRef = doc(db, "partnerLinks", linkId)
    await updateDoc(linkRef, { 
      isDefault: true,
      updatedAt: new Date().toISOString()
    })
    
    return true
  } catch (error) {
    console.error("Erro ao definir link padrão:", error)
    throw error
  }
}

/**
 * Obtém o link padrão do sistema
 */
export async function getDefaultLink() {
  try {
    console.log("Buscando link padrão do sistema diretamente do Firestore...")
    const defaultQuery = query(
      collection(db, "partnerLinks"),
      where("isDefault", "==", true)
    )
    
    const querySnapshot = await getDocs(defaultQuery)
    
    if (querySnapshot.empty) {
      console.log("Nenhum link padrão encontrado")
      return null
    }
    
    const docData = querySnapshot.docs[0]
    console.log("Link padrão encontrado:", docData.id)
    
    return {
      id: docData.id,
      ...docData.data()
    }
  } catch (error) {
    console.error("Erro ao obter link padrão do Firestore:", error)
    throw error
  }
} 