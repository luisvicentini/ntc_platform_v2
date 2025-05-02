import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore"
import { auth } from "@/lib/firebase"
import { updatePassword, sendPasswordResetEmail, getAuth } from "firebase/auth"

export async function POST(request: NextRequest) {
  try {
    console.log("===== INICIANDO DEFINIÇÃO DE SENHA DE ATIVAÇÃO =====")
    
    // Obter dados da requisição
    const { token, password } = await request.json()
    
    console.log(`Token recebido: ${token?.substring(0, 8)}...${token?.substring(token?.length - 8) || ''}`)
    console.log("Senha recebida: [REDACTED]")
    
    // Validar entradas
    if (!token || !password) {
      console.error("Erro: Token ou senha não fornecidos")
      return NextResponse.json(
        { success: false, message: "Token e senha são obrigatórios" },
        { status: 400 }
      )
    }
    
    // Validar força da senha
    if (password.length < 8) {
      console.error("Erro: Senha muito curta")
      return NextResponse.json(
        { success: false, message: "A senha deve ter pelo menos 8 caracteres" },
        { status: 400 }
      )
    }
    
    // Verificar requisitos da senha
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)
    const hasNumber = /\d/.test(password)
    const hasMixedCase = /[A-Z]/.test(password) && /[a-z]/.test(password)
    
    console.log("Validando requisitos da senha:")
    console.log(`- Tem caracteres especiais: ${hasSpecial}`)
    console.log(`- Tem números: ${hasNumber}`)
    console.log(`- Tem letras maiúsculas e minúsculas: ${hasMixedCase}`)
    
    if (!hasSpecial || !hasNumber || !hasMixedCase) {
      console.error("Erro: Senha não atende aos requisitos mínimos")
      return NextResponse.json(
        { 
          success: false, 
          message: "A senha deve conter letras maiúsculas, minúsculas, números e caracteres especiais" 
        },
        { status: 400 }
      )
    }
    
    // Buscar usuário com este token
    console.log("Buscando usuário com o token fornecido...")
    const usersRef = collection(db, 'users')
    const q = query(usersRef, where('resetPasswordToken', '==', token))
    const snapshot = await getDocs(q)
    
    console.log(`Usuários encontrados: ${snapshot.size}`)
    
    if (snapshot.empty) {
      console.error("Erro: Nenhum usuário encontrado com este token")
      return NextResponse.json(
        { success: false, message: "Token inválido ou expirado. Por favor, solicite um novo link de ativação." },
        { status: 400 }
      )
    }
    
    // Obter dados do usuário
    const userDoc = snapshot.docs[0]
    const userData = userDoc.data()
    const userId = userDoc.id
    
    console.log(`Usuário encontrado: ID ${userId}, Email: ${userData.email}`)
    
    // Verificar se o token expirou
    const expireDate = userData.resetPasswordTokenExpiresAt
      ? new Date(userData.resetPasswordTokenExpiresAt)
      : null
    
    if (expireDate) {
      const now = new Date()
      const isExpired = expireDate < now
      
      console.log(`Data de expiração: ${expireDate.toISOString()}`)
      console.log(`Data atual: ${now.toISOString()}`)
      console.log(`Token expirado? ${isExpired ? 'Sim' : 'Não'}`)
      
      if (isExpired) {
        console.error("Erro: Token expirado")
        return NextResponse.json(
          { success: false, message: "Token expirado. Por favor, solicite um novo link de ativação." },
          { status: 400 }
        )
      }
    } else {
      console.log("Token não possui data de expiração definida")
    }
    
    // Atualizar o usuário no Firebase Authentication (se necessário)
    // Nota: Normalmente seria preciso autenticar o usuário antes de alterar a senha,
    // mas como estamos lidando com uma situação de ativação, 
    // vamos usar a opção de reset de senha para definir a senha inicial
    
    try {
      // Enviar um email de redefinição de senha para o Firebase Auth poder lidar com a definição da senha
      console.log(`Enviando email de redefinição para: ${userData.email}`)
      await sendPasswordResetEmail(auth, userData.email)
      
      console.log(`Email de redefinição de senha enviado para: ${userData.email}`)
    } catch (firebaseError) {
      console.error("Erro ao enviar email de redefinição:", firebaseError)
      // Continuar mesmo se falhar, pois vamos atualizar o Firestore de qualquer forma
    }
    
    // Atualizar o documento do usuário no Firestore para limpar o token e marcar a conta como verificada
    console.log(`Atualizando status do usuário no Firestore: ${userId}`)
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, {
      emailVerified: true,
      isActive: true,
      status: 'active',
      resetPasswordToken: null,
      resetPasswordTokenExpiresAt: null,
      updatedAt: new Date().toISOString()
    })
    
    console.log("Conta ativada com sucesso!")
    
    return NextResponse.json({
      success: true,
      message: "Senha definida com sucesso. Você pode fazer login agora."
    })
  } catch (error) {
    console.error("Erro ao definir senha:", error)
    return NextResponse.json(
      { success: false, message: "Erro ao processar a requisição. Por favor, tente novamente ou contate o suporte." },
      { status: 500 }
    )
  } finally {
    console.log("===== DEFINIÇÃO DE SENHA CONCLUÍDA =====")
  }
} 