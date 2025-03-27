import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, addDoc, query, where, getDocs, doc, updateDoc, getDoc, increment } from "firebase/firestore"

// Função para redirecionar após pagamento
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")
    const paymentMethod = searchParams.get("paymentMethod")
    const orderId = searchParams.get("order_id") || searchParams.get("orderId")
    
    console.log("Callback Lastlink recebido:", { token, paymentMethod, orderId })
    console.log("URL completa:", request.url)
    console.log("Parâmetros da URL completos:", Object.fromEntries(searchParams.entries()))
    
    // Verificar localStorage armazenado pelo cliente para obter dados de checkout
    const userId = searchParams.get("userId") || searchParams.get("user_id")
    const partnerId = searchParams.get("partnerId") || searchParams.get("partner_id") || "MChsM1JopUMB2ye2Tdvp" // ID do parceiro Lastlink padrão
    const partnerLinkId = searchParams.get("partnerLinkId") || searchParams.get("ref") || searchParams.get("link_id")
    
    console.log("Dados extraídos da URL:", { userId, partnerId, partnerLinkId })
    
    // Buscar transação associada a este token/orderId se houver
    if (token || orderId) {
      // Tentar encontrar transação existente
      const transactionsRef = collection(db, "lastlink_transactions")
      const transactionQuery = query(
        transactionsRef,
        where("status", "==", "active")
      )
      
      if (token) {
        // Adicionar condição de token quando disponível
        // Nota: Como o token provavelmente está no campo rawData como string, precisamos verificar depois
      }
      
      if (orderId) {
        // Adicionar condição de orderId quando disponível
        // Similar ao token, se não encontramos diretamente, verificamos depois
      }
      
      const transactionSnapshot = await getDocs(transactionQuery)
      console.log(`Encontradas ${transactionSnapshot.size} transações ativas`)
      
      // Verificar manualmente por token no corpo da transação
      const matchedTransactions = []
      
      for (const doc of transactionSnapshot.docs) {
        const transactionData = doc.data()
        
        // Verificar se o orderId corresponde
        if (orderId && transactionData.orderId === orderId) {
          matchedTransactions.push({ id: doc.id, data: transactionData })
          console.log(`Transação encontrada pelo orderId: ${doc.id}`)
          continue
        }
        
        // Verificar se o token está presente no rawData
        if (token && transactionData.rawData && transactionData.rawData.includes(token)) {
          matchedTransactions.push({ id: doc.id, data: transactionData })
          console.log(`Transação encontrada pelo token no rawData: ${doc.id}`)
          continue
        }
      }
      
      if (matchedTransactions.length > 0) {
        console.log(`Encontradas ${matchedTransactions.length} transações para atualizar`)
        
        // Atualizar todas as transações encontradas com o partnerId e partnerLinkId
        for (const transaction of matchedTransactions) {
          try {
            // Verificar se já tem partnerId
            if (!transaction.data.partnerId && partnerId) {
              console.log(`Atualizando transação ${transaction.id} com partnerId: ${partnerId}`)
              
              await updateDoc(doc(db, "lastlink_transactions", transaction.id), {
                partnerId: partnerId,
                partnerLinkId: partnerLinkId || null,
                updatedAt: new Date().toISOString()
              })
              
              // Criar assinatura para esta transação
              await createSubscriptionFromTransaction(
                transaction.data.userId || userId,
                partnerId,
                partnerLinkId,
                transaction.data
              )
            }
          } catch (error) {
            console.error(`Erro ao atualizar transação ${transaction.id}:`, error)
          }
        }
      } else {
        console.log("Nenhuma transação encontrada para este token/orderId")
        
        // Se não encontrou nenhuma transação mas temos userId, podemos tentar criar ou atualizar 
        // assinatura diretamente usando as informações disponíveis
        if (userId && partnerId) {
          try {
            console.log("Criando assinatura diretamente da URL de callback")
            
            // Buscar informações do usuário
            const userRef = doc(db, "users", userId)
            const userDoc = await getDoc(userRef)
            
            if (userDoc.exists()) {
              const userData = userDoc.data()
              
              // Criar assinatura provisória para o usuário
              await createSubscriptionFromCallback(
                userId,
                partnerId,
                partnerLinkId,
                token,
                orderId,
                userData.email || "",
                userData.displayName || userData.name || ""
              )
            }
          } catch (error) {
            console.error("Erro ao criar assinatura da URL:", error)
          }
        }
      }
    }
    
    // Redirecionar para página de perfil do membro com informação de sucesso
    return NextResponse.redirect(new URL("/member/profile?payment=success", request.url))
  } catch (error) {
    console.error("Erro ao processar callback:", error)
    return NextResponse.redirect(new URL("/member/profile?payment=error", request.url))
  }
}

/**
 * Cria uma assinatura baseada em uma transação existente
 */
