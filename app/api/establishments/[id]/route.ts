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
    const body = await request.json()
    const sessionToken = request.headers.get("x-session-token")
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: "Sessão inválida" },
        { status: 403 }
      )
    }

    // Decodificar o token
    const session = jwtDecode<SessionToken>(sessionToken)

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

    // Verificar se o usuário é o dono do estabelecimento ou é master
    if (session.userType !== "master" && establishmentData.partnerId !== session.uid) {
      return NextResponse.json(
        { error: "Sem permissão para editar este estabelecimento" },
        { status: 403 }
      )
    }

    // Atualizar estabelecimento
    const updateData = {
      ...body,
      updatedAt: new Date().toISOString()
    }

    await updateDoc(establishmentRef, updateData)

    return NextResponse.json({
      id: params.id,
      ...establishmentData,
      ...updateData
    })

  } catch (error) {
    console.error("Erro ao atualizar estabelecimento:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar estabelecimento" },
      { status: 500 }
    )
  }
}

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

    // Decodificar o token
    const session = jwtDecode<SessionToken>(sessionToken)

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

    // Verificar se o usuário é o dono do estabelecimento ou é master
    if (session.userType !== "master" && establishmentData.partnerId !== session.uid) {
      return NextResponse.json(
        { error: "Sem permissão para excluir este estabelecimento" },
        { status: 403 }
      )
    }

    // Em vez de excluir, marcar como inativo
    await updateDoc(establishmentRef, {
      status: "inactive",
      updatedAt: new Date().toISOString()
    })

    return NextResponse.json({ message: "Estabelecimento excluído com sucesso" })

  } catch (error) {
    console.error("Erro ao excluir estabelecimento:", error)
    return NextResponse.json(
      { error: "Erro ao excluir estabelecimento" },
      { status: 500 }
    )
  }
}
