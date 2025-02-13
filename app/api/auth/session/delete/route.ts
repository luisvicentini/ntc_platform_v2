import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    // Remover o cookie de sessão
    cookies().delete("__session")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao remover sessão:", error)
    return NextResponse.json(
      { error: "Erro ao remover sessão" },
      { status: 500 }
    )
  }
}
