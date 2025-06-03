import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore"
import { jwtDecode } from "jwt-decode"
import type { SessionToken } from "@/types/session"
import { subDays, startOfDay, endOfDay } from "date-fns"

export async function GET(request: Request) {
  try {
    const sessionToken = request.headers.get("x-session-token")
    if (!sessionToken) {
      return NextResponse.json({ error: "Sessão inválida" }, { status: 403 })
    }

    const session = jwtDecode<SessionToken>(sessionToken)
    if (session.userType !== "partner") {
      return NextResponse.json({ error: "Acesso não autorizado" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const fromDate = new Date(searchParams.get("from") || subDays(new Date(), 30))
    const toDate = new Date(searchParams.get("to") || new Date())

    // Buscar estabelecimentos do parceiro
    const establishmentsRef = collection(db, "establishments")
    const establishmentsQuery = query(establishmentsRef, where("partnerId", "==", session.uid))
    const establishmentsSnapshot = await getDocs(establishmentsQuery)
    const establishmentIds = establishmentsSnapshot.docs.map(doc => doc.id)

    // Buscar vouchers e check-ins
    const vouchersRef = collection(db, "vouchers")
    const checkinsRef = collection(db, "checkins")

    // Dados por estabelecimento
    const establishmentData = await Promise.all(establishmentIds.map(async (establishmentId) => {
      const vouchersQuery = query(vouchersRef,
        where("establishmentId", "==", establishmentId),
        where("createdAt", ">=", Timestamp.fromDate(fromDate)),
        where("createdAt", "<=", Timestamp.fromDate(toDate))
      )
      const checkinsQuery = query(checkinsRef,
        where("establishmentId", "==", establishmentId),
        where("createdAt", ">=", Timestamp.fromDate(fromDate)),
        where("createdAt", "<=", Timestamp.fromDate(toDate))
      )

      const [vouchersSnap, checkinsSnap] = await Promise.all([
        getDocs(vouchersQuery),
        getDocs(checkinsQuery)
      ])

      return {
        establishmentId,
        vouchers: vouchersSnap.size,
        checkins: checkinsSnap.size
      }
    }))

    // Dados mensais para gráficos
    const monthlyData = []
    let currentDate = fromDate
    while (currentDate <= toDate) {
      const monthStart = startOfDay(currentDate)
      const monthEnd = endOfDay(currentDate)

      let monthVouchers = 0
      let monthCheckins = 0

      for (const establishmentId of establishmentIds) {
        const monthVouchersQuery = query(vouchersRef,
          where("establishmentId", "==", establishmentId),
          where("createdAt", ">=", Timestamp.fromDate(monthStart)),
          where("createdAt", "<=", Timestamp.fromDate(monthEnd))
        )
        const monthCheckinsQuery = query(checkinsRef,
          where("establishmentId", "==", establishmentId),
          where("createdAt", ">=", Timestamp.fromDate(monthStart)),
          where("createdAt", "<=", Timestamp.fromDate(monthEnd))
        )

        const [vouchersSnap, checkinsSnap] = await Promise.all([
          getDocs(monthVouchersQuery),
          getDocs(monthCheckinsQuery)
        ])

        monthVouchers += vouchersSnap.size
        monthCheckins += checkinsSnap.size
      }

      monthlyData.push({
        name: currentDate.toLocaleString('default', { month: 'short' }),
        vouchers: monthVouchers,
        checkins: monthCheckins,
        rate: monthVouchers > 0 ? (monthCheckins / monthVouchers) * 100 : 0
      })

      currentDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1))
    }

    return NextResponse.json({
      establishmentData,
      monthlyData
    })

  } catch (error) {
    console.error("Erro ao buscar dados do dashboard do parceiro:", error)
    return NextResponse.json(
      { error: "Erro ao buscar dados do dashboard" },
      { status: 500 }
    )
  }
} 