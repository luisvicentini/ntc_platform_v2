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
    const { email } = await request.json()
    console.log("Recebida solicitação de recuperação para email:", email)

    // Buscar usuário pelo email
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("email", "==", email.toLowerCase()))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      console.log("Email não encontrado:", email)
      return NextResponse.json(
        { error: "Email não encontrado" },
        { status: 404 }
      )
    }

    const userDoc = querySnapshot.docs[0]
    const userData = userDoc.data()
    
    // Log todos os campos do usuário para diagnóstico (exceto dados sensíveis)
    console.log("Usuário encontrado, campos disponíveis:", 
      Object.keys(userData).filter(k => !['password', 'resetPasswordToken'].includes(k))
    )
    console.log("Detalhes do usuário:", {
      id: userDoc.id,
      email: userData.email,
      uid: userData.uid || 'UID não encontrado',
      displayName: userData.displayName,
      userType: userData.userType,
      createdAt: userData.createdAt
    })

    // Verificar se temos o UID do Firebase Auth
    if (!userData.uid) {
      console.error("UID do usuário não encontrado em Firestore:", userDoc.id)
      
      // Em vez de falhar, tentaremos usar o ID do documento como UID
      console.log("Usando ID do documento como UID:", userDoc.id)
      
      // Atualizar o documento com o ID como UID
      await updateDoc(doc(db, "users", userDoc.id), {
        uid: userDoc.id,
        updatedAt: new Date().toISOString()
      })
      
      console.log("Documento atualizado com o UID:", userDoc.id)
      
      // Usar o ID do documento como UID daqui em diante
      userData.uid = userDoc.id
    }

    // Gerar token de recuperação
    const resetToken = randomBytes(32).toString("hex")
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1) // Token válido por 1h

    console.log("Token gerado:", resetToken.substring(0, 10) + "...", "Expira em:", expiresAt.toISOString())

    // Atualizar usuário com o token
    await updateDoc(doc(db, "users", userDoc.id), {
      resetPasswordToken: resetToken,
      resetPasswordTokenExpiresAt: expiresAt.toISOString(),
      updatedAt: new Date().toISOString()
    })

    console.log("Documento do usuário atualizado com token")

    // Enviar email de recuperação
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`
    
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: `Recuperação de Senha - ${process.env.NEXT_PUBLIC_APP_PROJECTNAME}`,
      html: `
        <h1>Recuperação de Senha</h1>
        <p>Você solicitou a recuperação de senha da sua conta na ${process.env.NEXT_PUBLIC_APP_PROJECTNAME}. Para definir uma nova senha, clique no link abaixo:</p>
        <p><a href="${resetUrl}">Redefinir minha senha</a></p>
        <p>Este link é válido por 1 hora.</p>
        <p>Se você não solicitou a recuperação de senha, por favor ignore este email.</p>
      `
    })

    console.log("Email de recuperação enviado para:", email)
    return NextResponse.json({ message: "Email de recuperação enviado com sucesso" })

  } catch (error: any) {
    console.error("Erro ao enviar email de recuperação:", error)
    return NextResponse.json(
      { error: `Erro ao enviar email de recuperação: ${error.message || "Erro desconhecido"}` },
      { status: 500 }
    )
  }
}