async function createSubscriptionFromTransaction(
  userId: string,
  partnerId: string,
  partnerLinkId: string | null,
  transactionData: any
) {
  try {
    console.log("Criando assinatura a partir da transação:", {
      userId,
      partnerId,
      partnerLinkId,
      orderId: transactionData.orderId
    })
    
    // Verificar se já existe uma assinatura
    const subscriptionsRef = collection(db, "subscriptions")
    const subscriptionQuery = query(
      subscriptionsRef,
      where("memberId", "==", userId),
      where("partnerId", "==", partnerId),
      where("paymentProvider", "==", "lastlink")
    )
    
    const subscriptionSnapshot = await getDocs(subscriptionQuery)
    
    // Extrair dados importantes da transação
    const {
      orderId,
      planName,
      planInterval,
      planIntervalCount,
      amount,
      paidAt,
      expiresAt
    } = transactionData
    
    // Dados da assinatura
    const subscriptionData = {
      memberId: userId,
      partnerId: partnerId,
      status: "active",
      paymentProvider: "lastlink",
      type: "lastlink",
      orderId: orderId || "",
      expiresAt: expiresAt || "",
      updatedAt: new Date().toISOString(),
      planName: planName || "Plano Premium",
      planInterval: planInterval || "month",
      planIntervalCount: planIntervalCount || 1,
      paymentAmount: amount || 0,
      currentPeriodStart: paidAt || new Date().toISOString(),
      currentPeriodEnd: expiresAt || "",
      priceId: `lastlink_${(planName || "premium").toLowerCase().replace(/\s/g, '_')}`,
      partnerLinkId: partnerLinkId || null
    }
    
    if (subscriptionSnapshot.empty) {
      // Criar nova assinatura
      const subscriptionRef = await addDoc(
        subscriptionsRef, 
        {
          ...subscriptionData,
          createdAt: new Date().toISOString()
        }
      )
      console.log("Nova assinatura criada:", subscriptionRef.id)
      
      // Incrementar conversões do link se temos o partnerLinkId
      if (partnerLinkId) {
        try {
          await updateDoc(doc(db, "partnerLinks", partnerLinkId), {
            conversions: increment(1),
            updatedAt: new Date().toISOString()
          })
          console.log("Conversões do link incrementadas")
        } catch (err) {
          console.error("Erro ao incrementar conversões do link:", err)
        }
      }
      
      return subscriptionRef.id
    } else {
      // Atualizar assinatura existente
      const subscriptionRef = subscriptionSnapshot.docs[0].ref
      await updateDoc(subscriptionRef, subscriptionData)
      console.log("Assinatura existente atualizada:", subscriptionSnapshot.docs[0].id)
      
      return subscriptionSnapshot.docs[0].id
    }
  } catch (error) {
    console.error("Erro ao criar assinatura da transação:", error)
    return null
  }
}

/**
 * Cria uma assinatura baseada apenas nos dados do callback
 */
async function createSubscriptionFromCallback(
  userId: string,
  partnerId: string,
  partnerLinkId: string | null,
  token: string | null,
  orderId: string | null,
  userEmail: string,
  userName: string
) {
  try {
    console.log("Criando assinatura a partir do callback:", {
      userId,
      partnerId,
      partnerLinkId,
      token,
      orderId
    })
    
    // Verificar se já existe uma assinatura
    const subscriptionsRef = collection(db, "subscriptions")
    const subscriptionQuery = query(
      subscriptionsRef,
      where("memberId", "==", userId),
      where("partnerId", "==", partnerId),
      where("paymentProvider", "==", "lastlink")
    )
    
    const subscriptionSnapshot = await getDocs(subscriptionQuery)
    
    // Calcular data de expiração (1 mês a partir de hoje)
    const now = new Date()
    const expiresAt = new Date(now)
    expiresAt.setMonth(now.getMonth() + 1)
    
    // Dados da assinatura
    const subscriptionData = {
      memberId: userId,
      partnerId: partnerId,
      status: "active",
      paymentProvider: "lastlink",
      type: "lastlink",
      orderId: orderId || "",
      expiresAt: expiresAt.toISOString(),
      updatedAt: new Date().toISOString(),
      planName: "Plano Premium",
      planInterval: "month",
      planIntervalCount: 1,
      paymentAmount: 0, // Valor temporário
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: expiresAt.toISOString(),
      priceId: "lastlink_premium",
      partnerLinkId: partnerLinkId || null,
      token: token || null // Guardar o token para referência
    }
    
    // Registrar também na coleção de transações para manter histórico
    const transactionData = {
      userId: userId,
      partnerId: partnerId,
      partnerLinkId: partnerLinkId,
      orderId: orderId || "",
      token: token || "",
      userEmail: userEmail,
      userName: userName,
      status: "active",
      type: "lastlink",
      provider: "lastlink",
      planName: "Plano Premium",
      planInterval: "month",
      planIntervalCount: 1,
      createdAt: now.toISOString(),
      paidAt: now.toISOString(),
      expiresAt: expiresAt.toISOString()
    }
    
    await addDoc(collection(db, "lastlink_transactions"), transactionData)
    
    if (subscriptionSnapshot.empty) {
      // Criar nova assinatura
      const subscriptionRef = await addDoc(
        subscriptionsRef, 
        {
          ...subscriptionData,
          createdAt: new Date().toISOString()
        }
      )
      console.log("Nova assinatura criada do callback:", subscriptionRef.id)
      
      // Incrementar conversões do link se temos o partnerLinkId
      if (partnerLinkId) {
        try {
          await updateDoc(doc(db, "partnerLinks", partnerLinkId), {
            conversions: increment(1),
            updatedAt: new Date().toISOString()
          })
          console.log("Conversões do link incrementadas")
        } catch (err) {
          console.error("Erro ao incrementar conversões do link:", err)
        }
      }
      
      return subscriptionRef.id
    } else {
      // Atualizar assinatura existente
      const subscriptionRef = subscriptionSnapshot.docs[0].ref
      await updateDoc(subscriptionRef, subscriptionData)
      console.log("Assinatura existente atualizada do callback:", subscriptionSnapshot.docs[0].id)
      
      return subscriptionSnapshot.docs[0].id
    }
  } catch (error) {
    console.error("Erro ao criar assinatura do callback:", error)
    return null
  }
} 