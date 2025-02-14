import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where, orderBy, limit, startAfter } from "firebase/firestore"
import { jwtDecode } from "jwt-decode"
import type { SessionToken } from "@/types/session"
import type { UserProfile } from "@/types/user"

export async function GET(request: Request) {
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

    // Apenas master pode listar usuários
    if (session.userType !== "master") {
      return NextResponse.json(
        { error: "Acesso não autorizado" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userType = searchParams.get("userType")
    const page = parseInt(searchParams.get("page") || "1")
    const perPage = parseInt(searchParams.get("perPage") || "10")

    // Construir query
    const usersRef = collection(db, "users")
    let userQuery = query(usersRef)

    // Adicionar filtro por tipo se especificado
    if (userType) {
      userQuery = query(userQuery, where("userType", "==", userType))
    }

    // Buscar todos os usuários
    const usersSnapshot = await getDocs(userQuery)
    const allUsers = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as UserProfile[]

    // Ordenar por data de criação (mais recentes primeiro)
    allUsers.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    // Calcular paginação
    const total = allUsers.length
    const totalPages = Math.ceil(total / perPage)
    const startIndex = (page - 1) * perPage
    const endIndex = startIndex + perPage
    const paginatedUsers = allUsers.slice(startIndex, endIndex)

    let establishmentsMap = new Map()
    let partnersMap = new Map()

    // Buscar dados dos estabelecimentos para usuários business
    const businessUsers = paginatedUsers
      .filter(user => user.userType === "business" && (user.establishmentId || (user.establishmentIds && user.establishmentIds.length > 0)))

    if (businessUsers.length > 0) {
      // Coletar todos os IDs de estabelecimentos únicos
      const establishmentIdsSet = new Set<string>()
      businessUsers.forEach(user => {
        if (user.establishmentId) establishmentIdsSet.add(user.establishmentId)
        if (user.establishmentIds) user.establishmentIds.forEach(id => establishmentIdsSet.add(id))
      })
      const establishmentIds = Array.from(establishmentIdsSet)
      const establishmentsRef = collection(db, "establishments")
      
      // Buscar estabelecimentos um por um para evitar erro de array vazio
      for (const establishmentId of establishmentIds) {
        if (!establishmentId) continue
        const establishmentDoc = await getDocs(query(establishmentsRef, where("__name__", "==", establishmentId)))
        if (!establishmentDoc.empty) {
          const doc = establishmentDoc.docs[0]
          establishmentsMap.set(doc.id, {
            id: doc.id,
            name: doc.data().name
          })
        }
      }
    }

    // Buscar dados dos parceiros para usuários member
    const memberUsers = paginatedUsers
      .filter(user => user.userType === "member" && user.partnerId)

    if (memberUsers.length > 0) {
      const partnerIds = memberUsers.map(user => user.partnerId)
      const partnersRef = collection(db, "users")
      
      // Buscar parceiros um por um para evitar erro de array vazio
      for (const partnerId of partnerIds) {
        if (!partnerId) continue
        const partnerDoc = await getDocs(query(partnersRef, where("__name__", "==", partnerId)))
        if (!partnerDoc.empty) {
          const doc = partnerDoc.docs[0]
          partnersMap.set(doc.id, {
            id: doc.id,
            name: doc.data().displayName
          })
        }
      }
    }

    // Mapear usuários com dados relacionados
    const users = paginatedUsers.map(user => {
      // Adicionar dados do estabelecimento se for business
      if (user.userType === "business") {
        const establishments = (user.establishmentIds || [])
          .map(id => establishmentsMap.get(id))
          .filter(Boolean)

        if (establishments.length > 0) {
          const lastEstablishment = establishmentsMap.get(user.establishmentId || establishments[0].id)
          return {
            ...user,
            establishment: lastEstablishment ? {
              id: lastEstablishment.id,
              name: lastEstablishment.name
            } : undefined,
            establishments: establishments.map(est => ({
              id: est.id,
              name: est.name
            }))
          }
        }
      }

      // Adicionar dados do parceiro se for member
      if (user.userType === "member" && user.partnerId) {
        const partner = partnersMap.get(user.partnerId)
        if (partner) {
          return {
            ...user,
            partner: {
              id: partner.id,
              name: partner.name
            }
          }
        }
      }

      return user
    })

    return NextResponse.json({
      users,
      total,
      page,
      perPage,
      totalPages
    })

  } catch (error) {
    console.error("Erro ao listar usuários:", error)
    return NextResponse.json(
      { error: "Erro ao listar usuários" },
      { status: 500 }
    )
  }
}
