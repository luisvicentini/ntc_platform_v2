import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { jwtDecode } from "jwt-decode"

import type { SessionToken } from "@/types/session"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Lidar com os parâmetros dinamicamente
    const id = params?.id

    if (!id) {
      return NextResponse.json(
        { error: "ID do estabelecimento não fornecido" },
        { status: 400 }
      )
    }

    const { isFeatured } = await request.json()
    const sessionToken = request.headers.get("x-session-token")
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: "Sessão inválida" },
        { status: 403 }
      )
    }

    // Decodificar o token
    const session = jwtDecode<SessionToken>(sessionToken)
    
    // Logs de diagnóstico
    console.log("Dados da sessão:", {
      uid: session.uid,
      userType: session.userType
    })

    // Verificar se o estabelecimento existe
    const establishmentRef = doc(db, "establishments", id)
    const establishmentSnap = await getDoc(establishmentRef)

    if (!establishmentSnap.exists()) {
      return NextResponse.json(
        { error: "Estabelecimento não encontrado" },
        { status: 404 }
      )
    }

    const establishmentData = establishmentSnap.data()
    
    // Verificar permissões: qualquer usuário partner ou master pode marcar/desmarcar destaque
    if (session.userType !== "master" && session.userType !== "partner") {
      return NextResponse.json(
        { 
          error: "Sem permissão para alterar o destaque deste estabelecimento", 
          details: "Apenas administradores e parceiros podem alterar o destaque" 
        },
        { status: 403 }
      )
    }

    // Atualizar estabelecimento
    await updateDoc(establishmentRef, {
      isFeatured,
      updatedAt: new Date().toISOString()
    })

    return NextResponse.json({
      id,
      ...establishmentData,
      isFeatured
    })

  } catch (error) {
    console.error("Erro ao atualizar destaque do estabelecimento:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar destaque do estabelecimento" },
      { status: 500 }
    )
  }
}

// Atualizar a configuração dinâmica para Next.js
export const dynamic = 'force-dynamic'
export const dynamicParams = true
