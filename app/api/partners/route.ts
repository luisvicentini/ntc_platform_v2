import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs } from "firebase/firestore"

export async function GET() {
  try {
    // Buscar todos os usuários que são parceiros
    const usersRef = collection(db, "users")
    const partnersQuery = query(usersRef, where("userType", "==", "partner"))
    const partnersSnapshot = await getDocs(partnersQuery)

    const partners = []

    for (const partnerDoc of partnersSnapshot.docs) {
      const partnerData = partnerDoc.data()

      // Buscar estabelecimentos do parceiro
      const establishmentsRef = collection(db, "establishments")
      const establishmentsQuery = query(establishmentsRef, where("partnerId", "==", partnerDoc.id))
      const establishmentsSnapshot = await getDocs(establishmentsQuery)
      const establishmentsCount = establishmentsSnapshot.size

      // Buscar membros dos estabelecimentos do parceiro
      let membersCount = 0
      const establishmentIds = establishmentsSnapshot.docs.map(doc => doc.id)
      
      if (establishmentIds.length > 0) {
        const membersRef = collection(db, "users")
        const membersQuery = query(
          membersRef, 
          where("userType", "==", "member"),
          where("establishmentId", "in", establishmentIds)
        )
        const membersSnapshot = await getDocs(membersQuery)
        membersCount = membersSnapshot.size
      }

      partners.push({
        id: partnerDoc.id,
        displayName: partnerData.displayName,
        email: partnerData.email,
        status: partnerData.status,
        establishments: establishmentsCount,
        members: membersCount,
        createdAt: partnerData.createdAt,
        updatedAt: partnerData.updatedAt
      })
    }

    return NextResponse.json(partners)

  } catch (error) {
    console.error("Erro ao buscar parceiros:", error)
    return NextResponse.json(
      { error: "Erro ao buscar parceiros" },
      { status: 500 }
    )
  }
}
