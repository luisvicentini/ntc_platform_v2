import { NextRequest, NextResponse } from "next/server"
import { collection, getDocs, addDoc, query, where, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { revalidateTag } from "next/cache"
import { CreateCouponData, CouponStatus } from "@/types/coupon"

// GET /api/coupons - Lista todos os cupons
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const establishmentId = searchParams.get("establishmentId")
    const status = searchParams.get("status") as CouponStatus | null
    const userId = searchParams.get("userId")

    const couponsRef = collection(db, "coupons")
    const queryConstraints = []

    if (establishmentId) {
      queryConstraints.push(where("establishmentId", "==", establishmentId))
    }

    if (status) {
      queryConstraints.push(where("status", "==", status))
    }

    // Se userId fornecido, busca apenas cupons não utilizados pelo usuário
    if (userId) {
      const usedCouponsRef = collection(db, "users", userId, "usedCoupons")
      const usedCouponsSnapshot = await getDocs(usedCouponsRef)
      const usedCouponIds = usedCouponsSnapshot.docs.map(doc => doc.data().couponId)

      if (usedCouponIds.length > 0) {
        queryConstraints.push(where("__name__", "not-in", usedCouponIds))
      }
    }

    queryConstraints.push(orderBy("createdAt", "desc"))

    const couponsQuery = query(couponsRef, ...queryConstraints)
    const snapshot = await getDocs(couponsQuery)

    const coupons = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    return NextResponse.json(coupons)
  } catch (error) {
    console.error("Error fetching coupons:", error)
    return NextResponse.json(
      { error: "Failed to fetch coupons" },
      { status: 500 }
    )
  }
}

// POST /api/coupons - Cria um novo cupom
export async function POST(request: NextRequest) {
  try {
    const data: CreateCouponData = await request.json()

    // Validar dados do cupom
    if (!data.code || !data.discount || !data.establishmentId || !data.validUntil) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Verificar se o código já existe
    const existingCouponQuery = query(
      collection(db, "coupons"),
      where("code", "==", data.code)
    )
    const existingCouponSnapshot = await getDocs(existingCouponQuery)

    if (!existingCouponSnapshot.empty) {
      return NextResponse.json(
        { error: "Coupon code already exists" },
        { status: 400 }
      )
    }

    // Criar novo cupom
    const couponRef = await addDoc(collection(db, "coupons"), {
      ...data,
      status: "active" as CouponStatus,
      currentUses: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })

    // Revalidar os dados
    revalidateTag("coupons")
    revalidateTag(`establishment-coupons-${data.establishmentId}`)

    return NextResponse.json({
      id: couponRef.id,
      ...data,
      status: "active",
      currentUses: 0
    })
  } catch (error) {
    console.error("Error creating coupon:", error)
    return NextResponse.json(
      { error: "Failed to create coupon" },
      { status: 500 }
    )
  }
}
