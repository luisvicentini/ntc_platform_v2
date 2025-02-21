import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore"
import { jwtDecode } from "jwt-decode"
import type { SessionToken } from "@/types/session"
import { startOfDay, endOfDay, subDays } from "date-fns"

export async function GET(request: Request) {
  try {
    const sessionToken = request.headers.get("x-session-token")
    if (!sessionToken) {
      return NextResponse.json({ error: "Sessão inválida" }, { status: 403 })
    }

    const session = jwtDecode<SessionToken>(sessionToken)
    
    // Buscar usuário e seus estabelecimentos vinculados
    const usersRef = collection(db, "users")
    const userQuery = query(
      usersRef,
      where("firebaseUid", "==", session.uid)
    )
    const userSnap = await getDocs(userQuery)
    
    if (userSnap.empty) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    const userData = userSnap.docs[0].data()
    const establishmentIds = userData.establishmentIds || []

    // Parâmetros de data da requisição
    const { searchParams } = new URL(request.url)
    const fromDate = new Date(searchParams.get("from") || new Date())
    const toDate = new Date(searchParams.get("to") || new Date())

    // Buscar vouchers do período
    const vouchersRef = collection(db, "vouchers")
    const vouchersPromises = establishmentIds.map(establishmentId => 
      getDocs(query(vouchersRef, 
        where("establishmentId", "==", establishmentId),
        where("createdAt", ">=", Timestamp.fromDate(fromDate)),
        where("createdAt", "<=", Timestamp.fromDate(toDate))
      ))
    )
    const vouchersSnapshots = await Promise.all(vouchersPromises)
    const vouchers = vouchersSnapshots.flatMap(snapshot => 
      snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        usedAt: doc.data().usedAt ? new Date(doc.data().usedAt) : null
      }))
    )

    // Calcular métricas do período
    const vouchersInPeriod = vouchers.length
    const checkinsInPeriod = vouchers.filter(v => v.status === "used").length
    const conversionRate = vouchersInPeriod > 0 
      ? (checkinsInPeriod / vouchersInPeriod) * 100 
      : 0

    // Calcular dados mensais incluindo taxa de conversão
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)

      const monthVouchers = vouchers.filter(v => 
        v.createdAt >= monthStart && v.createdAt <= monthEnd
      )
      
      const monthCheckins = monthVouchers.filter(v => v.status === "used")
      const monthConversionRate = monthVouchers.length > 0
        ? (monthCheckins.length / monthVouchers.length) * 100
        : 0

      return {
        name: date.toLocaleString('pt-BR', { month: 'short' }),
        vouchers: monthVouchers.length,
        checkins: monthCheckins.length,
        conversionRate: monthConversionRate
      }
    }).reverse()

    // Calcular crescimento em relação ao dia anterior
    const yesterday = subDays(fromDate, 1)
    const yesterdayVouchers = vouchers.filter(v => 
      v.createdAt >= startOfDay(yesterday) && 
      v.createdAt <= endOfDay(yesterday)
    ).length

    const voucherGrowth = yesterdayVouchers > 0
      ? ((vouchersInPeriod - yesterdayVouchers) / yesterdayVouchers) * 100
      : 0

    // Buscar os últimos check-ins
    const recentCheckins = vouchers
      .filter(v => v.status === "used" && v.usedAt)
      .sort((a, b) => (b.usedAt?.getTime() || 0) - (a.usedAt?.getTime() || 0))
      .slice(0, 10)
      .map(voucher => ({
        id: voucher.id,
        customerName: voucher.memberName || "Cliente não identificado",
        customerPhone: voucher.memberPhone || "Telefone não cadastrado",
        checkInDate: voucher.usedAt?.toLocaleDateString('pt-BR') || "",
        status: voucher.status,
        voucherCode: voucher.code
      }))

    return NextResponse.json({
      todayMetrics: {
        vouchers: vouchersInPeriod,
        checkins: checkinsInPeriod,
        conversionRate: Number(conversionRate.toFixed(1)),
        voucherGrowth: Number(voucherGrowth.toFixed(1))
      },
      monthlyData,
      recentCheckins
    })

  } catch (error) {
    console.error("Erro ao buscar dados do dashboard:", error)
    return NextResponse.json(
      { error: "Erro ao buscar dados do dashboard" },
      { status: 500 }
    )
  }
}
