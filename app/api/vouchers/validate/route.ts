import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where, doc, updateDoc, getDoc, Timestamp } from "firebase/firestore"
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
    const voucherSnap = await getDocs(voucherQuery)

    if (voucherSnap.empty) {
      return NextResponse.json({
        valid: false,
        message: "Voucher não encontrado"
      })
    }

    const voucherDoc = voucherSnap.docs[0]
    const voucher = { id: voucherDoc.id, ...voucherDoc.data() }

    // Verificar se o voucher está expirado
    const expirationTime = voucher.expiresAt?.seconds ? 
      new Date(voucher.expiresAt.seconds * 1000) : 
      new Date(voucher.expiresAt)

    if (expirationTime < new Date()) {
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
    const memberRef = doc(db, "users", voucher.memberId)
    const memberSnap = await getDoc(memberRef)

    if (!memberSnap.exists()) {
      return NextResponse.json({
        valid: false,
        message: "Membro não encontrado"
      })
    }

    const memberData = memberSnap.data()

    // Atualizar status para verificado
    await updateDoc(doc(db, "vouchers", voucherDoc.id), {
      status: "verified",
      verifiedAt: Timestamp.now(),
      verifiedBy: session.uid
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

// Rota para realizar o check-in
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
        { error: "Apenas estabelecimentos podem realizar check-in" },
        { status: 403 }
      )
    }

    const { code } = await request.json()

    // Buscar voucher pelo código
    const vouchersRef = collection(db, "vouchers")
    const voucherQuery = query(vouchersRef, where("code", "==", code))
    const voucherSnap = await getDocs(voucherQuery)

    if (voucherSnap.empty) {
      return NextResponse.json(
        { error: "Voucher não encontrado" },
        { status: 404 }
      )
    }

    const voucherDoc = voucherSnap.docs[0]
    const voucher = voucherDoc.data()

    if (voucher.status !== "verified") {
      return NextResponse.json(
        { error: "Voucher não foi verificado" },
        { status: 400 }
      )
    }

    // Realizar check-in
    await updateDoc(doc(db, "vouchers", voucherDoc.id), {
      status: "used",
      usedAt: Timestamp.now(),
      usedBy: session.uid
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
