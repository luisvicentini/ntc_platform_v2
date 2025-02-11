import { NextRequest, NextResponse } from "next/server"
import { doc, updateDoc, getDoc } from "firebase/firestore"
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

    const userRef = doc(db, "users", userId)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const userData = userDoc.data()
    return NextResponse.json(userData)
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
