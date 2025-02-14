import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, addDoc, updateDoc, doc } from "firebase/firestore"
import { jwtDecode } from "jwt-decode"
import jwt from "jsonwebtoken"
import { sendActivationEmail } from "../../../lib/email"
import type { SessionToken } from "@/types/session"

export async function POST(request: Request) {
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

    // Apenas master pode criar usuários
    if (session.userType !== "master") {
      return NextResponse.json(
        { error: "Acesso não autorizado" },
        { status: 403 }
      )
    }

    const data = await request.json()

    // Validar dados obrigatórios
    if (!data.displayName || !data.email || !data.userType) {
      return NextResponse.json(
        { error: "Dados incompletos" },
        { status: 400 }
      )
    }

    // Criar usuário
    const usersRef = collection(db, "users")
    const newUser = {
      displayName: data.displayName,
      email: data.email,
      userType: data.userType,
      status: "inactive",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Criar documento inicial
    const userDoc = await addDoc(usersRef, newUser)

    // Gerar token de ativação
    const activationToken = jwt.sign(
      { userId: userDoc.id, email: data.email },
      process.env.NEXTAUTH_SECRET!,
      { expiresIn: "7d" }
    )

    // Adicionar token e data de expiração ao documento
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 dias a partir de agora

    // Atualizar documento com o token
    await updateDoc(doc(db, "users", userDoc.id), {
      activationToken,
      activationTokenExpiresAt: expiresAt.toISOString()
    })

    // Enviar email de ativação
    const activationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/activate?token=${activationToken}`
    
    await sendActivationEmail({
      to: data.email,
      name: data.displayName,
      activationUrl,
      userType: data.userType
    })

    return NextResponse.json({
      id: userDoc.id,
      ...newUser
    })

  } catch (error) {
    console.error("Erro ao criar usuário:", error)
    return NextResponse.json(
      { error: "Erro ao criar usuário" },
      { status: 500 }
    )
  }
}
