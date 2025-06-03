import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, getDoc, doc } from "firebase/firestore"
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
    console.log("[DEBUG] ID do usuário business:", session.uid)

    // Buscar usuário na coleção users usando query
    const usersRef = collection(db, "users")
    const userQuery = query(
      usersRef,
      where("firebaseUid", "==", session.uid)
    )
    
    const userSnap = await getDocs(userQuery)
    
    if (userSnap.empty) {
      console.log("[DEBUG] Usuário não encontrado usando firebaseUid")
      return NextResponse.json({ vouchers: [] })
    }

    const userData = userSnap.docs[0].data()
    console.log("[DEBUG] Dados do usuário:", userData)

    // Verificar se é um usuário business
    if (userData.userType !== "business") {
      console.log("[DEBUG] Usuário não é do tipo business")
      return NextResponse.json(
        { error: "Acesso não autorizado" },
        { status: 403 }
      )
    }

    // Pegar os IDs dos estabelecimentos vinculados
    const establishmentIds = userData.establishmentIds || []
    console.log("[DEBUG] IDs dos estabelecimentos:", establishmentIds)

    if (establishmentIds.length === 0) {
      console.log("[DEBUG] Nenhum estabelecimento vinculado ao usuário")
      return NextResponse.json({ vouchers: [] })
    }

    // Buscar vouchers de todos os estabelecimentos
    const vouchersRef = collection(db, "vouchers")
    const allVouchers = []

    for (const establishmentId of establishmentIds) {
      console.log("[DEBUG] Buscando vouchers do estabelecimento:", establishmentId)
      
      const vouchersQuery = query(
        vouchersRef,
        where("establishmentId", "==", establishmentId)
      )
      
      const vouchersSnap = await getDocs(vouchersQuery)
      console.log(`[DEBUG] Vouchers encontrados para ${establishmentId}:`, vouchersSnap.size)
      
      vouchersSnap.docs.forEach(doc => {
        console.log("[DEBUG] Voucher encontrado:", doc.id, doc.data())
      })
      
      const establishmentVouchers = await Promise.all(
        vouchersSnap.docs.map(async (docSnapshot) => {
          const data = docSnapshot.data()
          
          // Buscar dados do Assinante usando query
          const membersRef = collection(db, "users")
          const memberQuery = query(
            membersRef,
            where("firebaseUid", "==", data.memberId)
          )
          const memberSnap = await getDocs(memberQuery)
          const memberData = !memberSnap.empty ? memberSnap.docs[0].data() : {}
          
          // Buscar dados do estabelecimento
          const establishmentRef = doc(db, "establishments", data.establishmentId)
          const establishmentDoc = await getDoc(establishmentRef)
          const establishmentData = establishmentDoc.exists() ? establishmentDoc.data() : {}
          
          return {
            id: docSnapshot.id,
            ...data,
            member: {
              id: data.memberId,
              name: memberData.displayName || "Usuário não encontrado",
              phone: memberData.phone || "Não informado",
              photoURL: memberData.photoURL,
              email: memberData.email || "Não informado"

            },
            establishment: {
              id: data.establishmentId,
              name: establishmentData.name || "Estabelecimento não encontrado"
            }
          }
        })
      )
      
      allVouchers.push(...establishmentVouchers)
    }

    console.log("[DEBUG] Total de vouchers encontrados:", allVouchers.length)
    console.log("[DEBUG] Resposta final:", { vouchers: allVouchers })

    return NextResponse.json({ 
      vouchers: allVouchers.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    })

  } catch (error) {
    console.error("[DEBUG] Erro ao buscar vouchers:", error)
    return NextResponse.json(
      { error: "Erro ao buscar vouchers" },
      { status: 500 }
    )
  }
}
