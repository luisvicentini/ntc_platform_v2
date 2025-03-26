import { NextResponse } from 'next/server'
import { collection, query, where, getDocs, DocumentData } from 'firebase/firestore'
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

    // Lista de IDs para buscar
    const userIds: string[] = []
    if (userId) userIds.push(userId)
    if (firebaseUid) userIds.push(firebaseUid)

    // Buscar pagamentos por ID ou email
    const lastlinkPaymentsRef = collection(db, 'lastlink_payments')
    
    let paymentsQuery
    
    if (userIds.length > 0) {
      paymentsQuery = query(
        lastlinkPaymentsRef,
        where('memberId', 'in', userIds)
      )
    } else if (email) {
      paymentsQuery = query(
        lastlinkPaymentsRef,
        where('customerEmail', '==', email)
      )
    } else {
      return NextResponse.json({ payments: [], subscriptions: [] })
    }

    const snapshot = await getDocs(paymentsQuery)
    
    const payments: LastlinkPayment[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as LastlinkPayment))

    console.log(`Encontrados ${payments.length} pagamentos Lastlink`)

    // Buscar assinaturas relacionadas
    const subscriptions: LastlinkSubscription[] = []
    if (userIds.length > 0) {
      const subscriptionsRef = collection(db, 'subscriptions')
      const subscriptionsQuery = query(
        subscriptionsRef,
        where('memberId', 'in', userIds),
        where('paymentProvider', '==', 'lastlink')
      )
      
      const subscriptionsSnapshot = await getDocs(subscriptionsQuery)
      
      subscriptionsSnapshot.docs.forEach(doc => {
        // Encontrar o pagamento relacionado à assinatura
        const subData = doc.data()
        const relatedPayment = payments.find(payment => payment.orderId === subData.orderId)
        
        const subscription: LastlinkSubscription = {
          id: doc.id,
          memberId: subData.memberId,
          partnerId: subData.partnerId,
          status: subData.status,
          paymentProvider: subData.paymentProvider,
          orderId: subData.orderId,
          expiresAt: subData.expiresAt,
          createdAt: subData.createdAt,
          updatedAt: subData.updatedAt,
          paymentDetails: relatedPayment || null
        }
        
        subscriptions.push(subscription)
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