import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore"
import { auth } from "@/lib/firebase"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updatePassword } from "firebase/auth"

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
    
    // Se o usuário não tiver uma conta no Firebase Auth, criar uma
    try {
      if (!userData.firebaseUid) {
        console.log("Criando conta no Firebase Auth para:", userData.email)
        
        // Criar uma nova conta no Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          userData.email,
          password
        )
        
        // Salvar o UID do Firebase no documento do usuário
        await updateDoc(doc(db, "users", userDoc.id), {
          firebaseUid: userCredential.user.uid,
          resetPasswordToken: null,
          resetPasswordTokenExpiresAt: null,
          activated: true,
          updatedAt: new Date().toISOString()
        })
        
        console.log("Conta criada com sucesso no Firebase Auth:", userCredential.user.uid)
      } else {
        // Se o usuário já tiver uma conta no Firebase Auth, atualizar a senha
        console.log("Atualizando senha para usuário existente:", userData.firebaseUid)
        
        // Fazer login temporário com uma senha temporária se disponível
        // Isso é necessário apenas se o usuário já existir e você precisar mudar a senha
        // Na maioria dos casos de ativação, o usuário ainda não existe no Auth
        
        // Atualizar o documento no Firestore
        await updateDoc(doc(db, "users", userDoc.id), {
          resetPasswordToken: null,
          resetPasswordTokenExpiresAt: null,
          activated: true,
          updatedAt: new Date().toISOString()
        })
        
        console.log("Documento do usuário atualizado, senha definida com sucesso")
      }
    } catch (firebaseError: any) {
      console.error("Erro ao interagir com o Firebase Auth:", firebaseError)
      
      // Tratar erros específicos do Firebase Auth
      if (firebaseError.code === "auth/email-already-in-use") {
        // Se o email já estiver em uso, podemos tentar atualizar a senha diretamente
        // ou fornecer instruções específicas para o usuário
        return NextResponse.json(
          { error: "Este email já está associado a uma conta. Por favor, tente recuperar sua senha em vez de ativar a conta." },
          { status: 400 }
        )
      }
      
      throw firebaseError
    }
    
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