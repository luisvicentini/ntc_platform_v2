import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, addDoc, Timestamp } from "firebase/firestore"

export async function POST(request: Request) {
  try {
    const { establishmentId, uid } = await request.json()

    if (!establishmentId || !uid) {
      return NextResponse.json({ 
        error: "Dados inválidos" 
      }, { status: 400 })
    }

    // Gerar código único
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()

    // Criar voucher com todos os campos necessários para a listagem
    const voucher = {
      code,
      establishmentId,
      memberId: uid,
      status: "pending",
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)),
      usedAt: null,
      validUntil: "24h", // Campo usado na listagem
      voucherAvailability: "unlimited", // Campo usado na listagem
      voucherCooldown: "1" // Campo usado na listagem
    }

    const vouchersRef = collection(db, "vouchers")
    const docRef = await addDoc(vouchersRef, voucher)

    return NextResponse.json({
      id: docRef.id,
      code,
      ...voucher
    })

  } catch (error) {
    console.error("Erro ao gerar voucher:", error)
    return NextResponse.json({ 
      error: "Erro ao gerar voucher" 
    }, { status: 500 })
  }
}
