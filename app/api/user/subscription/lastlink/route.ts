import { NextResponse } from 'next/server'
import { collection, query, where, getDocs, DocumentData, doc, getDoc, or } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface LastlinkPayment extends DocumentData {
  id: string
  memberId: string
  orderId: string
  amount: number
  status: string
  customerEmail: string
  customerName: string
  planName: string
  planInterval: string
  planIntervalCount: number
  createdAt: string
  paidAt: string
  expiresAt: string
  partnerId: string | null
  partnerLinkId: string | null
  metadata: Record<string, any>
}

interface LastlinkSubscription extends DocumentData {
  id: string
  memberId: string
  partnerId: string
  status: string
  paymentProvider: string
  provider: string
  orderId: string
  expiresAt: string
  createdAt: string
  updatedAt: string
  paymentDetails?: LastlinkPayment | null
  planName?: string
  planInterval?: string
  planIntervalCount?: number
  amount?: number
  paymentAmount?: number
  paidAt?: string
  currentPeriodStart?: string
  currentPeriodEnd?: string
  priceId?: string
  userEmail?: string
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const email = searchParams.get('email')
    const firebaseUid = searchParams.get('firebaseUid')

    console.log('Buscando assinaturas Lastlink para:', { userId, email, firebaseUid })

    if (!userId && !email && !firebaseUid) {
      return NextResponse.json(
        { error: 'Um identificador de usuário é obrigatório' },
        { status: 400 }
      )
    }

    // Coleção de possíveis IDs para o usuário
    const userIds: string[] = []
    let userEmail = email?.toLowerCase()
    
    // Adicionar os IDs fornecidos diretamente
    if (userId) userIds.push(userId)
    if (firebaseUid) userIds.push(firebaseUid)
    
    // Se temos e-mail, tentar encontrar o usuário pelo e-mail
    if (email) {
      try {
        console.log(`Buscando usuário pelo email: ${email}`)
        const usersRef = collection(db, 'users')
        const userQuery = query(usersRef, where('email', '==', email.toLowerCase()))
        const userSnapshot = await getDocs(userQuery)
        
        if (!userSnapshot.empty) {
          const userDoc = userSnapshot.docs[0]
          const userData = userDoc.data()
          
          // Adicionar o ID do documento e o UID se presente
          userIds.push(userDoc.id)
          if (userData.uid) userIds.push(userData.uid)
          userEmail = userData.email?.toLowerCase()
          
          console.log(`Usuário encontrado pelo email. Documento ID: ${userDoc.id}, Email: ${userEmail}`)
        }
      } catch (error) {
        console.error('Erro ao buscar usuário pelo email:', error)
      }
    }
    
    console.log(`IDs para busca: ${userIds.join(', ')}, Email: ${userEmail}`)
    
    // 1. Buscar assinaturas na coleção "subscriptions"
    const subscriptions: LastlinkSubscription[] = []
    
    // Construir queries para assinaturas
    const subscriptionsRef = collection(db, 'subscriptions')
    const subscriptionQueries = []
    
    // Query por memberId e provider=lastlink
    if (userIds.length > 0) {
      subscriptionQueries.push(
        getDocs(
          query(
            subscriptionsRef,
            where('memberId', 'in', userIds),
            where('provider', '==', 'lastlink')
          )
        )
      )
    }
    
    // Query por memberId e paymentProvider=lastlink (antiga nomenclatura)
    if (userIds.length > 0) {
      subscriptionQueries.push(
        getDocs(
          query(
            subscriptionsRef,
            where('memberId', 'in', userIds),
            where('paymentProvider', '==', 'lastlink')
          )
        )
      )
    }
    
    // Query por email (caso o memberId não seja encontrado)
    if (userEmail) {
      subscriptionQueries.push(
        getDocs(
          query(
            subscriptionsRef,
            where('userEmail', '==', userEmail),
            where('provider', '==', 'lastlink')
          )
        )
      )
      
      // Também tentar com paymentProvider (antiga nomenclatura)
      subscriptionQueries.push(
        getDocs(
          query(
            subscriptionsRef,
            where('userEmail', '==', userEmail),
            where('paymentProvider', '==', 'lastlink')
          )
        )
      )
    }
    
    // 2. Buscar também em lastlink_transactions (coleção específica)
    const lastlinkTransactionsRef = collection(db, 'lastlink_transactions')
    if (userIds.length > 0) {
      subscriptionQueries.push(
        getDocs(
          query(
            lastlinkTransactionsRef,
            where('memberId', 'in', userIds)
          )
        )
      )
    }
    
