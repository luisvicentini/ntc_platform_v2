import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs } from "firebase/firestore"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 })
    }

    const usersRef = collection(db, "users")
    const q = query(usersRef, where("email", "==", email.toLowerCase()))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    const userData = querySnapshot.docs[0].data()

    // Log para debug
    console.log('Dados do usuário encontrados:', userData)

    return NextResponse.json({
      status: userData.status,
      type: userData.userType // Garantir que estamos retornando userType e não type
    })

  } catch (error) {
    console.error("Erro ao verificar status:", error)
    return NextResponse.json(
      { error: "Erro ao verificar status do usuário" },
      { status: 500 }
    )
  }
} 