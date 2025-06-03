import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userRef = doc(db, "users", params.id)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    const userData = userSnap.data()
    const newStatus = userData.status === "active" ? "blocked" : "active"

    await updateDoc(userRef, {
      status: newStatus,
      updatedAt: new Date().toISOString()
    })

    return NextResponse.json({
      id: params.id,
      ...userData,
      status: newStatus
    })

  } catch (error) {
    console.error("Erro ao alterar status do usuário:", error)
    return NextResponse.json(
      { error: "Erro ao alterar status do usuário" },
      { status: 500 }
    )
  }
}
