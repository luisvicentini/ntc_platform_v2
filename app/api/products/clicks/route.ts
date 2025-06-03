import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore"

// Configurar cabeçalhos CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version, x-session-token, x-auth-uid, x-auth-email'
}

// Função para lidar com solicitações OPTIONS (preflight)
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

// Endpoint POST para registrar cliques
export async function POST(request: NextRequest) {
  try {
    console.log("API de cliques em produtos: Recebida solicitação POST")
    
    // Definir origem para CORS
    const origin = request.headers.get('origin') || '*'
    const customCorsHeaders = {
      ...corsHeaders,
      'Access-Control-Allow-Origin': origin
    }
    
    // Verificar se o Firebase está inicializado corretamente
    if (!db) {
      console.error("API de cliques em produtos: Erro crítico - Firestore não inicializado")
      return NextResponse.json(
        { error: "Erro de configuração do servidor" },
        { status: 500, headers: customCorsHeaders }
      )
    }
    
    // Extrair dados do corpo da requisição
    const data = await request.json()
    const { productId } = data
    
    if (!productId) {
      return NextResponse.json(
        { error: "ID do produto é obrigatório" },
        { status: 400, headers: customCorsHeaders }
      )
    }
    
    try {
      // Verificar se o produto existe
      const productRef = doc(db, "products", productId)
      const productSnap = await getDoc(productRef)
      
      if (!productSnap.exists()) {
        return NextResponse.json(
          { error: "Produto não encontrado" },
          { status: 404, headers: customCorsHeaders }
        )
      }
      
      // Referência para o documento de estatísticas
      const statsRef = doc(db, "product_stats", productId)
      const statsSnap = await getDoc(statsRef)
      
      if (!statsSnap.exists()) {
        // Se não existir estatísticas para este produto, criar novo documento
        await setDoc(statsRef, {
          productId,
          clickCount: 1,
          lastClickAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        })
      } else {
        // Se já existir, incrementar o contador
        await updateDoc(statsRef, {
          clickCount: increment(1),
          lastClickAt: new Date().toISOString()
        })
      }
      
      console.log(`API de cliques em produtos: Clique registrado para o produto ${productId}`)
      
      return NextResponse.json(
        { success: true, message: "Clique registrado com sucesso" },
        { status: 200, headers: customCorsHeaders }
      )
      
    } catch (dbError: any) {
      console.error("API de cliques em produtos: Erro ao acessar o Firestore:", dbError)
      
      return NextResponse.json(
        { 
          error: "Erro ao registrar clique no banco de dados",
          details: dbError.message,
          errorCode: dbError.code || "unknown"
        },
        { status: 500, headers: customCorsHeaders }
      )
    }
  } catch (error: any) {
    console.error("API de cliques em produtos: Erro geral na API:", error)
    
    return NextResponse.json(
      { error: "Erro ao processar solicitação", details: error.message },
      { status: 500, headers: corsHeaders }
    )
  }
}

// Endpoint GET para obter estatísticas de cliques
export async function GET(request: NextRequest) {
  try {
    console.log("API de cliques em produtos: Recebida solicitação GET")
    
    // Definir origem para CORS
    const origin = request.headers.get('origin') || '*'
    const customCorsHeaders = {
      ...corsHeaders,
      'Access-Control-Allow-Origin': origin
    }
    
    // Verificar se o Firebase está inicializado corretamente
    if (!db) {
      console.error("API de cliques em produtos: Erro crítico - Firestore não inicializado")
      return NextResponse.json(
        { error: "Erro de configuração do servidor" },
        { status: 500, headers: customCorsHeaders }
      )
    }
    
    // Extrair parâmetros da URL
    const url = new URL(request.url)
    const productId = url.searchParams.get('productId')
    
    if (productId) {
      // Obter estatísticas de um produto específico
      const statsRef = doc(db, "product_stats", productId)
      const statsSnap = await getDoc(statsRef)
      
      if (!statsSnap.exists()) {
        return NextResponse.json(
          { stats: { productId, clickCount: 0 } },
          { status: 200, headers: customCorsHeaders }
        )
      }
      
      return NextResponse.json(
        { stats: statsSnap.data() },
        { status: 200, headers: customCorsHeaders }
      )
    } else {
      // No futuro, implementar a lógica para obter todas as estatísticas
      // Atualmente retorna uma mensagem informando que o parâmetro é necessário
      return NextResponse.json(
        { error: "Parâmetro productId é necessário" },
        { status: 400, headers: customCorsHeaders }
      )
    }
  } catch (error: any) {
    console.error("API de cliques em produtos: Erro geral na API:", error)
    
    return NextResponse.json(
      { error: "Erro ao processar solicitação", details: error.message },
      { status: 500, headers: corsHeaders }
    )
  }
} 