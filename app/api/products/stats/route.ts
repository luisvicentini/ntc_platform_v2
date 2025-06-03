import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { db } from "@/lib/firebase"
import { collection, query, getDocs, doc, getDoc } from "firebase/firestore"

// Configurar cabeçalhos CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version, x-session-token, x-auth-uid, x-auth-email'
}

// Função para lidar com solicitações OPTIONS (preflight)
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

// Endpoint para buscar estatísticas de produtos
export async function GET(request: NextRequest) {
  try {
    console.log("API de estatísticas de produtos: Recebida solicitação GET")
    
    // Definir origem para CORS
    const origin = request.headers.get('origin') || '*'
    const customCorsHeaders = {
      ...corsHeaders,
      'Access-Control-Allow-Origin': origin
    }
    
    // Verificar se o Firebase está inicializado corretamente
    if (!db) {
      console.error("API de estatísticas de produtos: Erro crítico - Firestore não inicializado")
      return NextResponse.json(
        { error: "Erro de configuração do servidor", products: [] },
        { status: 500, headers: customCorsHeaders }
      )
    }
    
    try {
      // Obter todos os produtos ativos
      const productsRef = collection(db, "products")
      const productsSnapshot = await getDocs(query(productsRef))
      
      if (productsSnapshot.empty) {
        return NextResponse.json(
          { products: [] },
          { status: 200, headers: customCorsHeaders }
        )
      }
      
      // Obter estatísticas para cada produto
      const productsWithStats = await Promise.all(
        productsSnapshot.docs.map(async (docSnap) => {
          try {
            const product = {
              id: docSnap.id,
              ...docSnap.data()
            }
            
            // Buscar estatísticas de cliques
            const statsRef = doc(db, "product_stats", docSnap.id)
            const statsSnap = await getDoc(statsRef)
            
            const stats = statsSnap.exists()
              ? statsSnap.data()
              : { clickCount: 0, lastClickAt: null }
            
            return {
              ...product,
              stats: {
                clickCount: stats.clickCount || 0,
                lastClickAt: stats.lastClickAt || null
              }
            }
          } catch (error) {
            console.error(`Erro ao processar estatísticas para produto ${docSnap.id}:`, error)
            return {
              id: docSnap.id,
              ...docSnap.data(),
              stats: {
                clickCount: 0,
                lastClickAt: null
              }
            }
          }
        })
      )
      
      // Ordenar produtos por contagem de cliques (mais cliques primeiro)
      const sortedProducts = productsWithStats.sort((a, b) => {
        return (b.stats?.clickCount || 0) - (a.stats?.clickCount || 0)
      })
      
      return NextResponse.json(
        { products: sortedProducts },
        { status: 200, headers: customCorsHeaders }
      )
      
    } catch (dbError: any) {
      console.error("API de estatísticas de produtos: Erro ao acessar o Firestore:", dbError)
      
      return NextResponse.json(
        { 
          products: [],
          error: "Erro ao buscar estatísticas de produtos",
          details: dbError.message,
          errorCode: dbError.code || "unknown"
        },
        { status: 500, headers: customCorsHeaders }
      )
    }
  } catch (error: any) {
    console.error("API de estatísticas de produtos: Erro geral na API:", error)
    
    return NextResponse.json(
      { products: [], error: "Erro ao processar solicitação", details: error.message },
      { status: 500, headers: corsHeaders }
    )
  }
} 