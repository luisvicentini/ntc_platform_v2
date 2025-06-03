import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where, doc, getDoc, Timestamp } from "firebase/firestore"
import { jwtDecode } from "jwt-decode"
import type { SessionToken } from "@/types/session"
import { startOfDay, endOfDay, parseISO, format } from "date-fns"

export async function GET(request: Request) {
  try {
    const sessionToken = request.headers.get("x-session-token")
    if (!sessionToken) {
      return NextResponse.json({ error: "Sessão inválida" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') 
      ? startOfDay(parseISO(searchParams.get('startDate')!))
      : null
    const endDate = searchParams.get('endDate')
      ? endOfDay(parseISO(searchParams.get('endDate')!))
      : null

    const session = jwtDecode<SessionToken>(sessionToken)
    if (session.userType !== "partner") {
      return NextResponse.json({ error: "Acesso não autorizado" }, { status: 403 })
    }

    // Buscar o usuário parceiro
    const usersRef = collection(db, "users")
    const userQuery = query(usersRef, where("firebaseUid", "==", session.uid))
    const userSnapshot = await getDocs(userQuery)
    
    if (userSnapshot.empty) {
      return NextResponse.json({ error: "Parceiro não encontrado" }, { status: 404 })
    }

    const partnerId = userSnapshot.docs[0].id

    // 1. Buscar estabelecimentos
    const establishmentsRef = collection(db, "establishments")
    const establishmentsQuery = query(
      establishmentsRef,
      where("partnerId", "==", session.uid)
    )
    const establishmentsSnapshot = await getDocs(establishmentsQuery)
    const establishmentIds = establishmentsSnapshot.docs.map(doc => doc.id)
    const totalEstablishments = establishmentsSnapshot.size

    console.log("Partner ID:", session.uid)
    console.log("Total Establishments:", totalEstablishments)
    console.log("Establishment IDs:", establishmentIds)

    // 2. Buscar vouchers e check-ins
    let totalVouchers = 0
    let totalCheckins = 0
    const vouchersPerDay = {}
    const checkinsPerDay = {}

    // Buscar todos os vouchers dos estabelecimentos
    const vouchersRef = collection(db, "vouchers")
    
    // Fazer a busca em lotes de estabelecimentos para evitar limitações do Firestore
    for (let i = 0; i < establishmentIds.length; i += 10) {
      const batchIds = establishmentIds.slice(i, i + 10)
      const vouchersQuery = query(
        vouchersRef,
        where("establishmentId", "in", batchIds)
      )
      const vouchersSnapshot = await getDocs(vouchersQuery)

      vouchersSnapshot.docs.forEach(doc => {
        const voucher = doc.data()
        // Converter Timestamp do Firestore para Date
        const voucherDate = voucher.createdAt instanceof Timestamp 
          ? voucher.createdAt.toDate() 
          : new Date(voucher.createdAt)
        
        if (!startDate || !endDate || (voucherDate >= startDate && voucherDate <= endDate)) {
          const dateStr = format(voucherDate, 'yyyy-MM-dd')
          totalVouchers++
          vouchersPerDay[dateStr] = (vouchersPerDay[dateStr] || 0) + 1

          if (voucher.status === "used") {
            totalCheckins++
            checkinsPerDay[dateStr] = (checkinsPerDay[dateStr] || 0) + 1
          }
        }
      })
    }

    console.log("Total Vouchers:", totalVouchers)
    console.log("Total Check-ins:", totalCheckins)

    // 3. Buscar assinaturas e Assinantes
    const subscriptionsRef = collection(db, "subscriptions")
    const subscriptionsQuery = query(
      subscriptionsRef,
      where("partnerId", "==", partnerId)
    )
    const subscriptionsSnapshot = await getDocs(subscriptionsQuery)

    // Mapear Assinantes únicos e suas assinaturas
    const memberMap = new Map()
    
    subscriptionsSnapshot.docs.forEach(doc => {
      const subscription = { id: doc.id, ...doc.data() }
      const memberId = subscription.memberId
      
      if (!memberMap.has(memberId)) {
        memberMap.set(memberId, {
          isActive: false,
          isNew: false,
          isCanceled: false,
          subscriptions: []
        })
      }

      const memberData = memberMap.get(memberId)
      memberData.subscriptions.push(subscription)

      // Verificar status baseado na assinatura mais recente
      if (subscription.status === "active") {
        memberData.isActive = true
        // Verificar se é novo (assinatura criada no período)
        const createdAt = subscription.createdAt instanceof Timestamp 
          ? subscription.createdAt.toDate() 
          : new Date(subscription.createdAt)
          
        if (!startDate || !endDate || (createdAt >= startDate && createdAt <= endDate)) {
          memberData.isNew = true
        }
      } else if (subscription.status === "canceled") {
        memberData.isCanceled = true
      }
    })

    // Calcular métricas de Assinantes
    let totalMembers = 0
    let activeMembers = 0
    let newMembers = 0
    let canceledMembers = 0

    memberMap.forEach((memberData) => {
      totalMembers++
      if (memberData.isActive) activeMembers++
      if (memberData.isNew) newMembers++
      if (memberData.isCanceled) canceledMembers++
    })

    return NextResponse.json({
      totalMembers,
      activeMembers,
      newMembers,
      canceledMembers,
      totalEstablishments,
      totalVouchers,
      totalCheckins,
      conversionRate: totalVouchers > 0 ? (totalCheckins / totalVouchers) * 100 : 0,
      vouchersGraph: Object.entries(vouchersPerDay)
        .map(([date, vouchers]) => ({
          date,
          vouchers,
          checkins: checkinsPerDay[date] || 0
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
    })

  } catch (error) {
    console.error("Erro ao buscar métricas:", error)
    return NextResponse.json(
      { error: "Erro ao buscar métricas" },
      { status: 500 }
    )
  }
} 