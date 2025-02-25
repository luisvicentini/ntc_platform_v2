import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, addDoc, doc, getDoc } from "firebase/firestore"
import { jwtDecode } from "jwt-decode"
import type { SessionToken } from "@/types/session"
import { generateVoucherCode } from "@/app/utils/voucher"
import { addDays } from "date-fns"

export async function POST(request: Request) {
  try {
    const sessionToken = request.headers.get("x-session-token")
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: "Sessão inválida" },
        { status: 403 }
      )
    }

    const session = jwtDecode<SessionToken>(sessionToken)
    const { establishmentId } = await request.json()

    // Buscar dados do estabelecimento
    const establishmentRef = doc(db, "establishments", establishmentId)
    const establishmentDoc = await getDoc(establishmentRef)

    if (!establishmentDoc.exists()) {
      return NextResponse.json(
        { error: "Estabelecimento não encontrado" },
        { status: 404 }
      )
    }

    const establishmentData = establishmentDoc.data()

    // Usar o tempo de expiração em horas definido no estabelecimento
    const expirationHours = Number(establishmentData.voucherExpiration) || 24
    const expiresAt = new Date(Date.now() + (expirationHours * 60 * 60 * 1000))

    // Criar o voucher
    const voucherData = {
      code: generateVoucherCode(),
      memberId: session.uid,
      establishmentId,
      partnerId: establishmentData.partnerId,
      status: "pending",
      createdAt: new Date(),
      expiresAt,
      usedAt: null,
      discount: establishmentData.discountValue || 10,
      establishmentName: establishmentData.name,
      voucherDescription: establishmentData.voucherDescription || "",
      usageLimit: establishmentData.usageLimit || null
    }

    const vouchersRef = collection(db, "vouchers")
    const docRef = await addDoc(vouchersRef, voucherData)

    return NextResponse.json({
      id: docRef.id,
      ...voucherData
    })

  } catch (error) {
    console.error("Erro ao gerar voucher:", error)
    return NextResponse.json(
      { error: "Erro ao gerar voucher" },
      { status: 500 }
    )
  }
}
