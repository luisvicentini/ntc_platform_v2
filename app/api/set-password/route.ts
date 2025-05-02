import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const { token, password, email } = await request.json()
    
    if (!token || !password) {
      return NextResponse.json(
        { error: "Token e senha são obrigatórios" },
        { status: 400 }
      )
    }
    
    // Validar senha
    if (password.length < 8) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 8 caracteres" },
        { status: 400 }
      )
    }
    
    // Validar requisitos de senha forte
    const hasNumber = /\d/.test(password)
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)
    const hasUppercase = /[A-Z]/.test(password)
    const hasLowercase = /[a-z]/.test(password)

    if (!hasNumber || !hasSpecial || !hasUppercase || !hasLowercase) {
      return NextResponse.json(
        { error: "A senha precisa conter pelo menos um número, um caractere especial, uma letra maiúscula e uma letra minúscula" },
        { status: 400 }
      )
    }
    
    console.log("Definindo senha para token:", token.substring(0, 10) + "...")
    
    // Buscar usuário pelo token
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("resetPasswordToken", "==", token))
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      console.log("Token não encontrado")
      return NextResponse.json(
        { error: "Token inválido ou expirado" },
        { status: 404 }
      )
    }
    
    const userDoc = querySnapshot.docs[0]
    const userData = userDoc.data()
    
    // Verificar se o token não expirou
    const expiresAt = userData.resetPasswordTokenExpiresAt
    
    if (!expiresAt || new Date(expiresAt) < new Date()) {
      console.log("Token expirado")
      return NextResponse.json(
        { error: "Token expirado" },
        { status: 401 }
      )
    }
    
    // Criptografar a senha
    const hashedPassword = await bcrypt.hash(password, 10)
    
    // Atualizar usuário com a nova senha e limpar token
    await updateDoc(doc(db, "users", userDoc.id), {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordTokenExpiresAt: null,
      activated: true,
      updatedAt: new Date().toISOString()
    })
    
    console.log("Senha definida com sucesso para usuário:", userDoc.id)
    
    return NextResponse.json({
      message: "Senha definida com sucesso",
      email: userData.email
    })
    
  } catch (error: any) {
    console.error("Erro ao definir senha:", error)
    return NextResponse.json(
      { error: `Erro ao definir senha: ${error.message || "Erro desconhecido"}` },
      { status: 500 }
    )
  }
} 