    if (userEmail) {
      subscriptionQueries.push(
        getDocs(
          query(
            lastlinkTransactionsRef,
            where('userEmail', '==', userEmail)
          )
        )
      )
    }
    
    // Executar todas as queries em paralelo
    const subscriptionResults = await Promise.all(subscriptionQueries)
    
    // Processar resultados das assinaturas
    const processedSubscriptionIds = new Set<string>()
    
    for (const snapshot of subscriptionResults) {
      console.log(`Processando ${snapshot.size} resultados de assinaturas`)
      
      for (const doc of snapshot.docs) {
        const subData = doc.data()
        console.log(`Processando assinatura: ${doc.id}`, subData)
        
        // Evitar duplicatas
        if (!processedSubscriptionIds.has(doc.id)) {
          processedSubscriptionIds.add(doc.id)
          
          // Verificar se a assinatura está ativa
          const isActive = subData.status === 'active' || 
                          subData.status === 'ativa' || 
                          subData.status === 'iniciada' ||
                          subData.status === 'succeeded'
          
          console.log(`Status da assinatura ${doc.id}: ${subData.status}, Ativa: ${isActive}`)
          
          const subscription: LastlinkSubscription = {
            id: doc.id,
            memberId: subData.memberId,
            partnerId: subData.partnerId,
            status: subData.status,
            paymentProvider: 'lastlink',
            provider: 'lastlink',
            orderId: subData.orderId || '',
            expiresAt: subData.expiresAt || '',
            createdAt: subData.createdAt || new Date().toISOString(),
            updatedAt: subData.updatedAt || new Date().toISOString(),
            planName: subData.planName || 'Plano Premium',
            planInterval: subData.planInterval || 'month',
            planIntervalCount: subData.planIntervalCount || 1,
            amount: subData.amount || 0,
            paymentAmount: subData.paymentAmount || 0,
            paidAt: subData.paidAt || '',
            currentPeriodStart: subData.currentPeriodStart || subData.createdAt || '',
            currentPeriodEnd: subData.currentPeriodEnd || subData.expiresAt || '',
            priceId: subData.priceId || '',
            userEmail: subData.userEmail || userEmail || ''
          }
          
          // Adicionar detalhes do pagamento se disponíveis
          if (subData.paymentDetails) {
            subscription.paymentDetails = subData.paymentDetails
          }
          
          subscriptions.push(subscription)
        }
      }
    }
    
    // 3. Buscar pagamentos na coleção "lastlink_payments"
    const payments: LastlinkPayment[] = []
    const processedOrderIds = new Set<string>()
    
    // Construir queries para pagamentos
    const paymentQueries = []
    const lastlinkPaymentsRef = collection(db, 'lastlink_payments')
    
    // Query por memberId
    if (userIds.length > 0) {
      paymentQueries.push(
        getDocs(
          query(
            lastlinkPaymentsRef,
            where('memberId', 'in', userIds)
          )
        )
      )
    }
    
    // Query por email
    if (userEmail) {
      paymentQueries.push(
        getDocs(
          query(
            lastlinkPaymentsRef,
            where('customerEmail', '==', userEmail)
          )
        )
      )
    }
    
    // Executar todas as queries em paralelo
    const paymentResults = await Promise.all(paymentQueries)
    
    // Processar resultados dos pagamentos
    for (const snapshot of paymentResults) {
      console.log(`Processando ${snapshot.size} resultados de pagamentos`)
      
      for (const doc of snapshot.docs) {
        const payment = doc.data() as LastlinkPayment
        payment.id = doc.id
        
        // Evitar duplicatas pelo orderId
        if (!processedOrderIds.has(payment.orderId)) {
          processedOrderIds.add(payment.orderId)
          
          // Verificar se o pagamento tem todos os dados necessários
          console.log(`Pagamento encontrado:`, JSON.stringify({
            id: payment.id,
            orderId: payment.orderId,
            amount: payment.amount,
            status: payment.status,
            customerEmail: payment.customerEmail
          }))
          
          // Certificar-se de que o pagamento tem um valor adequado
          if (payment.amount === undefined || payment.amount === null) {
            payment.amount = 0
          }
          
          payments.push(payment)
        }
      }
    }
    
