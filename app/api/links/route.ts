import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'

// Interface para os dados dos links
interface PartnerLink {
  id: string
  partnerId?: string
  code?: string
  name?: string
  priceId?: string
  price?: number
  createdAt?: string
  updatedAt?: string
  checkoutType?: string
  paymentMethod?: string
  lastlinkUrl?: string
  [key: string]: any
}

export async function GET(request: Request) {
  try {
    // Simplificamos a autenticação - o contexto de autenticação já garante que
    // apenas usuários autenticados chegam aqui
    
    // Pegar parâmetros da requisição
    const url = new URL(request.url)
    const partnerId = url.searchParams.get('partnerId')
    const paymentMethod = url.searchParams.get('payment_method')
    
    // Buscar todos os links da coleção partnerLinks
    const linksRef = collection(db, 'partnerLinks')
    let linksQuery = query(linksRef)
    
    // Se tiver um partnerId, filtrar por ele
    if (partnerId) {
      linksQuery = query(linksRef, where('partnerId', '==', partnerId))
    }
    
    // Executar a consulta base
    const querySnapshot = await getDocs(linksQuery)
    
    // Filtrar os resultados manualmente
    let links: PartnerLink[] = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    // Se o filtro for para lastlink, filtrar manualmente
    if (paymentMethod === 'lastlink') {
      links = links.filter(link => {
        // Verificar se possui algum dos indicadores de que é um link do Lastlink
        return (
          link.checkoutType === 'lastlink' || 
          (link.priceId && link.priceId.startsWith('lastlink_')) ||
          link.paymentMethod === 'lastlink' ||
          link.lastlinkUrl
        )
      })
    }
    
    // Ordenar por data de criação (mais recente primeiro)
    links.sort((a, b) => {
      // Verificar se createdAt existe e é válido
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0)
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0)
      
      return dateB.getTime() - dateA.getTime()
    })
    
    return NextResponse.json({
      links,
      total: links.length
    })
  } catch (error) {
    console.error('Erro ao listar links:', error)
    return NextResponse.json(
      { error: 'Erro interno ao listar links' },
      { status: 500 }
    )
  }
} 