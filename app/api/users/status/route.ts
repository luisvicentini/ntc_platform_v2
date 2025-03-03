import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs } from "firebase/firestore"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get("email")

  if (!email) {
    return NextResponse.json({ error: "Email não fornecido" }, { status: 400 })
  }

  try {
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("email", "==", email.toLowerCase()))
    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    const userData = snapshot.docs[0].data()
    return NextResponse.json({ 
      status: userData.status,
      type: userData.type,
      id: snapshot.docs[0].id
    })
  } catch (error) {
    console.error("Erro ao verificar status do usuário:", error)
    return NextResponse.json(
      { error: "Erro ao verificar status do usuário" },
      { status: 500 }
    )
  }
} 