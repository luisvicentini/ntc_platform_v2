import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { establishmentId } = await request.json()
    const userId = params.id

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

    // Verificar se o estabelecimento existe
    const establishmentDoc = await getDoc(doc(db, "establishments", establishmentId))
    if (!establishmentDoc.exists()) {
      return NextResponse.json(
        { error: "Estabelecimento não encontrado" },
        { status: 404 }
      )
    }

    // Buscar estabelecimentos atuais do usuário
    const currentEstablishmentIds = userData.establishmentIds || []
    
    // Verificar se o estabelecimento já está vinculado
    if (currentEstablishmentIds.includes(establishmentId)) {
      return NextResponse.json(
        { error: "Estabelecimento já está vinculado" },
        { status: 400 }
      )
    }

    // Adicionar novo estabelecimento à lista
    const newEstablishmentIds = [...currentEstablishmentIds, establishmentId]

    // Atualizar o usuário com o novo estabelecimento
    await updateDoc(doc(db, "users", userId), {
      establishmentIds: newEstablishmentIds,
      establishmentId, // Último estabelecimento vinculado
      updatedAt: new Date().toISOString()
    })

    return NextResponse.json({
      message: "Estabelecimento vinculado com sucesso"
    })

  } catch (error) {
    console.error("Erro ao vincular estabelecimento:", error)
    return NextResponse.json(
      { error: "Erro ao vincular estabelecimento" },
      { status: 500 }
    )
  }
}
