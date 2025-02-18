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
    if (session.userType !== "business") {
      return NextResponse.json({ error: "Acesso não autorizado" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const fromDate = new Date(searchParams.get("from") || subDays(new Date(), 30))
    const toDate = new Date(searchParams.get("to") || new Date())

    // Buscar vouchers do período
    const vouchersRef = collection(db, "vouchers")
    const vouchersQuery = query(
      vouchersRef,
      where("establishmentId", "==", session.uid),
      where("createdAt", ">=", Timestamp.fromDate(fromDate)),
      where("createdAt", "<=", Timestamp.fromDate(toDate))
    )
    const vouchersSnapshot = await getDocs(vouchersQuery)
    const vouchers = vouchersSnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date()
      }
    })

    // Buscar check-ins do período
    const checkinsRef = collection(db, "checkins")
    const checkinsQuery = query(
      checkinsRef,
      where("establishmentId", "==", session.uid),
      where("createdAt", ">=", Timestamp.fromDate(fromDate)),
      where("createdAt", "<=", Timestamp.fromDate(toDate))
    )
    const checkinsSnapshot = await getDocs(checkinsQuery)
    const checkins = await Promise.all(checkinsSnapshot.docs.map(async doc => {
      const checkinData = doc.data()
      const userRef = collection(db, "users")
      const userQuery = query(userRef, where("__name__", "==", checkinData.userId))
      const userSnapshot = await getDocs(userQuery)
      const userData = userSnapshot.docs[0]?.data() || {}

      return {
        id: doc.id,
        ...checkinData,
        createdAt: checkinData.createdAt?.toDate() || new Date(),
        user: userData
      }
    }))

    // Calcular métricas diárias
    const today = new Date()
    const todayStart = startOfDay(today)
    const todayEnd = endOfDay(today)
    const yesterdayStart = startOfDay(subDays(today, 1))
    const yesterdayEnd = endOfDay(subDays(today, 1))

    const todayVouchers = vouchers.filter(v => 
      v.createdAt >= todayStart && v.createdAt <= todayEnd
    ).length

    const todayCheckins = checkins.filter(c => 
      c.createdAt >= todayStart && c.createdAt <= todayEnd
    ).length

    const yesterdayVouchers = vouchers.filter(v => 
      v.createdAt >= yesterdayStart && v.createdAt <= yesterdayEnd
    ).length

    // Calcular dados mensais
    const monthlyData = []
    let currentDate = fromDate
    while (currentDate <= toDate) {
      const monthStart = startOfDay(currentDate)
      const monthEnd = endOfDay(currentDate)

      const monthVouchers = vouchers.filter(v => 
        v.createdAt >= monthStart && v.createdAt <= monthEnd
      ).length

      const monthCheckins = checkins.filter(c => 
        c.createdAt >= monthStart && c.createdAt <= monthEnd
      ).length

      monthlyData.push({
        name: currentDate.toLocaleString('default', { month: 'short' }),
        vouchers: monthVouchers,
        checkins: monthCheckins,
        rate: monthVouchers > 0 ? (monthCheckins / monthVouchers) * 100 : 0
      })

      currentDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1))
    }

    // Formatar check-ins recentes
    const recentCheckins = checkins.map(checkin => ({
      id: checkin.id,
      customerName: checkin.user?.displayName || 'Cliente não identificado',
      customerPhone: checkin.user?.phone || 'Telefone não cadastrado',
      checkInDate: checkin.createdAt.toLocaleDateString(),
      status: checkin.status,
      voucherCode: checkin.voucherId
    }))

    return NextResponse.json({
      todayMetrics: {
        vouchers: todayVouchers,
        checkins: todayCheckins,
        conversionRate: todayVouchers > 0 ? (todayCheckins / todayVouchers) * 100 : 0,
        voucherGrowth: yesterdayVouchers > 0 
          ? ((todayVouchers - yesterdayVouchers) / yesterdayVouchers) * 100 
          : 0
      },
      monthlyData,
      recentCheckins
    })

  } catch (error) {
    console.error("Erro ao buscar dados do dashboard do estabelecimento:", error)
    return NextResponse.json(
      { error: "Erro ao buscar dados do dashboard" },
      { status: 500 }
    )
  }
} 