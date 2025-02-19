import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where, orderBy } from "firebase/firestore"
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

    // Apenas membros podem ver seus vouchers
    if (session.userType !== "member") {
      return NextResponse.json(
        { error: "Apenas membros podem acessar seus vouchers" },
        { status: 403 }
      )
    }

    // Buscar vouchers do membro
    const vouchersRef = collection(db, "vouchers")
    const voucherQuery = query(
      vouchersRef,
      where("memberId", "==", session.uid),
      orderBy("createdAt", "desc")
    )
    const voucherSnapshot = await getDocs(voucherQuery)

    // Buscar dados dos estabelecimentos relacionados
    const establishmentIds = Array.from(new Set(voucherSnapshot.docs.map(doc => doc.data().establishmentId)))
    const establishmentsRef = collection(db, "establishments")
    const establishmentsQuery = query(establishmentsRef, where("__name__", "in", establishmentIds))
    const establishmentsSnapshot = await getDocs(establishmentsQuery)

    const establishmentsMap = new Map()
    establishmentsSnapshot.docs.forEach(doc => {
      establishmentsMap.set(doc.id, { id: doc.id, ...doc.data() })
    })

    // Retornar vouchers com dados do estabelecimento
    const vouchers = voucherSnapshot.docs.map(doc => {
      const voucherData = doc.data()
      return {
        id: doc.id,
        ...voucherData,
        establishment: establishmentsMap.get(voucherData.establishmentId)
      }
    })

    return NextResponse.json(vouchers)

  } catch (error) {
    console.error("Erro ao buscar vouchers:", error)
    return NextResponse.json(
      { error: "Erro ao buscar vouchers" },
      { status: 500 }
    )
  }
}
