import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, doc, setDoc, query, where, getDocs } from "firebase/firestore"
import { generateActivationToken } from "@/lib/utils"
import { sendActivationEmail } from "@/lib/email"

export async function POST(request: Request) {
  try {
    const userData = await request.json()
    console.log('1. Dados recebidos:', userData)

    // Verificar se o email já existe
    const usersRef = collection(db, "users")
    const emailQuery = query(usersRef, where("email", "==", userData.email.toLowerCase()))
    const existingUser = await getDocs(emailQuery)

    if (!existingUser.empty) {
      return NextResponse.json(
        { error: "Este email já está cadastrado" },
        { status: 400 }
      )
    }

    console.log('2. Email disponível para cadastro')

    // Gerar token de ativação
    const activationToken = generateActivationToken()
    const now = new Date()

    // Criar documento do usuário
    const newUserRef = doc(usersRef)
    const newUserData = {
      id: newUserRef.id,
      email: userData.email.toLowerCase(),
      displayName: userData.displayName,
      phoneNumber: userData.phoneNumber,
      city: userData.city,
      userType: "member",
      status: "inactive",
      activationToken,
      activationTokenExpiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    }

    console.log('3. Tentando criar documento:', newUserData)

    await setDoc(newUserRef, newUserData)
    console.log('4. Documento criado com sucesso')

    // Enviar email de ativação
    const activationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/activate?token=${activationToken}`
    await sendActivationEmail({
      to: userData.email,
      name: userData.displayName,
      activationUrl,
      userType: "member"
    })

    return NextResponse.json({ 
      success: true,
      message: "Conta criada com sucesso. Verifique seu email para ativar sua conta."
    })

  } catch (error: any) {
    console.error("Erro detalhado ao criar usuário:", {
      message: error.message,
      code: error.code,
      stack: error.stack
    })
    
    // Retornar mensagem de erro mais específica
    return NextResponse.json(
      { error: error.message || "Erro ao criar conta" },
      { status: 500 }
    )
  }
} 