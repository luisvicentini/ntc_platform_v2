import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, addDoc, query, where, getDocs, doc, updateDoc, increment, serverTimestamp, getDoc } from "firebase/firestore"

// Interface para os eventos do Lastlink
interface LastlinkEventData {
  event?: string
  Buyer?: {
    Id?: string
    Email?: string
    Name?: string
    PhoneNumber?: string
    Document?: string
    Address?: any
  }
  Products?: Array<{
    Id?: string
    Name?: string
  }>
  Subscriptions?: Array<{
    Id?: string
    ProductId?: string
    CanceledDate?: string
    CancellationReason?: string
    ExpiredDate?: string
  }>
  Purchase?: {
    PaymentId?: string
    Recurrency?: number
    PaymentDate?: string
    ChargebackDate?: string
    OriginalPrice?: { Value?: number }
    Price?: { Value?: number }
    Payment?: {
      NumberOfInstallments?: number
      PaymentMethod?: string
    }
    Affiliate?: any
    Pix?: any
    BankSlip?: any
    Metadata?: {
      userId?: string
      partnerId?: string
      partnerLinkId?: string
      [key: string]: any
    }
  }
  Seller?: {
    Id?: string
    Email?: string
  }
  Offer?: {
    Id?: string
    Name?: string
    Url?: string
  }
  [key: string]: any
}

// Interface para os dados de evento base
interface BaseEventData {
  eventType: string
  memberId: string | null
  customerEmail: string
  customerName: string
  createdAt: string
  rawData: any
}

// Interface para os dados de pagamento
interface PaymentEventData extends BaseEventData {
  orderId: string
  amount: number
  status: string
  paidAt?: string
  processedAt?: string
  productName?: string
  paymentMethod?: string
  installments?: number
  isRecurrent?: boolean
}

// Interface para os dados de assinatura
interface SubscriptionEventData extends BaseEventData {
  subscriptionId: string
  canceledDate?: string
  cancelReason?: string
  expiredDate?: string
  productName?: string
}

