import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, addDoc, getDocs, query, where, writeBatch, doc } from "firebase/firestore"
import { jwtDecode } from "jwt-decode"
import { createTransport } from "nodemailer"
import type { SessionToken } from "@/types/session"

const transporter = createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

interface SubscriptionRequest {
  memberId: string
  partnerId: string
  expiresAt?: string
  status: "active" | "inactive"
}

export async function POST(request: Request) {
  try {
    const sessionToken = request.headers.get("x-session-token")
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: "Sessão inválida" },
        { status: 403 }
      )
    }

    // Decodificar o token
    const session = jwtDecode<SessionToken>(sessionToken)

    // Apenas usuários master podem criar assinaturas
    if (session.userType !== "master") {
      return NextResponse.json(
        { error: "Apenas administradores podem vincular membros a parceiros" },
        { status: 403 }
      )
    }

    const { subscriptions } = await request.json() as { subscriptions: SubscriptionRequest[] }

    if (!subscriptions.length) {
      return NextResponse.json(
        { error: "Nenhuma assinatura fornecida" },
        { status: 400 }
      )
    }

    const memberId = subscriptions[0].memberId

    // Verificar se o membro existe
    const membersRef = collection(db, "users")
    const memberSnapshot = await getDocs(query(membersRef, where("__name__", "==", memberId)))

    if (memberSnapshot.empty) {
      return NextResponse.json(
        { error: "Membro não encontrado" },
        { status: 404 }
      )
    }

    const memberData = memberSnapshot.docs[0].data()
    if (memberData.userType !== "member") {
      return NextResponse.json(
        { error: "Usuário não é um membro" },
        { status: 400 }
      )
    }

    // Verificar se os parceiros existem
    const partnerIds = Array.from(new Set(subscriptions.map(s => s.partnerId)))
    const partnersQuery = query(membersRef, where("__name__", "in", partnerIds))
    const partnersSnapshot = await getDocs(partnersQuery)

    const validPartnerIds = partnersSnapshot.docs
      .filter(doc => doc.data().userType === "partner")
      .map(doc => doc.id)

    if (validPartnerIds.length !== partnerIds.length) {
      return NextResponse.json(
        { error: "Um ou mais parceiros não encontrados" },
        { status: 400 }
      )
    }

    // Criar assinaturas em lote
    const batch = writeBatch(db)
    const subscriptionsRef = collection(db, "subscriptions")

    // Primeiro, desativar todas as assinaturas existentes do membro
    const existingQuery = query(
      subscriptionsRef,
      where("memberId", "==", memberId),
      where("status", "==", "active")
    )
    const existingSnapshot = await getDocs(existingQuery)
    
    existingSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        status: "inactive",
        updatedAt: new Date().toISOString()
      })
    })

    // Depois, criar as novas assinaturas
    subscriptions.forEach(subscription => {
      const newDocRef = doc(collection(db, "subscriptions"))
      batch.set(newDocRef, {
        ...subscription,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    })

    await batch.commit()

    // Buscar dados do parceiro
    const partnerSnapshot = await getDocs(query(membersRef, where("__name__", "==", subscriptions[0].partnerId)))
    const partnerData = partnerSnapshot.docs[0].data()

    // Enviar email de boas-vindas
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: memberData.email,
      subject: "Bem-vindo à plataforma NTC!",
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
              .highlight { color: #7435db; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Bem-vindo à plataforma NTC!</h1>
              </div>
              
              <p>Olá ${memberData.displayName},</p>
              
              <p>Você foi vinculado como membro ao parceiro <span class="highlight">${partnerData.displayName}</span>.</p>
              
              <p>Com esta assinatura, você terá acesso a todos os benefícios oferecidos por este parceiro${
                subscriptions[0].expiresAt 
                  ? ` até ${new Date(subscriptions[0].expiresAt).toLocaleDateString("pt-BR")}`
                  : ""
              }.</p>
              
              <p>Para acessar sua conta e começar a aproveitar os benefícios, clique no botão abaixo:</p>
              
              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/auth/member" class="button">Acessar minha conta</a>
              </div>
              
              <div class="footer">
                <p>Se você não reconhece esta atividade, por favor ignore este email.</p>
                <p>Este é um email automático, não responda.</p>
              </div>
            </div>
          </body>
        </html>
      `
    })

    return NextResponse.json({ message: "Assinaturas atualizadas com sucesso" })

  } catch (error) {
    console.error("Erro ao criar assinaturas:", error)
    return NextResponse.json(
      { error: "Erro ao criar assinaturas" },
      { status: 500 }
    )
  }
}
