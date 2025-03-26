import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc } from "firebase/firestore"

export async function GET(request: Request) {
  try {
    // Obter parâmetros da URL
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const userId = searchParams.get("userId") || searchParams.get("metadata[userId]")
    const partnerId = searchParams.get("partnerId") || searchParams.get("metadata[partnerId]")
    const partnerLinkId = searchParams.get("linkId") || searchParams.get("metadata[linkId]") || searchParams.get("metadata[partnerLinkId]")
    const reference = searchParams.get("reference") // ID da transação no Lastlink
    
    console.log("Parâmetros de callback recebidos:", { status, userId, partnerId, partnerLinkId, reference })
    
    // Verificar status e parâmetros necessários
    if (status !== "approved" || !userId) {
      // Redirecionar para uma página de erro ou de pagamento pendente
      return NextResponse.redirect(new URL("/payment-failed", request.url))
    }
    
    // Verificar se o usuário existe
    let memberId = userId
    let userData
    
    try {
      const userRef = doc(db, "users", userId)
      const userDoc = await getDoc(userRef)
      
      if (userDoc.exists()) {
        userData = userDoc.data()
        memberId = userData.uid || userId
        
        // Atualizar status do usuário para ativo
        await updateDoc(userRef, {
          status: "active",
          updatedAt: new Date().toISOString()
        })
        
        console.log(`Status do usuário ${userId} atualizado para 'active'`)
      } else {
        console.error(`Usuário não encontrado: ${userId}`)
        return NextResponse.redirect(new URL("/payment-failed?reason=user-not-found", request.url))
      }
    } catch (err) {
      console.error("Erro ao buscar/atualizar usuário:", err)
      return NextResponse.redirect(new URL("/payment-failed?reason=user-error", request.url))
    }
    
    // Se não temos parceiro, mas temos link, buscar o parceiro pelo link
    if (!partnerId && partnerLinkId) {
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
    
    // Se temos parceiro, criar a assinatura
    if (partnerId) {
      try {
        // Verificar se já existe uma assinatura ativa entre este membro e parceiro
        const subscriptionsRef = collection(db, "subscriptions")
        const subscriptionQuery = query(
          subscriptionsRef,
          where("memberId", "==", memberId),
          where("partnerId", "==", partnerId),
          where("status", "==", "active")
        )
        
        const subscriptionSnapshot = await getDocs(subscriptionQuery)
        
        if (subscriptionSnapshot.empty) {
          // Buscar informações do parceiro
          const partnerRef = doc(db, "users", partnerId)
          const partnerDoc = await getDoc(partnerRef)
          
          if (!partnerDoc.exists()) {
            console.error(`Parceiro não encontrado: ${partnerId}`)
            // Ainda assim, redirecionar para sucesso, pois o pagamento foi aprovado
            return NextResponse.redirect(new URL("/payment-success", request.url))
          }
          
          const partnerData = partnerDoc.data()
          
          // Criar nova assinatura
          const subscriptionData = {
            memberId,
            partnerId,
            partnerName: partnerData.displayName || partnerData.name || "Parceiro",
            partnerEmail: partnerData.email || "",
            partnerLinkId: partnerLinkId || null,
            status: "active",
            paymentProvider: "lastlink",
            paymentReference: reference,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          
          const docRef = await addDoc(collection(db, "subscriptions"), subscriptionData)
          console.log(`Assinatura criada com sucesso: ${docRef.id}`)
        } else {
          console.log("Assinatura já existe, não é necessário criar uma nova")
        }
      } catch (err) {
        console.error("Erro ao gerenciar assinatura:", err)
      }
    } else {
      console.warn("Nenhum partnerId disponível, não foi possível criar assinatura")
    }
    
    // Redirecionar para página de sucesso
    return NextResponse.redirect(new URL("/payment-success", request.url))
    
  } catch (error) {
    console.error("Erro ao processar callback:", error)
    return NextResponse.redirect(new URL("/payment-failed?reason=unknown", request.url))
  }
} 