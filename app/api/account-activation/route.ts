import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from "firebase/firestore"
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
    const { email, name } = await request.json()
    console.log("Recebida solicitação de ativação de conta para email:", email)

    // Buscar usuário pelo email
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("email", "==", email.toLowerCase()))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      console.log("Email não encontrado, criando novo usuário:", email)
      
      // Criar novo usuário com email e nome
      const newUserRef = doc(collection(db, "users"))
      const resetToken = randomBytes(32).toString("hex")
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24) // Token válido por 24h
      
      const userData = {
        email: email.toLowerCase(),
        displayName: name || "Novo Usuário",
        userType: "member",
        createdAt: new Date().toISOString(),
        resetPasswordToken: resetToken,
        resetPasswordTokenExpiresAt: expiresAt.toISOString(),
        activated: false
      }
      
      await updateDoc(newUserRef, userData)
      console.log("Novo usuário criado com ID:", newUserRef.id)
      
      // Enviar email de ativação
      await sendActivationEmail(email, name || "Novo Usuário", resetToken)
      
      return NextResponse.json({ 
        message: "Email de ativação enviado com sucesso",
        isNewUser: true
      })
    }

    // Usuário já existe, enviar email de ativação
    const userDoc = querySnapshot.docs[0]
    const userData = userDoc.data()
    
    console.log("Usuário encontrado, enviando email de ativação para:", userDoc.id)
    
    // Gerar token de ativação
    const resetToken = randomBytes(32).toString("hex")
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // Token válido por 24h

    // Atualizar usuário com o token
    await updateDoc(doc(db, "users", userDoc.id), {
      resetPasswordToken: resetToken,
      resetPasswordTokenExpiresAt: expiresAt.toISOString(),
      updatedAt: new Date().toISOString(),
      activated: false
    })

    // Enviar email de ativação
    await sendActivationEmail(email, userData.displayName || name || "Usuário", resetToken)

    return NextResponse.json({ message: "Email de ativação enviado com sucesso" })

  } catch (error: any) {
    console.error("Erro ao enviar email de ativação:", error)
    return NextResponse.json(
      { error: `Erro ao enviar email de ativação: ${error.message || "Erro desconhecido"}` },
      { status: 500 }
    )
  }
}

async function sendActivationEmail(email: string, name: string, token: string) {
  // URL para ativação de conta
  const activationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/activate-account?token=${token}`
  
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: `Ativação de Conta - ${process.env.NEXT_PUBLIC_APP_PROJECTNAME}`,
    html: `
      <h1>Bem-vindo(a) ${name}!</h1>
      <p>Sua conta na ${process.env.NEXT_PUBLIC_APP_PROJECTNAME} foi criada com sucesso.</p>
      <p>Para ativar sua conta e definir sua senha, clique no link abaixo:</p>
      <p><a href="${activationUrl}" style="background-color: #10b981; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">Ativar minha conta</a></p>
      <p>Este link é válido por 24 horas.</p>
      <p>Se você não solicitou esta conta, por favor ignore este email.</p>
    `
  })
  
  console.log("Email de ativação enviado para:", email)
} 