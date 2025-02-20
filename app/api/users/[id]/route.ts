import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore"
import { jwtDecode } from "jwt-decode"
import type { SessionToken } from "@/types/session"

export async function GET(
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

    if (session.userType !== "master") {
      return NextResponse.json(
        { error: "Acesso não autorizado" },
        { status: 403 }
      )
    }

    const userDoc = await getDoc(doc(db, "users", params.id))
    
    if (!userDoc.exists()) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    const userData = userDoc.data()

    return NextResponse.json({
      id: userDoc.id,
      ...userData
    })

  } catch (error) {
    console.error("Erro ao buscar usuário:", error)
    return NextResponse.json(
      { error: "Erro ao buscar usuário" },
      { status: 500 }
    )
  }
}

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

    // Apenas master pode atualizar usuários
    if (session.userType !== "master") {
      return NextResponse.json(
        { error: "Acesso não autorizado" },
        { status: 403 }
      )
    }

    const data = await request.json()

    // Validar dados obrigatórios
    if (!data.displayName || !data.email || !data.userType || !data.status) {
      return NextResponse.json(
        { error: "Dados incompletos" },
        { status: 400 }
      )
    }

    // Atualizar usuário
    const userRef = doc(db, "users", params.id)
    const updatedUser = {
      displayName: data.displayName,
      email: data.email,
      userType: data.userType,
      status: data.status,
      updatedAt: new Date().toISOString()
    }

    await updateDoc(userRef, updatedUser)

    return NextResponse.json({
      id: params.id,
      ...updatedUser
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
    const sessionToken = request.headers.get("x-session-token")
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: "Sessão inválida" },
        { status: 403 }
      )
    }

    // Decodificar o token
    const session = jwtDecode<SessionToken>(sessionToken)

    // Apenas master pode excluir usuários
    if (session.userType !== "master") {
      return NextResponse.json(
        { error: "Acesso não autorizado" },
        { status: 403 }
      )
    }

    // Excluir usuário
    const userRef = doc(db, "users", params.id)
    await deleteDoc(userRef)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Erro ao excluir usuário:", error)
    return NextResponse.json(
      { error: "Erro ao excluir usuário" },
      { status: 500 }
    )
  }
}
