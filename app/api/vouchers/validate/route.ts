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

    if (!code) {
      return NextResponse.json({
        valid: false,
        message: "Código do voucher é obrigatório"
      })
    }

    console.log("Buscando voucher com código:", code)

    // Buscar voucher apenas pelo código
    const vouchersRef = collection(db, "vouchers")
    const voucherQuery = query(
      vouchersRef, 
      where("code", "==", code)
    )
    
    const voucherSnapshot = await getDocs(voucherQuery)
    
    if (voucherSnapshot.empty) {
      console.log("Nenhum voucher encontrado com o código:", code)
      return NextResponse.json({
        valid: false,
        message: "Voucher não encontrado"
      })
    }

    const voucherDoc = voucherSnapshot.docs[0]
    const voucher = voucherDoc.data()
    
    console.log("Voucher encontrado:", {
      id: voucherDoc.id,
      code: voucher.code,
      status: voucher.status
    })

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
      return NextResponse.json({
        valid: false,
        message: "Este voucher está expirado",
        expiresAt: voucher.expiresAt
      })
    }

    // Buscar dados do membro
    const membersRef = collection(db, "users")
    const memberDoc = await getDocs(query(
      membersRef, 
      where("__name__", "==", voucher.memberId)
    ))

    if (memberDoc.empty) {
      console.log("Membro não encontrado:", voucher.memberId)
      return NextResponse.json({
        valid: false,
        message: "Membro não encontrado"
      })
    }

    const memberData = memberDoc.docs[0].data()

    // Buscar dados do estabelecimento original
    const establishmentRef = doc(db, "establishments", voucher.establishmentId)
    const establishmentDoc = await getDoc(establishmentRef)
    const establishmentData = establishmentDoc.data()

    return NextResponse.json({
      valid: true,
      voucher: {
        ...voucher,
        id: voucherDoc.id,
        member: {
          id: voucher.memberId,
          name: memberData.displayName,
          email: memberData.email,
          phone: memberData.phone
        },
        establishment: {
          id: voucher.establishmentId,
          name: establishmentData?.name || 'Estabelecimento não encontrado'
        }
      }
    })

  } catch (error) {
    console.error("Erro ao validar voucher:", error)
    return NextResponse.json(
      { 
        error: "Erro ao validar voucher",
        details: error instanceof Error ? error.message : "Erro desconhecido"
      },
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
