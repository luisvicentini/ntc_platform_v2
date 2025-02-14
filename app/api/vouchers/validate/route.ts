import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where, doc, updateDoc } from "firebase/firestore"
import { jwtDecode } from "jwt-decode"
import type { SessionToken } from "@/types/session"
import type { Voucher } from "@/types/voucher"

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

    // Apenas estabelecimentos podem validar vouchers
    if (session.userType !== "business") {
      return NextResponse.json(
        { error: "Apenas estabelecimentos podem validar vouchers" },
        { status: 403 }
      )
    }

    const { code } = await request.json()

    // Buscar voucher pelo código
    const vouchersRef = collection(db, "vouchers")
    const voucherQuery = query(vouchersRef, where("code", "==", code))
    const voucherSnapshot = await getDocs(voucherQuery)

    if (voucherSnapshot.empty) {
      return NextResponse.json({
        valid: false,
        message: "Voucher não encontrado"
      })
    }

    const voucherDoc = voucherSnapshot.docs[0]
    const voucher = voucherDoc.data() as Voucher

    // Verificar se o voucher pertence a este estabelecimento
    if (voucher.establishmentId !== session.uid) {
      return NextResponse.json({
        valid: false,
        message: "Este voucher não pertence a este estabelecimento"
      })
    }

    // Verificar se o voucher já foi usado
    if (voucher.status === "used") {
      return NextResponse.json({
        valid: false,
        message: "Este voucher já foi utilizado",
        usedAt: voucher.usedAt
      })
    }

    // Verificar se o voucher está expirado
    if (new Date(voucher.expiresAt) < new Date()) {
      // Atualizar status para expirado
      await updateDoc(doc(vouchersRef, voucherDoc.id), {
        status: "expired",
        updatedAt: new Date().toISOString()
      })

      return NextResponse.json({
        valid: false,
        message: "Este voucher está expirado",
        expiresAt: voucher.expiresAt
      })
    }

    // Buscar dados do membro
    const membersRef = collection(db, "users")
    const memberDoc = await getDocs(query(membersRef, where("__name__", "==", voucher.memberId)))
    const memberData = memberDoc.docs[0].data()

    return NextResponse.json({
      valid: true,
      voucher: {
        ...voucher,
        id: voucherDoc.id,
        member: {
          id: voucher.memberId,
          name: memberData.displayName,
          email: memberData.email
        }
      }
    })

  } catch (error) {
    console.error("Erro ao validar voucher:", error)
    return NextResponse.json(
      { error: "Erro ao validar voucher" },
      { status: 500 }
    )
  }
}

// Rota para marcar voucher como utilizado
export async function PATCH(request: Request) {
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

    // Apenas estabelecimentos podem validar vouchers
    if (session.userType !== "business") {
      return NextResponse.json(
        { error: "Apenas estabelecimentos podem validar vouchers" },
        { status: 403 }
      )
    }

    const { code } = await request.json()

    // Buscar voucher pelo código
    const vouchersRef = collection(db, "vouchers")
    const voucherQuery = query(vouchersRef, where("code", "==", code))
    const voucherSnapshot = await getDocs(voucherQuery)

    if (voucherSnapshot.empty) {
      return NextResponse.json(
        { error: "Voucher não encontrado" },
        { status: 404 }
      )
    }

    const voucherDoc = voucherSnapshot.docs[0]
    const voucher = voucherDoc.data() as Voucher

    // Verificar se o voucher pertence a este estabelecimento
    if (voucher.establishmentId !== session.uid) {
      return NextResponse.json(
        { error: "Este voucher não pertence a este estabelecimento" },
        { status: 403 }
      )
    }

    // Verificar se o voucher já foi usado
    if (voucher.status === "used") {
      return NextResponse.json(
        { error: "Este voucher já foi utilizado" },
        { status: 400 }
      )
    }

    // Verificar se o voucher está expirado
    if (new Date(voucher.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "Este voucher está expirado" },
        { status: 400 }
      )
    }

    // Marcar voucher como utilizado
    const now = new Date()
    await updateDoc(doc(vouchersRef, voucherDoc.id), {
      status: "used",
      usedAt: now.toISOString(),
      updatedAt: now.toISOString()
    })

    return NextResponse.json({
      message: "Voucher utilizado com sucesso"
    })

  } catch (error) {
    console.error("Erro ao utilizar voucher:", error)
    return NextResponse.json(
      { error: "Erro ao utilizar voucher" },
      { status: 500 }
    )
  }
}
