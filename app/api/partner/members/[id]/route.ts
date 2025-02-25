import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore"
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

    const session = jwtDecode<SessionToken>(sessionToken)
    if (session.userType !== "partner") {
      return NextResponse.json(
        { error: "Acesso não autorizado" },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Buscar documento do usuário
    const userRef = doc(db, "users", params.id)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    // Atualizar dados básicos do usuário
    const updateData: any = {}
    if (body.displayName) updateData.displayName = body.displayName
    if (body.phone) updateData.phone = body.phone

    if (Object.keys(updateData).length > 0) {
      await updateDoc(userRef, updateData)
    }

    // Se houver alteração no status da assinatura
    if (body.subscription?.status && body.subscription?.id) {
      await updateDoc(doc(db, "subscriptions", body.subscription.id), {
        status: body.subscription.status,
        updatedAt: new Date().toISOString()
      })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Erro ao atualizar membro:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar membro" },
      { status: 500 }
    )
  }
} 