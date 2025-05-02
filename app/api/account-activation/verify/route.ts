import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"

export async function GET(request: NextRequest) {
  try {
    // Log do início da verificação
    console.log("===== INICIANDO VERIFICAÇÃO DE TOKEN DE ATIVAÇÃO =====")
    
    // Obter o token da URL
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    
    // Log do token (parcial para segurança)
    if (token) {
      const tokenPreview = `${token.substring(0, 8)}...${token.substring(token.length - 8)}`
      console.log(`Token recebido: ${tokenPreview}`)
    } else {
      console.log("Token não fornecido na requisição")
    }
    
    // Verificar se o token foi fornecido
    if (!token) {
      return NextResponse.json(
        { valid: false, message: "Token não fornecido" },
        { status: 400 }
      )
    }
    
    // Buscar usuário com este token
    console.log("Buscando usuário com o token fornecido...")
    const usersRef = collection(db, 'users')
    const q = query(usersRef, where('resetPasswordToken', '==', token))
    const snapshot = await getDocs(q)
    
    // Log do resultado da busca
    console.log(`Resultado da busca: ${snapshot.empty ? 'Nenhum usuário encontrado' : 'Usuário encontrado'}`)
    
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
    
    console.log(`Usuário encontrado: ID ${userId}, Email: ${userData.email}`)
    
    // Verificar se o token expirou
    const expireDate = userData.resetPasswordTokenExpiresAt
      ? new Date(userData.resetPasswordTokenExpiresAt)
      : null
    
    if (expireDate) {
      const now = new Date()
      const isExpired = expireDate < now
      
      console.log(`Data de expiração do token: ${expireDate.toISOString()}`)
      console.log(`Data atual: ${now.toISOString()}`)
      console.log(`Token expirado? ${isExpired ? 'Sim' : 'Não'}`)
      
      if (isExpired) {
        return NextResponse.json(
          { valid: false, message: "Token expirado. Por favor, solicite um novo link de ativação." },
          { status: 400 }
        )
      }
    } else {
      console.log("Token não possui data de expiração definida")
    }
    
    // Token válido, retornar informações básicas do usuário
    console.log("Token válido! Retornando dados do usuário.")
    
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
      { valid: false, message: "Erro ao processar a requisição. Por favor, tente novamente ou contate o suporte." },
      { status: 500 }
    )
  } finally {
    console.log("===== VERIFICAÇÃO DE TOKEN CONCLUÍDA =====")
  }
} 