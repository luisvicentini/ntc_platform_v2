import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, query, getDocs, getDoc, doc, where, Timestamp } from "firebase/firestore"
import { jwtDecode } from "jwt-decode"
import type { SessionToken } from "@/types/session"

export async function GET(request: Request) {
  try {
    const sessionToken = request.headers.get("x-session-token")
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: "Sessão inválida" },
        { status: 403 }
      )
    }

    const session = jwtDecode<SessionToken>(sessionToken)
    console.log("[DEBUG] ID do usuário membro:", session.uid)

    // Buscar usuário para verificar permissões
    const usersRef = collection(db, "users")
    const userQuery = query(usersRef)
    const userSnap = await getDocs(userQuery)
    
    // Encontrar o usuário com o UID correspondente
    const userDoc = userSnap.docs.find(doc => 
      doc.data().firebaseUid === session.uid || doc.id === session.uid
    )
    
    if (!userDoc) {
      console.log("[DEBUG] Usuário não encontrado")
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    const userData = userDoc.data()
    console.log("[DEBUG] Dados do usuário:", userData)

    // Verificar se o usuário tem permissão de produtor de conteúdo
    const isContentProducer = 
      userData.isContentProducer === true || 
      userData.role === "contentProducer" || 
      userData.role === "admin" ||
      (userData.roles && (
        userData.roles.includes("contentProducer") || 
        userData.roles.includes("admin")
      ));

    if (!isContentProducer) {
      console.log("[DEBUG] Usuário não tem permissão de produtor de conteúdo")
      return NextResponse.json(
        { error: "Acesso não autorizado" },
        { status: 403 }
      )
    }

    // Definir data de início (06/05/2025)
    const startDate = new Date('2025-05-06T00:00:00.000Z')
    const startTimestamp = Timestamp.fromDate(startDate)

    // Buscar vouchers a partir da data especificada
    const vouchersRef = collection(db, "vouchers")
    const vouchersQuery = query(
      vouchersRef,
      where("createdAt", ">=", startTimestamp)
    )
    const vouchersSnap = await getDocs(vouchersQuery)
    
    console.log(`[DEBUG] Total de vouchers encontrados: ${vouchersSnap.size}`)
    
    // Processar todos os vouchers e adicionar dados do membro e estabelecimento
    const allVouchers = await Promise.all(
      vouchersSnap.docs.map(async (docSnapshot) => {
        const data = docSnapshot.data()
        
        try {
          // Buscar dados do membro
          let memberData = {}
          if (data.memberId) {
            const memberRef = doc(db, "users", data.memberId)
            const memberDoc = await getDoc(memberRef)
            memberData = memberDoc.exists() ? memberDoc.data() : {}
          }
          
          // Buscar dados do estabelecimento
          let establishmentData = {}
          if (data.establishmentId) {
            const establishmentRef = doc(db, "establishments", data.establishmentId)
            const establishmentDoc = await getDoc(establishmentRef)
            establishmentData = establishmentDoc.exists() ? establishmentDoc.data() : {}
          }
          
          return {
            id: docSnapshot.id,
            ...data,
            member: {
              id: data.memberId,
              name: memberData.displayName || "Usuário não encontrado",
              phone: memberData.phone || "Não informado",
              photoURL: memberData.photoURL,
              email: memberData.email || "Não informado"
            },
            establishment: {
              id: data.establishmentId,
              name: establishmentData.name || "Estabelecimento não encontrado"
            }
          }
        } catch (err) {
          console.error("[DEBUG] Erro ao processar voucher:", err)
          return {
            id: docSnapshot.id,
            ...data,
            member: {
              id: data.memberId,
              name: "Erro ao carregar dados",
              phone: "Não informado",
              email: "Não informado"
            },
            establishment: {
              id: data.establishmentId,
              name: "Erro ao carregar dados"
            }
          }
        }
      })
    )

    console.log("[DEBUG] Processados todos os vouchers")

    return NextResponse.json({ 
      vouchers: allVouchers.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    })

  } catch (error) {
    console.error("[DEBUG] Erro ao buscar vouchers:", error)
    return NextResponse.json(
      { error: "Erro ao buscar vouchers" },
      { status: 500 }
    )
  }
}