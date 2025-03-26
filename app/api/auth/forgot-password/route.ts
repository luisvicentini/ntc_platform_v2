import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore"
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

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    // Buscar usuário pelo email
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("email", "==", email))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return NextResponse.json(
        { error: "Email não encontrado" },
        { status: 404 }
      )
    }

    const userDoc = querySnapshot.docs[0]
    const userData = userDoc.data()

    // Gerar token de recuperação
    const resetToken = randomBytes(32).toString("hex")
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1) // Token válido por 1h

    // Atualizar usuário com o token
    await updateDoc(doc(db, "users", userDoc.id), {
      resetPasswordToken: resetToken,
      resetPasswordTokenExpiresAt: expiresAt.toISOString(),
      updatedAt: new Date().toISOString()
    })

    // Enviar email de recuperação
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`
    
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: "Recuperação de Senha - Clube Não Tem Chef",
      html: `
        <h1>Recuperação de Senha</h1>
        <p>Você solicitou a recuperação de senha da sua conta na Clube Não Tem Chef. Para definir uma nova senha, clique no link abaixo:</p>
        <p><a href="${resetUrl}">Redefinir minha senha</a></p>
        <p>Este link é válido por 1 hora.</p>
        <p>Se você não solicitou a recuperação de senha, por favor ignore este email.</p>
      `
    })

    return NextResponse.json({ message: "Email de recuperação enviado com sucesso" })

  } catch (error) {
    console.error("Erro ao enviar email de recuperação:", error)
    return NextResponse.json(
      { error: "Erro ao enviar email de recuperação" },
      { status: 500 }
    )
  }
}
