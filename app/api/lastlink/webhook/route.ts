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
    
    // Buscar o usuário pelo e-mail
    let memberId: string | null = null
    if (buyer.Email) {
      const usersRef = collection(db, "users")
      const userQuery = query(usersRef, where("email", "==", buyer.Email.toLowerCase()))
      const userSnapshot = await getDocs(userQuery)
      
      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data()
        memberId = userData.uid || userSnapshot.docs[0].id
      }
    }
    
    // Também buscar pelo userId se fornecido nos metadados
    if (!memberId && userId) {
      try {
        const userRef = doc(db, "users", userId)
        const userDoc = await getDoc(userRef)
        
        if (userDoc.exists()) {
          const userData = userDoc.data()
          memberId = userData.uid || userId
        }
      } catch (err) {
        console.error("Erro ao buscar usuário pelo userId:", err)
      }
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
        eventData = {
          ...eventData,
          orderId: purchase.PaymentId || "",
          amount: purchase.Price?.Value || 0,
          status: "confirmed",
          paidAt: purchase.PaymentDate || new Date().toISOString(),
          productName: products[0]?.Name || "",
          paymentMethod: purchase.Payment?.PaymentMethod || "",
          installments: purchase.Payment?.NumberOfInstallments || 1
        } as PaymentEventData
        
        // Se temos um membro identificado, criar assinatura
        if (memberId) {
          await createOrUpdateSubscription(
            memberId, 
            "active", 
            purchase.PaymentId || null,
            null,
            partnerId,
            partnerLinkId
          )
        }
        break
        
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
          isRecurrent: true
        } as PaymentEventData
        
        // Se temos um membro identificado, atualizar assinatura
        if (memberId) {
          await createOrUpdateSubscription(
            memberId, 
            "active", 
            purchase.PaymentId || null,
            null,
            partnerId,
            partnerLinkId
          )
        }
        break
        
      // Para outros eventos, apenas registramos os dados base
    }
    
    // Salvar no Firestore
    const collectionRef = collection(db, collectionName)
    const docRef = await addDoc(collectionRef, eventData)
    
    return NextResponse.json({
      success: true,
      message: `Evento ${eventType} processado com sucesso`,
      id: docRef.id
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
    
    // Se ainda não temos o partnerId, não podemos criar a assinatura
    if (!partnerId && status === "active") {
      console.error("Não foi possível criar assinatura: falta o ID do parceiro")
      return
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
        where("paymentProvider", "==", "lastlink"),
        where("status", "==", "active")
      )
    } else {
      // Caso contrário, buscamos todas as assinaturas Lastlink ativas do membro
      subscriptionQuery = query(
        subscriptionsRef,
        where("memberId", "==", memberId),
        where("paymentProvider", "==", "lastlink"),
        where("status", "==", "active")
      )
    }
    
    const subscriptionSnapshot = await getDocs(subscriptionQuery)
    
    const updateData: Record<string, any> = {
      status,
      updatedAt: new Date().toISOString()
    }
    
    // Adicionar campos opcionais se fornecidos
    if (orderId) updateData.orderId = orderId
    if (status === "canceled" && reason) updateData.cancelReason = reason
    if (status === "expired") updateData.expiredAt = new Date().toISOString()
    
    // Criar nova assinatura se não existir e temos partnerId
    if (subscriptionSnapshot.empty && status === "active" && partnerId) {
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
      
      // Criar a assinatura
      const subscriptionData = {
        memberId,
        partnerId,
        partnerName,
        status: "active",
        paymentProvider: "lastlink",
        orderId,
        partnerLinkId: partnerLinkId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      const docRef = await addDoc(subscriptionsRef, subscriptionData)
      console.log(`Assinatura criada com sucesso: ${docRef.id}`)
      
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
    } else if (!subscriptionSnapshot.empty) {
      // Atualizar assinatura existente
      const batch = subscriptionSnapshot.docs.map(async (doc) => {
        await updateDoc(doc.ref, updateData)
        console.log(`Assinatura ${doc.id} atualizada para status: ${status}`)
      })
      
      await Promise.all(batch)
    }
  } catch (error) {
    console.error("Erro ao atualizar assinatura:", error)
  }
}