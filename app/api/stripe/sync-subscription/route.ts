import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/firebase'
import { collection, addDoc, getDocs, query, where, doc, getDoc } from 'firebase/firestore'

export async function POST(request: Request) {
  try {
    const { subscriptionId, userId, firebaseUid } = await request.json()
    
    if (!subscriptionId || !userId) {
      return NextResponse.json({ 
        error: 'subscriptionId e userId são obrigatórios' 
      }, { status: 400 })
    }
    
    // 1. Verificar se a assinatura já existe no Firebase
    const subscriptionsRef = collection(db, 'subscriptions')
    const q = query(subscriptionsRef, where('stripeSubscriptionId', '==', subscriptionId))
    const existingSubscriptions = await getDocs(q)
    
    if (!existingSubscriptions.empty) {
      return NextResponse.json({ 
        success: false, 
        message: 'Assinatura já existe no Firebase' 
      })
    }
    
    // 2. Buscar a assinatura no Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['customer', 'items.data.price.product']
    })
    
    // 3. Extrair metadados
    const metadata = subscription.metadata || {}
    const partnerId = metadata.partnerId
    
    if (!partnerId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Assinatura não tem partnerId nos metadados' 
      })
    }
    
    // 4. Verificar o parceiro
    const partnerRef = doc(db, 'users', partnerId)
    const partnerDoc = await getDoc(partnerRef)
    
    if (!partnerDoc.exists()) {
      return NextResponse.json({ 
        success: false, 
        message: `Parceiro ${partnerId} não encontrado` 
      })
    }
    
    const partnerData = partnerDoc.data()
    
    // 5. Criar o documento de assinatura
    const expirationDate = new Date(subscription.current_period_end * 1000)
    
    const subscriptionData = {
      memberId: firebaseUid || userId, // Usar o firebaseUid se fornecido
      partnerId: partnerId,
      partnerName: partnerData.displayName || 'Parceiro',
      partnerEmail: partnerData.email || '',
      partnerLinkId: metadata.partnerLinkId || null,
      status: subscription.status,
      expiresAt: expirationDate.toISOString(),
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    const docRef = await addDoc(collection(db, 'subscriptions'), subscriptionData)
    
    return NextResponse.json({
      success: true,
      message: 'Assinatura sincronizada com sucesso',
      subscriptionId: docRef.id
    })
    
  } catch (error: any) {
    console.error('Erro ao sincronizar assinatura:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
} 