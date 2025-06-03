import { NextRequest, NextResponse } from "next/server"
import { doc, updateDoc, getDoc, collection, query, where, getDocs, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { revalidateTag } from "next/cache"
import { UpdateUserProfileData } from "@/types/user"

// GET /api/user/profile - Obtém os dados do perfil do usuário
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    console.log("Buscando perfil para o usuário ID:", userId)

    // Primeiro, tenta buscar pelo ID do documento
    const userRef = doc(db, "users", userId)
    const userDoc = await getDoc(userRef)

    // Se encontrou o documento
    if (userDoc.exists()) {
      const userData = userDoc.data()
      console.log("Perfil encontrado pelo ID do documento:", userData.email)
      return NextResponse.json({
        id: userDoc.id,
        ...userData
      })
    }

    // Se não encontrou pelo ID do documento, pode ser um caso onde o UID do Firebase Auth é diferente
    // Vamos tentar buscar documentos onde o campo uid corresponde ao userId fornecido
    const usersCollection = collection(db, "users")
    const q = query(usersCollection, where("uid", "==", userId), limit(1))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      const userData = querySnapshot.docs[0].data()
      console.log("Perfil encontrado pelo campo uid:", userData.email)
      return NextResponse.json({
        id: querySnapshot.docs[0].id,
        ...userData
      })
    }

    // Se chegou aqui, não encontrou o usuário em nenhum dos casos
    console.log("Usuário não encontrado com ID ou UID:", userId)
    return NextResponse.json(
      { error: "User not found" },
      { status: 404 }
    )
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    )
  }
}

// PATCH /api/user/profile - Atualiza os dados do perfil do usuário
export async function PATCH(request: NextRequest) {
  try {
    const data = await request.json()
    const { userId, ...updateData }: { userId: string } & UpdateUserProfileData = data

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    // Atualizar no Firestore
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      ...updateData,
      updatedAt: new Date().toISOString()
    })

    // Buscar dados atualizados
    const userDoc = await getDoc(userRef)
    const userData = userDoc.data()

    // Revalidar os dados
    revalidateTag("user")
    revalidateTag(`user-${userId}`)
    revalidateTag("profile")

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        ...userData
      }
    })
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    )
  }
}
