import { NextRequest, NextResponse } from "next/server"
import { doc, getDoc, updateDoc, runTransaction, collection } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { revalidateTag } from "next/cache"
import { UpdateCouponData, CouponStatus } from "@/types/coupon"

// GET /api/coupons/[id] - Obtém um cupom específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const docRef = doc(db, "coupons", params.id)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: "Coupon not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: docSnap.id,
      ...docSnap.data()
    })
  } catch (error) {
    console.error("Error fetching coupon:", error)
    return NextResponse.json(
      { error: "Failed to fetch coupon" },
      { status: 500 }
    )
  }
}

// PATCH /api/coupons/[id] - Atualiza um cupom
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data: UpdateCouponData = await request.json()
    const docRef = doc(db, "coupons", params.id)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: "Coupon not found" },
        { status: 404 }
      )
    }

    // Atualizar no Firestore
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    })

    // Revalidar os dados
    revalidateTag("coupons")
    revalidateTag(`coupon-${params.id}`)

    return NextResponse.json({
      id: params.id,
      ...docSnap.data(),
      ...data
    })
  } catch (error) {
    console.error("Error updating coupon:", error)
    return NextResponse.json(
      { error: "Failed to update coupon" },
      { status: 500 }
    )
  }
}

// POST /api/coupons/[id]/use - Usa um cupom
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    // Usar transação para garantir consistência
    await runTransaction(db, async (transaction) => {
      const couponRef = doc(db, "coupons", params.id)
      const couponDoc = await transaction.get(couponRef)

      if (!couponDoc.exists()) {
        throw new Error("Coupon not found")
      }

      const couponData = couponDoc.data()

      // Verificar se o cupom está ativo
      if (couponData.status !== "active") {
        throw new Error("Coupon is not active")
      }

      // Verificar se o cupom não expirou
      if (new Date(couponData.validUntil) < new Date()) {
        throw new Error("Coupon has expired")
      }

      // Verificar limite de usos
      if (couponData.maxUses && couponData.currentUses >= couponData.maxUses) {
        throw new Error("Coupon usage limit reached")
      }

      // Registrar uso do cupom
      const usedCouponRef = doc(collection(db, "users", userId, "usedCoupons"))
      transaction.set(usedCouponRef, {
        couponId: params.id,
        establishmentId: couponData.establishmentId,
        usedAt: new Date().toISOString(),
        discount: couponData.discount
      })

      // Atualizar contador de usos do cupom
      const newUses = (couponData.currentUses || 0) + 1
      const newStatus = couponData.maxUses && newUses >= couponData.maxUses
        ? "used" as CouponStatus
        : "active" as CouponStatus

      transaction.update(couponRef, {
        currentUses: newUses,
        status: newStatus,
        updatedAt: new Date().toISOString()
      })
    })

    // Revalidar os dados
    revalidateTag("coupons")
    revalidateTag(`coupon-${params.id}`)
    revalidateTag(`user-coupons-${userId}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error using coupon:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to use coupon" },
      { status: 500 }
    )
  }
}
