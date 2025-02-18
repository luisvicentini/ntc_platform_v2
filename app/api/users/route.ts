import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from "firebase/firestore"
import { jwtDecode } from "jwt-decode"
import jwt from "jsonwebtoken"
import { sendActivationEmail } from "@/lib/email"
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

    // Verificar se já existe um usuário com este email
    const usersRef = collection(db, "users")
    const emailQuery = query(usersRef, where("email", "==", data.email.toLowerCase()))
    const existingUsers = await getDocs(emailQuery)

    if (!existingUsers.empty) {
      return NextResponse.json(
        { error: "Já existe um usuário com este email" },
        { status: 400 }
      )
    }

    // Criar usuário
    const newUser = {
      displayName: data.displayName,
      email: data.email.toLowerCase(), // Garantir que o email está em lowercase
      userType: data.userType,
      status: "inactive",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Criar documento inicial
    const userDoc = await addDoc(usersRef, newUser)

    // Gerar token de ativação
    const activationToken = jwt.sign(
      { 
        userId: userDoc.id, 
        email: data.email.toLowerCase() 
      },
      process.env.NEXTAUTH_SECRET || "seu-fallback-secret",
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

    try {
      // Enviar email de ativação
      const activationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/activate?token=${activationToken}`
      
      await sendActivationEmail({
        to: data.email.toLowerCase(),
        name: data.displayName,
        activationUrl,
        userType: data.userType
      })
    } catch (emailError) {
      console.error("Erro ao enviar email de ativação:", emailError)
      // Não falhar a criação do usuário se o email falhar
      // Apenas logar o erro e continuar
    }

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
