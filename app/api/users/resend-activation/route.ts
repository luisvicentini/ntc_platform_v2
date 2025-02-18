import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore"
import jwt from "jsonwebtoken"
import { sendActivationEmail } from "@/lib/email"
import { jwtDecode } from "jwt-decode"
import type { SessionToken } from "@/types/session"

export async function POST(request: Request) {
  try {
    // Verificar autenticação do master
    const sessionToken = request.headers.get("x-session-token")
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: "Sessão inválida" },
        { status: 403 }
      )
    }

    // Decodificar o token
    const session = jwtDecode<SessionToken>(sessionToken)

    // Apenas master pode reenviar emails
    if (session.userType !== "master") {
      return NextResponse.json(
        { error: "Acesso não autorizado" },
        { status: 403 }
      )
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: "ID do usuário é obrigatório" },
        { status: 400 }
      )
    }

    // Buscar usuário
    const userDoc = await getDoc(doc(db, "users", userId))
    
    if (!userDoc.exists()) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    const userData = userDoc.data()

    // Verificar se o usuário já está ativo
    if (userData.status === "active") {
      return NextResponse.json(
        { error: "Usuário já está ativo" },
        { status: 400 }
      )
    }

    // Gerar novo token de ativação
    const activationToken = jwt.sign(
      { 
        userId: userDoc.id, 
        email: userData.email 
      },
      process.env.NEXTAUTH_SECRET || "seu-fallback-secret",
      { expiresIn: "24h" }
    )

    // Calcular data de expiração (24h a partir de agora)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    // Atualizar documento com o novo token
    await updateDoc(doc(db, "users", userDoc.id), {
      activationToken,
      activationTokenExpiresAt: expiresAt.toISOString(),
      status: "inactive", // Garantir que o status está como inativo
      updatedAt: new Date().toISOString()
    })

    // Enviar novo email de ativação
    const activationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/activate?token=${activationToken}`
    
    await sendActivationEmail({
      to: userData.email,
      name: userData.displayName,
      activationUrl,
      userType: userData.userType
    })

    return NextResponse.json({ 
      message: "Email de ativação reenviado com sucesso",
      status: "success"
    })

  } catch (error) {
    console.error("Erro ao reenviar email de ativação:", error)
    return NextResponse.json(
      { 
        error: "Erro ao reenviar email de ativação",
        details: error instanceof Error ? error.message : "Erro desconhecido"
      },
      { status: 500 }
    )
  }
}
