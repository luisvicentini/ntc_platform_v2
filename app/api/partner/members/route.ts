import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore"
import { jwtDecode } from "jwt-decode"
import type { SessionToken } from "@/types/session"

export async function GET(request: Request) {
  try {
    const sessionToken = request.headers.get("x-session-token")
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: "Sessão inválida" },
        { status: 403 }
      )
    }

    const session = jwtDecode<SessionToken>(sessionToken)

    if (session.userType !== "partner") {
      return NextResponse.json(
        { error: "Acesso não autorizado" },
        { status: 403 }
      )
    }

    // Primeiro, buscar o documento do usuário parceiro
    const usersRef = collection(db, "users")
    const partnerQuery = query(usersRef, where("firebaseUid", "==", session.uid))
    const partnerSnapshot = await getDocs(partnerQuery)
    
    if (partnerSnapshot.empty) {
      console.error("Parceiro não encontrado para firebaseUid:", session.uid)
      return NextResponse.json(
        { error: "Parceiro não encontrado" },
        { status: 404 }
      )
    }

    const partnerId = partnerSnapshot.docs[0].id
    console.log("ID do documento do parceiro:", partnerId)

    // Buscar todas as assinaturas do parceiro (ativas e inativas)
    const subscriptionsRef = collection(db, "subscriptions")
    const subscriptionsQuery = query(
      subscriptionsRef,
      where("partnerId", "==", partnerId)
    )
    
    console.log("Buscando assinaturas para partnerId:", partnerId)
    const subscriptionsSnapshot = await getDocs(subscriptionsQuery)
    console.log("[STRIPE] Assinaturas encontradas:", subscriptionsSnapshot.size)

    // Obter IDs únicos dos Assinantes
    const memberIds = [...new Set(subscriptionsSnapshot.docs.map(doc => doc.data().memberId))]
    console.log("IDs únicos de Assinantes:", memberIds)

    if (memberIds.length === 0) {
      return NextResponse.json({ members: [] })
    }

    // Buscar dados dos Assinantes
    const members = []

    // Buscar Assinantes em lotes para evitar limitações do Firestore
    for (let i = 0; i < memberIds.length; i += 10) {
      const batch = memberIds.slice(i, i + 10)
      const membersQuery = query(
        usersRef,
        where("firebaseUid", "in", batch)
      )
      const membersSnapshot = await getDocs(membersQuery)
      console.log(`Buscando lote ${i/10 + 1}, encontrados:`, membersSnapshot.size)
      
      // Para cada Assinante, encontrar sua assinatura mais recente
      const batchMembers = membersSnapshot.docs.map(doc => {
        const memberData = doc.data()
        const memberSubscriptions = subscriptionsSnapshot.docs
          .filter(sub => sub.data().memberId === memberData.firebaseUid)
          .sort((a, b) => {
            const dateA = new Date(a.data().createdAt)
            const dateB = new Date(b.data().createdAt)
            return dateB.getTime() - dateA.getTime()
          })

        const latestSubscription = memberSubscriptions[0]?.data()

        return {
          id: doc.id,
          ...memberData,
          subscription: latestSubscription ? {
            createdAt: latestSubscription.createdAt,
            expiresAt: latestSubscription.expiresAt,
            status: latestSubscription.status
          } : null,
          subscriptions: memberSubscriptions.map(sub => ({
            createdAt: sub.data().createdAt,
            expiresAt: sub.data().expiresAt,
            status: sub.data().status
          }))
        }
      })

      members.push(...batchMembers)
    }

    console.log("Total de Assinantes processados:", members.length)
    return NextResponse.json({ members })

  } catch (error) {
    console.error("Erro ao listar Assinantes:", error)
    return NextResponse.json(
      { error: "Erro ao listar Assinantes" },
      { status: 500 }
    )
  }
} 