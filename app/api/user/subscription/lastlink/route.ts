import { NextResponse } from 'next/server'
import { collection, query, where, getDocs, DocumentData, doc, getDoc } from 'firebase/firestore'
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
  orderId: string
  expiresAt: string
  createdAt: string
  updatedAt: string
  paymentDetails?: LastlinkPayment | null
  planName?: string
  planInterval?: string
  planIntervalCount?: number
  amount?: number
  paidAt?: string
  currentPeriodStart?: string
  currentPeriodEnd?: string
  priceId?: string
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const email = searchParams.get('email')
    const firebaseUid = searchParams.get('firebaseUid')

    console.log('Buscando pagamentos Lastlink para:', { userId, email, firebaseUid })

    if (!userId && !email && !firebaseUid) {
      return NextResponse.json(
        { error: 'Um identificador de usuário é obrigatório' },
        { status: 400 }
      )
    }

    // Coleção de possíveis IDs para o usuário
    const userIds: string[] = []
    
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
          
          console.log(`Usuário encontrado pelo email. Documento ID: ${userDoc.id}, UID: ${userData.uid || 'não definido'}`)
        }
      } catch (error) {
        console.error('Erro ao buscar usuário pelo email:', error)
      }
    }
    
    // Se temos userId, tentar buscar o documento do usuário para obter o UID
    if (userId && !userIds.includes(userId)) {
      try {
        console.log(`Buscando usuário pelo ID do documento: ${userId}`)
        const userRef = doc(db, 'users', userId)
        const userDoc = await getDoc(userRef)
        
        if (userDoc.exists()) {
          const userData = userDoc.data()
          
          // Adicionar o UID se presente
          if (userData.uid && !userIds.includes(userData.uid)) {
            userIds.push(userData.uid)
            console.log(`Adicionando UID do usuário: ${userData.uid}`)
          }
        }
      } catch (error) {
        console.error('Erro ao buscar documento do usuário:', error)
      }
    }
    
    console.log(`IDs para busca: ${userIds.join(', ')}`)
    
    // 1. Buscar assinaturas na coleção "subscriptions"
    const subscriptions: LastlinkSubscription[] = []
    if (userIds.length > 0) {
      console.log('Buscando assinaturas Lastlink...')
      
      const subscriptionsRef = collection(db, 'subscriptions')
      const subscriptionsQuery = query(
        subscriptionsRef,
        where('memberId', 'in', userIds),
        where('paymentProvider', '==', 'lastlink')
      )
      
      const subscriptionsSnapshot = await getDocs(subscriptionsQuery)
      console.log(`Encontradas ${subscriptionsSnapshot.size} assinaturas Lastlink`)
      
      // Extrair assinaturas encontradas
      for (const doc of subscriptionsSnapshot.docs) {
        const subData = doc.data()
        console.log(`Assinatura encontrada: ${doc.id}, Status: ${subData.status}, Parceiro: ${subData.partnerId}`)
        
        const subscription: LastlinkSubscription = {
          id: doc.id,
          memberId: subData.memberId,
          partnerId: subData.partnerId,
          status: subData.status,
          paymentProvider: subData.paymentProvider,
          orderId: subData.orderId || '',
          expiresAt: subData.expiresAt || '',
          createdAt: subData.createdAt || '',
          updatedAt: subData.updatedAt || '',
          // Outros campos existentes
          planName: subData.planName || 'Plano Premium',
          planInterval: subData.planInterval || 'month',
          planIntervalCount: subData.planIntervalCount || 1,
          amount: subData.paymentAmount || 0,
          paidAt: subData.paidAt || '',
          currentPeriodStart: subData.currentPeriodStart || '',
          currentPeriodEnd: subData.currentPeriodEnd || '',
          priceId: subData.priceId || '',
        }
        
        subscriptions.push(subscription)
      }
    }
    
    // 2. Buscar pagamentos na coleção "lastlink_payments"
    const payments: LastlinkPayment[] = []
    
    // Construir queries
    const queries = []
    const lastlinkPaymentsRef = collection(db, 'lastlink_payments')
    
    // Query por memberId (qualquer um dos IDs)
    if (userIds.length > 0) {
      queries.push(
        getDocs(
          query(
            lastlinkPaymentsRef,
            where('memberId', 'in', userIds)
          )
        )
      )
    }
    
    // Query por email
    if (email) {
      queries.push(
        getDocs(
          query(
            lastlinkPaymentsRef,
            where('customerEmail', '==', email.toLowerCase())
          )
        )
      )
    }
    
    // Executar todas as queries em paralelo
    const queryResults = await Promise.all(queries)
    
    // Processar resultados e remover duplicatas
    const processedOrderIds = new Set<string>()
    
    for (const snapshot of queryResults) {
      for (const doc of snapshot.docs) {
        const payment = doc.data() as LastlinkPayment
        
        // Evitar duplicatas pelo orderId
        if (payment.orderId && !processedOrderIds.has(payment.orderId)) {
          processedOrderIds.add(payment.orderId)
          
          payments.push({
            ...payment,
            id: doc.id
          })
        }
      }
    }
    
    console.log(`Encontrados ${payments.length} pagamentos Lastlink`)
    
    // 3. Atualizar assinaturas com detalhes de pagamento
    for (const subscription of subscriptions) {
      // Encontrar pagamento correspondente pelo orderId
      if (subscription.orderId) {
        const relatedPayment = payments.find(payment => payment.orderId === subscription.orderId)
        if (relatedPayment) {
          subscription.paymentDetails = relatedPayment
        }
      }
    }
    
    // 4. Verificar se encontramos assinaturas. Se não, mas encontramos pagamentos, 
    // podemos criar objetos de assinatura a partir deles para compatibilidade
    if (subscriptions.length === 0 && payments.length > 0) {
      console.log('Nenhuma assinatura encontrada, mas temos pagamentos. Gerando assinaturas virtuais...')
      
      // Agrupar pagamentos por partnerId e selecionar o mais recente de cada grupo
      const paymentsByPartner = new Map<string, LastlinkPayment>()
      
      for (const payment of payments) {
        const partnerId = payment.partnerId || 'unknown'
        const existingPayment = paymentsByPartner.get(partnerId)
        
        // Se não temos um pagamento para este parceiro ou este é mais recente
        if (!existingPayment || new Date(payment.paidAt) > new Date(existingPayment.paidAt)) {
          paymentsByPartner.set(partnerId, payment)
        }
      }
      
      // Criar assinaturas virtuais a partir dos pagamentos mais recentes
      Array.from(paymentsByPartner.entries()).forEach(([partnerId, payment]) => {
        const now = new Date()
        const paidAt = new Date(payment.paidAt)
        
        // Calcular data de expiração com base no intervalo do plano
        let expiresAt = new Date(paidAt)
        const interval = payment.planInterval || 'month'
        const intervalCount = payment.planIntervalCount || 1
        
        if (interval === 'month') {
          expiresAt.setMonth(expiresAt.getMonth() + intervalCount)
        } else if (interval === 'year') {
          expiresAt.setFullYear(expiresAt.getFullYear() + intervalCount)
        } else if (interval === 'week') {
          expiresAt.setDate(expiresAt.getDate() + (7 * intervalCount))
        } else if (interval === 'day') {
          expiresAt.setDate(expiresAt.getDate() + intervalCount)
        }
        
        // Determinar status com base na data de expiração
        const status = expiresAt > now ? 'active' : 'expired'
        
        const subscription: LastlinkSubscription = {
          id: `virtual_${payment.id}`,
          memberId: payment.memberId,
          partnerId: partnerId !== 'unknown' ? partnerId : 'MChsM1JopUMB2ye2Tdvp',
          status: status,
          paymentProvider: 'lastlink',
          orderId: payment.orderId,
          expiresAt: expiresAt.toISOString(),
          createdAt: payment.createdAt,
          updatedAt: payment.paidAt,
          paymentDetails: payment,
          // Campos adicionais
          planName: payment.planName || 'Plano Premium',
          planInterval: interval,
          planIntervalCount: intervalCount,
          amount: payment.amount,
          currentPeriodStart: payment.paidAt,
          currentPeriodEnd: expiresAt.toISOString(),
          priceId: `lastlink_${(payment.planName || 'premium').toLowerCase().replace(/\s/g, '_')}`,
        }
        
        subscriptions.push(subscription)
        console.log(`Criada assinatura virtual a partir do pagamento ${payment.id}`)
      })
    }

    return NextResponse.json({
      payments,
      subscriptions
    })
  } catch (error) {
    console.error('Erro ao buscar pagamentos Lastlink:', error)
    return NextResponse.json(
      { error: 'Erro interno ao buscar pagamentos' },
      { status: 500 }
    )
  }
} 