import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, addDoc, query, where, getDocs, doc, updateDoc, increment, serverTimestamp, getDoc, orderBy, limit, deleteDoc, setDoc } from "firebase/firestore"
import { randomBytes } from "crypto"
import { createTransport } from "nodemailer"

// Configurar o transporter para envio de emails
const transporter = createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

// Função para enviar email de ativação
async function sendActivationEmail(email: string, name: string, token: string) {
  try {
    // URL para ativação de conta
    const activationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/activate-account?token=${token}`
    
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: `Ativação de Conta - ${process.env.NEXT_PUBLIC_APP_PROJECTNAME}`,
      html: `
        <h1>Bem-vindo(a) ${name}!</h1>
        <p>Sua conta na ${process.env.NEXT_PUBLIC_APP_PROJECTNAME} foi criada com sucesso após seu pagamento.</p>
        <p>Para ativar sua conta e definir sua senha, clique no link abaixo:</p>
        <p><a href="${activationUrl}" style="background-color: #10b981; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">Ativar minha conta</a></p>
        <p>Este link é válido por 24 horas.</p>
        <p>Se você não solicitou esta conta, por favor ignore este email.</p>
      `
    })
    
    console.log("Email de ativação enviado para:", email)
    return true
  } catch (error) {
    console.error("Erro ao enviar email de ativação:", error)
    return false
  }
}

// Definição do parceiro padrão
const DEFAULT_PARTNER_ID = "t0daqXpfxg3M1nm6v1vB"

// Interface para os eventos do Lastlink
interface LastlinkEventData {
  event?: string
  Event?: string
  IsTest?: boolean
  Data?: any
  Buyer?: {
    Id?: string
    Email?: string
    Name?: string
    PhoneNumber?: string
    Document?: string
    Address?: any
  }
  Products?: Array<{
    Id?: string
    Name?: string
  }>
  Subscriptions?: Array<{
    Id?: string
    ProductId?: string
    CanceledDate?: string
    CancellationReason?: string
    ExpiredDate?: string
  }>
  Purchase?: {
    PaymentId?: string
    Recurrency?: number
    PaymentDate?: string
    ChargebackDate?: string
    OriginalPrice?: { Value?: number }
    Price?: { Value?: number }
    Payment?: {
      NumberOfInstallments?: number
      PaymentMethod?: string
    }
    Affiliate?: any
    Pix?: any
    BankSlip?: any
    Metadata?: {
      partnerId?: string
      partnerLinkId?: string
      [key: string]: any
    }
  }
  Seller?: {
    Id?: string
    Email?: string
  }
  Offer?: {
    Id?: string
    Name?: string
    Url?: string
  }
  [key: string]: any
}

// Interface para os dados de assinatura da Lastlink
interface LastlinkSubscription {
  Id?: string
  ProductId?: string
  CanceledDate?: string
  CancellationReason?: string
  ExpiredDate?: string
}

export async function POST(request: Request) {
  try {
    console.log("========= INÍCIO DO PROCESSAMENTO DO WEBHOOK PARA CRIAÇÃO DE USUÁRIO =========")
    
    // Log dos headers para diagnóstico
    const headers = Object.fromEntries(request.headers.entries())
    console.log("Cabeçalho da requisição:", headers)
    console.log("URL do webhook:", request.url)
    console.log("Método:", request.method)
    
    // Verificar token da Lastlink (pode ser implementado mais tarde)
    const lastlinkToken = headers['x-lastlink-token']
    
    // Por enquanto, aceitar todos os webhooks sem verificação
    console.log("Webhook aceito sem verificação de token")
    
    // Extrair conteúdo do webhook
    const text = await request.text()
    console.log("Corpo da requisição (texto):", text)
    
    // Decodificar JSON
    const rawData = JSON.parse(text) as LastlinkEventData
    console.log("Webhook Lastlink recebido (decodificado):", JSON.stringify(rawData))
    
    // Verificar se os dados estão dentro de um campo "Data" ou diretamente no objeto
    let actualData: LastlinkEventData = { ...rawData }
    
    // Extrair dados do formato correto (pode estar dentro do campo Data)
    if (rawData.Data && typeof rawData.Data === 'object') {
      console.log("Dados encontrados dentro do campo 'Data'")
      
      // Verificar se o objeto Data tem os campos necessários
      const dataObj = rawData.Data as LastlinkEventData
      
      // Extrair dados diretamente do objeto Data se existirem
      actualData.Buyer = dataObj.Buyer || actualData.Buyer
      actualData.Products = dataObj.Products || actualData.Products
      actualData.Purchase = dataObj.Purchase || actualData.Purchase
      actualData.Subscriptions = dataObj.Subscriptions || actualData.Subscriptions
      actualData.Offer = dataObj.Offer || actualData.Offer
      actualData.Seller = dataObj.Seller || actualData.Seller
      actualData.Event = dataObj.Event || actualData.Event || actualData.event
      
      console.log("Dados mesclados de Data:", 
        "Buyer:", !!actualData.Buyer, 
        "Products:", !!actualData.Products, 
        "Purchase:", !!actualData.Purchase)
    }
    
    // Extrair tipo de evento
    const eventType = actualData.Event || actualData.event || 'Purchase_Order_Confirmed'
    console.log("Tipo de evento (extraído):", eventType)
    
    // Ignorar eventos de teste
    if (actualData.IsTest) {
      console.log("Webhook de teste ignorado")
      return NextResponse.json({ status: 'success', message: 'Webhook de teste recebido' })
    }
    
    // Extrair dados úteis
    const products = actualData.Products || []
    const buyer = actualData.Buyer || {}
    const purchase = actualData.Purchase || {}
    const subscriptions = actualData.Subscriptions || [] as LastlinkSubscription[]
    
    console.log("Dados extraídos:")
    console.log("- Produtos:", products)
    console.log("- Comprador:", buyer)
    console.log("- Compra:", purchase)
    console.log("- Assinaturas:", subscriptions)
    
    // Verificar dados críticos antes de continuar
    if (!buyer) {
      console.error("Dados do comprador não encontrados no webhook")
      return NextResponse.json({ status: 'error', message: 'Dados do comprador não encontrados' }, { status: 400 })
    }
    
    // Obter dados para identificação do parceiro
    let partnerId = DEFAULT_PARTNER_ID
    let partnerLinkId = null
    
    // Tente obter informações de afiliado se disponíveis
    if (purchase.Affiliate && purchase.Affiliate.Id) {
      console.log("Informações de afiliado encontradas:", purchase.Affiliate)
      // Tente mapear o afiliado para um partnerId se necessário
      // Por enquanto, usamos o ID padrão
    }
    
    // Tente obter informações da UTM se disponíveis
    if (actualData.Utm) {
      console.log("Informações de UTM encontradas:", actualData.Utm)
      // Aqui podemos adicionar lógica para rastrear origem via UTM
    }
    
    const userEmail = buyer.Email
    const userName = buyer.Name || ''
    const userPhone = buyer.PhoneNumber || ''
    const userDocument = buyer.Document || ''
    const userAddress = buyer.Address || null
    
    if (!userEmail) {
      console.error("Email do usuário não fornecido no webhook")
      console.error("Estrutura do objeto buyer:", JSON.stringify(buyer))
      console.error("Estrutura completa dos dados:", JSON.stringify(actualData))
      return NextResponse.json({ status: 'error', message: 'Email do usuário não fornecido' }, { status: 400 })
    }
    
    console.log("Dados para identificação:")
    console.log("- partnerId:", partnerId)
    console.log("- userEmail:", userEmail)
    console.log("- userName:", userName)
    console.log("- userDocument:", userDocument)
    
    // Verificar se o usuário já existe pelo email
    let userId = null
    let userExists = false
    const usersRef = collection(db, 'users')
    const q = query(usersRef, where('email', '==', userEmail.toLowerCase()))
    const snapshot = await getDocs(q)
    
    if (!snapshot.empty) {
      // Usuário já existe
      userId = snapshot.docs[0].id
      userExists = true
      console.log(`Usuário já existe no sistema. ID: ${userId}`)
    } else {
      // Criar novo usuário
      console.log("Criando novo usuário no sistema")
      
      // Criar uma referência ao documento do novo usuário
      const newUserRef = doc(usersRef)
      const now = new Date()
      
      const newUserData = {
        id: newUserRef.id,
        uid: newUserRef.id, // Duplicando o ID para compatibilidade
        email: userEmail.toLowerCase(),
        displayName: userName,
        phoneNumber: userPhone,
        document: userDocument,
        address: userAddress,
        buyerId: buyer.Id || null, // ID do comprador na Lastlink
        userType: 'member',
        status: 'active', // Ativo imediatamente (não precisa de confirmação)
        isActive: true,
        emailVerified: false,
        partnerId: partnerId,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        // Campos adicionais específicos para controle
        createdVia: 'lastlink-webhook',
        lastlinkPurchaseId: purchase.PaymentId || null
      }
      
      try {
        // Usar setDoc em vez de addDoc, seguindo o padrão da rota de registro
        console.log(`Tentando criar usuário com ID: ${newUserRef.id}`)
        await setDoc(newUserRef, newUserData)
        userId = newUserRef.id
        console.log(`Novo usuário criado com sucesso. ID: ${userId}`)
      } catch (error) {
        console.error("Erro ao criar usuário:", error)
        return NextResponse.json({ status: 'error', message: 'Erro ao criar usuário' }, { status: 500 })
      }
    }
    
    // Neste ponto, temos o userId (novo ou existente)
    
    // Determinar dados do plano
    let planName = "Plano Premium"
    if (products.length > 0 && products[0].Name) {
      planName = products[0].Name
    }
    
    let planInterval = "month"
    let planIntervalCount = 1
    
    if (purchase.Recurrency) {
      if (purchase.Recurrency == 12) {
        planInterval = "year"
        planIntervalCount = 1
      } else if (purchase.Recurrency == 6) {
        planInterval = "semester"
        planIntervalCount = 1
      } else if (purchase.Recurrency == 3) {
        planInterval = "quarter"
        planIntervalCount = 1
      } else {
        planInterval = "month"
        planIntervalCount = purchase.Recurrency || 1
      }
    }
    
    // Verificar se já existe uma transação com o mesmo orderId
    let existingTransaction: { id: string; [key: string]: any } | null = null;
    if (purchase.PaymentId) {
      const transactionsRef = collection(db, 'transactions')
      const q = query(transactionsRef, where('orderId', '==', purchase.PaymentId))
      const snapshot = await getDocs(q)
      
      if (!snapshot.empty) {
        existingTransaction = {
          id: snapshot.docs[0].id,
          ...snapshot.docs[0].data() as { [key: string]: any }
        }
        console.log(`Transação existente encontrada: ${existingTransaction.id}`)
      }
    }
    
    // Se já existe uma transação e não é um evento de confirmação, simplesmente atualizar
    if (existingTransaction && eventType !== 'Purchase_Order_Confirmed' && eventType !== 'Purchase_Request_Confirmed') {
      console.log("Transação já existe e evento não é de confirmação, apenas atualizando")
      await updateDoc(doc(db, 'transactions', existingTransaction.id), {
        userId: userId,
        partnerId: partnerId,
        partnerLinkId: partnerLinkId,
        updatedAt: new Date().toISOString()
      })
      
      return NextResponse.json({ 
        status: 'success', 
        message: 'Webhook processado, transação atualizada',
        userId: userId,
        transactionId: existingTransaction.id
      })
    }
    
    // Criar objeto da transação
    const now = new Date()
    const transactionData = {
      orderId: purchase.PaymentId || '',
      amount: purchase.Price?.Value || 0,
      paymentMethod: purchase.Payment?.PaymentMethod || '',
      installments: purchase.Payment?.NumberOfInstallments || 1,
      paidAt: purchase.PaymentDate || now.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
      planName,
      planInterval,
      planIntervalCount,
      userId,
      userEmail,
      userName: buyer.Name || '',
      partnerId,
      partnerLinkId,
      status: 'active',
      type: 'lastlink',
      provider: 'lastlink',
      rawData: JSON.stringify(text), // Convertendo para string para evitar problemas
      buyerId: buyer.Id || null,
      affiliateId: purchase.Affiliate?.Id || null,
      affiliateEmail: purchase.Affiliate?.Email || null,
      subscriptionIds: subscriptions.map((sub: LastlinkSubscription) => sub.Id) || [],
      // Verificar se utmParams existe antes de adicioná-lo
      ...(actualData.Utm ? { utmParams: actualData.Utm } : {})
    }
    
    console.log("Salvando transação no banco de dados:", transactionData)
    
    // Salvar transação
    let transactionId
    if (existingTransaction) {
      transactionId = existingTransaction.id
      await updateDoc(doc(db, 'transactions', existingTransaction.id), transactionData)
      console.log(`Transação existente atualizada: ${transactionId}`)
    } else {
      // Criar uma referência para o documento da transação
      const transactionsRef = collection(db, 'transactions')
      const newTransactionRef = doc(transactionsRef)
      
      // Adicionar ID ao objeto da transação
      const transactionWithId = {
        ...transactionData,
        id: newTransactionRef.id
      }
      
      // Usar setDoc para criar a transação com ID específico
      await setDoc(newTransactionRef, transactionWithId)
      transactionId = newTransactionRef.id
      console.log(`Nova transação criada: ${transactionId}`)
    }
    
    // Verificar se o usuário já tem uma assinatura ativa com este parceiro
    const subscriptionsRef = collection(db, 'subscriptions')
    const subscriptionQuery = query(
      subscriptionsRef,
      where('userId', '==', userId),
      where('partnerId', '==', partnerId),
      where('status', '==', 'active')
    )
    const subscriptionSnapshot = await getDocs(subscriptionQuery)
    
    let subscriptionId
    if (!subscriptionSnapshot.empty) {
      // Atualizar assinatura existente
      subscriptionId = subscriptionSnapshot.docs[0].id
      const subscriptionRef = doc(db, 'subscriptions', subscriptionId)
      
      await updateDoc(subscriptionRef, {
        transactionId,
        updatedAt: now.toISOString(),
        planName,
        planInterval,
        planIntervalCount,
        price: purchase.Price?.Value || 0,
        paymentMethod: purchase.Payment?.PaymentMethod || 'pix',
        provider: 'lastlink',
        lastlinkSubscriptionIds: subscriptions.map((sub: LastlinkSubscription) => sub.Id) || [],
        lastlinkBuyerId: buyer.Id || null
      })
      
      console.log(`Assinatura existente atualizada: ${subscriptionId}`)
    } else {
      // Criar nova assinatura
      const newSubscriptionRef = doc(subscriptionsRef)
      
      const subscriptionData = {
        id: newSubscriptionRef.id,
        userId,
        memberId: userId,
        partnerId,
        partnerLinkId,
        transactionId,
        planName,
        planInterval,
        planIntervalCount,
        price: purchase.Price?.Value || 0,
        startDate: now.toISOString(),
        endDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 ano
        status: 'active',
        paymentMethod: purchase.Payment?.PaymentMethod || 'pix',
        provider: 'lastlink',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        type: 'lastlink',
        userEmail: userEmail,
        lastlinkSubscriptionIds: subscriptions.map((sub: LastlinkSubscription) => sub.Id) || [],
        lastlinkBuyerId: buyer.Id || null
      }
      
      await setDoc(newSubscriptionRef, subscriptionData)
      subscriptionId = newSubscriptionRef.id
      console.log(`Nova assinatura criada: ${subscriptionId}`)
      
      // Incrementar contagem de conversões do link se tiver partnerLinkId
      if (partnerLinkId) {
        try {
          const linkRef = doc(db, 'partnerLinks', partnerLinkId)
          await updateDoc(linkRef, {
            conversions: increment(1),
            updatedAt: now.toISOString()
          })
          console.log(`Incrementada conversão do link ${partnerLinkId}`)
        } catch (error) {
          console.error("Erro ao incrementar conversões do link:", error)
        }
      }
    }
    
    // Atualizar o usuário para garantir que o partnerId está correto
    if (userExists) {
      await updateDoc(doc(db, 'users', userId), {
        partnerId: partnerId,
        updatedAt: now.toISOString()
      })
      console.log(`Usuário ${userId} atualizado com partnerId ${partnerId}`)
    }
    
    // ADICIONADO: Criar ou atualizar registro na coleção memberPartners
    try {
      console.log("Verificando registro existente em memberPartners...")
      const memberPartnersRef = collection(db, "memberPartners")
      const mpQuery = query(
        memberPartnersRef,
        where("memberId", "==", userId),
        where("partnerId", "==", partnerId)
      )
      
      const mpSnapshot = await getDocs(mpQuery)
      
      if (mpSnapshot.empty) {
        console.log("Criando novo registro em memberPartners")
        // Criar novo registro
        const memberPartnerData = {
          memberId: userId,
          userId: userId, // Adicionando userId também para ter os dois campos
          partnerId: partnerId,
          status: "active",
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          expiresAt: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 ano
          transactionId: transactionId,
          userEmail: userEmail.toLowerCase(),
          planName: planName,
          planInterval: planInterval,
          planIntervalCount: planIntervalCount,
          price: purchase.Price?.Value || 0,
          provider: 'lastlink',
          type: 'lastlink',
          startDate: now.toISOString()
        }
        
        await addDoc(memberPartnersRef, memberPartnerData)
        console.log("Registro criado em memberPartners com sucesso")
      } else {
        console.log("Atualizando registro existente em memberPartners")
        // Atualizar registro existente
        const mpDoc = mpSnapshot.docs[0]
        await updateDoc(doc(memberPartnersRef, mpDoc.id), {
          status: "active",
          updatedAt: now.toISOString(),
          expiresAt: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          transactionId: transactionId
        })
        console.log("Registro atualizado em memberPartners com sucesso")
      }
    } catch (error) {
      console.error("Erro ao criar/atualizar registro em memberPartners:", error)
      // Não interrompe o fluxo principal em caso de erro
    }
    
    // ADICIONADO: Enviar email de ativação para o usuário
    try {
      console.log("Preparando para enviar email de ativação para o usuário:", userEmail)
      
      // Gerar token de ativação
      const resetToken = randomBytes(32).toString("hex")
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24) // Token válido por 24h
      
      // Atualizar o documento do usuário com o token
      await updateDoc(doc(db, 'users', userId), {
        resetPasswordToken: resetToken,
        resetPasswordTokenExpiresAt: expiresAt.toISOString(),
        updatedAt: now.toISOString()
      })
      
      console.log("Token de ativação gerado:", resetToken.substring(0, 10) + "...")
      
      // Enviar o email com o token
      const emailSent = await sendActivationEmail(
        userEmail,
        userName || "Usuário",
        resetToken
      )
      
      if (emailSent) {
        console.log("Email de ativação enviado com sucesso para:", userEmail)
      } else {
        console.warn("Falha ao enviar email de ativação para:", userEmail)
      }
    } catch (emailError) {
      console.error("Erro ao processar envio de email de ativação:", emailError)
      // Não interrompe o fluxo principal em caso de erro no email
    }
    
    console.log("========= FIM DO PROCESSAMENTO DO WEBHOOK =========")
    
    return NextResponse.json({ 
      status: 'success', 
      message: 'Webhook processado com sucesso',
      userId: userId,
      userCreated: !userExists,
      transactionId: transactionId,
      subscriptionId: subscriptionId
    })
  } catch (error) {
    console.error("Erro ao processar webhook:", error)
    return NextResponse.json({ status: 'error', message: 'Erro ao processar webhook' }, { status: 500 })
  }
}

// Função para construir resposta com cabeçalhos CORS
function corsResponse(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-lastlink-token',
    },
  })
}

// Handler para Options (preflight CORS)
export async function OPTIONS() {
  return corsResponse({})
} 