export async function POST(request: Request) {
  try {
    // Verificar o token para autenticação
    const token = request.headers.get("x-lastlink-token")
    const expectedToken = process.env.LASTLINK_TOKEN
    
    if (!token || token !== expectedToken) {
      console.error("Token inválido ou ausente")
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Processar dados do webhook
    const data: LastlinkEventData = await request.json()
    console.log("Webhook Lastlink recebido:", data)
    
    // Verificar o tipo de evento - pode ser payment.confirmed (formato antigo) ou novos formatos
    const eventType = data.event || ""
    console.log("Tipo de evento:", eventType)
    
    // Se for um novo formato de evento (Purchase_Order_Confirmed, etc)
    if (eventType.includes("_")) {
      return handleNewFormatEvent(eventType, data)
    }

    // Processar no formato antigo (payment.confirmed)
    // Verificar se é um evento de pagamento confirmado
    if (eventType !== "payment.confirmed") {
      return NextResponse.json(
        { message: "Evento ignorado, processamos apenas payment.confirmed" },
        { status: 200 }
      )
    }

    // Dados do pagamento
    const payment = data.payment || {}
    const customer = payment.customer || {}
    const subscription = payment.subscription || {}
    const plan = subscription.plan || {}
    
    // Verificar se temos as informações necessárias
    if (!customer.email || !payment.order_id) {
      return NextResponse.json(
        { error: "Dados insuficientes para processar" },
        { status: 400 }
      )
    }

    // Buscar o usuário pelo e-mail
    const usersRef = collection(db, "users")
    const userQuery = query(usersRef, where("email", "==", customer.email))
    const userSnapshot = await getDocs(userQuery)
    
    if (userSnapshot.empty) {
      console.error("Usuário não encontrado:", customer.email)
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    const userData = userSnapshot.docs[0].data()
    const userId = userSnapshot.docs[0].id
    const memberId = userData.uid || userId

    // Salvar o pagamento no Firestore
    const lastlinkPaymentsRef = collection(db, "lastlink_payments")
    const paymentData = {
      memberId,
      orderId: payment.order_id,
      amount: payment.amount,
      status: payment.status,
      customerEmail: customer.email,
      customerName: customer.name || "",
      planName: plan.name || "",
      planInterval: plan.interval || "month",
      planIntervalCount: plan.interval_count || 1,
      createdAt: new Date().toISOString(),
      paidAt: payment.paid_at || new Date().toISOString(),
      expiresAt: subscription.expires_at || "",
      partnerId: payment.metadata?.partnerId || null,
      partnerLinkId: payment.metadata?.partnerLinkId || null,
      metadata: payment.metadata || {}
    }

    const paymentRef = await addDoc(lastlinkPaymentsRef, paymentData)
    
    // Se houver informações do parceiro, criar uma assinatura
    if (paymentData.partnerId) {
      // Verificar se já existe uma assinatura ativa
      const subscriptionsRef = collection(db, "subscriptions")
      const subscriptionQuery = query(
        subscriptionsRef,
        where("memberId", "==", memberId),
        where("partnerId", "==", paymentData.partnerId),
        where("status", "==", "active")
      )
      
      const subscriptionSnapshot = await getDocs(subscriptionQuery)
      
      if (subscriptionSnapshot.empty) {
        // Criar nova assinatura
        await addDoc(subscriptionsRef, {
          memberId,
          partnerId: paymentData.partnerId,
          status: "active",
          paymentProvider: "lastlink",
          orderId: payment.order_id,
          expiresAt: subscription.expires_at || "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      } else {
        // Atualizar assinatura existente
        const subscriptionDoc = subscriptionSnapshot.docs[0].ref
        await updateDoc(subscriptionDoc, {
          status: "active",
          paymentProvider: "lastlink",
          orderId: payment.order_id,
          expiresAt: subscription.expires_at || "",
          updatedAt: new Date().toISOString()
        })
      }
      
      // Se houver partnerLinkId, incrementar as conversões
      if (paymentData.partnerLinkId) {
        try {
          const partnerLinkRef = doc(db, "partnerLinks", paymentData.partnerLinkId)
          await updateDoc(partnerLinkRef, {
            conversions: increment(1),
            updatedAt: new Date().toISOString()
          })
        } catch (error) {
          console.error("Erro ao incrementar conversões:", error)
        }
      }
    }

    return NextResponse.json(
      { 
        success: true, 
        message: "Pagamento processado com sucesso",
        paymentId: paymentRef.id
      }
    )
  } catch (error) {
    console.error("Erro ao processar webhook:", error)
    return NextResponse.json(
      { error: "Erro interno ao processar webhook" },
      { status: 500 }
    )
  }
}

// Função para lidar com os novos formatos de eventos
async function handleNewFormatEvent(eventType: string, data: LastlinkEventData) {
  try {
    console.log(`Processando evento no novo formato: ${eventType}`)
    console.log("Dados completos do evento:", JSON.stringify(data))
    
    // Extrair informações comuns
    const buyer = data.Buyer || {}
    const products = data.Products || []
    const purchase = data.Purchase || {}
    const subscriptions = data.Subscriptions || []
    
    // Extrair metadados
    const metadata = purchase.Metadata || {}
    const userId = metadata.userId
    const partnerId = metadata.partnerId
    const partnerLinkId = metadata.partnerLinkId
    
    console.log("Metadados do webhook:", { userId, partnerId, partnerLinkId })
    console.log("Dados do comprador:", { email: buyer.Email, name: buyer.Name })
    console.log("Dados do pagamento:", { 
      orderId: purchase.PaymentId, 
      valor: purchase.Price?.Value,
      data: purchase.PaymentDate
    })
    
    // Buscar o usuário pelo e-mail
    let memberId: string | null = null
    if (buyer.Email) {
      console.log(`Buscando usuário pelo email: ${buyer.Email}`)
      const usersRef = collection(db, "users")
      const userQuery = query(usersRef, where("email", "==", buyer.Email.toLowerCase()))
      const userSnapshot = await getDocs(userQuery)
      
      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data()
        memberId = userData.uid || userSnapshot.docs[0].id
        console.log(`Usuário encontrado pelo email. ID: ${memberId}`)
      }
    }
    
    // Também buscar pelo userId se fornecido nos metadados
    if (!memberId && userId) {
      try {
        console.log(`Usuário não encontrado pelo email. Tentando pelo userId: ${userId}`)
        
        // Primeiro tenta buscar documento com este ID
        const userRef = doc(db, "users", userId)
        const userDoc = await getDoc(userRef)
        
        if (userDoc.exists()) {
          const userData = userDoc.data()
          memberId = userData.uid || userId
          console.log(`Usuário encontrado pelo userId como ID do documento. ID: ${memberId}`)
        } else {
          // Se não encontrou, tenta buscar pelo campo uid
          const usersRef = collection(db, "users")
          const uidQuery = query(usersRef, where("uid", "==", userId))
          const uidSnapshot = await getDocs(uidQuery)
          
          if (!uidSnapshot.empty) {
            const userData = uidSnapshot.docs[0].data()
            memberId = userData.uid || uidSnapshot.docs[0].id
            console.log(`Usuário encontrado pelo userId como campo UID. ID: ${memberId}`)
          }
        }
      } catch (err) {
        console.error("Erro ao buscar usuário pelo userId:", err)
      }
    }
    
    if (!memberId) {
      console.error("Não foi possível identificar o usuário. Criando evento sem associação a usuário.")
    } else {
      console.log(`Usuário final identificado. ID: ${memberId}`)
    }
    
    // Definir coleção e dados base de acordo com o tipo de evento
    let collectionName = "lastlink_events"
    let eventData: BaseEventData | PaymentEventData | SubscriptionEventData = {
      eventType,
      memberId,
      customerEmail: buyer.Email || "",
      customerName: buyer.Name || "",
      createdAt: new Date().toISOString(),
      rawData: data
    }
    
    // Processar de acordo com o tipo de evento
    switch (eventType) {
      case "Purchase_Order_Confirmed":
        collectionName = "lastlink_payments"
        const productName = products[0]?.Name || "Plano Premium"
        const amount = purchase.Price?.Value || 0
        
        console.log(`Processando confirmação de pagamento: ${purchase.PaymentId}`)
        console.log(`Produto: ${productName}, Valor: ${amount}`)
        
        eventData = {
          ...eventData,
          orderId: purchase.PaymentId || "",
          amount: amount,
          status: "confirmed",
          paidAt: purchase.PaymentDate || new Date().toISOString(),
          productName: productName,
          paymentMethod: purchase.Payment?.PaymentMethod || "",
          installments: purchase.Payment?.NumberOfInstallments || 1,
          planName: productName,
          planInterval: "month", // Valor padrão, pode ser ajustado
          planIntervalCount: 1    // Valor padrão, pode ser ajustado
        } as PaymentEventData
        
        // Salvar no Firestore primeiro para termos os detalhes do pagamento
        const collectionRef = collection(db, collectionName)
        const paymentDocRef = await addDoc(collectionRef, eventData)
        console.log(`Evento de pagamento salvo com ID: ${paymentDocRef.id}`)
        
        // Se temos um membro identificado, criar assinatura
        if (memberId) {
          console.log(`Criando assinatura para membro: ${memberId}`)
          const subscriptionId = await createOrUpdateSubscription(
            memberId, 
            "active", 
            purchase.PaymentId || null,
            null,
            partnerId,
            partnerLinkId
          )
          console.log(`Resultado da criação da assinatura: ${subscriptionId || 'falha'}`)
        } else {
          console.error("Não foi possível criar assinatura: membro não identificado")
        }
        
        return NextResponse.json({
          success: true,
          message: `Pagamento confirmado processado com sucesso`,
          id: paymentDocRef.id,
          memberFound: !!memberId
        })
        
      case "Payment_Chargeback":
      case "Payment_Refund":
        collectionName = "lastlink_payments"
        eventData = {
          ...eventData,
          orderId: purchase.PaymentId || "",
          amount: purchase.Price?.Value || 0,
          status: eventType === "Payment_Chargeback" ? "chargeback" : "refunded",
          processedAt: purchase.PaymentDate || new Date().toISOString(),
          productName: products[0]?.Name || ""
        } as PaymentEventData
        
        // Se temos um membro identificado, cancelar assinatura
        if (memberId) {
          await createOrUpdateSubscription(
            memberId, 
            "canceled", 
            purchase.PaymentId || null, 
            eventType === "Payment_Chargeback" ? "chargeback" : "refund"
          )
        }
        break
        
      case "Subscription_Canceled":
        eventData = {
          ...eventData,
          subscriptionId: subscriptions[0]?.Id || "",
          canceledDate: subscriptions[0]?.CanceledDate || new Date().toISOString(),
          cancelReason: subscriptions[0]?.CancellationReason || "",
          productName: products[0]?.Name || ""
        } as SubscriptionEventData
        
        // Se temos um membro identificado, cancelar assinatura
        if (memberId) {
          await createOrUpdateSubscription(
            memberId, 
            "canceled", 
            null, 
            subscriptions[0]?.CancellationReason || "manual_cancellation"
          )
        }
        break
        
      case "Subscription_Expired":
        eventData = {
          ...eventData,
          subscriptionId: subscriptions[0]?.Id || "",
          expiredDate: subscriptions[0]?.ExpiredDate || new Date().toISOString(),
          productName: products[0]?.Name || ""
        } as SubscriptionEventData
        
        // Se temos um membro identificado, expirar assinatura
        if (memberId) {
          await createOrUpdateSubscription(memberId, "expired")
        }
        break
        
      case "Recurrent_Payment":
        collectionName = "lastlink_payments"
        eventData = {
          ...eventData,
          orderId: purchase.PaymentId || "",
          amount: purchase.Price?.Value || 0,
          status: "confirmed",
          paidAt: purchase.PaymentDate || new Date().toISOString(),
          productName: products[0]?.Name || "",
          paymentMethod: purchase.Payment?.PaymentMethod || "",
          installments: purchase.Payment?.NumberOfInstallments || 1,
          isRecurrent: true,
          planName: products[0]?.Name || "Plano Premium",
          planInterval: "month", // Valor padrão, pode ser ajustado
          planIntervalCount: 1    // Valor padrão, pode ser ajustado
        } as PaymentEventData
        
        // Salvar no Firestore primeiro
        const recurrentPaymentRef = collection(db, collectionName)
        const recurrentDocRef = await addDoc(recurrentPaymentRef, eventData)
        
        // Se temos um membro identificado, atualizar assinatura
        if (memberId) {
          const subscriptionId = await createOrUpdateSubscription(
            memberId, 
            "active", 
            purchase.PaymentId || null,
            null,
            partnerId,
            partnerLinkId
          )
          console.log(`Assinatura atualizada para pagamento recorrente: ${subscriptionId || 'falha'}`)
        }
        
        return NextResponse.json({
          success: true,
          message: `Pagamento recorrente processado com sucesso`,
          id: recurrentDocRef.id
        })
        
      // Para outros eventos, apenas registramos os dados base
      default:
        console.log(`Tipo de evento não tratado especificamente: ${eventType}`)
    }
    
    // Salvar no Firestore (para casos que não retornaram antes)
    const eventCollectionRef = collection(db, collectionName)
    const eventDocRef = await addDoc(eventCollectionRef, eventData)
    
    return NextResponse.json({
      success: true,
      message: `Evento ${eventType} processado com sucesso`,
      id: eventDocRef.id
    })
  } catch (error) {
    console.error(`Erro ao processar evento ${eventType}:`, error)
    return NextResponse.json(
      { error: `Erro interno ao processar evento ${eventType}` },
      { status: 500 }
    )
  }
}

// Função auxiliar para criar ou atualizar assinatura
async function createOrUpdateSubscription(
  memberId: string, 
  status: string, 
  orderId: string | null = null, 
  reason: string | null = null,
  partnerId: string | null = null,
  partnerLinkId: string | null = null
) {
  try {
    console.log(`Tentando criar/atualizar assinatura - Dados:`, { 
      memberId, 
      status, 
      orderId, 
      partnerId, 
      partnerLinkId 
    })
    
    // Se não temos o partnerId, tente buscar do link
    if (partnerLinkId && !partnerId) {
      try {
        const linkRef = doc(db, "partnerLinks", partnerLinkId)
        const linkDoc = await getDoc(linkRef)
        
        if (linkDoc.exists()) {
          partnerId = linkDoc.data().partnerId
          console.log(`Parceiro encontrado através do link: ${partnerId}`)
        }
      } catch (err) {
        console.error("Erro ao buscar parceiro através do link:", err)
      }
    }
    
    // Se ainda não temos o partnerId, vamos usar um valor padrão para assinaturas Lastlink
    if (!partnerId && status === "active") {
      console.log("Parceiro não encontrado, usando o parceiro lastlink padrão")
      partnerId = process.env.DEFAULT_LASTLINK_PARTNER_ID || "MChsM1JopUMB2ye2Tdvp" // ID do parceiro padrão
    }
    
    console.log(`Parceiro final: ${partnerId}`)
    
    // Buscar detalhes do pagamento se tivermos um orderId
    let paymentDetails = null
    if (orderId) {
      try {
        const paymentsRef = collection(db, "lastlink_payments")
        const paymentQuery = query(
          paymentsRef,
          where("orderId", "==", orderId)
        )
        const paymentSnapshot = await getDocs(paymentQuery)
        
        if (!paymentSnapshot.empty) {
          paymentDetails = paymentSnapshot.docs[0].data()
          console.log(`Detalhes do pagamento encontrados para orderId: ${orderId}`)
        }
      } catch (err) {
        console.error("Erro ao buscar detalhes do pagamento:", err)
      }
    }
    
    // Query base para buscar assinaturas
    let subscriptionQuery
    const subscriptionsRef = collection(db, "subscriptions")
    
    if (partnerId) {
      // Se temos um partnerId, buscamos assinaturas específicas desse parceiro
      subscriptionQuery = query(
        subscriptionsRef,
        where("memberId", "==", memberId),
        where("partnerId", "==", partnerId),
        where("paymentProvider", "==", "lastlink")
      )
    } else {
      // Caso contrário, buscamos todas as assinaturas Lastlink do membro
      subscriptionQuery = query(
        subscriptionsRef,
        where("memberId", "==", memberId),
        where("paymentProvider", "==", "lastlink")
      )
    }
    
    const subscriptionSnapshot = await getDocs(subscriptionQuery)
    console.log(`Assinaturas existentes encontradas: ${subscriptionSnapshot.size}`)
    
    const updateData: Record<string, any> = {
      status,
      updatedAt: new Date().toISOString()
    }
    
    // Adicionar campos opcionais se fornecidos
    if (orderId) updateData.orderId = orderId
    if (status === "canceled" && reason) updateData.cancelReason = reason
    if (status === "expired") updateData.expiredAt = new Date().toISOString()
    
    // Adicionar detalhes do pagamento se disponíveis
    if (paymentDetails) {
      updateData.paymentAmount = paymentDetails.amount
      updateData.planName = paymentDetails.planName
      updateData.planInterval = paymentDetails.planInterval
      updateData.planIntervalCount = paymentDetails.planIntervalCount
      updateData.paidAt = paymentDetails.paidAt
      updateData.expiresAt = paymentDetails.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 dias no futuro
    }
    
    // Criar nova assinatura se não existir ou todas estão inativas
    let shouldCreateNew = subscriptionSnapshot.empty
    
    // Verificar se todas as assinaturas existentes estão inativas
    if (!subscriptionSnapshot.empty) {
      const hasActiveSubscription = subscriptionSnapshot.docs.some(doc => 
        doc.data().status === "active" || doc.data().status === status
      )
      shouldCreateNew = !hasActiveSubscription && status === "active"
    }
    
    if (shouldCreateNew && status === "active" && partnerId) {
      console.log(`Criando nova assinatura para membro ${memberId} com parceiro ${partnerId}`)
      
      // Obter nome do parceiro
      let partnerName = "Parceiro"
      try {
        const partnerRef = doc(db, "users", partnerId)
        const partnerDoc = await getDoc(partnerRef)
        
        if (partnerDoc.exists()) {
          partnerName = partnerDoc.data().displayName || partnerDoc.data().name || "Parceiro"
        }
      } catch (err) {
        console.error("Erro ao buscar nome do parceiro:", err)
      }
      
      // Definir data de expiração se não fornecida
      const expiresAt = (paymentDetails && paymentDetails.expiresAt) 
        ? paymentDetails.expiresAt 
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 dias por padrão
      
      // Criar a assinatura
      const subscriptionData = {
        memberId,
        partnerId,
        partnerName,
        status: "active",
        paymentProvider: "lastlink",
        type: "lastlink", // Adicionar tipo para compatibilidade com assinaturas Stripe
        orderId: orderId || "",
        partnerLinkId: partnerLinkId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expiresAt,
        // Adicionar informações do plano e pagamento se disponíveis
        ...(paymentDetails ? {
          planName: paymentDetails.planName || "Plano Premium",
          planInterval: paymentDetails.planInterval || "month",
          planIntervalCount: paymentDetails.planIntervalCount || 1,
          paymentAmount: paymentDetails.amount || 0,
          paidAt: paymentDetails.paidAt || new Date().toISOString(),
          priceId: `lastlink_${(paymentDetails.planName || "premium").toLowerCase().replace(/\s/g, "_")}`,
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: expiresAt,
        } : {
          planName: "Plano Premium",
          planInterval: "month",
          planIntervalCount: 1,
          priceId: "lastlink_premium",
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: expiresAt,
        })
      }
      
      try {
        const docRef = await addDoc(subscriptionsRef, subscriptionData)
        console.log(`Assinatura criada com sucesso: ${docRef.id} com dados:`, subscriptionData)
        
        // Incrementar contagem de conversões se houver linkId
        if (partnerLinkId) {
          try {
            const linkRef = doc(db, "partnerLinks", partnerLinkId)
            await updateDoc(linkRef, {
              conversions: increment(1),
              updatedAt: new Date().toISOString()
            })
            console.log(`Conversão incrementada para o link ${partnerLinkId}`)
          } catch (err) {
            console.error("Erro ao incrementar conversões:", err)
          }
        }
        
        return docRef.id // Retorna o ID da assinatura criada
      } catch (error) {
        console.error("Erro ao criar assinatura no Firestore:", error)
        throw error
      }
    } else if (!subscriptionSnapshot.empty) {
      // Atualizar assinatura existente
      console.log(`Atualizando ${subscriptionSnapshot.size} assinaturas existentes para status: ${status}`)
      
      const batch = subscriptionSnapshot.docs.map(async (doc) => {
        try {
          const docData = doc.data()
          console.log(`Atualizando assinatura ${doc.id} (status atual: ${docData.status}) para ${status}`)
          
          // Se a assinatura já está cancelada, não alterar para ativa
          if (docData.status === "canceled" && status === "active") {
            console.log(`Assinatura ${doc.id} já está cancelada, criando nova em vez de atualizar`)
            return null
          }
          
          await updateDoc(doc.ref, updateData)
          console.log(`Assinatura ${doc.id} atualizada com sucesso`)
          return doc.id
        } catch (err) {
          console.error(`Erro ao atualizar assinatura ${doc.id}:`, err)
          return null
        }
      })
      
      const updated = await Promise.all(batch)
      return updated.filter(Boolean)[0] // Retorna o primeiro ID atualizado com sucesso
    }
    
    return null
  } catch (error) {
    console.error("Erro ao atualizar assinatura:", error)
    return null
  }
}