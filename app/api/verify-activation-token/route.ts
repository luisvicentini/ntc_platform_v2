import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"

export async function POST(request: Request) {
  try {
    const { token } = await request.json()
    
    if (!token) {
      return NextResponse.json(
        { error: "Token não fornecido" },
        { status: 400 }
      )
    }
    
    console.log("Verificando token de ativação:", token.substring(0, 10) + "...")
    
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
    
    // Retornar informações básicas do usuário
    return NextResponse.json({
      user: {
        id: userDoc.id,
        email: userData.email,
        displayName: userData.displayName,
      }
    })
    
  } catch (error: any) {
    console.error("Erro ao verificar token:", error)
    return NextResponse.json(
      { error: `Erro ao verificar token: ${error.message || "Erro desconhecido"}` },
      { status: 500 }
    )
  }
} 