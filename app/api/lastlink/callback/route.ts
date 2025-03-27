import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, addDoc, query, where, getDocs, doc, updateDoc, getDoc, increment, limit } from "firebase/firestore"

// Definir interface para tipagem
interface TransactionData {
  id: string;
  token?: string;
  paymentMethod?: string;
  userId?: string;
  partnerId?: string;
  partnerLinkId?: string;
  planName?: string;
  status?: string;
  provider?: string;
  createdAt?: string;
  updatedAt?: string;
  rawData?: string;
  [key: string]: any; // Para permitir propriedades adicionais
}

// Função para buscar transação existente por token
const findTransactionByToken = async (token: string): Promise<TransactionData | null> => {
  try {
    // Buscar nas transações da Lastlink
    const transactionsRef = collection(db, 'transactions')
    const q = query(transactionsRef, where('rawData', 'array-contains', token))
    const snapshot = await getDocs(q)
    
    if (!snapshot.empty) {
      return {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
      } as TransactionData
    }
    
    return null
  } catch (error) {
    console.error('Erro ao buscar transação por token:', error)
    return null
  }
}

// Função para buscar parceiro padrão se necessário
const getDefaultPartner = async () => {
  try {
    // Verificar configuração de parceiro padrão
    const configRef = doc(db, 'config', 'lastlink')
    const configSnap = await getDoc(configRef)
    
    if (configSnap.exists() && configSnap.data().defaultPartnerId) {
      return configSnap.data().defaultPartnerId
    }
    
    // Buscar o primeiro parceiro ativo como fallback
    const partnersRef = collection(db, 'users')
    const q = query(
      partnersRef,
      where('userType', '==', 'partner'),
      where('isActive', '==', true),
      limit(1)
    )
    
    const snapshot = await getDocs(q)
    if (!snapshot.empty) {
      return snapshot.docs[0].id
    }
    
    return null
  } catch (error) {
    console.error('Erro ao buscar parceiro padrão:', error)
    return null
  }
}

// Função para criar ou atualizar assinatura
const createOrUpdateSubscription = async (userId: string, partnerId: string, partnerLinkId: string | null, transactionId: string, planName: string, paymentMethod: string) => {
  try {
    // Validar parâmetros obrigatórios
    if (!userId || !partnerId) {
      throw new Error('Faltam userId ou partnerId')
    }
    
    // Verificar se já existe uma assinatura ativa
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
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 ano
        status: 'active',
        paymentMethod: paymentMethod || 'pix',
        provider: 'lastlink',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      
      const docRef = await addDoc(collection(db, 'subscriptions'), subscriptionData)
      console.log(`Nova assinatura criada com ID: ${docRef.id}`)
      
      // Incrementar conversões do link se tiver partnerLinkId
      if (partnerLinkId) {
        const linkRef = doc(db, 'partnerLinks', partnerLinkId)
        await updateDoc(linkRef, {
          conversions: increment(1),
          updatedAt: new Date().toISOString()
        })
        console.log(`Incrementada conversão do link ${partnerLinkId}`)
      }
      
      return { id: docRef.id, ...subscriptionData }
    } else {
      // Retornar assinatura existente
      const subscriptionDoc = snapshot.docs[0]
      console.log(`Assinatura existente encontrada: ${subscriptionDoc.id}`)
      
      return { id: subscriptionDoc.id, ...subscriptionDoc.data() }
    }
  } catch (error) {
    console.error('Erro ao criar/atualizar assinatura:', error)
    throw error
  }
}

export async function GET(request: Request) {
  try {
    // Extrair parâmetros da URL
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const paymentMethod = searchParams.get('paymentMethod')
    let userId = searchParams.get('userId')
    let partnerId = searchParams.get('partnerId')
    let partnerLinkId = searchParams.get('partnerLinkId')
    
    console.log('Callback Lastlink recebido:', { token, paymentMethod, userId, partnerId, partnerLinkId })
    console.log('URL completa:', request.url)
    
    // Validar token
    if (!token) {
      return NextResponse.json(
        { error: 'Token não fornecido' },
        { status: 400 }
      )
    }
    
    // Buscar transação existente
    let transaction: TransactionData | null = await findTransactionByToken(token)
    
    // Se não encontramos uma transação, vamos criar com os dados disponíveis
    if (!transaction) {
      // Se não temos o partnerId, buscar parceiro padrão
      if (!partnerId) {
        partnerId = await getDefaultPartner()
        console.log(`Usando parceiro padrão: ${partnerId}`)
      }
      
      // Criar nova transação
      const transactionData: TransactionData = {
        id: '', // Será preenchido após a criação
        token,
        paymentMethod: paymentMethod || 'pix',
        userId,
        partnerId,
        partnerLinkId,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        provider: 'lastlink',
        planName: 'Plano Premium'
      }
      
      const docRef = await addDoc(collection(db, 'transactions'), transactionData)
      transaction = { 
        ...transactionData,
        id: docRef.id 
      }
      console.log(`Nova transação criada com ID: ${docRef.id}`)
    } else {
      // Atualizar transação existente se necessário
      const updates: Partial<TransactionData> = {}
      let needsUpdate = false
      
      if (userId && !transaction.userId) {
        updates.userId = userId
        needsUpdate = true
      } else if (transaction.userId) {
        userId = transaction.userId
      }
      
      if (partnerId && !transaction.partnerId) {
        updates.partnerId = partnerId
        needsUpdate = true
      } else if (transaction.partnerId) {
        partnerId = transaction.partnerId
      }
      
      if (partnerLinkId && !transaction.partnerLinkId) {
        updates.partnerLinkId = partnerLinkId
        needsUpdate = true
      } else if (transaction.partnerLinkId) {
        partnerLinkId = transaction.partnerLinkId
      }
      
      if (needsUpdate) {
        updates.updatedAt = new Date().toISOString()
        
        const transactionRef = doc(db, 'transactions', transaction.id)
        await updateDoc(transactionRef, updates)
        console.log(`Transação ${transaction.id} atualizada:`, updates)
        
        // Atualizar objeto local
        transaction = { 
          ...transaction, 
          ...updates 
        }
      }
    }
    
    // Criar/atualizar assinatura se temos userId e partnerId
    let subscription = null
    if (userId && partnerId && transaction) {
      try {
        subscription = await createOrUpdateSubscription(
          userId,
          partnerId,
          partnerLinkId || null,
          transaction.id,
          (transaction as any).planName || 'Plano Premium',
          (transaction as any).paymentMethod || paymentMethod || 'pix'
        )
      } catch (error) {
        console.error('Erro ao criar assinatura:', error)
      }
    }

    // Garantir que transaction não seja null antes de retornar
    if (!transaction) {
      return NextResponse.json(
        { error: 'Falha ao criar ou localizar transação' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Pagamento processado com sucesso',
      transaction: {
        id: transaction.id,
        status: (transaction as any).status || 'active'
      },
      subscription: subscription ? {
        id: subscription.id,
        status: subscription.status
      } : null
    })
  } catch (error) {
    console.error('Erro ao processar callback:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao processar callback',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
} 