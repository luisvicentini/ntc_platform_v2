import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where } from "firebase/firestore"
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

    // Apenas Assinantes podem verificar cooldown
    if (session.userType !== "member") {
      return NextResponse.json(
        { error: "Apenas Assinantes podem verificar cooldown" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const establishmentId = searchParams.get("establishmentId")

    if (!establishmentId) {
      return NextResponse.json(
        { error: "ID do estabelecimento é obrigatório" },
        { status: 400 }
      )
    }

    // Buscar estabelecimento
    const establishmentsRef = collection(db, "establishments")
    const establishmentDoc = await getDocs(query(establishmentsRef, where("__name__", "==", establishmentId)))

    if (establishmentDoc.empty) {
      return NextResponse.json(
        { error: "Estabelecimento não encontrado" },
        { status: 404 }
      )
    }

    const establishmentData = establishmentDoc.docs[0].data()

    // Buscar último voucher gerado
    const vouchersRef = collection(db, "vouchers")
    const voucherQuery = query(
      vouchersRef,
      where("memberId", "==", session.uid),
      where("establishmentId", "==", establishmentId)
    )
    const voucherSnapshot = await getDocs(voucherQuery)

    // Se não houver vouchers, pode gerar
    if (voucherSnapshot.empty) {
      return NextResponse.json({
        canGenerate: true
      })
    }

    // Pegar o voucher mais recente
    const lastVoucher = voucherSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as { id: string, generatedAt: string }))
      .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())[0]

    const lastGeneratedTime = new Date(lastVoucher.generatedAt).getTime()
    const cooldownMs = establishmentData.voucherCooldown * 60 * 60 * 1000
    const now = Date.now()

    // Se ainda está no cooldown, retornar quando poderá gerar novamente
    if (now - lastGeneratedTime < cooldownMs) {
      const nextAvailable = new Date(lastGeneratedTime + cooldownMs)
      return NextResponse.json({
        canGenerate: false,
        nextAvailable: nextAvailable.toISOString()
      })
    }

    // Se passou do cooldown, pode gerar
    return NextResponse.json({
      canGenerate: true
    })

  } catch (error) {
    console.error("Erro ao verificar cooldown:", error)
    return NextResponse.json(
      { error: "Erro ao verificar cooldown" },
      { status: 500 }
    )
  }
}
