import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where, getDoc, doc } from "firebase/firestore"
import { jwtDecode } from "jwt-decode"
import type { SessionToken } from "@/types/session"
import jwt from "jsonwebtoken"

export async function GET(request: Request) {
  try {
    // Obter token de autenticação do cabeçalho
    const sessionToken = request.headers.get("x-session-token")
    
    if (!sessionToken) {
      return NextResponse.json({ error: "Token de sessão não fornecido" }, { status: 401 })
    }
    
    // Validar token
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      return NextResponse.json({ error: "Configuração JWT ausente" }, { status: 500 })
    }
    
    let memberId
    try {
      const decodedToken = jwt.verify(sessionToken, jwtSecret)
      if (typeof decodedToken === "object" && decodedToken !== null) {
        memberId = decodedToken.uid || decodedToken.id
      }
    } catch (error) {
      console.error("Erro ao verificar token:", error)
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }
    
    if (!memberId) {
      return NextResponse.json({ error: "ID do Assinante não encontrado no token" }, { status: 401 })
    }
    
    console.log(`Buscando feed para Assinante: ${memberId}`)

    // 1. Buscar assinaturas ativas do Assinante (versão simplificada)
    const subscriptionsRef = collection(db, "subscriptions")
    const subscriptionsQuery = query(
      subscriptionsRef,
      where("memberId", "==", memberId),
      where("status", "==", "active")
    )
    
    const subscriptionsSnapshot = await getDocs(subscriptionsQuery)
    console.log(`Encontradas ${subscriptionsSnapshot.size} assinaturas ativas`)
    
    // Extrair IDs dos parceiros de todas as assinaturas ativas
    const partnerIds = new Set()
    subscriptionsSnapshot.docs.forEach(doc => {
      const partnerData = doc.data()
      if (partnerData.partnerId) {
        partnerIds.add(partnerData.partnerId)
        console.log(`Adicionado parceiro: ${partnerData.partnerId}`)
      }
    })
    
    // Converter Set para Array para usar na consulta
    const partnerIdsArray = Array.from(partnerIds)
    console.log(`Total de parceiros únicos: ${partnerIdsArray.length}`)
    
    // 2. Buscar estabelecimentos em destaque
    const featuredEstablishmentsRef = collection(db, "establishments")
    const featuredQuery = query(
      featuredEstablishmentsRef,
      where("isFeatured", "==", true),
      where("status", "==", "active")
    )
    
    const featuredSnapshot = await getDocs(featuredQuery)
    const featuredEstablishments = featuredSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    console.log(`Encontrados ${featuredEstablishments.length} estabelecimentos em destaque`)
    
    // 3. Buscar estabelecimentos dos parceiros
    let partnerEstablishments = []
    
    if (partnerIdsArray.length > 0) {
      // Para lidar com possíveis limitações do Firestore (in aceita no máximo 10 valores)
      for (let i = 0; i < partnerIdsArray.length; i += 10) {
        const batch = partnerIdsArray.slice(i, i + 10)
        
        if (batch.length > 0) {
          const establishmentsRef = collection(db, "establishments")
          const establishmentsQuery = query(
            establishmentsRef,
            where("partnerId", "in", batch),
            where("status", "==", "active")
          )
          
          const establishmentsSnapshot = await getDocs(establishmentsQuery)
          
          establishmentsSnapshot.docs.forEach(doc => {
            partnerEstablishments.push({
              id: doc.id,
              ...doc.data()
            })
          })
        }
      }
    }
    
    console.log(`Encontrados ${partnerEstablishments.length} estabelecimentos de parceiros`)
    
    // 4. Combinar resultados (removendo duplicatas por ID)
    const allEstablishmentIds = new Set()
    const combinedEstablishments = []
    
    // Adicionar estabelecimentos em destaque
    featuredEstablishments.forEach(est => {
      if (!allEstablishmentIds.has(est.id)) {
        allEstablishmentIds.add(est.id)
        combinedEstablishments.push(est)
      }
    })
    
    // Adicionar estabelecimentos dos parceiros
    partnerEstablishments.forEach(est => {
      if (!allEstablishmentIds.has(est.id)) {
        allEstablishmentIds.add(est.id)
        combinedEstablishments.push(est)
      }
    })
    
    console.log(`Total de estabelecimentos retornados: ${combinedEstablishments.length}`)
    
    return NextResponse.json({ 
      establishments: combinedEstablishments,
      featuredCount: featuredEstablishments.length,
      partnerCount: partnerEstablishments.length
    })
  } catch (error) {
    console.error("Erro ao carregar feed:", error)
    return NextResponse.json({ error: "Erro ao carregar estabelecimentos" }, { status: 500 })
  }
}