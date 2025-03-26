import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const linkId = searchParams.get("linkId")
    const userId = searchParams.get("userId")
    const callbackUrl = searchParams.get("callback")
    
    console.log("Parâmetros de redirecionamento recebidos:", { linkId, userId, callbackUrl })
    
    if (!linkId) {
      return NextResponse.json(
        { error: "ID do link é obrigatório" },
        { status: 400 }
      )
    }
    
    // Buscar o link para obter o ID do parceiro e o priceId
    const linksRef = collection(db, "partnerLinks")
    const linkQuery = query(linksRef, where("__name__", "==", linkId))
    const linkSnapshot = await getDocs(linkQuery)
    
    if (linkSnapshot.empty) {
      console.error(`Link não encontrado: ${linkId}`)
      return NextResponse.json({ error: "Link não encontrado" }, { status: 404 })
    }
    
    const linkData = linkSnapshot.docs[0].data()
    const partnerId = linkData.partnerId
    const priceId = linkData.priceId
    
    console.log("Dados do link encontrado:", { partnerId, priceId })
    
    // Verificar se é um link da Lastlink
    if (!priceId.startsWith("lastlink_")) {
      return NextResponse.json({ error: "Link não é do tipo Lastlink" }, { status: 400 })
    }
    
    // Buscar informações do parceiro para obter a URL do Lastlink
    try {
      // Método 1: Buscar pela referência direta do documento
      const partnerRef = doc(db, "users", partnerId)
      const partnerDoc = await getDoc(partnerRef)
      
      if (!partnerDoc.exists()) {
        // Método 2: Se não encontrar diretamente pelo ID, tenta buscar pelo UID
        console.log(`Tentando buscar parceiro pelo UID: ${partnerId}`)
        const usersRef = collection(db, "users")
        const partnerQuery = query(usersRef, where("uid", "==", partnerId))
        const partnerSnapshot = await getDocs(partnerQuery)
        
        if (partnerSnapshot.empty) {
          console.error(`Parceiro não encontrado: ${partnerId}`)
          return NextResponse.json({ error: "Parceiro não encontrado" }, { status: 404 })
        }
        
        const partnerData = partnerSnapshot.docs[0].data()
        const checkoutOptions = partnerData.checkoutOptions || {}
        
        if (!checkoutOptions.lastlinkEnabled) {
          return NextResponse.json({ error: "Checkout Lastlink não está habilitado para este parceiro" }, { status: 400 })
        }
        
        // Extrair o nome do plano do priceId
        const planId = priceId.replace("lastlink_", "").replace(/_/g, " ")
        
        // Buscar o plano correspondente
        const plan = checkoutOptions.lastlinkPlans.find(
          (p: any) => p.name.toLowerCase() === planId.toLowerCase()
        )
        
        if (!plan || !plan.link) {
          console.error(`Plano não encontrado: ${planId}`)
          return NextResponse.json({ error: "URL do plano não encontrada" }, { status: 404 })
        }
        
        console.log("Plano encontrado via UID:", plan)
        
        // Construir a URL com parâmetros para metadados (opcional)
        let redirectUrl = plan.link
        
        // Verificar se o usuário existe se userId for fornecido
        let userName = "";
        let userEmail = "";
        
        if (userId) {
          try {
            const userRef = doc(db, "users", userId)
            const userDoc = await getDoc(userRef)
            
            if (userDoc.exists()) {
              const userData = userDoc.data()
              userName = userData.displayName || userData.name || ""
              userEmail = userData.email || ""
              console.log("Dados do usuário encontrados:", { userName, userEmail })
            } else {
              console.warn(`Usuário não encontrado: ${userId}`)
            }
          } catch (err) {
            console.error("Erro ao buscar usuário:", err)
          }
        }
        
        // Adicionar metadados como query params para o Lastlink
        if (redirectUrl) {
          // Parâmetros para metadados que o Lastlink vai receber
          const metadataParams = new URLSearchParams()
          
          // Parâmetros padrão para o Lastlink
          if (userEmail) metadataParams.append("email", userEmail)
          if (userName) metadataParams.append("name", userName)
          
          // Adicionar URL de callback se fornecida
          if (callbackUrl) {
            metadataParams.append("callback_url", callbackUrl)
            console.log("URL de callback incluída:", callbackUrl)
          }
          
          // Adicionar informações como metadados para o webhook
          if (userId) metadataParams.append("metadata[userId]", userId)
          if (partnerId) metadataParams.append("metadata[partnerId]", partnerId)
          if (linkId) metadataParams.append("metadata[partnerLinkId]", linkId)
          
          // Verificar se já tem parâmetros na URL
          const hasParams = redirectUrl.includes("?")
          redirectUrl += `${hasParams ? "&" : "?"}${metadataParams.toString()}`
          
          console.log("URL de redirecionamento construída:", redirectUrl)
        }
        
        // Retornar a URL para o cliente redirecionar
        return NextResponse.json({ redirectUrl })
      }
      
      // Se chegou aqui, encontrou o parceiro diretamente pelo ID
      const partnerData = partnerDoc.data()
      const checkoutOptions = partnerData.checkoutOptions || {}
      
      if (!checkoutOptions.lastlinkEnabled) {
        return NextResponse.json({ error: "Checkout Lastlink não está habilitado para este parceiro" }, { status: 400 })
      }
      
      // Extrair o nome do plano do priceId
      const planId = priceId.replace("lastlink_", "").replace(/_/g, " ")
      
      // Buscar o plano correspondente
      const plan = checkoutOptions.lastlinkPlans.find(
        (p: any) => p.name.toLowerCase() === planId.toLowerCase()
      )
      
      if (!plan || !plan.link) {
        console.error(`Plano não encontrado: ${planId}`)
        return NextResponse.json({ error: "URL do plano não encontrada" }, { status: 404 })
      }
      
      console.log("Plano encontrado via ID direto:", plan)
      
      // Construir a URL com parâmetros para metadados (opcional)
      let redirectUrl = plan.link
      
      // Verificar se o usuário existe se userId for fornecido
      let userName = "";
      let userEmail = "";
      
      if (userId) {
        try {
          const userRef = doc(db, "users", userId)
          const userDoc = await getDoc(userRef)
          
          if (userDoc.exists()) {
            const userData = userDoc.data()
            userName = userData.displayName || userData.name || ""
            userEmail = userData.email || ""
            console.log("Dados do usuário encontrados:", { userName, userEmail })
          } else {
            console.warn(`Usuário não encontrado: ${userId}`)
          }
        } catch (err) {
          console.error("Erro ao buscar usuário:", err)
        }
      }
      
      // Adicionar metadados como query params para o Lastlink
      if (redirectUrl) {
        // Parâmetros para metadados que o Lastlink vai receber
        const metadataParams = new URLSearchParams()
        
        // Parâmetros padrão para o Lastlink
        if (userEmail) metadataParams.append("email", userEmail)
        if (userName) metadataParams.append("name", userName)
        
        // Adicionar URL de callback se fornecida
        if (callbackUrl) {
          metadataParams.append("callback_url", callbackUrl)
          console.log("URL de callback incluída:", callbackUrl)
        }
        
        // Adicionar informações como metadados para o webhook
        if (userId) metadataParams.append("metadata[userId]", userId)
        if (partnerId) metadataParams.append("metadata[partnerId]", partnerId)
        if (linkId) metadataParams.append("metadata[partnerLinkId]", linkId)
        
        // Verificar se já tem parâmetros na URL
        const hasParams = redirectUrl.includes("?")
        redirectUrl += `${hasParams ? "&" : "?"}${metadataParams.toString()}`
        
        console.log("URL de redirecionamento construída:", redirectUrl)
      }
      
      // Retornar a URL para o cliente redirecionar
      return NextResponse.json({ redirectUrl })
      
    } catch (err) {
      console.error(`Erro ao buscar parceiro: ${err}`)
      return NextResponse.json({ error: "Erro ao buscar informações do parceiro" }, { status: 500 })
    }
    
  } catch (error) {
    console.error("Erro ao processar redirecionamento:", error)
    return NextResponse.json(
      { error: "Erro interno ao processar redirecionamento" },
      { status: 500 }
    )
  }
} 