import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, addDoc, getDocs, query, where } from "firebase/firestore"
import { jwtDecode } from "jwt-decode"
import type { SessionToken } from "@/types/session"

export async function POST(request: Request) {
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

    // Apenas membros podem gerar vouchers
    if (session.userType !== "member") {
      return NextResponse.json(
        { error: "Apenas membros podem gerar vouchers" },
        { status: 403 }
      )
    }

    const { establishmentId } = await request.json()

    // Verificar se o estabelecimento existe
    const establishmentsRef = collection(db, "establishments")
    const establishmentDoc = await getDocs(query(establishmentsRef, where("__name__", "==", establishmentId)))

    if (establishmentDoc.empty) {
      return NextResponse.json(
        { error: "Estabelecimento não encontrado" },
        { status: 404 }
      )
    }

    // Verificar se o membro tem assinatura ativa com o parceiro
    const subscriptionsRef = collection(db, "subscriptions")
    const subscriptionQuery = query(
      subscriptionsRef,
      where("memberId", "==", session.uid),
      where("partnerId", "==", establishmentDoc.docs[0].data().partnerId),
      where("status", "==", "active")
    )
    const subscriptionDoc = await getDocs(subscriptionQuery)

    if (subscriptionDoc.empty) {
      return NextResponse.json(
        { error: "Você não tem uma assinatura ativa com este parceiro" },
        { status: 403 }
      )
    }

    const establishmentData = establishmentDoc.docs[0].data()

    // Verificar se já existe um voucher pendente
    const vouchersRef = collection(db, "vouchers")
    const existingVoucherQuery = query(
      vouchersRef,
      where("memberId", "==", session.uid),
      where("establishmentId", "==", establishmentId)
    )
    const existingVoucherDoc = await getDocs(existingVoucherQuery)

    // Verificar cooldown
    if (!existingVoucherDoc.empty) {
      const lastVoucher = existingVoucherDoc.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())[0]

      const lastGeneratedTime = new Date(lastVoucher.generatedAt).getTime()
      const cooldownMs = establishmentData.voucherCooldown * 60 * 60 * 1000
      const now = Date.now()

      if (now - lastGeneratedTime < cooldownMs) {
        const nextAvailable = new Date(lastGeneratedTime + cooldownMs)
        return NextResponse.json({
          error: "Aguarde o tempo de cooldown",
          nextAvailable: nextAvailable.toISOString()
        }, { status: 400 })
      }
    }

    // Verificar se já existe um voucher pendente
    const pendingVoucherQuery = query(
      vouchersRef,
      where("memberId", "==", session.uid),
      where("establishmentId", "==", establishmentId),
      where("status", "==", "pending")
    )
    const pendingVoucherDoc = await getDocs(pendingVoucherQuery)

    if (!pendingVoucherDoc.empty) {
      return NextResponse.json(
        { error: "Você já possui um voucher pendente para este estabelecimento" },
        { status: 400 }
      )
    }

    // Gerar código do voucher
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()

    // Calcular data de expiração (24h)
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    // Salvar voucher no banco
    const voucher = {
      code,
      memberId: session.uid,
      establishmentId,
      status: "pending",
      generatedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    }

    const docRef = await addDoc(vouchersRef, voucher)

    return NextResponse.json({
      id: docRef.id,
      ...voucher
    })

  } catch (error) {
    console.error("Erro ao gerar voucher:", error)
    return NextResponse.json(
      { error: "Erro ao gerar voucher" },
      { status: 500 }
    )
  }
}
