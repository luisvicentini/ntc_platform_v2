import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where, getDoc, doc } from "firebase/firestore"
import { jwtDecode } from "jwt-decode"
import type { SessionToken } from "@/types/session"
import jwt from "jsonwebtoken"

// Função para buscar o link de pagamento padrão
async function getDefaultLink() {
  const defaultPaymentLinkQuery = query(
    collection(db, "partnerLinks"),
    where("isDefault", "==", true)
  )
  
  const defaultPaymentLinkSnapshot = await getDocs(defaultPaymentLinkQuery)
  
  if (!defaultPaymentLinkSnapshot.empty) {
    const linkDoc = defaultPaymentLinkSnapshot.docs[0]
    return {
      id: linkDoc.id,
      ...linkDoc.data()
    }
  }
  
  return null
}

// Função para buscar todos os estabelecimentos ativos
async function getBatchEstablishments() {
  const establishmentsRef = collection(db, "establishments")
  const activeEstablishmentsQuery = query(
    establishmentsRef,
    where("status", "==", "active")
  )
  
  const establishmentsSnapshot = await getDocs(activeEstablishmentsQuery)
  
  return establishmentsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }))
}

export async function GET(request: Request) {
  try {
    // Obter token de autenticação do cabeçalho
    const sessionToken = request.headers.get("x-session-token")
    
    if (!sessionToken) {
      return NextResponse.json({ error: "Token de sessão não fornecido" }, { status: 401 })
    }
    
    // Validar token
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      return NextResponse.json({ error: "Configuração JWT ausente" }, { status: 500 })
    }
    
    let memberId
    let userEmail
    try {
      const decodedToken = jwt.verify(sessionToken, jwtSecret)
      if (typeof decodedToken === "object" && decodedToken !== null) {
        memberId = decodedToken.uid || decodedToken.id
        userEmail = decodedToken.email || null
      }
    } catch (error) {
      console.error("Erro ao verificar token:", error)
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }
    
    if (!memberId && !userEmail) {
      return NextResponse.json({ error: "ID ou Email do usuário não encontrado no token" }, { status: 401 })
    }
    
    console.log(`Buscando feed para usuário: ID=${memberId || 'N/A'}, Email=${userEmail || 'N/A'}`)

    // Verificar assinaturas do usuário
    // 1. Buscar assinaturas Stripe pelos status
    const stripeSubscriptionsRef = collection(db, "subscriptions")
    let stripeSubscriptionsQuery

    if (memberId) {
      stripeSubscriptionsQuery = query(
        stripeSubscriptionsRef,
        where("memberId", "==", memberId),
        where("status", "in", ["active", "trialing"])
      )
    } else {
      stripeSubscriptionsQuery = query(
        stripeSubscriptionsRef,
        where("status", "in", ["active", "trialing"])
      )
    }
    
    const stripeSubscriptionsSnapshot = await getDocs(stripeSubscriptionsQuery)
    
    // 1.1 Buscar assinaturas com type="stripe" e status ativo
    const stripeTypeQuery = query(
      stripeSubscriptionsRef,
      where("memberId", "==", memberId),
      where("status", "in", ["active", "trialing"]),
      where("type", "==", "stripe")
    )
    
    const stripeTypeSnapshot = await getDocs(stripeTypeQuery)
    console.log(`- Stripe (type): ${stripeTypeSnapshot.size}`)
    
    // Adicionar verificação de stripeSubscriptionId para identificar assinaturas Stripe
    const stripeIdQuery = query(
      stripeSubscriptionsRef,
      where("memberId", "==", memberId),
      where("status", "in", ["active", "trialing"])
    )
    // Não podemos filtrar diretamente por existência de campo no Firestore
    // Por isso precisamos verificar após receber os documentos

    const stripeIdSnapshot = await getDocs(stripeIdQuery)
    const hasActiveStripeSubscriptionById = stripeIdSnapshot.docs.some(doc => {
      const data = doc.data()
      return data.stripeSubscriptionId && 
             data.stripeSubscriptionId.length > 0 && 
             (data.status === "active" || data.status === "trialing")
    })

    // Adicionar verificação de webhookEvent para identificar assinaturas Lastlink
    const lastlinkWebhookQuery = query(
      stripeSubscriptionsRef,
      where("memberId", "==", memberId),
      where("status", "in", ["active", "ativa", "iniciada", "paid"])
    )

    const lastlinkWebhookSnapshot = await getDocs(lastlinkWebhookQuery)
    const hasActiveLastlinkByWebhook = lastlinkWebhookSnapshot.docs.some(doc => {
      const data = doc.data()
      return data.webhookEvent === "Purchase_Request_Confirmed" && 
             (data.status === "active" || data.status === "ativa" || 
              data.status === "iniciada" || data.status === "paid")
    })

    console.log(`- Stripe (por SubscriptionId): ${hasActiveStripeSubscriptionById ? 'Sim' : 'Não'}`)
    console.log(`- Lastlink (por webhookEvent): ${hasActiveLastlinkByWebhook ? 'Sim' : 'Não'}`)

    let hasActiveStripeSubscription = stripeSubscriptionsSnapshot.size > 0 || 
                                    stripeTypeSnapshot.size > 0 ||
                                    hasActiveStripeSubscriptionById

    // Verificar por userId se memberId não foi encontrado
    if (!hasActiveStripeSubscription && memberId) {
      const stripeUserIdQuery = query(
        stripeSubscriptionsRef,
        where("userId", "==", memberId),
        where("status", "in", ["active", "trialing"])
      )
      
      const stripeUserIdSnapshot = await getDocs(stripeUserIdQuery)
      hasActiveStripeSubscription = stripeUserIdSnapshot.size > 0
    }

    // Verificar por email
    if (!hasActiveStripeSubscription && userEmail) {
      const stripeEmailQuery = query(
        stripeSubscriptionsRef,
        where("userEmail", "==", userEmail.toLowerCase()),
        where("status", "in", ["active", "trialing"])
      )
      
      const stripeEmailSnapshot = await getDocs(stripeEmailQuery)
      hasActiveStripeSubscription = stripeEmailSnapshot.size > 0
    }

    // Verificar assinaturas Lastlink por emails
    let hasActiveLastlinkSubscription = false
    if (userEmail) {
      const lastlinkEmailQuery = query(
        stripeSubscriptionsRef,
        where("userEmail", "==", userEmail.toLowerCase()),
        where("status", "in", ["active", "ativa", "iniciada", "paid"])
      )
      
      const lastlinkEmailSnapshot = await getDocs(lastlinkEmailQuery)
      hasActiveLastlinkSubscription = lastlinkEmailSnapshot.docs.some(doc => {
        const data = doc.data()
        return (data.provider === "lastlink" || 
               data.paymentProvider === "lastlink" || 
               data.checkoutType === "lastlink" ||
               data.type === "lastlink")
      })
    }

    // Se não encontrou por email, continuar com as verificações existentes por memberId
    if (!hasActiveLastlinkSubscription && memberId) {
      // 2. Buscar assinaturas Lastlink ativas (com provider específico)
      const lastlinkProviderSubscriptionsQuery = query(
        stripeSubscriptionsRef,
        where("memberId", "==", memberId),
        where("status", "in", ["active", "ativa", "iniciada", "paid"]),
        where("provider", "==", "lastlink")
      )
      
      const lastlinkProviderSnapshot = await getDocs(lastlinkProviderSubscriptionsQuery)
      
      // 3. Buscar assinaturas Lastlink ativas (com paymentProvider)
      const lastlinkPaymentProviderQuery = query(
        stripeSubscriptionsRef,
        where("memberId", "==", memberId),
        where("status", "in", ["active", "ativa", "iniciada", "paid"]),
        where("paymentProvider", "==", "lastlink")
      )
      
      const lastlinkPaymentProviderSnapshot = await getDocs(lastlinkPaymentProviderQuery)
      
      // 4. Buscar assinaturas onde checkoutType é lastlink
      const lastlinkCheckoutTypeQuery = query(
        stripeSubscriptionsRef,
        where("memberId", "==", memberId),
        where("status", "in", ["active", "ativa", "iniciada", "paid"]),
        where("checkoutType", "==", "lastlink")
      )
      
      const lastlinkCheckoutTypeSnapshot = await getDocs(lastlinkCheckoutTypeQuery)
      
      // 5. Buscar assinaturas onde type é lastlink
      const lastlinkTypeQuery = query(
        stripeSubscriptionsRef,
        where("memberId", "==", memberId),
        where("status", "in", ["active", "ativa", "iniciada", "paid"]),
        where("type", "==", "lastlink")
      )
      
      const lastlinkTypeSnapshot = await getDocs(lastlinkTypeQuery)
      
      console.log(`- Lastlink (provider): ${lastlinkProviderSnapshot.size}`)
      console.log(`- Lastlink (paymentProvider): ${lastlinkPaymentProviderSnapshot.size}`)
      console.log(`- Lastlink (checkoutType): ${lastlinkCheckoutTypeSnapshot.size}`)
      console.log(`- Lastlink (type): ${lastlinkTypeSnapshot.size}`)
      
      const hasActiveByMemberId = 
        lastlinkProviderSnapshot.size > 0 || 
        lastlinkPaymentProviderSnapshot.size > 0 ||
        lastlinkCheckoutTypeSnapshot.size > 0 ||
        lastlinkTypeSnapshot.size > 0;
        
      hasActiveLastlinkSubscription = hasActiveLastlinkSubscription || hasActiveByMemberId || hasActiveLastlinkByWebhook;
      
      // Coletar IDs de parceiros para todas consultas
      if (hasActiveByMemberId) {
        // Adicionar IDs de parceiros das assinaturas Lastlink
        lastlinkProviderSnapshot.docs.forEach(doc => {
          const partnerData = doc.data()
          if (partnerData.partnerId) {
            partnerIds.add(partnerData.partnerId)
          }
        })
        
        // Adicionar parceiros do checkoutType Lastlink
        lastlinkCheckoutTypeSnapshot.docs.forEach(doc => {
          const partnerData = doc.data()
          if (partnerData.partnerId) {
            partnerIds.add(partnerData.partnerId)
          }
        })
        
        // Adicionar parceiros do paymentProvider Lastlink
        lastlinkPaymentProviderSnapshot.docs.forEach(doc => {
          const partnerData = doc.data()
          if (partnerData.partnerId) {
            partnerIds.add(partnerData.partnerId)
          }
        })
        
        // Adicionar IDs de parceiros das assinaturas com type="lastlink"
        lastlinkTypeSnapshot.docs.forEach(doc => {
          const partnerData = doc.data()
          if (partnerData.partnerId) {
            partnerIds.add(partnerData.partnerId)
          }
        })
      }
    }

    console.log(`Verificação de assinaturas para usuário: ID=${memberId || 'N/A'}, Email=${userEmail || 'N/A'}`)
    console.log(`- Stripe ativas: ${stripeSubscriptionsSnapshot.size}`)
    console.log(`- Lastlink (por webhookEvent): ${hasActiveLastlinkByWebhook ? 'Sim' : 'Não'}`)
    console.log(`- Lastlink (por email): ${hasActiveLastlinkSubscription ? 'Sim' : 'Não'}`)
    console.log(`- Status final: ${hasActiveStripeSubscription || hasActiveLastlinkSubscription ? 'ASSINATURA ATIVA' : 'SEM ASSINATURA ATIVA'}`)

    const hasActiveSubscription = hasActiveStripeSubscription || hasActiveLastlinkSubscription
    
    // Se não tiver assinatura ativa, verificar se tem assinatura pendente ou cancelada
    if (!hasActiveSubscription) {
      console.log("O membro não tem assinatura ativa")
      
      // Verificar assinaturas pendentes
      const pendingSubscriptionsQuery = query(
        stripeSubscriptionsRef,
        where("memberId", "==", memberId),
        where("status", "in", ["past_due", "incomplete", "unpaid", "pendente"]) 
      )
      
      // Verificar assinaturas canceladas
      const canceledSubscriptionsQuery = query(
        stripeSubscriptionsRef,
        where("memberId", "==", memberId),
        where("status", "in", ["canceled", "cancelled", "cancelada", "inactive", "inativa"]) 
      )
      
      const pendingSnapshot = await getDocs(pendingSubscriptionsQuery)
      const canceledSnapshot = await getDocs(canceledSubscriptionsQuery)
      
      const pendingSubscription = pendingSnapshot.size > 0
      const canceledSubscription = canceledSnapshot.size > 0
      
      // Tentativa de buscar o link padrão para oferecer ao usuário
      try {
        const defaultLink = await getDefaultLink()
        
        const partnerEstablishments = await getBatchEstablishments()
        
        // Retorna todos os estabelecimentos, mas com flag indicando que o usuário não tem assinatura
        return NextResponse.json({
          status: pendingSubscription ? "pending" : canceledSubscription ? "canceled" : "none",
          message: pendingSubscription 
            ? "Sua assinatura está pendente de pagamento. Após a confirmação do pagamento, você terá acesso aos cupons."
            : canceledSubscription
              ? "Sua assinatura foi cancelada. Para continuar acessando os cupons, é necessário adquirir uma nova assinatura."
              : "Você não possui uma assinatura ativa. Para acessar os cupons, adquira uma assinatura.",
          defaultPaymentLink: defaultLink,
          establishments: partnerEstablishments // Sempre enviamos os estabelecimentos
        })
      } catch (error) {
        console.error("Erro ao buscar o link padrão:", error)
        
        const partnerEstablishments = await getBatchEstablishments()
        
        return NextResponse.json({
          status: pendingSubscription ? "pending" : canceledSubscription ? "canceled" : "none",
          message: "Você não possui uma assinatura ativa. Para acessar os cupons, adquira uma assinatura.",
          establishments: partnerEstablishments // Sempre enviamos os estabelecimentos
        })
      }
    }
    
    // A partir daqui, sabemos que o usuário tem uma assinatura ativa
    console.log(`Usuário com assinatura ativa. Buscando estabelecimentos...`)
    
    // Extrair IDs dos parceiros de todas as assinaturas ativas
    const partnerIds = new Set()
    
    // Adicionar IDs de parceiros das assinaturas Stripe
    stripeSubscriptionsSnapshot.docs.forEach(doc => {
      const partnerData = doc.data()
      if (partnerData.partnerId) {
        partnerIds.add(partnerData.partnerId)
      }
    })
    
    // Adicionar IDs de parceiros das assinaturas com type="stripe"
    stripeTypeSnapshot.docs.forEach(doc => {
      const partnerData = doc.data()
      if (partnerData.partnerId) {
        partnerIds.add(partnerData.partnerId)
      }
    })
    
    // Adicionar IDs de parceiros das assinaturas Lastlink
    lastlinkWebhookSnapshot.docs.forEach(doc => {
      const data = doc.data()
      if (data.webhookEvent === "Purchase_Request_Confirmed" && 
          (data.status === "active" || data.status === "ativa" || 
           data.status === "iniciada" || data.status === "paid") &&
          data.partnerId) {
        partnerIds.add(data.partnerId)
      }
    })
    
    // Converter Set para Array para usar na consulta
    const partnerIdsArray = Array.from(partnerIds)
    console.log(`Total de parceiros únicos: ${partnerIdsArray.length}`)
    
    // Buscar estabelecimentos em destaque
    const featuredEstablishmentsRef = collection(db, "establishments")
    const featuredQuery = query(
      featuredEstablishmentsRef,
      where("isFeatured", "==", true),
      where("status", "==", "active")
    )
    
    const featuredSnapshot = await getDocs(featuredQuery)
    const featuredEstablishments = featuredSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    console.log(`Encontrados ${featuredEstablishments.length} estabelecimentos em destaque`)
    
    // Buscar estabelecimentos dos parceiros
    let partnerEstablishments: any[] = []
    
    if (partnerIdsArray.length > 0) {
      // Para lidar com possíveis limitações do Firestore (in aceita no máximo 10 valores)
      for (let i = 0; i < partnerIdsArray.length; i += 10) {
        const batch = partnerIdsArray.slice(i, i + 10)
        
        if (batch.length > 0) {
          const establishmentsRef = collection(db, "establishments")
          const establishmentsQuery = query(
            establishmentsRef,
            where("partnerId", "in", batch),
            where("status", "==", "active")
          )
          
          const establishmentsSnapshot = await getDocs(establishmentsQuery)
          
          establishmentsSnapshot.docs.forEach(doc => {
            partnerEstablishments.push({
              id: doc.id,
              ...doc.data()
            })
          })
        }
      }
    }
    
    console.log(`Encontrados ${partnerEstablishments.length} estabelecimentos de parceiros`)
    
    // Combinar resultados (removendo duplicatas por ID)
    const allEstablishmentIds = new Set<string>()
    const combinedEstablishments: any[] = []
    
    // Adicionar estabelecimentos em destaque
    featuredEstablishments.forEach(est => {
      if (!allEstablishmentIds.has(est.id)) {
        allEstablishmentIds.add(est.id)
        combinedEstablishments.push(est)
      }
    })
    
    // Adicionar estabelecimentos dos parceiros
    partnerEstablishments.forEach(est => {
      if (!allEstablishmentIds.has(est.id)) {
        allEstablishmentIds.add(est.id)
        combinedEstablishments.push(est)
      }
    })
    
    console.log(`Total de estabelecimentos retornados: ${combinedEstablishments.length}`)
    
    return NextResponse.json({ 
      status: "active",
      establishments: combinedEstablishments,
      featuredCount: featuredEstablishments.length,
      partnerCount: partnerEstablishments.length
    })
  } catch (error) {
    console.error("Erro ao carregar feed:", error)
    return NextResponse.json({ error: "Erro ao carregar estabelecimentos" }, { status: 500 })
  }
}