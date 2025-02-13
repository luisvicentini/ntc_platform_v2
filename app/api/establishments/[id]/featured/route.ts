import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { jwtDecode } from "jwt-decode"

import type { SessionToken } from "@/types/session"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { isFeatured } = await request.json()
    const sessionToken = request.headers.get("x-session-token")
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: "Sessão inválida" },
        { status: 403 }
      )
    }

    // Decodificar o token
    const session = jwtDecode<SessionToken>(sessionToken)

    // Apenas usuários master podem marcar estabelecimentos como destaque
    if (session.userType !== "master") {
      return NextResponse.json(
        { error: "Apenas administradores podem marcar estabelecimentos como destaque" },
        { status: 403 }
      )
    }

    // Verificar se o estabelecimento existe
    const establishmentRef = doc(db, "establishments", params.id)
    const establishmentSnap = await getDoc(establishmentRef)

    if (!establishmentSnap.exists()) {
      return NextResponse.json(
        { error: "Estabelecimento não encontrado" },
        { status: 404 }
      )
    }

    const establishmentData = establishmentSnap.data()

    // Atualizar estabelecimento
    await updateDoc(establishmentRef, {
      isFeatured,
      updatedAt: new Date().toISOString()
    })

    return NextResponse.json({
      id: params.id,
      ...establishmentData,
      isFeatured
    })

  } catch (error) {
    console.error("Erro ao atualizar destaque do estabelecimento:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar destaque do estabelecimento" },
      { status: 500 }
    )
  }
}
