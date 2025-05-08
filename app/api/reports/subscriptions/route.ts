import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, getDocs, doc, getDoc, DocumentData, query, where } from "firebase/firestore"

interface Subscription extends DocumentData {
  id: string;
  userId?: string;
  partnerId?: string;
  status?: string;
  createdAt?: string | number;
  [key: string]: any;
}

export async function GET(request: Request) {
  try {
    const sessionToken = request.headers.get("x-session-token")
    
    // Obter todas as assinaturas da coleção
    const subscriptionsRef = collection(db, "subscriptions")
    const snapshot = await getDocs(subscriptionsRef)
    
    const subscriptions: Subscription[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // Buscar todas as transações para verificar assinaturas ativas
    const transactionsRef = collection(db, "transactions")
    const transactionsSnapshot = await getDocs(transactionsRef)
    const transactions: DocumentData[] = transactionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    // Mapeamento de userId para transações
    const userTransactions: Record<string, any[]> = {}
    transactions.forEach((transaction: DocumentData) => {
      if (transaction.userId) {
        if (!userTransactions[transaction.userId]) {
          userTransactions[transaction.userId] = []
        }
        userTransactions[transaction.userId].push(transaction)
      }
    })
    
    // Buscar todos os vouchers para verificar engajamento
    const vouchersRef = collection(db, "vouchers")
    const vouchersSnapshot = await getDocs(vouchersRef)
    const vouchers: DocumentData[] = vouchersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    // Contabilizar vouchers por usuário
    const userVouchers: Record<string, number> = {}
    vouchers.forEach((voucher: DocumentData) => {
      const userId = voucher.userId || voucher.memberId
      if (userId) {
        userVouchers[userId] = (userVouchers[userId] || 0) + 1
      }
    })

    // Enriquecer os dados com informações do parceiro e do usuário
    const enrichedSubscriptions = await Promise.all(subscriptions.map(async (subscription) => {
      let partnerData = null
      if (subscription.partnerId) {
        const partnerRef = doc(db, "users", subscription.partnerId)
        const partnerSnap = await getDoc(partnerRef)
        if (partnerSnap.exists()) {
          partnerData = partnerSnap.data()
        }
      }

      // Também enriquecer com dados do usuário quando disponíveis
      let userData = null
      if (subscription.userId) {
        const userRef = doc(db, "users", subscription.userId)
        const userSnap = await getDoc(userRef)
        if (userSnap.exists()) {
          userData = userSnap.data()
        }
      }
      
      // Verificar se existem transações para este usuário
      const hasTransactions = subscription.userId && userTransactions[subscription.userId] && 
                             userTransactions[subscription.userId].length > 0
      
      // Verificar se o usuário gerou vouchers
      const voucherCount = subscription.userId ? (userVouchers[subscription.userId] || 0) : 0
      const isEngaged = voucherCount > 0
      
      // Determinar o status real da assinatura baseado em transações
      let effectiveStatus = subscription.status || 'inactive'
      if (hasTransactions && (effectiveStatus === 'active' || effectiveStatus === 'ativa')) {
        effectiveStatus = 'active'
      } else if (!hasTransactions && (effectiveStatus === 'active' || effectiveStatus === 'ativa')) {
        // Marcar como "pendente" se não houver transações mas o status for ativo
        effectiveStatus = 'pending'
      }

      return {
        ...subscription,
        effectiveStatus,
        partner: partnerData ? {
          id: subscription.partnerId,
          name: partnerData.displayName || partnerData.name || partnerData.businessName,
          email: partnerData.email
        } : null,
        user: userData ? {
          id: subscription.userId,
          displayName: userData.displayName || userData.name,
          email: userData.email,
          phoneNumber: userData.phoneNumber
        } : null,
        hasTransactions,
        voucherCount,
        isEngaged
      }
    }))

    // Ordenar assinaturas: ativas primeiro, depois por data de criação
    enrichedSubscriptions.sort((a, b) => {
      // Priorizar assinaturas ativas
      const isActiveA = a.effectiveStatus === 'active' || a.effectiveStatus === 'ativa'
      const isActiveB = b.effectiveStatus === 'active' || b.effectiveStatus === 'ativa'
      
      if (isActiveA && !isActiveB) return -1
      if (!isActiveA && isActiveB) return 1
      
      // Em seguida, ordenar por data (mais recente primeiro)
      const dateA = new Date(a.createdAt || 0)
      const dateB = new Date(b.createdAt || 0)
      return dateB.getTime() - dateA.getTime()
    })

    return NextResponse.json(enrichedSubscriptions)

  } catch (error) {
    console.error("Erro ao buscar assinaturas para relatórios:", error)
    return NextResponse.json(
      { error: "Erro ao buscar assinaturas para relatórios" },
      { status: 500 }
    )
  }
} 