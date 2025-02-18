import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore"
import { jwtDecode } from "jwt-decode"
import type { SessionToken } from "@/types/session"
import type { Voucher } from "@/types/voucher"

interface Member {
  displayName?: string
  phone?: string
  partnerId?: string
}

interface Partner {
  name?: string
}

export async function GET(request: Request) {
  try {
    const sessionToken = request.headers.get("x-session-token")
    if (!sessionToken) {
      return NextResponse.json({ error: "Sessão inválida" }, { status: 403 })
    }

    const session = jwtDecode<SessionToken>(sessionToken)
    if (session.userType !== "business") {
      return NextResponse.json({ error: "Acesso não autorizado" }, { status: 403 })
    }

    // Buscar todos os vouchers do estabelecimento
    const vouchersRef = collection(db, "vouchers")
    const vouchersQuery = query(
      vouchersRef,
      where("establishmentId", "==", session.uid)
    )
    const vouchersSnapshot = await getDocs(vouchersQuery)
    const vouchers = vouchersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Voucher[]

    // Buscar informações dos membros e parceiros
    const usersRef = collection(db, "users")
    const partnersRef = collection(db, "partners")

    // Processar cada voucher para incluir informações do membro e parceiro
    const reports = await Promise.all(vouchers.map(async voucher => {
      // Buscar informações do membro
      const memberQuery = query(usersRef, where("__name__", "==", voucher.memberId))
      const memberSnapshot = await getDocs(memberQuery)
      const memberData = memberSnapshot.docs[0]?.data() as Member || {}

      // Buscar informações do parceiro do membro
      let partnerName = "Não Tem Chef"
      if (memberData.partnerId) {
        const partnerQuery = query(partnersRef, where("__name__", "==", memberData.partnerId))
        const partnerSnapshot = await getDocs(partnerQuery)
        const partnerData = partnerSnapshot.docs[0]?.data() as Partner
        if (partnerData) {
          partnerName = partnerData.name || "Não Tem Chef"
        }
      }

      // Verificar status do voucher
      let status = "Check-in Pendente"
      if (voucher.status === "used") {
        status = "Check-in Realizado"
      } else if (voucher.expiresAt && new Date(voucher.expiresAt) < new Date()) {
        status = "Voucher Expirado"
      }

      // Formatar data do check-in
      const checkInDate = voucher.usedAt 
        ? new Date(voucher.usedAt).toLocaleDateString('pt-BR')
        : voucher.createdAt 
          ? new Date(voucher.createdAt).toLocaleDateString('pt-BR')
          : '-'

      return {
        id: voucher.id,
        customerName: memberData.displayName || "Cliente não identificado",
        customerPhone: memberData.phone || "Telefone não cadastrado",
        associatedBusiness: partnerName,
        checkInDate,
        status,
        voucherCode: voucher.code || voucher.id
      }
    }))

    return NextResponse.json(reports)

  } catch (error) {
    console.error("Erro ao buscar relatórios:", error)
    return NextResponse.json(
      { error: "Erro ao buscar relatórios" },
      { status: 500 }
    )
  }
}
