import { NextRequest, NextResponse } from "next/server"
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { revalidateTag } from "next/cache"
import { UpdateEstablishmentData } from "@/types/establishment"

// GET /api/establishments/[id] - Obtém um estabelecimento específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const docRef = doc(db, "establishments", params.id)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: "Establishment not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: docSnap.id,
      ...docSnap.data()
    })
  } catch (error) {
    console.error("Error fetching establishment:", error)
    return NextResponse.json(
      { error: "Failed to fetch establishment" },
      { status: 500 }
    )
  }
}

// PATCH /api/establishments/[id] - Atualiza um estabelecimento
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data: UpdateEstablishmentData = await request.json()
    const docRef = doc(db, "establishments", params.id)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: "Establishment not found" },
        { status: 404 }
      )
    }

    // Atualizar no Firestore
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    })

    // Revalidar os dados
    revalidateTag("establishments")
    revalidateTag(`establishment-${params.id}`)

    return NextResponse.json({
      id: params.id,
      ...docSnap.data(),
      ...data
    })
  } catch (error) {
    console.error("Error updating establishment:", error)
    return NextResponse.json(
      { error: "Failed to update establishment" },
      { status: 500 }
    )
  }
}

// DELETE /api/establishments/[id] - Remove um estabelecimento
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const docRef = doc(db, "establishments", params.id)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: "Establishment not found" },
        { status: 404 }
      )
    }

    // Remover do Firestore
    await deleteDoc(docRef)

    // Revalidar os dados
    revalidateTag("establishments")
    revalidateTag(`establishment-${params.id}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting establishment:", error)
    return NextResponse.json(
      { error: "Failed to delete establishment" },
      { status: 500 }
    )
  }
}
