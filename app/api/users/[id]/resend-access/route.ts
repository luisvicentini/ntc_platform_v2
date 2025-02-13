import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { createTransport } from "nodemailer"
import { randomBytes } from "crypto"

const transporter = createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userRef = doc(db, "users", params.id)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    const userData = userSnap.data()

    // Gerar novo token de ativação
    const activationToken = randomBytes(32).toString("hex")
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // Token válido por 24h

    await updateDoc(userRef, {
      activationToken,
      activationTokenExpiresAt: expiresAt.toISOString(),
      updatedAt: new Date().toISOString()
    })

    // Enviar email de ativação
    const activationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/activate?token=${activationToken}`
    
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: userData.email,
      subject: "Ative sua conta na plataforma NTC",
      html: `
        <h1>Bem-vindo à plataforma NTC!</h1>
        <p>Você foi convidado para acessar a plataforma. Para ativar sua conta e definir sua senha, clique no link abaixo:</p>
        <p><a href="${activationUrl}">Ativar minha conta</a></p>
        <p>Este link é válido por 24 horas.</p>
        <p>Se você não solicitou este convite, por favor ignore este email.</p>
      `
    })

    return NextResponse.json({ message: "Email de ativação reenviado com sucesso" })

  } catch (error) {
    console.error("Erro ao reenviar acesso:", error)
    return NextResponse.json(
      { error: "Erro ao reenviar acesso" },
      { status: 500 }
    )
  }
}
