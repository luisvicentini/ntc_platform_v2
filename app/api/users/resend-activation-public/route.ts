import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore"
import jwt from "jsonwebtoken"
import { sendActivationEmail } from "@/lib/email"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      )
    }

    // Buscar usuário pelo email
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("email", "==", email.toLowerCase()))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    const userDoc = querySnapshot.docs[0]
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

    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    // Atualizar documento com o novo token
    await updateDoc(doc(db, "users", userDoc.id), {
      activationToken,
      activationTokenExpiresAt: expiresAt.toISOString(),
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