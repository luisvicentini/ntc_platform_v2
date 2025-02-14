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
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .button { 
                display: inline-block; 
                padding: 12px 24px; 
                background-color: #7435db; 
                color: white; 
                text-decoration: none; 
                border-radius: 4px;
                margin: 20px 0;
              }
              .footer { margin-top: 30px; font-size: 14px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Bem-vindo à plataforma NTC!</h1>
              </div>
              
              <p>Olá ${userData.displayName},</p>
              
              <p>Você foi convidado para acessar a plataforma NTC como <strong>${
                userData.userType === "master" ? "Usuário Master" :
                userData.userType === "partner" ? "Parceiro" :
                userData.userType === "member" ? "Membro" :
                userData.userType === "business" ? "Business" : "Usuário"
              }</strong>.</p>
              
              <p>Para ativar sua conta e definir sua senha, clique no botão abaixo:</p>
              
              <div style="text-align: center;">
                <a href="${activationUrl}" class="button">Ativar minha conta</a>
              </div>
              
              <p><strong>Importante:</strong> Este link é válido por 24 horas.</p>
              
              <div class="footer">
                <p>Se você não solicitou este convite, por favor ignore este email.</p>
                <p>Este é um email automático, não responda.</p>
              </div>
            </div>
          </body>
        </html>
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