    // Se não encontramos pagamentos em lastlink_payments, buscar também na coleção lastlink_transactions
    if (payments.length === 0) {
      console.log('Nenhum pagamento encontrado na coleção lastlink_payments, buscando em lastlink_transactions')
      
      const lastlinkTransactionsPaymentsRef = collection(db, 'lastlink_transactions')
      const transactionPaymentQueries = []
      
      if (userIds.length > 0) {
        transactionPaymentQueries.push(
          getDocs(
            query(
              lastlinkTransactionsPaymentsRef,
              where('memberId', 'in', userIds)
            )
          )
        )
      }
      
      if (userEmail) {
        transactionPaymentQueries.push(
          getDocs(
            query(
              lastlinkTransactionsPaymentsRef,
              where('userEmail', '==', userEmail)
            )
          )
        )
      }
      
      const transactionPaymentResults = await Promise.all(transactionPaymentQueries)
      
      for (const snapshot of transactionPaymentResults) {
        console.log(`Processando ${snapshot.size} resultados de transações como pagamentos`)
        
        for (const doc of snapshot.docs) {
          const data = doc.data()
          
          if (!processedOrderIds.has(data.orderId)) {
            processedOrderIds.add(data.orderId)
            
            const transactionPayment: LastlinkPayment = {
              id: doc.id,
              memberId: data.memberId || '',
              orderId: data.orderId || doc.id,
              amount: data.amount || data.paymentAmount || 0,
              status: data.status || 'succeeded',
              customerEmail: data.userEmail || data.customerEmail || userEmail || '',
              customerName: data.userName || data.customerName || '',
              planName: data.planName || 'Plano Premium',
              planInterval: data.planInterval || 'month',
              planIntervalCount: data.planIntervalCount || 1,
              createdAt: data.createdAt || new Date().toISOString(),
              paidAt: data.paidAt || data.createdAt || new Date().toISOString(),
              expiresAt: data.expiresAt || '',
              partnerId: data.partnerId || null,
              partnerLinkId: data.partnerLinkId || null,
              metadata: data.metadata || {}
            }
            
            console.log(`Transação convertida em pagamento:`, JSON.stringify({
              id: transactionPayment.id,
              orderId: transactionPayment.orderId,
              amount: transactionPayment.amount,
              status: transactionPayment.status
            }))
            
            payments.push(transactionPayment)
          }
        }
      }
    }
    
    // Ordenar pagamentos por data de criação (mais recentes primeiro)
    payments.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime()
      const dateB = new Date(b.createdAt || 0).getTime()
      return dateB - dateA
    })
    
    // Se não encontramos assinaturas, mas encontramos pagamentos, criar assinaturas virtuais
    if (subscriptions.length === 0 && payments.length > 0) {
      console.log('Criando assinaturas virtuais a partir dos pagamentos')
      
      // Agrupar pagamentos por partnerId
      const paymentsByPartner = new Map<string, LastlinkPayment>()
      
      // Pegar o pagamento mais recente para cada parceiro
      for (const payment of payments) {
        const partnerId = payment.partnerId || 'desconhecido'
        
        if (!paymentsByPartner.has(partnerId) || 
            new Date(payment.paidAt) > new Date(paymentsByPartner.get(partnerId)!.paidAt)) {
          paymentsByPartner.set(partnerId, payment)
        }
      }
      
      // Criar assinaturas a partir dos pagamentos
      Array.from(paymentsByPartner.entries()).forEach(([partnerId, payment]) => {
        const subscription: LastlinkSubscription = {
          id: `virtual_${payment.id}`,
          memberId: payment.memberId || userId || '',
          partnerId: partnerId,
          status: 'active',
          paymentProvider: 'lastlink',
          provider: 'lastlink',
          orderId: payment.orderId,
          expiresAt: payment.expiresAt || '',
          createdAt: payment.createdAt || new Date().toISOString(),
          updatedAt: payment.paidAt || new Date().toISOString(),
          planName: payment.planName || 'Plano Premium',
          planInterval: payment.planInterval || 'month',
          planIntervalCount: payment.planIntervalCount || 1,
          amount: payment.amount || 0,
          paymentAmount: payment.amount || 0,
          paidAt: payment.paidAt || '',
          currentPeriodStart: payment.createdAt || '',
          currentPeriodEnd: payment.expiresAt || '',
          userEmail: payment.customerEmail || userEmail || ''
        }
        
        subscriptions.push(subscription)
      })
    }
    
    // Log final dos dados encontrados
    console.log(`Retornando ${subscriptions.length} assinaturas e ${payments.length} pagamentos`)
    
    return NextResponse.json({
      subscriptions,
      payments
    })
    
  } catch (error) {
    console.error('Erro ao buscar dados da assinatura Lastlink:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar dados da assinatura' },
      { status: 500 }
    )
  }
} 