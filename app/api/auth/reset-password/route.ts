import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore"
import { getAuth, updatePassword, signInWithEmailAndPassword, signOut, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth"
import * as firebaseAdmin from 'firebase-admin'
import { getFirebaseAdminApp } from "@/lib/firebase-admin"

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()
    console.log("Solicitação de redefinição de senha recebida para token:", token)

    // Buscar usuário pelo token
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("resetPasswordToken", "==", token))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      console.log("Token não encontrado na base de dados")
      return NextResponse.json(
        { error: "Token inválido ou expirado" },
        { status: 400 }
      )
    }

    const userDoc = querySnapshot.docs[0]
    const userData = userDoc.data()
    console.log("Usuário encontrado:", userData.email)

    // Verificar se o token expirou
    if (new Date(userData.resetPasswordTokenExpiresAt) < new Date()) {
      console.log("Token expirado em:", userData.resetPasswordTokenExpiresAt)
      return NextResponse.json(
        { error: "Token expirado" },
        { status: 400 }
      )
    }

    // Verificar se o usuário tem UID válido
    if (!userData.uid) {
      console.error("UID não encontrado para o usuário:", userData.email, "ID do documento:", userDoc.id)
      
      // Em vez de falhar, vamos usar o ID do documento como UID
      console.log("Usando ID do documento como UID:", userDoc.id)
      
      // Atualizar o documento com o ID como UID
      await updateDoc(doc(db, "users", userDoc.id), {
        uid: userDoc.id,
        updatedAt: new Date().toISOString()
      })
      
      console.log("Documento atualizado com o UID:", userDoc.id)
      
      // Usar o ID do documento como UID daqui em diante
      userData.uid = userDoc.id
    }

    console.log("UID do usuário encontrado:", userData.uid)
    
    try {
      // Inicializar Admin SDK se ainda não estiver inicializado
      const adminApp = getFirebaseAdminApp()
      const adminAuth = adminApp.auth()
      
      // Verificar se o usuário existe no Firebase Auth pelo email
      try {
        // Primeiro, tentar encontrar o usuário pelo email no Firebase Auth
        console.log("Buscando usuário pelo email no Firebase Auth:", userData.email)
        let firebaseUser = null
        
        try {
          // Buscar usuário pelo email no Firebase Auth
          const userByEmail = await adminAuth.getUserByEmail(userData.email)
          if (userByEmail) {
            firebaseUser = userByEmail
            console.log("Usuário encontrado no Firebase Auth pelo email:", userData.email, "UID:", userByEmail.uid)
            
            // Se o UID no Firestore for diferente do UID no Firebase Auth
            if (userData.uid !== userByEmail.uid) {
              console.log("UIDs diferentes. Firestore:", userData.uid, "Firebase Auth:", userByEmail.uid)
              
              // Atualizar o documento no Firestore com o UID correto do Firebase Auth
              await updateDoc(doc(db, "users", userDoc.id), {
                uid: userByEmail.uid,
                updatedAt: new Date().toISOString()
              })
              
              console.log("Documento atualizado com o UID correto do Firebase Auth:", userByEmail.uid)
              
              // Usar o UID correto do Firebase Auth daqui em diante
              userData.uid = userByEmail.uid
            }
          }
        } catch (findError: any) {
          if (findError.code !== 'auth/user-not-found') {
            console.error("Erro ao buscar usuário pelo email:", findError)
          }
        }
        
        // Se encontramos o usuário, atualizamos a senha
        if (firebaseUser) {
          console.log("Atualizando senha para o usuário existente:", userData.email)
          await adminAuth.updateUser(userData.uid, {
            password: password,
          })
          console.log("Senha atualizada com sucesso")
        } else {
          // Se não encontramos o usuário, tentamos criar ou atualizar
          try {
            console.log("Tentando atualizar usuário no Firebase Auth:", userData.email, "UID:", userData.uid)
            await adminAuth.updateUser(userData.uid, {
              password: password,
            })
            console.log("Senha atualizada com sucesso")
          } catch (updateError: any) {
            // Se o usuário não existir no Firebase Auth, tentamos criar
            if (updateError.code === 'auth/user-not-found') {
              console.log("Usuário não encontrado no Firebase Auth, tentando criar:", userData.email)
              
              try {
                // Criar o usuário no Firebase Auth
                await adminAuth.createUser({
                  uid: userData.uid,
                  email: userData.email,
                  password: password,
                  displayName: userData.displayName || '',
                  emailVerified: userData.emailVerified || false,
                  disabled: false
                })
                
                console.log("Usuário criado com sucesso no Firebase Auth")
              } catch (createError: any) {
                console.error("Erro ao criar usuário no Firebase Auth:", createError)
                
                if (createError.code === 'auth/uid-already-exists') {
                  return NextResponse.json(
                    { error: "UID já existe, mas não conseguimos localizar o usuário. Por favor, contate o suporte." },
                    { status: 400 }
                  )
                }
                
                if (createError.code === 'auth/email-already-exists') {
                  // Se o email já existe com outro UID, isso não deveria acontecer neste ponto
                  // porque já verificamos e atualizamos acima
                  return NextResponse.json(
                    { error: "Erro interno: email já existe com outro UID. Por favor, contate o suporte." },
                    { status: 500 }
                  )
                }
                
                return NextResponse.json(
                  { error: `Erro ao criar usuário: ${createError.message}` },
                  { status: 500 }
                )
              }
            } else {
              // Se for outro erro, reportar
              console.error("Erro ao atualizar senha:", updateError)
              
              if (updateError.code === 'auth/invalid-uid') {
                return NextResponse.json(
                  { error: "UID inválido. Por favor, solicite um novo link de redefinição." },
                  { status: 400 }
                )
              }
              
              return NextResponse.json(
                { error: `Erro ao atualizar senha: ${updateError.message}` },
                { status: 500 }
              )
            }
          }
        }
      } catch (authError: any) {
        console.error("Erro ao interagir com Firebase Auth:", authError)
        return NextResponse.json(
          { error: `Erro no serviço de autenticação: ${authError.message}` },
          { status: 500 }
        )
      }

    // Limpar token de recuperação
    await updateDoc(doc(db, "users", userDoc.id), {
      resetPasswordToken: null,
      resetPasswordTokenExpiresAt: null,
      updatedAt: new Date().toISOString()
    })
      
      console.log("Token de redefinição removido com sucesso")

    return NextResponse.json({ message: "Senha redefinida com sucesso" })
    } catch (adminError: any) {
      console.error("Erro com Admin SDK:", adminError)
      
      // Erro mais detalhado para diagnóstico
      if (adminError.code === 'auth/user-not-found') {
        return NextResponse.json(
          { error: "Usuário não encontrado na autenticação. O usuário pode ter sido excluído." },
          { status: 400 }
        )
      }
      
      if (adminError.code === 'auth/invalid-uid') {
        return NextResponse.json(
          { error: "UID inválido. Por favor, solicite um novo link de redefinição." },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: `Não foi possível redefinir a senha: ${adminError.message}` },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error("Erro ao redefinir senha:", error)
    
    if (error.code === "auth/weak-password") {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 6 caracteres" },
        { status: 400 }
      )
    }

    if (error.code === "auth/requires-recent-login") {
      return NextResponse.json(
        { error: "Por motivos de segurança, é necessário reautenticar. Por favor, solicite um novo link de redefinição de senha." },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: `Erro ao redefinir senha: ${error.message || "Erro desconhecido"}` },
      { status: 500 }
    )
  }
}
