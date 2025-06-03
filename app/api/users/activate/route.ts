import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, updateDoc, doc, setDoc, deleteDoc } from "firebase/firestore"
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth"
import jwt from "jsonwebtoken"
import { sendActivationEmail } from "@/lib/email"

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()

    // Buscar usuário pelo token de ativação
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("activationToken", "==", token))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return NextResponse.json(
        { error: "Token inválido ou expirado" },
        { status: 400 }
      )
    }

    const userDoc = querySnapshot.docs[0]
    const userData = userDoc.data()

    // Verificar se o token expirou
    if (new Date(userData.activationTokenExpiresAt) < new Date()) {
      // Atualizar status para expirado
      await updateDoc(doc(db, "users", userDoc.id), {
        status: "expired",
        updatedAt: new Date().toISOString()
      })

      // Gerar novo token e enviar novo email
      const newToken = jwt.sign(
        { userId: userDoc.id, email: userData.email },
        process.env.NEXTAUTH_SECRET!,
        { expiresIn: "24h" }
      )

      const newExpiresAt = new Date()
      newExpiresAt.setHours(newExpiresAt.getHours() + 24)

      await updateDoc(doc(db, "users", userDoc.id), {
        activationToken: newToken,
        activationTokenExpiresAt: newExpiresAt.toISOString()
      })

      // Enviar novo email de ativação
      const activationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/activate?token=${newToken}`
      await sendActivationEmail({
        to: userData.email,
        name: userData.displayName,
        activationUrl,
        userType: userData.userType
      })

      return NextResponse.json(
        { 
          error: "Token expirado. Um novo email de ativação foi enviado.",
          newEmailSent: true 
        },
        { status: 400 }
      )
    }

    // Criar usuário no Firebase Auth
    const auth = getAuth()
    const { user: firebaseUser } = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      password
    )

    // Atualizar o documento existente
    await updateDoc(doc(db, "users", userDoc.id), {
      status: "active",
      activationToken: null,
      activationTokenExpiresAt: null,
      updatedAt: new Date().toISOString(),
      firebaseUid: firebaseUser.uid
    })

    // Fazer logout do usuário recém-criado
    await signOut(auth)

    // Retornar o userType para redirecionar corretamente
    return NextResponse.json({ 
      message: "Conta ativada com sucesso",
      userType: userData.userType
    })

  } catch (error: any) {
    console.error("Erro ao ativar conta:", error)
    
    if (error.code === "auth/weak-password") {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 6 caracteres" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Erro ao ativar conta" },
      { status: 500 }
    )
  }
}
