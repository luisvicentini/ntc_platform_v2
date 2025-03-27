import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, addDoc, query, where, getDocs, doc, updateDoc, getDoc } from "firebase/firestore"

// Função para redirecionar após pagamento
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")
    const paymentMethod = searchParams.get("paymentMethod")
    const orderId = searchParams.get("order_id") || searchParams.get("orderId")
    
    console.log("Callback Lastlink recebido:", { token, paymentMethod, orderId })
    
    // Logs detalhados para diagnóstico
    console.log("Parâmetros da URL completos:", Object.fromEntries(searchParams.entries()))
    
    // Verificar se temos informações de metadata no URL
    const userId = searchParams.get("metadata[userId]") || searchParams.get("metadata_userId")
    const partnerId = searchParams.get("metadata[partnerId]") || searchParams.get("metadata_partnerId")
    const partnerLinkId = searchParams.get("metadata[partnerLinkId]") || searchParams.get("metadata_partnerLinkId")
    
    console.log("Metadados extraídos:", { userId, partnerId, partnerLinkId })
    
    // Se temos um orderId, podemos tentar registrar a operação localmente
    if (orderId && userId) {
      try {
        console.log(`Registrando pagamento para orderId: ${orderId}, userId: ${userId}`)
        
        // Verificar se o pagamento já foi registrado
        const paymentsRef = collection(db, "lastlink_payments")
        const paymentQuery = query(paymentsRef, where("orderId", "==", orderId))
        const paymentSnapshot = await getDocs(paymentQuery)
        
        if (paymentSnapshot.empty) {
          console.log("Pagamento ainda não registrado. Registrando localmente...")
          
          // Buscar detalhes do usuário
          let userName = ""
          let userEmail = ""
          
          try {
            const userRef = doc(db, "users", userId)
            const userDoc = await getDoc(userRef)
            
            if (userDoc.exists()) {
              const userData = userDoc.data()
              userName = userData.displayName || userData.name || ""
              userEmail = userData.email || ""
            }
          } catch (err) {
            console.error("Erro ao buscar detalhes do usuário:", err)
          }
          
          // Registrar o pagamento
          const paymentData = {
            memberId: userId,
            orderId: orderId,
            status: "active",
            customerName: userName,
            customerEmail: userEmail,
            paymentMethod: paymentMethod || "unknown",
            createdAt: new Date().toISOString(),
            paidAt: new Date().toISOString(),
            partnerId: partnerId || null,
            partnerLinkId: partnerLinkId || null,
            planName: "Plano Premium", // Valor padrão
            planInterval: "month", // Valor padrão
            planIntervalCount: 1, // Valor padrão
            metadata: {
              token: token,
              userId: userId,
              partnerId: partnerId,
              partnerLinkId: partnerLinkId
            }
          }
          
          await addDoc(paymentsRef, paymentData)
          console.log("Pagamento registrado com sucesso localmente")
          
          // Criar uma assinatura se temos partner ID
          if (partnerId) {
            try {
              console.log("Tentando criar assinatura local...")
              
              // Verificar se já existe assinatura
              const subscriptionsRef = collection(db, "subscriptions")
              const subscriptionQuery = query(
                subscriptionsRef,
                where("memberId", "==", userId),
                where("partnerId", "==", partnerId),
                where("paymentProvider", "==", "lastlink")
              )
              
              const subscriptionSnapshot = await getDocs(subscriptionQuery)
              
              // Calcular data de expiração (1 mês a partir de agora)
              const expiresAt = new Date()
              expiresAt.setMonth(expiresAt.getMonth() + 1)
              
              if (subscriptionSnapshot.empty) {
                // Criar nova assinatura
                const subscriptionData = {
                  memberId: userId,
                  partnerId: partnerId,
                  status: "active",
                  paymentProvider: "lastlink",
                  type: "lastlink",
                  orderId: orderId,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  expiresAt: expiresAt.toISOString(),
                  currentPeriodStart: new Date().toISOString(),
                  currentPeriodEnd: expiresAt.toISOString(),
                  planName: "Plano Premium",
                  planInterval: "month",
                  planIntervalCount: 1,
                  priceId: "lastlink_plano_premium"
                }
                
                await addDoc(subscriptionsRef, subscriptionData)
                console.log("Assinatura criada com sucesso localmente")
              } else {
                // Atualizar assinatura existente
                const subscriptionDoc = subscriptionSnapshot.docs[0].ref
                
                await updateDoc(subscriptionDoc, {
                  status: "active",
                  orderId: orderId,
                  updatedAt: new Date().toISOString(),
                  expiresAt: expiresAt.toISOString(),
                  currentPeriodEnd: expiresAt.toISOString()
                })
                
                console.log("Assinatura atualizada com sucesso localmente")
              }
            } catch (err) {
              console.error("Erro ao criar/atualizar assinatura:", err)
            }
          }
        } else {
          console.log("Pagamento já registrado anteriormente")
        }
      } catch (error) {
        console.error("Erro ao registrar pagamento:", error)
      }
    }
    
    // Redirecionar para página de perfil do membro
    return NextResponse.redirect(new URL("/member/profile?payment=success", request.url))
  } catch (error) {
    console.error("Erro ao processar callback:", error)
    return NextResponse.redirect(new URL("/member/profile?payment=error", request.url))
  }
} 