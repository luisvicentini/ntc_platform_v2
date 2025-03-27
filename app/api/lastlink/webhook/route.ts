import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, addDoc, query, where, getDocs, doc, updateDoc, increment, serverTimestamp, getDoc, orderBy, limit, deleteDoc } from "firebase/firestore"

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
    console.log("========= INÍCIO DO PROCESSAMENTO DO WEBHOOK =========")
    
    // Log dos headers para diagnóstico
    const headers = Object.fromEntries(request.headers.entries())
    console.log("Cabeçalho da requisição:", request.headers)
    console.log("URL do webhook:", request.url)
    console.log("Método:", request.method)
    
    console.log("Headers completos recebidos:", headers)
    
    // Verificar token da Lastlink (pode ser implementado mais tarde)
    const lastlinkToken = headers['x-lastlink-token']
    
    // Por enquanto, aceitar todos os webhooks sem verificação
    console.log("Webhook aceito sem verificação de token")
    
    // Extrair conteúdo do webhook
    const text = await request.text()
    console.log("Corpo da requisição (texto):", text)
    
    // Decodificar JSON
    const webhookData = JSON.parse(text)
    console.log("Webhook Lastlink recebido (decodificado):", JSON.stringify(webhookData))
    
    // Extrair tipo de evento
    const eventType = webhookData.Event
    console.log("Tipo de evento:", eventType)
    
    // Ignorar eventos de teste
    if (webhookData.IsTest) {
      console.log("Webhook de teste ignorado")
      return NextResponse.json({ status: 'success', message: 'Webhook de teste recebido' })
    }
    
    // Extrair dados úteis
    const data = webhookData.Data || {}
    const products = data.Products || []
    const buyer = data.Buyer || {}
    const purchase = data.Purchase || {}
    const subscriptions = data.Subscriptions || []
    
    console.log("Dados extraídos:")
    console.log("- Produtos:", products)
    console.log("- Comprador:", buyer)
    console.log("- Compra:", purchase)
    console.log("- Assinaturas:", subscriptions)
    
    // Obter metadados
    const metadata = purchase.Metadata || data.Metadata || {}
    console.log("Metadados:", metadata)
    
    // Obter dados para identificação do usuário e parceiro
    let userId = metadata.userId || null
    let partnerId = metadata.partnerId || null
    let partnerLinkId = metadata.partnerLinkId || null
    const userEmail = buyer.Email
    
    console.log("Dados para identificação:")
    console.log("- userId:", userId)
    console.log("- partnerId:", partnerId)
    console.log("- partnerLinkId:", partnerLinkId)
    console.log("- userEmail:", userEmail)
    
    // Se não temos userId mas temos email, buscar usuário pelo email
    if (!userId && userEmail) {
      console.log(`Buscando usuário pelo email: ${userEmail}`)
      const usersRef = collection(db, 'users')
      const q = query(usersRef, where('email', '==', userEmail))
      const snapshot = await getDocs(q)
      
      if (!snapshot.empty) {
        userId = snapshot.docs[0].id
        console.log(`Usuário encontrado pelo email. ID: ${userId}`)
      }
    }
    
    // Se ainda não temos partnerId, tentar diferentes estratégias para encontrá-lo
    if (!partnerId) {
      console.log("Tentando encontrar partnerId por métodos alternativos")
      
      // NOVA ESTRATÉGIA: Buscar em pending_subscriptions
      if (userId || userEmail) {
        try {
          const pendingSubscriptionsRef = collection(db, 'pending_subscriptions')
          let pendingQuery;
          
          if (userId) {
            pendingQuery = query(
              pendingSubscriptionsRef,
              where('userId', '==', userId),
              where('expiresAt', '>', new Date().toISOString())
            )
          } else {
            pendingQuery = query(
              pendingSubscriptionsRef,
              where('userEmail', '==', userEmail),
              where('expiresAt', '>', new Date().toISOString())
            )
          }
          
          const pendingSnapshot = await getDocs(pendingQuery)
          if (!pendingSnapshot.empty) {
            // Ordenar por data de criação (mais recente primeiro)
            const sortedDocs = pendingSnapshot.docs.sort((a, b) => {
              const dateA = new Date(a.data().createdAt || 0);
              const dateB = new Date(b.data().createdAt || 0);
              return dateB.getTime() - dateA.getTime();
            });
            
            const pendingData = sortedDocs[0].data();
            
            if (pendingData.partnerId) {
              partnerId = pendingData.partnerId;
              console.log(`Parceiro encontrado em assinatura pendente: ${partnerId}`);
            }
            
            if (pendingData.partnerLinkId) {
              partnerLinkId = pendingData.partnerLinkId;
              console.log(`Link do parceiro encontrado em assinatura pendente: ${partnerLinkId}`);
            }
            
            // Se encontramos os dados, podemos excluir o registro pendente
            await deleteDoc(doc(db, 'pending_subscriptions', sortedDocs[0].id));
            console.log(`Registro pendente ${sortedDocs[0].id} removido após uso`);
          }
        } catch (error) {
          console.error("Erro ao buscar assinaturas pendentes:", error);
        }
      }
      
      // Estratégia 1: Buscar nas transações recentes do mesmo usuário
      if (!partnerId && userId) {
        const transactionsRef = collection(db, 'transactions')
        const q = query(
          transactionsRef,
          where('userId', '==', userId),
          where('partnerId', '!=', null),
          orderBy('partnerId'),
          orderBy('createdAt', 'desc'),
          limit(1)
        )
        
        try {
          const snapshot = await getDocs(q)
          if (!snapshot.empty) {
            partnerId = snapshot.docs[0].data().partnerId
            partnerLinkId = snapshot.docs[0].data().partnerLinkId
            console.log(`Encontrado parceiro em transação anterior: partnerId=${partnerId}, partnerLinkId=${partnerLinkId}`)
          }
        } catch (error) {
          console.error("Erro ao buscar transações:", error)
        }
      }
      
      // Estratégia 2: Buscar em links_access se existe algum acesso recente
      if (!partnerId && userEmail) {
        const linksAccessRef = collection(db, 'links_access')
        const q = query(
          linksAccessRef,
          where('userEmail', '==', userEmail),
          orderBy('createdAt', 'desc'),
          limit(1)
        )
        
        try {
          const snapshot = await getDocs(q)
          if (!snapshot.empty) {
            const mostRecentAccess = snapshot.docs[0].data()
            partnerId = mostRecentAccess.partnerId
            partnerLinkId = mostRecentAccess.linkId
            console.log(`Encontrado parceiro em acesso recente: partnerId=${partnerId}, partnerLinkId=${partnerLinkId}`)
          }
        } catch (error) {
          console.error("Erro ao buscar acessos de links:", error)
        }
      }
      
      // Estratégia 4: Usar um parceiro padrão
      if (!partnerId) {
        try {
          // Buscar configuração de parceiro padrão
          const configRef = doc(db, 'config', 'lastlink')
          const configSnap = await getDoc(configRef)
          
          if (configSnap.exists() && configSnap.data().defaultPartnerId) {
            partnerId = configSnap.data().defaultPartnerId
            console.log(`Usando parceiro padrão: ${partnerId}`)
          } else {
            // Se ainda não temos, usar o primeiro parceiro ativo
            const partnersRef = collection(db, 'users')
            const partnersQuery = query(
              partnersRef,
              where('userType', '==', 'partner'),
              where('isActive', '==', true),
              limit(1)
            )
            
            const partnersSnapshot = await getDocs(partnersQuery)
            
            if (!partnersSnapshot.empty) {
              partnerId = partnersSnapshot.docs[0].id
              console.log(`Usando primeiro parceiro encontrado: ${partnerId}`)
            }
          }
        } catch (error) {
          console.error("Erro ao buscar parceiro padrão:", error)
        }
      }
    }
    
    // Determinar dados do plano
    let planName = "Plano Premium"
    if (products.length > 0 && products[0].Name) {
      planName = products[0].Name
    }
    
    let planInterval = "month"
    let planIntervalCount = 1
    
    if (purchase.Recurrency) {
      if (purchase.Recurrency == 12) {
        planInterval = "year"
        planIntervalCount = 1
      } else if (purchase.Recurrency == 6) {
        planInterval = "semester"
        planIntervalCount = 1
      } else if (purchase.Recurrency == 3) {
        planInterval = "quarter"
        planIntervalCount = 1
      } else {
        planInterval = "month"
        planIntervalCount = purchase.Recurrency || 1
      }
    }
    
    // Verificar se já existe uma transação com o mesmo orderId
    let existingTransaction = null
    if (purchase.PaymentId) {
      const transactionsRef = collection(db, 'transactions')
      const q = query(transactionsRef, where('orderId', '==', purchase.PaymentId))
      const snapshot = await getDocs(q)
      
      if (!snapshot.empty) {
        existingTransaction = {
          id: snapshot.docs[0].id,
          ...snapshot.docs[0].data()
        }
        console.log(`Transação existente encontrada: ${existingTransaction.id}`)
        
        // Atualizar a transação existente com partnerId e partnerLinkId se estiverem faltando
        if (partnerId && !existingTransaction.partnerId) {
          const transactionRef = doc(db, 'transactions', existingTransaction.id)
          await updateDoc(transactionRef, {
            partnerId: partnerId,
            partnerLinkId: partnerLinkId
          })
          console.log(`Transação ${existingTransaction.id} atualizada com partnerId=${partnerId}, partnerLinkId=${partnerLinkId}`)
          
          // Atualizar o objeto local também
          existingTransaction.partnerId = partnerId
          existingTransaction.partnerLinkId = partnerLinkId
        }
      }
    }
    
    // Se já existe uma transação e não é um evento de confirmação, simplesmente retornar
    if (existingTransaction && eventType !== 'Purchase_Order_Confirmed' && eventType !== 'Purchase_Request_Confirmed') {
      console.log("Transação já existe e evento não é de confirmação, ignorando")
      return NextResponse.json({ status: 'success', message: 'Webhook processado, transação já existe' })
    }
    
    // Criar objeto da transação
    const transactionData = {
      orderId: purchase.PaymentId || '',
      amount: purchase.Price?.Value || 0,
      paymentMethod: purchase.Payment?.PaymentMethod || '',
      installments: purchase.Payment?.NumberOfInstallments || 1,
      paidAt: purchase.PaymentDate || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
      planName,
      planInterval,
      planIntervalCount,
      userId,
      userEmail,
      userName: buyer.Name || '',
      partnerId,
      partnerLinkId,
      status: 'active',
      type: 'lastlink',
      provider: 'lastlink',
      rawData: text
    }
    
    console.log("Salvando transação no banco de dados:", transactionData)
    
    // Salvar transação
    let transactionId
    if (existingTransaction) {
      transactionId = existingTransaction.id
    } else {
      const docRef = await addDoc(collection(db, 'transactions'), transactionData)
      transactionId = docRef.id
    }
    
    console.log(`Transação salva com ID: ${transactionId}`)
    
    // Criar assinatura se for um evento de confirmação
    if ((eventType === 'Purchase_Order_Confirmed' || eventType === 'Purchase_Request_Confirmed' || eventType === 'Subscription_Product_Access') && userId && partnerId) {
      try {
        // Verificar se já existe uma assinatura ativa para este usuário/parceiro
        const subscriptionsRef = collection(db, 'subscriptions')
        const q = query(
          subscriptionsRef,
          where('userId', '==', userId),
          where('partnerId', '==', partnerId),
          where('status', '==', 'active')
        )
        const snapshot = await getDocs(q)
        
        if (snapshot.empty) {
          // Criar nova assinatura
          const subscriptionData = {
            userId,
            partnerId,
            partnerLinkId,
            transactionId,
            planName,
            planInterval,
            planIntervalCount,
            price: purchase.Price?.Value || 0,
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 ano
            status: 'active',
            paymentMethod: purchase.Payment?.PaymentMethod || 'pix',
            provider: 'lastlink',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          
          const docRef = await addDoc(collection(db, 'subscriptions'), subscriptionData)
          console.log(`Assinatura criada com ID: ${docRef.id}`)
          
          // Incrementar contagem de conversões do link se tiver partnerLinkId
          if (partnerLinkId) {
            const linkRef = doc(db, 'partnerLinks', partnerLinkId)
            await updateDoc(linkRef, {
              conversions: increment(1),
              updatedAt: new Date().toISOString()
            })
            console.log(`Incrementada conversão do link ${partnerLinkId}`)
          }
        } else {
          console.log("Assinatura ativa já existe para este usuário e parceiro")
        }
      } catch (error) {
        console.error("Erro ao criar assinatura:", error)
        console.log("Não foi possível criar assinatura: erro ao processar")
      }
    } else {
      console.log("Não foi possível criar assinatura: faltam userId ou partnerId")
    }
    
    console.log("========= FIM DO PROCESSAMENTO DO WEBHOOK =========")
    
    return NextResponse.json({ status: 'success', message: 'Webhook processado com sucesso' })
  } catch (error) {
    console.error("Erro ao processar webhook:", error)
    return NextResponse.json({ status: 'error', message: 'Erro ao processar webhook' }, { status: 500 })
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
        
        // Verificar se temos informações válidas
        if (!purchase || !purchase.PaymentId) {
          console.log("Dados de pagamento incompletos")
          return NextResponse.json({ 
            error: "Dados de pagamento incompletos" 
          }, { status: 400 })
        }
        
        console.log("Processando pagamento confirmado:", purchase)
        
        // Determinar o ID e email do membro
        const customerEmail = buyer?.Email || ""
        const userId = purchase.Metadata?.userId || buyer?.Id || ""
        console.log("ID do usuário:", userId)
        console.log("Email do cliente:", customerEmail)
        
        // Buscar o usuário pelo email se não temos o ID
        if (!memberId && customerEmail) {
          console.log(`Tentando encontrar usuário pelo email: ${customerEmail}`)
          try {
            const usersRef = collection(db, "users")
            const userQuery = query(usersRef, where("email", "==", customerEmail.toLowerCase()))
            const userSnapshot = await getDocs(userQuery)
            
            if (!userSnapshot.empty) {
              const userData = userSnapshot.docs[0].data()
              memberId = userData.uid || userSnapshot.docs[0].id
              console.log(`Usuário encontrado pelo email. ID: ${memberId}`)
            } else {
              console.log(`Usuário não encontrado pelo email: ${customerEmail}`)
            }
          } catch (error) {
            console.error("Erro ao buscar usuário pelo email:", error)
          }
        }
        
        // Se ainda não encontramos o membro, tentar pelo ID
        if (!memberId && userId) {
          console.log(`Tentando encontrar usuário pelo ID: ${userId}`)
          try {
            // Verificar se o ID corresponde a um documento na coleção users
            const userRef = doc(db, "users", userId)
            const userDoc = await getDoc(userRef)
            
            if (userDoc.exists()) {
              const userData = userDoc.data()
              memberId = userData.uid || userId
              console.log(`Usuário encontrado pelo ID no documento. ID: ${memberId}`)
            } else {
              // Se não, considerar o ID fornecido como UID
              memberId = userId
              console.log(`Usando ID fornecido como ID do membro: ${memberId}`)
            }
          } catch (error) {
            console.error("Erro ao buscar usuário pelo ID:", error)
            // Em caso de erro, usar o ID fornecido
            memberId = userId
          }
        }
        
        console.log(`ID do membro determinado: ${memberId || "Não encontrado"}`)
        
        eventData = {
          ...eventData,
          orderId: purchase.PaymentId,
          amount: purchase.Price?.Value || 0,
          status: "active",
          paidAt: purchase.PaymentDate || new Date().toISOString(),
          paymentMethod: purchase.Payment?.PaymentMethod || "",
          installments: purchase.Payment?.NumberOfInstallments || 1,
          productName: products[0]?.Name || "",
          partnerId: purchase.Metadata?.partnerId || null,
          partnerLinkId: purchase.Metadata?.partnerLinkId || null
        } as PaymentEventData
        
        // Salvar o pagamento
        const paymentCollectionRef = collection(db, collectionName)
        const paymentDocRef = await addDoc(paymentCollectionRef, eventData)
        
        // Criar ou atualizar assinatura se temos um ID de membro
        if (memberId) {
          try {
            console.log("Criando/atualizando assinatura para o membro:", memberId)
            
            // Extrair nome do plano do produto
            const planName = products[0]?.Name || "Plano Premium"
            
            // Determinar o intervalo e contagem com base no nome ou usar valores padrão
            let planInterval = "month"
            let planIntervalCount = 1
            
            if (planName.toLowerCase().includes("anual")) {
              planInterval = "year"
              planIntervalCount = 1
            } else if (planName.toLowerCase().includes("semestral")) {
              planInterval = "month"
              planIntervalCount = 6
            } else if (planName.toLowerCase().includes("trimestral")) {
              planInterval = "month"
              planIntervalCount = 3
            }
            
            // Adicionar detalhes do plano ao pagamento
            await updateDoc(paymentDocRef, {
              planName,
              planInterval,
              planIntervalCount
            })
            
            // Criar ou atualizar a assinatura com todos os detalhes necessários
            await createOrUpdateSubscription(
              memberId, 
              "active", 
              purchase.PaymentId,
              null,
              purchase.Metadata?.partnerId || null,
              purchase.Metadata?.partnerLinkId || null
            )
            
            console.log("Assinatura criada/atualizada com sucesso")
          } catch (error) {
            console.error("Erro ao criar/atualizar assinatura:", error)
          }
        } else {
          console.log("Não foi possível criar assinatura: ID do membro não encontrado")
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
      updateData.planInterval = paymentDetails.planInterval || "month"
      updateData.planIntervalCount = paymentDetails.planIntervalCount || 1
      updateData.paidAt = paymentDetails.paidAt
      
      // Calcular o período atual com base no intervalo do plano
      const paidAt = new Date(paymentDetails.paidAt)
      const interval = paymentDetails.planInterval || "month"
      const intervalCount = paymentDetails.planIntervalCount || 1
      let expiresAt = new Date(paidAt)
      
      if (interval === "month") {
        expiresAt.setMonth(expiresAt.getMonth() + intervalCount)
      } else if (interval === "year") {
        expiresAt.setFullYear(expiresAt.getFullYear() + intervalCount)
      } else if (interval === "week") {
        expiresAt.setDate(expiresAt.getDate() + (7 * intervalCount))
      } else if (interval === "day") {
        expiresAt.setDate(expiresAt.getDate() + intervalCount)
      }
      
      updateData.currentPeriodStart = paidAt.toISOString()
      updateData.currentPeriodEnd = expiresAt.toISOString()
      updateData.expiresAt = expiresAt.toISOString()
      
      // Gerar um priceId baseado no nome do plano
      if (paymentDetails.planName) {
        updateData.priceId = `lastlink_${paymentDetails.planName.toLowerCase().replace(/\s/g, '_')}`
      } else {
        updateData.priceId = "lastlink_premium"
      }
    }

    // Se não existem assinaturas ou se a assinatura existente está cancelada, criar uma nova
    if (subscriptionSnapshot.empty || (status === "active" && subscriptionSnapshot.docs.some(doc => doc.data().status === "canceled"))) {
      // Criar nova assinatura
      console.log("Criando nova assinatura Lastlink")
      
      // Se não temos detalhes de pagamento, usar valores padrão
      const now = new Date()
      const oneMonthLater = new Date(now)
      oneMonthLater.setMonth(now.getMonth() + 1)
      
      const expiresAt = updateData.expiresAt || oneMonthLater.toISOString()
      
      const subscriptionData: Record<string, any> = {
        memberId,
        partnerId,
        status,
        paymentProvider: "lastlink",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        type: "lastlink", // Adicionar tipo explícito
        ...updateData
      }
      
      // Fornecer valores padrão se não temos detalhes do pagamento
      if (!paymentDetails) {
        subscriptionData.planName = "Plano Premium"
        subscriptionData.planInterval = "month"
        subscriptionData.planIntervalCount = 1
        subscriptionData.priceId = "lastlink_premium"
        subscriptionData.currentPeriodStart = new Date().toISOString()
        subscriptionData.currentPeriodEnd = expiresAt
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

// Endpoint para testar a autenticação do webhook
export async function GET(request: Request) {
  try {
    // Verificar o token para autenticação
    const headers = Object.fromEntries(request.headers.entries())
    
    // Log de todos os cabeçalhos para depuração
    console.log("Todos os cabeçalhos recebidos:", headers)
    
    const token = request.headers.get("x-lastlink-token") || 
                 request.headers.get("x-lastlink-webhook-token") || 
                 request.headers.get("authorization")?.replace("Bearer ", "") ||
                 request.headers.get("x-api-key")
    
    // Token fornecido pela Lastlink
    const expectedToken = "fdf8727af48b4962bb74226ff491ca37"
    
    // Aceitar qualquer token para debug
    return NextResponse.json({
      status: "success",
      message: "Autenticação do webhook em modo debug - todos os tokens são aceitos",
      receivedToken: token ? token.substring(0, 5) + "..." : "nenhum",
      expectedToken: expectedToken.substring(0, 5) + "...",
      allHeaders: headers,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("Erro ao testar webhook:", error)
    return NextResponse.json(
      { error: "Erro interno ao testar webhook" },
      { status: 500 }
    )
  }
}

// Função para construir resposta com cabeçalhos CORS
function corsResponse(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-lastlink-token',
    },
  })
}

// Handler para Options (preflight CORS)
export async function OPTIONS() {
  return corsResponse({})
}