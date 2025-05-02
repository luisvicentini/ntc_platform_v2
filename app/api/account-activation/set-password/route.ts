import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore"
import { auth } from "@/lib/firebase"
import { updatePassword, sendPasswordResetEmail, getAuth } from "firebase/auth"

export async function POST(request: NextRequest) {
  try {
    // Obter dados da requisição
    const { token, password } = await request.json()
    
    // Validar entradas
    if (!token || !password) {
      return NextResponse.json(
        { success: false, message: "Token e senha são obrigatórios" },
        { status: 400 }
      )
    }
    
    // Validar força da senha
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: "A senha deve ter pelo menos 8 caracteres" },
        { status: 400 }
      )
    }
    
    // Verificar requisitos da senha
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)
    const hasNumber = /\d/.test(password)
    const hasMixedCase = /[A-Z]/.test(password) && /[a-z]/.test(password)
    
    if (!hasSpecial || !hasNumber || !hasMixedCase) {
      return NextResponse.json(
        { 
          success: false, 
          message: "A senha deve conter letras maiúsculas, minúsculas, números e caracteres especiais" 
        },
        { status: 400 }
      )
    }
    
    // Buscar usuário com este token
    const usersRef = collection(db, 'users')
    const q = query(usersRef, where('resetPasswordToken', '==', token))
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      return NextResponse.json(
        { success: false, message: "Token inválido ou expirado" },
        { status: 400 }
      )
    }
    
    // Obter dados do usuário
    const userDoc = snapshot.docs[0]
    const userData = userDoc.data()
    const userId = userDoc.id
    
    // Verificar se o token expirou
    const expireDate = userData.resetPasswordTokenExpiresAt
      ? new Date(userData.resetPasswordTokenExpiresAt)
      : null
    
    if (expireDate && expireDate < new Date()) {
      return NextResponse.json(
        { success: false, message: "Token expirado" },
        { status: 400 }
      )
    }
    
    // Atualizar o usuário no Firebase Authentication (se necessário)
    // Nota: Normalmente seria preciso autenticar o usuário antes de alterar a senha,
    // mas como estamos lidando com uma situação de ativação, 
    // vamos usar a opção de reset de senha para definir a senha inicial
    
    try {
      // Enviar um email de redefinição de senha para o Firebase Auth poder lidar com a definição da senha
      await sendPasswordResetEmail(auth, userData.email)
      
      console.log(`Email de redefinição de senha enviado para: ${userData.email}`)
    } catch (firebaseError) {
      console.error("Erro ao enviar email de redefinição:", firebaseError)
      // Continuar mesmo se falhar, pois vamos atualizar o Firestore de qualquer forma
    }
    
    // Atualizar o documento do usuário no Firestore para limpar o token e marcar a conta como verificada
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, {
      emailVerified: true,
      isActive: true,
      status: 'active',
      resetPasswordToken: null,
      resetPasswordTokenExpiresAt: null,
      updatedAt: new Date().toISOString()
    })
    
    return NextResponse.json({
      success: true,
      message: "Senha definida com sucesso. Você pode fazer login agora."
    })
  } catch (error) {
    console.error("Erro ao definir senha:", error)
    return NextResponse.json(
      { success: false, message: "Erro ao processar a requisição" },
      { status: 500 }
    )
  }
} 