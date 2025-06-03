import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, getDoc, doc } from "firebase/firestore"
import { jwtDecode } from "jwt-decode"
import type { SessionToken } from "@/types/session"

export async function GET(request: Request) {
  try {
    const sessionToken = request.headers.get("x-session-token")
    
    if (!sessionToken) {
      return NextResponse.json({ error: "Sessão inválida" }, { status: 403 })
    }

    // Decodificar o token
    const session = jwtDecode<SessionToken>(sessionToken)

    // Buscar vouchers do usuário
    const vouchersRef = collection(db, "vouchers")
    const vouchersQuery = query(
      vouchersRef, 
      where("memberId", "==", session.uid)
    )
    const vouchersSnap = await getDocs(vouchersQuery)

    // Array para armazenar as promises de busca dos estabelecimentos
    const vouchersWithEstablishments = await Promise.all(
      vouchersSnap.docs.map(async (voucherDoc) => {
        const voucherData = voucherDoc.data()
        
        // Buscar dados do estabelecimento
        const establishmentRef = doc(db, "establishments", voucherData.establishmentId)
        const establishmentSnap = await getDoc(establishmentRef)
        
        return {
          id: voucherDoc.id,
          ...voucherData,
          establishment: establishmentSnap.exists() ? {
            id: establishmentSnap.id,
            ...establishmentSnap.data()
          } : null
        }
      })
    )

    return NextResponse.json(vouchersWithEstablishments)

  } catch (error) {
    console.error("Erro ao buscar vouchers:", error)
    return NextResponse.json({ error: "Erro ao carregar vouchers" }, { status: 500 })
  }
}
