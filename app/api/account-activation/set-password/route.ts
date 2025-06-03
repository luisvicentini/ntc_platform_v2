import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore"
import { auth } from "@/lib/firebase"
import { 
  updatePassword, 
  sendPasswordResetEmail, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  getAuth,
  signOut, 
  updateEmail,
  signInWithCustomToken,
  signInAnonymously,
  fetchSignInMethodsForEmail,
  sendSignInLinkToEmail
} from "firebase/auth"
import { getFirebaseAdminApp, auth as adminAuth } from "@/lib/firebase-admin"
import * as admin from 'firebase-admin'

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
    const userEmail = userData.email
    const firebaseUid = userData.uid || userId
    
    console.log(`Usuário encontrado: ID ${userId}, Email: ${userEmail}`)
    
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
    
    // Inicializar Firebase Admin SDK
    getFirebaseAdminApp()
    
    // Atualizar a senha diretamente usando o Firebase Admin SDK
    try {
      // Verificar se o usuário existe no Firebase Auth
      try {
        console.log(`Verificando se o usuário existe no Firebase Auth: ${firebaseUid}`)
        await adminAuth.getUser(firebaseUid)
        console.log("Usuário existente no Firebase Auth")
        
        // Usuário existe, atualizar a senha
        await adminAuth.updateUser(firebaseUid, {
          password: password,
          emailVerified: true
        })
        
        console.log("Senha atualizada com sucesso no Firebase Auth")
      } catch (getUserError) {
        console.error("Erro ao obter usuário do Firebase Auth:", getUserError)
        
        // Usuário não existe no Firebase Auth, criar novo usuário
        console.log("Criando novo usuário no Firebase Auth...")
        
        try {
          const userRecord = await adminAuth.createUser({
            uid: firebaseUid,
            email: userEmail,
            password: password,
            emailVerified: true
          })
          
          console.log(`Novo usuário criado no Firebase Auth: ${userRecord.uid}`)
        } catch (createError) {
          console.error("Erro ao criar usuário:", createError)
          
          // Se falhar na criação com UID específico, tentar criar com UID gerado pelo Firebase
          if (String(createError).includes('already exists')) {
            console.log("Tentando criar usuário sem especificar UID...")
            
            try {
              // Verificar se o email já está em uso
              const userByEmail = await adminAuth.getUserByEmail(userEmail)
              
              if (userByEmail) {
                console.log(`Usuário encontrado pelo email: ${userByEmail.uid}`)
                
                // Atualizar dados do usuário existente
                await adminAuth.updateUser(userByEmail.uid, {
                  password: password,
                  emailVerified: true
                })
                
                console.log("Senha atualizada para o usuário encontrado pelo email")
                
                // Atualizar o UID no documento do Firestore se for diferente
                if (userByEmail.uid !== firebaseUid) {
                  await updateDoc(userDoc.ref, {
                    uid: userByEmail.uid
                  })
                  console.log(`UID do usuário atualizado no Firestore: ${userByEmail.uid}`)
                }
              }
            } catch (emailLookupError) {
              // Email não encontrado, tentativa final de criar usuário com novo UID
              try {
                const newUserRecord = await adminAuth.createUser({
                  email: userEmail,
                  password: password,
                  emailVerified: true
                })
                
                console.log(`Usuário criado com novo UID: ${newUserRecord.uid}`)
                
                // Atualizar o documento do Firestore com o novo UID
                await updateDoc(userDoc.ref, {
                  uid: newUserRecord.uid
                })
                
                console.log(`UID atualizado no Firestore: ${newUserRecord.uid}`)
              } catch (finalCreateError) {
                console.error("Erro final ao criar usuário:", finalCreateError)
                throw new Error("Não foi possível criar ou atualizar o usuário no Firebase Auth")
              }
            }
          } else {
            throw createError
          }
        }
      }
    } catch (adminError) {
      console.error("Erro ao usar Firebase Admin:", adminError)
      
      // Fallback: enviar email de redefinição de senha
      console.log("Fallback: enviando email de redefinição de senha")
      await sendPasswordResetEmail(auth, userEmail)
      console.log(`Email de redefinição de senha enviado para: ${userEmail}`)
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