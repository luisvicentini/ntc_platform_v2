import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where } from "firebase/firestore"

export async function GET() {
  try {
    // Buscar todos os usuários que são parceiros
    const usersRef = collection(db, "users")
    const partnersQuery = query(usersRef, where("userType", "==", "partner"))
    const partnersSnapshot = await getDocs(partnersQuery)

    const partners = partnersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    return NextResponse.json(partners)
  } catch (error) {
    console.error("Erro ao buscar parceiros:", error)
    return NextResponse.json(
      { error: "Erro ao buscar parceiros" },
      { status: 500 }
    )
  }
}
