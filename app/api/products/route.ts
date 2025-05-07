import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore"

/**
 * NOTA IMPORTANTE SOBRE ÍNDICES NO FIREBASE
 * 
 * Para que a consulta original funcione (com where + orderBy), é necessário criar um 
 * índice composto no Firebase. Siga essas instruções precisas:
 * 
 * 1. Acesse o Console do Firebase: https://console.firebase.google.com
 * 2. Selecione seu projeto "ntc-platform"
 * 3. No menu lateral, clique em "Firestore Database"
 * 4. Clique na aba "Índices"
 * 5. Clique em "Adicionar índice"
 * 6. Configure o índice:
 *    - Coleção: products
 *    - Campos:
 *      - isActive (Ordem: Ascendente)
 *      - createdAt (Ordem: Descendente)
 *    - Nome da consulta: deixe em branco (automático)
 * 7. Clique em "Criar índice"
 * 8. Aguarde alguns minutos até o status mudar para "Habilitado"
 * 
 * Após o índice estar ativo, remova a solução temporária e descomente a consulta original.
 */

// Configurar cabeçalhos CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version, x-session-token, x-auth-uid, x-auth-email'
}

// Função para lidar com solicitações OPTIONS (preflight)
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET(request: NextRequest) {
  try {
    console.log("API de produtos: Recebida solicitação GET")
    
    // Extrair cabeçalhos de autenticação (para log, mas não mais necessários para acesso)
    const sessionToken = request.headers.get('x-session-token') || ""
    const authUid = request.headers.get('x-auth-uid') || ""
    const authEmail = request.headers.get('x-auth-email') || ""

    // Log dos dados de autenticação (parcial para segurança)
    console.log("API de produtos: Dados de autenticação recebidos:", {
      hasSessionToken: !!sessionToken,
      hasAuthUid: !!authUid,
      authEmail: authEmail ? `${authEmail.substring(0, 3)}...` : "não fornecido"
    })
    
    // Definir origem para CORS
    const origin = request.headers.get('origin') || '*'
    const customCorsHeaders = {
      ...corsHeaders,
      'Access-Control-Allow-Origin': origin
    }
    
    // Verificar se o Firebase está inicializado corretamente
    if (!db) {
      console.error("API de produtos: Erro crítico - Firestore não inicializado")
      return NextResponse.json(
        { error: "Erro de configuração do servidor", products: [] },
        { status: 500, headers: customCorsHeaders }
      )
    }
    
    try {
      // Obter produtos ativos - sem verificar autenticação, sempre retorna produtos ativos
      console.log("API de produtos: Consultando banco de dados...")
      
      // Construção da query mais segura
      const productsRef = collection(db, "products")
      
      // SOLUÇÃO TEMPORÁRIA: Simplificar a query para não precisar de índice composto
      // Primeiro obter todos os produtos ativos sem ordenação (não requer índice)
      const productsQuery = query(
        productsRef,
        where("isActive", "==", true),
        limit(50) // Aumentando o limite para compensar a falta de ordenação
      )
      
      const querySnapshot = await getDocs(productsQuery)
      console.log(`API de produtos: Encontrados ${querySnapshot.size} documentos`)
      
      // Mapear os produtos com tratamento de erros
      const products = []
      for (const doc of querySnapshot.docs) {
        try {
          const data = doc.data()
          products.push({
            id: doc.id,
            name: data.name || "",
            description: data.description || "",
            image: data.image || "",
            mediaType: data.mediaType || "image",
            voucher: data.voucher || "",
            validUntil: data.validUntil || null,
            link: data.link || "",
            phone: data.phone || null,
            createdAt: data.createdAt || null,
            partnerId: data.partnerId || ""
          })
        } catch (docError) {
          console.error(`API de produtos: Erro ao processar documento ${doc.id}:`, docError)
          // Continua para o próximo documento
        }
      }
      
      console.log(`API de produtos: Processados ${products.length} produtos do banco de dados`)
      
      // ADICIONAL: Ordenar produtos manualmente pelo lado do servidor
      // já que removemos o orderBy da consulta
      products.sort((a, b) => {
        // Tentar comparar as datas de criação (do mais recente para o mais antigo)
        try {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
          return dateB - dateA // Ordenação decrescente
        } catch (err) {
          console.warn("Erro ao ordenar produtos por data:", err)
          return 0
        }
      })
      
      // Limitar a 20 produtos após ordenação manual
      const limitedProducts = products.slice(0, 20)
      
      // Filtrar apenas produtos válidos (não expirados)
      const now = new Date()
      const validProducts = limitedProducts.filter(product => {
        // Se não tiver data de validade, consideramos válido
        if (!product.validUntil) return true
        
        try {
          const validUntil = new Date(product.validUntil)
          return validUntil > now
        } catch (error) {
          // Em caso de erro ao processar a data, mantemos o produto
          console.warn(`API de produtos: Erro ao processar data de validade para produto ${product.id}`, error)
          return true
        }
      })
      
      console.log(`API de produtos: ${validProducts.length} produtos válidos após filtragem de data`)
      
      return NextResponse.json({ products: validProducts }, { 
        status: 200, 
        headers: customCorsHeaders
      })
    } catch (dbError: any) {
      console.error("API de produtos: Erro ao realizar consulta no Firestore:", dbError)
      
      // Retornar uma lista vazia em vez de erro para não quebrar a UI
      return NextResponse.json(
        { 
          products: [], 
          error: "Erro ao buscar produtos do banco de dados",
          details: dbError.message,
          errorCode: dbError.code || "unknown"
        },
        { status: 200, headers: customCorsHeaders }
      )
    }
  } catch (error: any) {
    console.error("API de produtos: Erro geral na API:", error)
    
    // Retornar uma lista vazia em vez de erro para não quebrar a UI
    return NextResponse.json(
      { products: [], error: "Erro ao processar solicitação", details: error.message },
      { status: 200, headers: corsHeaders }
    )
  }
} 