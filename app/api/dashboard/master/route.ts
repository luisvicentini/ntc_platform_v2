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
    if (session.userType !== "master") {
      return NextResponse.json({ error: "Acesso não autorizado" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const fromDate = new Date(searchParams.get("from") || subDays(new Date(), 30))
    const toDate = new Date(searchParams.get("to") || new Date())

    // Buscar totais
    const usersRef = collection(db, "users")
    const partnersRef = collection(db, "users")
    const vouchersRef = collection(db, "vouchers")
    const checkinsRef = collection(db, "checkins")

    // Total de usuários
    const usersQuery = query(usersRef, where("type", "==", "member"))
    const usersSnapshot = await getDocs(usersQuery)
    const totalUsers = usersSnapshot.size

    // Total de parceiros ativos
    const partnersQuery = query(partnersRef, where("type", "==", "partner"), where("status", "==", "active"))
    const partnersSnapshot = await getDocs(partnersQuery)
    const totalPartners = partnersSnapshot.size

    // Total de vouchers
    const vouchersQuery = query(vouchersRef, 
      where("createdAt", ">=", Timestamp.fromDate(fromDate)),
      where("createdAt", "<=", Timestamp.fromDate(toDate))
    )
    const vouchersSnapshot = await getDocs(vouchersQuery)
    const totalVouchers = vouchersSnapshot.size

    // Dados mensais para gráficos
    const monthlyData = []
    let currentDate = fromDate
    while (currentDate <= toDate) {
      const monthStart = startOfDay(currentDate)
      const monthEnd = endOfDay(currentDate)

      const monthVouchersQuery = query(vouchersRef,
        where("createdAt", ">=", Timestamp.fromDate(monthStart)),
        where("createdAt", "<=", Timestamp.fromDate(monthEnd))
      )
      const monthCheckinsQuery = query(checkinsRef,
        where("createdAt", ">=", Timestamp.fromDate(monthStart)),
        where("createdAt", "<=", Timestamp.fromDate(monthEnd))
      )

      const [monthVouchersSnap, monthCheckinsSnap] = await Promise.all([
        getDocs(monthVouchersQuery),
        getDocs(monthCheckinsQuery)
      ])

      monthlyData.push({
        name: currentDate.toLocaleString('default', { month: 'short' }),
        vouchers: monthVouchersSnap.size,
        checkins: monthCheckinsSnap.size
      })

      currentDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1))
    }

    // Calcular crescimento mensal
    const previousMonthVouchersQuery = query(vouchersRef,
      where("createdAt", ">=", Timestamp.fromDate(subDays(fromDate, 30))),
      where("createdAt", "<=", Timestamp.fromDate(fromDate))
    )
    const previousMonthVouchersSnap = await getDocs(previousMonthVouchersQuery)
    const growthRate = previousMonthVouchersSnap.size > 0 
      ? ((totalVouchers - previousMonthVouchersSnap.size) / previousMonthVouchersSnap.size) * 100
      : 0

    return NextResponse.json({
      totalUsers,
      totalPartners,
      totalVouchers,
      monthlyData,
      growthRate: growthRate.toFixed(1)
    })

  } catch (error) {
    console.error("Erro ao buscar dados do dashboard master:", error)
    return NextResponse.json(
      { error: "Erro ao buscar dados do dashboard" },
      { status: 500 }
    )
  }
} 