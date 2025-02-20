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
    const sessionToken = request.headers.get("x-session-token")
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: "Sessão inválida" },
        { status: 403 }
      )
    }

    const session = jwtDecode<SessionToken>(sessionToken)

    if (session.userType !== "master") {
      return NextResponse.json(
        { error: "Acesso não autorizado" },
        { status: 403 }
      )
    }

    const { establishmentIds, removeAll } = await request.json()
    const userId = params.id

    if (!Array.isArray(establishmentIds)) {
      return NextResponse.json(
        { error: "Formato inválido de estabelecimentos" },
        { status: 400 }
      )
    }

    // Verificar se o usuário existe
    const userDoc = await getDoc(doc(db, "users", userId))
    if (!userDoc.exists()) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    const userData = userDoc.data()
    if (userData.userType !== "business") {
      return NextResponse.json(
        { error: "Usuário não é do tipo business" },
        { status: 400 }
      )
    }

    // Verificar se todos os estabelecimentos existem
    const establishmentPromises = establishmentIds.map(async (id) => {
      const estDoc = await getDoc(doc(db, "establishments", id))
      return { id, exists: estDoc.exists() }
    })

    const establishmentResults = await Promise.all(establishmentPromises)
    const invalidEstablishments = establishmentResults.filter(est => !est.exists)

    if (invalidEstablishments.length > 0) {
      return NextResponse.json(
        { 
          error: "Alguns estabelecimentos não foram encontrados",
          invalidIds: invalidEstablishments.map(est => est.id)
        },
        { status: 404 }
      )
    }

    // Atualizar o usuário com os novos estabelecimentos
    await updateDoc(doc(db, "users", userId), {
      establishmentIds,
      establishmentId: removeAll ? null : (establishmentIds[0] || null), // Define como null se removeAll for true
      updatedAt: new Date().toISOString()
    })

    return NextResponse.json({
      message: "Estabelecimentos vinculados com sucesso"
    })

  } catch (error) {
    console.error("Erro ao vincular estabelecimentos:", error)
    return NextResponse.json(
      { error: "Erro ao vincular estabelecimentos" },
      { status: 500 }
    )
  }
}

// GET para buscar estabelecimentos vinculados
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userDoc = await getDoc(doc(db, "users", params.id))
    if (!userDoc.exists()) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    const userData = userDoc.data()
    const establishments = userData.establishmentIds || []

    return NextResponse.json({ establishments })

  } catch (error) {
    console.error("Erro ao buscar estabelecimentos:", error)
    return NextResponse.json(
      { error: "Erro ao buscar estabelecimentos" },
      { status: 500 }
    )
  }
}
