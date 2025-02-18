import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs } from "firebase/firestore"
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

    // Decodificar o token
    const session = jwtDecode<SessionToken>(sessionToken)

    if (session.userType !== "member") {
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

    // Se não houver assinaturas ativas, retornar array vazio
    if (subscriptionsSnapshot.empty) {
      return NextResponse.json({ establishments: [] })
    }

    // 2. Obter IDs dos parceiros das assinaturas ativas
    const partnerIds = subscriptionsSnapshot.docs.map(doc => doc.data().partnerId)

    // 3. Buscar estabelecimentos vinculados aos parceiros
    const establishmentsRef = collection(db, "establishments")
    const establishments = []

    // Buscar estabelecimentos para cada parceiro
    for (const partnerId of partnerIds) {
      const establishmentsQuery = query(
        establishmentsRef,
        where("partnerId", "==", partnerId),
        where("status", "==", "active")
      )
      const establishmentsSnapshot = await getDocs(establishmentsQuery)

      // 4. Para cada estabelecimento, buscar informações adicionais
      for (const doc of establishmentsSnapshot.docs) {
        const establishmentData = doc.data()

        // Buscar dados do parceiro
        const partnerDoc = await getDocs(query(
          collection(db, "users"),
          where("__name__", "==", partnerId)
        ))

        const partnerData = partnerDoc.docs[0]?.data() || {}

        // Buscar vouchers ativos do estabelecimento
        const vouchersRef = collection(db, "vouchers")
        const vouchersQuery = query(
          vouchersRef,
          where("establishmentId", "==", doc.id),
          where("status", "==", "active")
        )
        const vouchersSnapshot = await getDocs(vouchersQuery)
        const vouchers = vouchersSnapshot.docs.map(vDoc => ({
          id: vDoc.id,
          ...vDoc.data()
        }))

        // Garantir que as imagens sejam URLs completas do Firebase Storage
        const images = establishmentData.images?.map((image: string) => {
          if (image.startsWith('blob:')) {
            return null // Ignorar blobs temporários
          }
          // Se a imagem já for uma URL completa, mantê-la
          if (image.startsWith('http')) {
            return image
          }
          // Se for um path do Storage, converter para URL completa
          return `https://storage.googleapis.com/${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}/${image}`
        }).filter(Boolean) || []

        // Adicionar estabelecimento com todas as informações
        establishments.push({
          id: doc.id,
          ...establishmentData,
          images: images,
          partner: {
            id: partnerId,
            displayName: partnerData.displayName,
            email: partnerData.email
          },
          vouchers: vouchers
        })
      }
    }

    // 5. Ordenar estabelecimentos (pode ajustar critério conforme necessário)
    establishments.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return NextResponse.json({ 
      establishments,
      total: establishments.length
    })

  } catch (error) {
    console.error("Erro ao buscar feed do membro:", error)
    return NextResponse.json(
      { 
        error: "Erro ao buscar estabelecimentos",
        details: error instanceof Error ? error.message : "Erro desconhecido"
      },
      { status: 500 }
    )
  }
}