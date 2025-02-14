import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import jwt from "jsonwebtoken"
import { sendActivationEmail } from "@/lib/email"

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    // Buscar usuário
    const userDoc = await getDoc(doc(db, "users", userId))
    
    if (!userDoc.exists()) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    const userData = userDoc.data()

    // Gerar novo token de ativação
    const activationToken = jwt.sign(
      { userId: userDoc.id, email: userData.email },
      process.env.NEXTAUTH_SECRET!,
      { expiresIn: "24h" }
    )

    // Calcular data de expiração (24h a partir de agora)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    // Atualizar documento com o novo token
    await updateDoc(doc(db, "users", userDoc.id), {
      activationToken,
      activationTokenExpiresAt: expiresAt.toISOString(),
      status: "inactive" // Garantir que o status está como inativo
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
      message: "Email de ativação reenviado com sucesso" 
    })

  } catch (error) {
    console.error("Erro ao reenviar email de ativação:", error)
    return NextResponse.json(
      { error: "Erro ao reenviar email de ativação" },
      { status: 500 }
    )
  }
}
