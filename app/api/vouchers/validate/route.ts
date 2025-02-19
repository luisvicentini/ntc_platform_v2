import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where, doc, updateDoc, getDoc } from "firebase/firestore"
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

    const session = jwtDecode<SessionToken>(sessionToken)

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
    const voucherDoc = await getDocs(voucherQuery)

    if (voucherDoc.empty) {
      return NextResponse.json({
        valid: false,
        message: "Voucher não encontrado"
      })
    }

    const voucher = { id: voucherDoc.docs[0].id, ...voucherDoc.docs[0].data() }

    // Verificar se o voucher pertence ao estabelecimento do usuário business
    if (voucher.businessId !== session.uid) {
      return NextResponse.json({
        valid: false,
        message: "Este voucher não pertence ao seu estabelecimento"
      })
    }

    // Verificar se o voucher está expirado
    if (new Date(voucher.expiresAt) < new Date()) {
      return NextResponse.json({
        valid: false,
        message: "Este voucher está expirado"
      })
    }

    // Verificar se o voucher já foi utilizado
    if (voucher.status === "used") {
      return NextResponse.json({
        valid: false,
        message: "Este voucher já foi utilizado"
      })
    }

    // Buscar dados do membro
    const membersRef = collection(db, "users")
    const memberDoc = await getDocs(query(membersRef, where("__name__", "==", voucher.memberId)))

    if (memberDoc.empty) {
      return NextResponse.json({
        valid: false,
        message: "Membro não encontrado"
      })
    }

    const memberData = memberDoc.docs[0].data()

    // Atualizar status do voucher para usado
    await updateDoc(doc(db, "vouchers", voucher.id), {
      status: "used",
      usedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })

    return NextResponse.json({
      valid: true,
      voucher: {
        ...voucher,
        member: {
          name: memberData.displayName,
          phone: memberData.phone
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

    const session = jwtDecode<SessionToken>(sessionToken)

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
    const voucher = voucherDoc.data()

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
      usedBy: session.uid, // ID do estabelecimento que realizou o check-in
      updatedAt: now.toISOString()
    })

    return NextResponse.json({
      success: true,
      message: "Check-in realizado com sucesso"
    })

  } catch (error) {
    console.error("Erro ao realizar check-in:", error)
    return NextResponse.json(
      { error: "Erro ao realizar check-in" },
      { status: 500 }
    )
  }
}
