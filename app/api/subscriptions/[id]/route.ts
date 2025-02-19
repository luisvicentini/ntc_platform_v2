import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { jwtDecode } from "jwt-decode"
import type { SessionToken } from "@/types/session"

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sessionToken = request.headers.get("x-session-token")
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: "Sessão inválida" },
        { status: 403 }
      )
    }

    const session = jwtDecode<SessionToken>(sessionToken)

    // Apenas usuários master podem cancelar assinaturas
    if (session.userType !== "master") {
      return NextResponse.json(
        { error: "Acesso não autorizado" },
        { status: 403 }
      )
    }

    const subscriptionRef = doc(db, "subscriptions", params.id)
    const subscriptionDoc = await getDoc(subscriptionRef)

    if (!subscriptionDoc.exists()) {
      return NextResponse.json(
        { error: "Assinatura não encontrada" },
        { status: 404 }
      )
    }

    // Atualizar status da assinatura para "cancelled"
    await updateDoc(subscriptionRef, {
      status: "cancelled",
      updatedAt: new Date().toISOString()
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Erro ao cancelar assinatura:", error)
    return NextResponse.json(
      { error: "Erro ao cancelar assinatura" },
      { status: 500 }
    )
  }
}
