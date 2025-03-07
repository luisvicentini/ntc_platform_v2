import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/firebase'
import { collection, addDoc, getDocs, query, where, doc, updateDoc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import Stripe from 'stripe'

// Forçar modo desenvolvimento para testes locais
const isDevelopment = true // process.env.NODE_ENV === 'development'
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

const calculateExpirationDate = (subscription) => {
  try {
    // Verificar se temos os dados do plano
    if (!subscription.items || 
        !subscription.items.data || 
        subscription.items.data.length === 0 ||
        !subscription.items.data[0].price ||
        !subscription.items.data[0].price.recurring) {
      console.log('⚠️ Dados do plano não encontrados, usando current_period_end')
      return new Date(subscription.current_period_end * 1000)
    }

    const recurring = subscription.items.data[0].price.recurring
    const interval = recurring.interval
    const intervalCount = recurring.interval_count || 1

    console.log(`📅 Plano: ${intervalCount} ${interval}(s)`)

    let expirationDate = new Date()

    switch(interval) {
      case 'day':
        expirationDate.setDate(expirationDate.getDate() + intervalCount)
        break
      case 'week':
        expirationDate.setDate(expirationDate.getDate() + (intervalCount * 7))
        break
      case 'month':
        expirationDate.setMonth(expirationDate.getMonth() + intervalCount)
        break
      case 'year':
        expirationDate.setFullYear(expirationDate.getFullYear() + intervalCount)
        break
      default:
        // Fallback para current_period_end do Stripe
        expirationDate = new Date(subscription.current_period_end * 1000)
    }

    console.log(`📅 Data de expiração calculada: ${expirationDate.toISOString()}`)
    return expirationDate
  } catch (err) {
    console.error('❌ Erro ao calcular data de expiração:', err)
    // Fallback seguro
    return new Date(subscription.current_period_end * 1000)
  }
}

export async function POST(req: Request) {
  console.log('🎯 Webhook recebido')
  
  try {
    const body = await req.text()
    const signature = headers().get('stripe-signature') || ''
    
    console.log('📝 Assinatura recebida:', signature ? 'Sim' : 'Não')
    console.log('🔑 Secret configurado:', endpointSecret ? 'Sim' : 'Não')

    let event
    
    try {
      // Verificar a assinatura do webhook
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret!)
      console.log('✅ Webhook verificado com sucesso:', event.type)
    } catch (err: any) {
      console.error(`❌ Erro na verificação da assinatura: ${err.message}`)
      return NextResponse.json({ 
        error: `Erro na verificação da assinatura: ${err.message}` 
      }, { status: 400 })
    }

    // Processar eventos específicos
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        console.log('💰 Checkout concluído, ID da sessão:', session.id)
        
        await processCheckoutCompleted(session)
        break
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object
        console.log('📝 Assinatura atualizada:', subscription.id)
        
        await processSubscriptionUpdated(subscription)
        break
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        console.log('❌ Assinatura cancelada:', subscription.id)
        
        await processSubscriptionDeleted(subscription)
        break
      }
    }

    return NextResponse.json({ received: true })
    
  } catch (err: any) {
    console.error(`❌ Erro geral no webhook: ${err.message}`)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// Função para processar checkout concluído
async function processCheckoutCompleted(session) {
  try {
    // Extrair metadados
    const metadata = session.metadata || {}
    const userId = metadata.userId
    const partnerId = metadata.partnerId
    const partnerLinkId = metadata.partnerLinkId
    
    console.log('📊 Metadados do checkout:', { userId, partnerId, partnerLinkId })
    
    if (!userId) {
      console.error('❌ userId não encontrado nos metadados')
      return
    }
    
    // Atualizar status do usuário
    try {
      const userRef = doc(db, 'users', userId)
      const userDoc = await getDoc(userRef)
      
      if (userDoc.exists()) {
        await updateDoc(userRef, {
          status: 'active',
          updatedAt: new Date().toISOString()
        })
        console.log(`✅ Status do usuário ${userId} atualizado para 'active'`)
      } else {
        console.error(`❌ Usuário ${userId} não encontrado no Firestore`)
      }
    } catch (err) {
      console.error('❌ Erro ao atualizar status do usuário:', err)
    }
    
    // Verificar firebaseUid
    let firebaseUid = userId
    try {
      const userRef = doc(db, 'users', userId)
      const userDoc = await getDoc(userRef)
      
      if (userDoc.exists() && userDoc.data().firebaseUid) {
        firebaseUid = userDoc.data().firebaseUid
        console.log(`ℹ️ Usando firebaseUid: ${firebaseUid}`)
      }
    } catch (err) {
      console.error('❌ Erro ao buscar firebaseUid:', err)
    }
    
    // Criar vinculação com parceiro
    if (partnerId) {
      try {
        const partnerRef = doc(db, 'users', partnerId)
        const partnerDoc = await getDoc(partnerRef)
        
        if (!partnerDoc.exists()) {
          console.error(`❌ Parceiro ${partnerId} não encontrado`)
          return
        }
        
        // Verificar se já existe uma assinatura ativa
        const subscriptionsRef = collection(db, 'subscriptions')
        const q = query(
          subscriptionsRef, 
          where('memberId', '==', firebaseUid),
          where('partnerId', '==', partnerId),
          where('status', '==', 'active')
        )
        
        const existingSubscriptions = await getDocs(q)
        
        if (!existingSubscriptions.empty) {
          console.log('⚠️ Já existe uma assinatura ativa para este Assinante e parceiro')
          return
        }
        
        // Obter assinatura do Stripe para detalhes adicionais
        if (!session.subscription) {
          console.log('⚠️ Nenhum ID de assinatura encontrado na sessão')
          return
        }
        
        const subscription = await stripe.subscriptions.retrieve(session.subscription, {
          expand: ['items.data.price'] // Importante: expandir os itens para acessar os detalhes do plano
        })
        console.log('✅ Assinatura Stripe recuperada:', subscription.id)
        
        // Calcular data de expiração com base no plano
        const expirationDate = calculateExpirationDate(subscription)
        
        // Extrair dados do parceiro
        const partnerData = partnerDoc.data()
        
        // Criar registro de assinatura
        const subscriptionData = {
          memberId: firebaseUid,
          partnerId: partnerId,
          partnerName: partnerData.displayName || 'Parceiro',
          partnerEmail: partnerData.email || '',
          partnerLinkId: partnerLinkId || null,
          status: subscription.status,
          expiresAt: expirationDate.toISOString(),
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: subscription.customer,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        const docRef = await addDoc(collection(db, 'subscriptions'), subscriptionData)
        console.log(`✅ Assinatura criada com sucesso, ID: ${docRef.id}`)
      } catch (err) {
        console.error('❌ Erro ao criar assinatura:', err)
      }
    } else {
      console.log('ℹ️ Sem partnerId, nenhuma assinatura criada')
    }
  } catch (err) {
    console.error('❌ Erro ao processar checkout concluído:', err)
  }
}

// Função para processar atualização de assinatura
async function processSubscriptionUpdated(subscription) {
  try {
    // Buscar assinatura no Firestore
    const subscriptionsRef = collection(db, 'subscriptions')
    const q = query(
      subscriptionsRef, 
      where('stripeSubscriptionId', '==', subscription.id)
    )
    
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      console.log('⚠️ Assinatura não encontrada no Firestore:', subscription.id)
      return
    }
    
    // Atualizar todos os documentos encontrados
    for (const doc of querySnapshot.docs) {
      await updateDoc(doc.ref, {
        status: subscription.status,
        expiresAt: new Date(subscription.current_period_end * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      })
      console.log(`✅ Assinatura ${doc.id} atualizada com sucesso`)
    }
  } catch (err) {
    console.error('❌ Erro ao processar atualização de assinatura:', err)
  }
}

// Função para processar cancelamento de assinatura
async function processSubscriptionDeleted(subscription) {
  try {
    // Buscar assinatura no Firestore
    const subscriptionsRef = collection(db, 'subscriptions')
    const q = query(
      subscriptionsRef, 
      where('stripeSubscriptionId', '==', subscription.id)
    )
    
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      console.log('⚠️ Assinatura não encontrada no Firestore:', subscription.id)
      return
    }
    
    // Atualizar todos os documentos encontrados
    for (const doc of querySnapshot.docs) {
      await updateDoc(doc.ref, {
        status: 'canceled',
        canceledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      console.log(`✅ Assinatura ${doc.id} marcada como cancelada`)
    }
  } catch (err) {
    console.error('❌ Erro ao processar cancelamento de assinatura:', err)
  }
}

// Configuração para não parsear o corpo da requisição
export const config = {
  api: {
    bodyParser: false,
  },
} 