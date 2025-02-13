import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { sign } from "jsonwebtoken"

const SECRET_KEY = process.env.NEXTAUTH_SECRET || "ntc-platform-secret-key"

export async function POST(request: Request) {
  try {
    const { user } = await request.json()

    // Criar token JWT
    const token = sign(
      {
        uid: user.uid,
        userType: user.userType,
        email: user.email,
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7 dias
      },
      SECRET_KEY
    )

    // Configurar cookie
    cookies().set("__session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: "/"
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao criar sessão:", error)
    return NextResponse.json(
      { error: "Erro ao criar sessão" },
      { status: 500 }
    )
  }
}
