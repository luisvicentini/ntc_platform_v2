import { NextRequest, NextResponse } from "next/server"
import { collection, getDocs, addDoc, query, where, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { revalidateTag } from "next/cache"
import { CreateEstablishmentData } from "@/types/establishment"

// GET /api/establishments - Lista todos os estabelecimentos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const partnerId = searchParams.get("partnerId")

    const establishmentsRef = collection(db, "establishments")
    
    // Construir a query baseada nos parâmetros
    const queryConstraints = []
    if (partnerId) {
      queryConstraints.push(where("partnerId", "==", partnerId))
      queryConstraints.push(orderBy("createdAt", "desc"))
    }

    const establishmentsQuery = queryConstraints.length > 0
      ? query(establishmentsRef, ...queryConstraints)
      : establishmentsRef

    const snapshot = await getDocs(establishmentsQuery)
    const establishments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    return NextResponse.json(establishments)
  } catch (error) {
    console.error("Error fetching establishments:", error)
    return NextResponse.json(
      { error: "Failed to fetch establishments" },
      { status: 500 }
    )
  }
}

// POST /api/establishments - Cria um novo estabelecimento
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { partnerId, ...establishmentData }: { partnerId: string } & CreateEstablishmentData = data

    if (!partnerId) {
      return NextResponse.json(
        { error: "Partner ID is required" },
        { status: 400 }
      )
    }

    // Adicionar ao Firestore
    const docRef = await addDoc(collection(db, "establishments"), {
      ...establishmentData,
      partnerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      averageRating: 0,
      totalRatings: 0
    })

    // Revalidar os dados
    revalidateTag("establishments")

    return NextResponse.json({
      id: docRef.id,
      ...establishmentData,
      partnerId
    })
  } catch (error) {
    console.error("Error creating establishment:", error)
    return NextResponse.json(
      { error: "Failed to create establishment" },
      { status: 500 }
    )
  }
}
