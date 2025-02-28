import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where, getDoc, doc } from "firebase/firestore"
import { jwtDecode } from "jwt-decode"
import type { SessionToken } from "@/types/session"

export async function GET(request: Request) {
  try {
    const sessionToken = request.headers.get("x-session-token")
    
    if (!sessionToken) {
      console.log("Sessão inválida - token não encontrado")
      return NextResponse.json(
        { error: "Sessão inválida" },
        { status: 403 }
      )
    }

    // Decodificar o token
    const session = jwtDecode<SessionToken>(sessionToken)
    console.log("Sessão decodificada:", session)

    if (session.userType !== "member") {
      console.log("Usuário não é membro:", session.userType)
      return NextResponse.json(
        { error: "Acesso não autorizado" },
        { status: 403 }
      )
    }

    // 1. Buscar assinaturas ativas do membro
    const subscriptionsRef = collection(db, "subscriptions")
    const subscriptionsQuery = query(
      subscriptionsRef,
      where("memberId", "==", session.uid),
      where("status", "==", "active")
    )
    const subscriptionsSnapshot = await getDocs(subscriptionsQuery)
    console.log("[FIREBASE]Assinaturas encontradas:", subscriptionsSnapshot.size)

    // Se não houver assinaturas ativas, retornar array vazio
    if (subscriptionsSnapshot.empty) {
      console.log("Nenhuma assinatura ativa encontrada")
      return NextResponse.json({ establishments: [] })
    }

    // 2. Para cada assinatura, buscar o parceiro e seus estabelecimentos
    const establishments = []
    
    for (const subscriptionDoc of subscriptionsSnapshot.docs) {
      const subscriptionData = subscriptionDoc.data()
      console.log("Dados da assinatura:", subscriptionData)
      
      // Buscar o parceiro
      const partnerDoc = await getDoc(doc(db, "users", subscriptionData.partnerId))
      if (!partnerDoc.exists()) {
        console.log("Parceiro não encontrado:", subscriptionData.partnerId)
        continue
      }
      
      const partnerData = partnerDoc.data()
      console.log("Dados do parceiro:", partnerData)

      // Buscar estabelecimentos do parceiro
      const establishmentsRef = collection(db, "establishments")
      const establishmentsQuery = query(
        establishmentsRef,
        where("partnerId", "==", partnerData.firebaseUid || partnerData.uid)
      )
      
      const establishmentsSnapshot = await getDocs(establishmentsQuery)
      console.log("Estabelecimentos encontrados para o parceiro:", establishmentsSnapshot.size)

      // Adicionar estabelecimentos encontrados ao array
      establishmentsSnapshot.docs.forEach(doc => {
        const data = doc.data()
        establishments.push({
          id: doc.id,
          ...data,
          partnerId: data.partnerId,
          partnerName: partnerData.displayName,
          status: data.status || "active",
          isFeatured: data.isFeatured || false,
          rating: data.rating || 0,
          totalRatings: data.totalRatings || 0
        })
      })
    }

    console.log("Total de estabelecimentos processados:", establishments.length)
    return NextResponse.json({ establishments })

  } catch (error) {
    console.error("Erro ao buscar feed:", error)
    return NextResponse.json(
      { error: "Erro ao buscar feed" },
      { status: 500 }
    )
  }
}