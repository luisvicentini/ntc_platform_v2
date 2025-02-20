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

    const session = jwtDecode<SessionToken>(sessionToken)

    if (session.userType !== "business") {
      return NextResponse.json(
        { error: "Acesso não autorizado" },
        { status: 403 }
      )
    }

    // Buscar vouchers do estabelecimento
    const vouchersRef = collection(db, "vouchers")
    const vouchersQuery = query(
      vouchersRef,
      where("businessId", "==", session.uid)
    )
    
    const vouchersSnap = await getDocs(vouchersQuery)
    const vouchers = await Promise.all(
      vouchersSnap.docs.map(async (doc) => {
        const data = doc.data()
        
        // Buscar dados do membro
        const memberDoc = await getDocs(
          query(collection(db, "members"), where("__name__", "==", data.memberId))
        )
        
        const memberData = memberDoc.docs[0]?.data() || {}
        
        return {
          id: doc.id,
          ...data,
          member: {
            id: data.memberId,
            name: memberData.displayName || "Usuário não encontrado",
            phone: memberData.phone || "Não informado",
            photoURL: memberData.photoURL
          }
        }
      })
    )

    return NextResponse.json(vouchers)

  } catch (error) {
    console.error("Erro ao buscar vouchers:", error)
    return NextResponse.json(
      { error: "Erro ao carregar vouchers" },
      { status: 500 }
    )
  }
} 