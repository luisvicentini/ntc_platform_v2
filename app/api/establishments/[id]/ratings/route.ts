import { NextRequest, NextResponse } from "next/server"
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  runTransaction, 
  doc, 
  getDoc,
  DocumentData 
} from "firebase/firestore"
import { UserProfile } from "@/types/user"
import { db } from "@/lib/firebase"
import { revalidateTag } from "next/cache"

// GET /api/establishments/[id]/ratings - Lista todas as avaliações de um estabelecimento
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ratingsRef = collection(db, "establishments", params.id, "ratings")
    const ratingsQuery = query(ratingsRef, orderBy("createdAt", "desc"))
    const snapshot = await getDocs(ratingsQuery)

    const ratings = await Promise.all(
      snapshot.docs.map(async (ratingDoc) => {
        const data = ratingDoc.data()
        // Buscar informações do usuário que fez a avaliação
        const userRef = doc(db, "users", data.userId)
        const userDoc = await getDoc(userRef)
        const userData = userDoc.data() as UserProfile | undefined

        return {
          id: ratingDoc.id,
          ...data,
          userDisplayName: userData?.displayName || "Usuário",
          userPhotoURL: userData?.photoURL
        }
      })
    )

    return NextResponse.json(ratings)
  } catch (error) {
    console.error("Error fetching ratings:", error)
    return NextResponse.json(
      { error: "Failed to fetch ratings" },
      { status: 500 }
    )
  }
}

// POST /api/establishments/[id]/ratings - Adiciona uma nova avaliação
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, score, comment } = await request.json()

    if (!userId || typeof score !== "number" || score < 1 || score > 5) {
      return NextResponse.json(
        { error: "Invalid rating data" },
        { status: 400 }
      )
    }

    // Usar transação para atualizar a média e total de avaliações
    await runTransaction(db, async (transaction) => {
      const establishmentRef = doc(db, "establishments", params.id)
      const establishmentDoc = await transaction.get(establishmentRef)

      if (!establishmentDoc.exists()) {
        throw new Error("Establishment not found")
      }

      const establishmentData = establishmentDoc.data()
      const currentTotal = establishmentData.totalRatings || 0
      const currentAverage = establishmentData.averageRating || 0

      // Calcular nova média
      const newTotal = currentTotal + 1
      const newAverage = ((currentAverage * currentTotal) + score) / newTotal

      // Adicionar avaliação
      const ratingRef = doc(collection(db, "establishments", params.id, "ratings"))
      transaction.set(ratingRef, {
        userId,
        score,
        comment,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      // Atualizar estabelecimento
      transaction.update(establishmentRef, {
        totalRatings: newTotal,
        averageRating: newAverage,
        updatedAt: new Date().toISOString()
      })
    })

    // Revalidar os dados
    revalidateTag("establishments")
    revalidateTag(`establishment-${params.id}`)
    revalidateTag(`establishment-ratings-${params.id}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error creating rating:", error)
    return NextResponse.json(
      { error: "Failed to create rating" },
      { status: 500 }
    )
  }
}
