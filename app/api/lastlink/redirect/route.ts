import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs } from "firebase/firestore"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const linkId = searchParams.get("linkId")
    const userId = searchParams.get("userId")
    
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
      return NextResponse.json({ error: "Link não encontrado" }, { status: 404 })
    }
    
    const linkData = linkSnapshot.docs[0].data()
    const partnerId = linkData.partnerId
    const priceId = linkData.priceId
    
    // Verificar se é um link da Lastlink
    if (!priceId.startsWith("lastlink_")) {
      return NextResponse.json({ error: "Link não é do tipo Lastlink" }, { status: 400 })
    }
    
    // Buscar informações do parceiro para obter a URL do Lastlink
    const usersRef = collection(db, "users")
    const partnerQuery = query(usersRef, where("uid", "==", partnerId))
    const partnerSnapshot = await getDocs(partnerQuery)
    
    if (partnerSnapshot.empty) {
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
      return NextResponse.json({ error: "URL do plano não encontrada" }, { status: 404 })
    }
    
    // Construir a URL com parâmetros para metadados (opcional)
    let redirectUrl = plan.link
    
    // Adicionar metadados como query params se necessário
    if (userId) {
      // Verificar se já tem parâmetros na URL
      const hasParams = redirectUrl.includes("?")
      redirectUrl += `${hasParams ? "&" : "?"}userId=${userId}&partnerId=${partnerId}&linkId=${linkId}`
    }
    
    // Retornar a URL para o cliente redirecionar
    return NextResponse.json({ redirectUrl })
    
  } catch (error) {
    console.error("Erro ao processar redirecionamento:", error)
    return NextResponse.json(
      { error: "Erro interno ao processar redirecionamento" },
      { status: 500 }
    )
  }
} 