import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, addDoc, getDocs, query, where, doc, updateDoc, getDoc, DocumentData } from "firebase/firestore"
import { jwtDecode } from "jwt-decode"
import type { SessionToken } from "@/types/session"

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const sessionToken = request.headers.get("x-session-token")
    
    // Verificar se é uma requisição para criar assinatura 'iniciada'
    if (data.status === 'iniciada') {
      // Para criação de assinatura inicial, apenas validamos os dados básicos
      const { userId, partnerId, userEmail } = data
      
      if (!userId || !partnerId) {
        return NextResponse.json(
          { error: "UserId e partnerId são obrigatórios" },
          { status: 400 }
        )
      }
      
      // Verificar se já existe uma assinatura iniciada para este usuário e parceiro
      const subscriptionsRef = collection(db, "subscriptions")
      const existingQuery = query(
        subscriptionsRef,
        where("userId", "==", userId),
        where("partnerId", "==", partnerId),
        where("status", "==", "iniciada")
      )
      const existingSnapshot = await getDocs(existingQuery)
      
      // Se existir, atualizar com os novos dados
      if (!existingSnapshot.empty) {
        const existingId = existingSnapshot.docs[0].id
        
        // Criar objeto com dados atualizados
        const subscriptionData = {
          ...data,
          updatedAt: new Date().toISOString()
        }
        
        // Atualizar documento existente
        const existingDocRef = doc(db, "subscriptions", existingId)
        await updateDoc(existingDocRef, subscriptionData)
        
        return NextResponse.json({
          id: existingId,
          ...subscriptionData,
          message: "Assinatura inicial atualizada"
        })
      }
      
      // Garantir que temos os dados mínimos necessários
      const subscriptionData = {
        ...data,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'iniciada'
      }
      
      // Criar nova assinatura inicial
      const docRef = await addDoc(collection(db, "subscriptions"), subscriptionData)
      
      console.log(`Assinatura inicial criada com ID: ${docRef.id}`)
      
      return NextResponse.json({
        id: docRef.id,
        ...subscriptionData,
        message: "Assinatura inicial criada"
      })
    }
    
    // Para outros tipos de assinatura, seguir o fluxo normal com autenticação
    const { memberId, partnerId } = data
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: "Sessão inválida" },
        { status: 403 }
      )
    }

    // Decodificar o token
    const session = jwtDecode<SessionToken>(sessionToken)

    // Apenas usuários master podem criar assinaturas
    if (session.userType !== "master") {
      return NextResponse.json(
        { error: "Apenas administradores podem vincular Assinantes a parceiros" },
        { status: 403 }
      )
    }

    // Verificar se o Assinante existe
    const membersRef = collection(db, "users")
    const memberQuery = query(membersRef, where("uid", "==", memberId))
    const memberSnapshot = await getDocs(memberQuery)

    if (memberSnapshot.empty) {
      return NextResponse.json(
        { error: "Assinante não encontrado" },
        { status: 404 }
      )
    }

    const memberData = memberSnapshot.docs[0].data()
    if (memberData.userType !== "member") {
      return NextResponse.json(
        { error: "Usuário não é um Assinante" },
        { status: 400 }
      )
    }

    // Verificar se o parceiro existe
    const partnerQuery = query(membersRef, where("uid", "==", partnerId))
    const partnerSnapshot = await getDocs(partnerQuery)

    if (partnerSnapshot.empty) {
      return NextResponse.json(
        { error: "Parceiro não encontrado" },
        { status: 404 }
      )
    }

    const partnerData = partnerSnapshot.docs[0].data()
    if (partnerData.userType !== "partner") {
      return NextResponse.json(
        { error: "Usuário não é um parceiro" },
        { status: 400 }
      )
    }

    // Verificar se já existe uma assinatura ativa
    const subscriptionsRef = collection(db, "subscriptions")
    const existingQuery = query(
      subscriptionsRef,
      where("memberId", "==", memberId),
      where("partnerId", "==", partnerId),
      where("status", "==", "active")
    )
    const existingSnapshot = await getDocs(existingQuery)

    if (!existingSnapshot.empty) {
      return NextResponse.json(
        { error: "Assinante já está vinculado a este parceiro" },
        { status: 400 }
      )
    }

    // Criar assinatura
    const subscriptionData = {
      memberId,
      partnerId,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const docRef = await addDoc(collection(db, "subscriptions"), subscriptionData)

    return NextResponse.json({
      id: docRef.id,
      ...subscriptionData
    })

  } catch (error) {
    console.error("Erro ao criar assinatura:", error)
    return NextResponse.json(
      { error: "Erro ao criar assinatura" },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const partnerId = searchParams.get("partnerId")
    const userEmail = searchParams.get("email")

    const subscriptionsRef = collection(db, "subscriptions")
    let subscriptionsQuery
    let subscriptions: DocumentData[] = []

    if (userId || userEmail) {
      // Buscar por userId e email (para assinaturas do membro)
      if (userId) {
        const userIdQuery = query(
          subscriptionsRef,
          where("userId", "==", userId)
        )
        const userIdSnapshot = await getDocs(userIdQuery)
        subscriptions.push(...userIdSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })))
      }

      if (userEmail) {
        const emailQuery = query(
          subscriptionsRef,
          where("userEmail", "==", userEmail)
        )
        const emailSnapshot = await getDocs(emailQuery)
        // Adicionar resultados da busca por email, evitando duplicatas
        const emailResults = emailSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        emailResults.forEach(result => {
          if (!subscriptions.find(s => s.id === result.id)) {
            subscriptions.push(result)
          }
        })
      }
    } else if (partnerId) {
      // Buscar por partnerId (para assinaturas vinculadas ao parceiro)
      const partnerQuery = query(
        subscriptionsRef,
        where("partnerId", "==", partnerId)
      )
      const snapshot = await getDocs(partnerQuery)
      subscriptions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } else {
      // Se não houver filtro, retornar erro
      return NextResponse.json(
        { error: "É necessário fornecer userId, email ou partnerId" },
        { status: 400 }
      )
    }

    // Enriquecer os dados com informações do parceiro
    const enrichedSubscriptions = await Promise.all(subscriptions.map(async (subscription) => {
      let partnerData = null
      if (subscription.partnerId) {
        const partnerRef = doc(db, "users", subscription.partnerId)
        const partnerSnap = await getDoc(partnerRef)
        if (partnerSnap.exists()) {
          partnerData = partnerSnap.data()
        }
      }

      return {
        ...subscription,
        partner: partnerData ? {
          id: subscription.partnerId,
          name: partnerData.displayName || partnerData.name || partnerData.businessName,
          email: partnerData.email
        } : null
      }
    }))

    // Ordenar assinaturas: ativas primeiro, depois por data de criação
    enrichedSubscriptions.sort((a, b) => {
      // Priorizar assinaturas ativas
      const isActiveA = a.status === 'active' || a.status === 'ativa'
      const isActiveB = b.status === 'active' || b.status === 'ativa'
      
      if (isActiveA && !isActiveB) return -1
      if (!isActiveA && isActiveB) return 1
      
      // Em seguida, ordenar por data (mais recente primeiro)
      const dateA = new Date(a.createdAt || 0)
      const dateB = new Date(b.createdAt || 0)
      return dateB.getTime() - dateA.getTime()
    })

    return NextResponse.json(enrichedSubscriptions)

  } catch (error) {
    console.error("Erro ao buscar assinaturas:", error)
    return NextResponse.json(
      { error: "Erro ao buscar assinaturas" },
      { status: 500 }
    )
  }
}
