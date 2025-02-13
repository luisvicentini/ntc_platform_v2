import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { jwtDecode } from "jwt-decode"
import type { SessionToken } from "@/types/session"

export async function PATCH(
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

    // Decodificar o token
    const session = jwtDecode<SessionToken>(sessionToken)

    // Apenas usuários master podem cancelar assinaturas
    if (session.userType !== "master") {
      return NextResponse.json(
        { error: "Apenas administradores podem cancelar assinaturas" },
        { status: 403 }
      )
    }

    // Verificar se a assinatura existe
    const subscriptionRef = doc(db, "subscriptions", params.id)
    const subscriptionSnap = await getDoc(subscriptionRef)

    if (!subscriptionSnap.exists()) {
      return NextResponse.json(
        { error: "Assinatura não encontrada" },
        { status: 404 }
      )
    }

    // Atualizar assinatura
    await updateDoc(subscriptionRef, {
      status: "inactive",
      updatedAt: new Date().toISOString()
    })

    return NextResponse.json({
      message: "Assinatura cancelada com sucesso"
    })

  } catch (error) {
    console.error("Erro ao cancelar assinatura:", error)
    return NextResponse.json(
      { error: "Erro ao cancelar assinatura" },
      { status: 500 }
    )
  }
}
