import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"

export async function GET(request: NextRequest) {
  try {
    // Obter o token da URL
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    
    // Verificar se o token foi fornecido
    if (!token) {
      return NextResponse.json(
        { valid: false, message: "Token não fornecido" },
        { status: 400 }
      )
    }
    
    // Buscar usuário com este token
    const usersRef = collection(db, 'users')
    const q = query(usersRef, where('resetPasswordToken', '==', token))
    const snapshot = await getDocs(q)
    
    // Se não encontrou usuário com este token
    if (snapshot.empty) {
      return NextResponse.json(
        { valid: false, message: "Token inválido ou expirado" },
        { status: 400 }
      )
    }
    
    // Obter dados do usuário
    const userData = snapshot.docs[0].data()
    const userId = snapshot.docs[0].id
    
    // Verificar se o token expirou
    const expireDate = userData.resetPasswordTokenExpiresAt
      ? new Date(userData.resetPasswordTokenExpiresAt)
      : null
    
    if (expireDate && expireDate < new Date()) {
      return NextResponse.json(
        { valid: false, message: "Token expirado" },
        { status: 400 }
      )
    }
    
    // Token válido, retornar informações básicas do usuário
    return NextResponse.json({
      valid: true,
      user: {
        userId,
        email: userData.email,
        name: userData.displayName || userData.name
      }
    })
  } catch (error) {
    console.error("Erro ao verificar token de ativação:", error)
    return NextResponse.json(
      { valid: false, message: "Erro ao processar a requisição" },
      { status: 500 }
    )
  }
} 