import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where, writeBatch, doc } from "firebase/firestore"
import { jwtDecode } from "jwt-decode"
import { createTransport } from "nodemailer"
import type { SessionToken } from "@/types/session"

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
        { error: "Apenas administradores podem vincular Assinantes a parceiros" },
        { status: 403 }
      )
    }

    const { subscriptions } = await request.json() as { subscriptions: SubscriptionRequest[] }

    if (!subscriptions?.length) {
      return NextResponse.json(
        { error: "Nenhuma assinatura fornecida" },
        { status: 400 }
      )
    }

    const memberId = subscriptions[0].memberId

    // Verificar se o Assinante existe
    const membersRef = collection(db, "users")
    const memberDoc = doc(membersRef, memberId)
    const memberSnapshot = await getDocs(query(membersRef, where("__name__", "==", memberId)))

    if (memberSnapshot.empty) {
      return NextResponse.json(
        { error: "Assinante não encontrado" },
        { status: 404 }
      )
    }

    const memberData = memberSnapshot.docs[0].data()

    // Verificar se os parceiros existem e criar um mapa de dados dos parceiros
    const partnerIds = Array.from(new Set(subscriptions.map(s => s.partnerId)))
    const partnersSnapshot = await getDocs(query(membersRef, where("__name__", "in", partnerIds)))
    
    const partnerDataMap = new Map()
    partnersSnapshot.docs.forEach(doc => {
      partnerDataMap.set(doc.id, doc.data())
    })

    // Verificar se todos os parceiros são válidos
    const invalidPartners = partnerIds.filter(id => !partnerDataMap.has(id))
    if (invalidPartners.length > 0) {
      return NextResponse.json(
        { error: `Parceiros não encontrados: ${invalidPartners.join(", ")}` },
        { status: 400 }
      )
    }

    // Criar assinaturas em lote
    const batch = writeBatch(db)
    const subscriptionsRef = collection(db, "subscriptions")

    // Desativar assinaturas existentes
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

    // Criar novas assinaturas
    for (const subscription of subscriptions) {
      const newSubscriptionRef = doc(subscriptionsRef)
      batch.set(newSubscriptionRef, {
        memberId: subscription.memberId,
        partnerId: subscription.partnerId,
        status: "active",
        expiresAt: subscription.expiresAt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    }

    // Executar o batch
    await batch.commit()

    // Enviar emails de notificação (opcional, pode ser movido para um job separado)
    try {
      if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        const transporter = createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT),
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        })

        for (const subscription of subscriptions) {
          const partnerData = partnerDataMap.get(subscription.partnerId)
          await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: memberData.email,
            subject: "Nova Assinatura Ativada - NTC",
            html: `
              <h1>Nova Assinatura Ativada</h1>
              <p>Olá ${memberData.displayName},</p>
              <p>Sua assinatura com ${partnerData.displayName} foi ativada.</p>
              ${subscription.expiresAt ? 
                `<p>Esta assinatura expira em: ${new Date(subscription.expiresAt).toLocaleDateString('pt-BR')}</p>` 
                : ''}
            `
          })
        }
      }
    } catch (emailError) {
      console.error("Erro ao enviar emails:", emailError)
      // Não falhar a operação se o envio de email falhar
    }

    return NextResponse.json({ 
      message: "Assinaturas atualizadas com sucesso",
      success: true 
    })

  } catch (error) {
    console.error("Erro ao criar assinaturas:", error)
    return NextResponse.json(
      { 
        error: "Erro ao criar assinaturas",
        details: error instanceof Error ? error.message : "Erro desconhecido"
      },
      { status: 500 }
    )
  }
}
