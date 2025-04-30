import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore"
import { generateActivationToken } from "@/lib/utils/utils"
import { sendActivationEmail } from "@/lib/email"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json(
        { error: "Email não fornecido" },
        { status: 400 }
      )
    }
    
    console.log(`Tentando reenviar email de ativação para: ${email}`)
    
    // Buscar usuário pelo email
    const usersRef = collection(db, "users")
    const emailQuery = query(usersRef, where("email", "==", email.toLowerCase()))
    const snapshot = await getDocs(emailQuery)
    
    if (snapshot.empty) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }
    
    // Obter o primeiro usuário
    const userDoc = snapshot.docs[0]
    const userData = userDoc.data()
    
    // Verificar se o usuário já está ativo
    if (userData.status === "active") {
      return NextResponse.json(
        { error: "Este usuário já está ativo. Tente fazer login novamente." },
        { status: 400 }
      )
    }
    
    // Gerar novo token de ativação
    const activationToken = generateActivationToken()
    const now = new Date()
    const tokenExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString() // 24 horas
    
    // Atualizar documento do usuário com novo token
    await updateDoc(doc(db, "users", userDoc.id), {
      activationToken,
      activationTokenExpiresAt: tokenExpiresAt,
      updatedAt: now.toISOString()
    })
    
    // Enviar email de ativação
    const activationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/activate?token=${activationToken}`
    
    await sendActivationEmail({
      to: email.toLowerCase(),
      name: userData.displayName || "Usuário",
      activationUrl,
      userType: userData.userType || "member"
    })
    
    return NextResponse.json({ 
      success: true,
      message: "Email de ativação reenviado com sucesso" 
    })
    
  } catch (error: any) {
    console.error("Erro ao reenviar email de ativação:", error)
    
    return NextResponse.json(
      { error: error.message || "Erro ao reenviar email de ativação" },
      { status: 500 }
    )
  }
} 