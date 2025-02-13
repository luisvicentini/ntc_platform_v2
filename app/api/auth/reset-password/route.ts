import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore"
import { getAuth, signInWithEmailAndPassword, updatePassword, signOut } from "firebase/auth"

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()

    // Buscar usuário pelo token
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("resetPasswordToken", "==", token))
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
    if (new Date(userData.resetPasswordTokenExpiresAt) < new Date()) {
      return NextResponse.json(
        { error: "Token expirado" },
        { status: 400 }
      )
    }

    // Atualizar senha no Firebase Auth
    const auth = getAuth()
    await signInWithEmailAndPassword(auth, userData.email, password)
    await updatePassword(auth.currentUser!, password)
    await signOut(auth)

    // Limpar token de recuperação
    await updateDoc(doc(db, "users", userDoc.id), {
      resetPasswordToken: null,
      resetPasswordTokenExpiresAt: null,
      updatedAt: new Date().toISOString()
    })

    return NextResponse.json({ message: "Senha redefinida com sucesso" })

  } catch (error: any) {
    console.error("Erro ao redefinir senha:", error)
    
    if (error.code === "auth/weak-password") {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 6 caracteres" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Erro ao redefinir senha" },
      { status: 500 }
    )
  }
}
