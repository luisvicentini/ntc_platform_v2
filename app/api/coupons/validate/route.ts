import { NextRequest, NextResponse } from "next/server"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

// POST /api/coupons/validate - Valida um cupom
export async function POST(request: NextRequest) {
  try {
    const { code, userId, establishmentId } = await request.json()

    if (!code || !userId || !establishmentId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Buscar o cupom pelo código
    const couponsRef = collection(db, "coupons")
    const couponQuery = query(
      couponsRef,
      where("code", "==", code),
      where("establishmentId", "==", establishmentId)
    )
    const couponSnapshot = await getDocs(couponQuery)

    if (couponSnapshot.empty) {
      return NextResponse.json(
        { error: "Coupon not found" },
        { status: 404 }
      )
    }

    const couponDoc = couponSnapshot.docs[0]
    const couponData = couponDoc.data()

    // Verificar se o cupom está ativo
    if (couponData.status !== "active") {
      return NextResponse.json(
        { error: "Coupon is not active", code: "INACTIVE" },
        { status: 400 }
      )
    }

    // Verificar se o cupom não expirou
    if (new Date(couponData.validUntil) < new Date()) {
      return NextResponse.json(
        { error: "Coupon has expired", code: "EXPIRED" },
        { status: 400 }
      )
    }

    // Verificar limite de usos
    if (couponData.maxUses && couponData.currentUses >= couponData.maxUses) {
      return NextResponse.json(
        { error: "Coupon usage limit reached", code: "LIMIT_REACHED" },
        { status: 400 }
      )
    }

    // Verificar se o usuário já usou este cupom
    const usedCouponsRef = collection(db, "users", userId, "usedCoupons")
    const usedCouponQuery = query(
      usedCouponsRef,
      where("couponId", "==", couponDoc.id)
    )
    const usedCouponSnapshot = await getDocs(usedCouponQuery)

    if (!usedCouponSnapshot.empty) {
      return NextResponse.json(
        { error: "User has already used this coupon", code: "ALREADY_USED" },
        { status: 400 }
      )
    }

    // Verificar se o estabelecimento existe
    const establishmentRef = doc(db, "establishments", establishmentId)
    const establishmentDoc = await getDoc(establishmentRef)

    if (!establishmentDoc.exists()) {
      return NextResponse.json(
        { error: "Establishment not found", code: "INVALID_ESTABLISHMENT" },
        { status: 400 }
      )
    }

    // Cupom é válido
    return NextResponse.json({
      valid: true,
      coupon: {
        id: couponDoc.id,
        ...couponData
      }
    })
  } catch (error) {
    console.error("Error validating coupon:", error)
    return NextResponse.json(
      { error: "Failed to validate coupon" },
      { status: 500 }
    )
  }
}
