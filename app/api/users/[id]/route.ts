import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore"

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { displayName, email, userType, status } = body

    const userRef = doc(db, "users", params.id)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    const updateData = {
      ...(displayName && { displayName }),
      ...(email && { email }),
      ...(userType && { userType }),
      ...(status && { status }),
      updatedAt: new Date().toISOString()
    }

    await updateDoc(userRef, updateData)

    return NextResponse.json({
      id: params.id,
      ...userSnap.data(),
      ...updateData
    })

  } catch (error) {
    console.error("Erro ao atualizar usuário:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar usuário" },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    await deleteDoc(userRef)

    return NextResponse.json({ message: "Usuário excluído com sucesso" })

  } catch (error) {
    console.error("Erro ao excluir usuário:", error)
    return NextResponse.json(
      { error: "Erro ao excluir usuário" },
      { status: 500 }
    )
  }
}
