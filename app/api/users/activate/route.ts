import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore"
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth"

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
      return NextResponse.json(
        { error: "Token expirado" },
        { status: 400 }
      )
    }

    // Criar usuário no Firebase Auth
    const auth = getAuth()
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, password)

    // Atualizar o documento existente com o UID do Firebase Auth
    await updateDoc(doc(db, "users", userDoc.id), {
      status: "active",
      activationToken: null,
      activationTokenExpiresAt: null,
      updatedAt: new Date().toISOString(),
      uid: userCredential.user.uid
    })

    await signOut(auth) // Fazer logout para que o usuário faça login com as novas credenciais

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
