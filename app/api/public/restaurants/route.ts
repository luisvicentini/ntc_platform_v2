import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, limit, orderBy } from "firebase/firestore"

// Cache simples para armazenar os resultados por até 30 minutos
let cachedData: { 
  establishments: any[]; 
  timestamp: number; 
  count: number;
} | null = null;

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos em milissegundos

export async function GET() {
  try {
    console.log("==== API PÚBLICA DE RESTAURANTES ====")
    console.log("Iniciando busca de estabelecimentos públicos")
    console.log("Timestamp:", new Date().toISOString())
    
    // Verificar se há dados em cache válidos
    const now = Date.now();
    if (cachedData && (now - cachedData.timestamp) < CACHE_DURATION) {
      console.log(`Usando dados em cache de ${new Date(cachedData.timestamp).toISOString()}`)
      console.log(`Cache válido por mais ${Math.floor((CACHE_DURATION - (now - cachedData.timestamp)) / 1000)} segundos`)
      console.log(`Retornando ${cachedData.count} estabelecimentos do cache`)
      
      return NextResponse.json({
        establishments: cachedData.establishments,
        count: cachedData.count,
        source: "cache",
        cachedAt: new Date(cachedData.timestamp).toISOString(),
        timestamp: new Date().toISOString()
      })
    }
    
    console.log("Cache inválido ou não encontrado, buscando dados frescos")
    
    // Verificar se o objeto db está disponível
    if (!db) {
      console.error("Erro crítico: objeto db do Firestore não disponível")
      throw new Error("Configuração do Firestore não disponível")
    }
    
    // Verificar tipo do objeto db para garantir que é uma instância válida
    if (typeof db !== 'object' || db === null) {
      console.error("Erro crítico: objeto db não é um objeto válido:", typeof db)
      throw new Error("Instância Firestore inválida")
    }
    
    console.log("Referência ao Firestore obtida com sucesso")
    
    // Tratar possíveis erros com try/catch específico para operações do Firestore
    let establishmentsRef;
    try {
      establishmentsRef = collection(db, "establishments")
      console.log("Coleção de estabelecimentos referenciada:", "establishments")
    } catch (error) {
      console.error("Erro ao acessar coleção 'establishments':", error)
      throw new Error("Falha ao acessar coleção no Firestore")
    }
    
    // Remover o filtro de isActive e usar apenas limit e ordenação
    let establishmentsQuery;
    try {
      establishmentsQuery = query(
        establishmentsRef,
        orderBy("name"), // Ordenar por nome
        limit(100) // Limitar resultados para evitar sobrecarga
      )
    } catch (error) {
      console.error("Erro ao construir query:", error)
      throw new Error("Falha ao criar query para o Firestore")
    }
    
    console.log("Query montada, executando no Firestore...")
    let snapshot;
    try {
      snapshot = await getDocs(establishmentsQuery)
      console.log(`Firestore retornou resposta com ${snapshot.docs.length} documentos`)
    } catch (error) {
      console.error("Erro ao executar query no Firestore:", error)
      throw new Error("Falha ao buscar dados no Firestore")
    }
    
    if (snapshot.empty) {
      console.warn("Nenhum estabelecimento encontrado na coleção")
    }
    
    // Processar os resultados
    const establishments = snapshot.docs.map(doc => {
      const data = doc.data()
      
      // Log para depuração mais detalhado do discountValue (alterado de discountvalue)
      console.log(`Firestore data for ${doc.id} (${data.name || 'Sem nome'}): discountValue =`, data.discountValue, `(Type: ${typeof data.discountValue})`);
      
      // Log para depuração
      console.log(`Processando estabelecimento: ${doc.id} (${data.name || 'Sem nome'})`)
      
      // Verificar se há dados críticos faltando
      if (!data.name) {
        console.warn(`Estabelecimento ${doc.id} sem nome definido`)
      }
      
      if (!data.images || !Array.isArray(data.images) || data.images.length === 0) {
        console.warn(`Estabelecimento ${doc.id} sem imagens ou formato inválido`)
      }
      
      // Retornar apenas os dados necessários para a exibição pública
      return {
        id: doc.id,
        name: data.name || "Nome não disponível",
        images: Array.isArray(data.images) ? data.images : [],
        type: {
          type: data.type?.type || data.establishmentType || "Restaurante",
          category: data.type?.category || data.establishmentCategory || "Outros",
        },
        address: {
          city: data.address?.city || "Cidade não informada",
          state: data.address?.state || "UF",
        },
        partnerId: data.partnerId || "",
        partnerName: data.partnerName || "",
        isFeatured: data.isFeatured || false,
        rating: data.rating || 0,
        discountvalue: data.discountValue || 0
      }
    })
    
    // Atualizar o cache
    cachedData = {
      establishments,
      count: establishments.length,
      timestamp: now
    }
    
    console.log(`API retornando ${establishments.length} estabelecimentos processados`)
    console.log("Cache atualizado com sucesso")
    console.log("==== FIM DA EXECUÇÃO ====")
    
    return NextResponse.json({
      establishments,
      count: establishments.length,
      source: "firestore",
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("ERRO CRÍTICO ao buscar estabelecimentos:", error)
    
    // Extrair informações mais detalhadas do erro
    const errorDetails = {
      message: error instanceof Error ? error.message : "Erro desconhecido",
      stack: error instanceof Error ? error.stack : null,
      timestamp: new Date().toISOString()
    }
    
    console.error("Detalhes do erro:", JSON.stringify(errorDetails, null, 2))
    
    // Verificar se temos dados em cache, mesmo desatualizados, para usar como fallback
    if (cachedData) {
      console.log("Usando cache expirado como fallback devido ao erro")
      
      return NextResponse.json({
        establishments: cachedData.establishments,
        count: cachedData.count,
        source: "expired_cache",
        cachedAt: new Date(cachedData.timestamp).toISOString(),
        error: "Dados podem estar desatualizados devido a um erro na atualização",
        timestamp: new Date().toISOString()
      })
    }
    
    return NextResponse.json(
      { 
        error: "Falha ao buscar estabelecimentos", 
        message: errorDetails.message,
        timestamp: errorDetails.timestamp
      },
      { status: 500 }
    )
  }
} 