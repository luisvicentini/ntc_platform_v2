import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { db } from "@/lib/firebase"
import { collection, query, where, orderBy, getDocs, getDoc, doc, Timestamp } from "firebase/firestore"

// Configurar cabeçalhos CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version'
};

// Função para lidar com solicitações OPTIONS (preflight)
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    // Definir origem para CORS
    const origin = request.headers.get('origin') || '*';
    const customCorsHeaders = {
      ...corsHeaders,
      'Access-Control-Allow-Origin': origin
    };
    
    // Verificar se o cookie de sessão ou token Authorization - mas não bloquear
    // Apenas para fins de log, permitimos acesso a qualquer usuário para visualizar stories
    const sessionCookie = request.cookies.get('__session');
    const authHeader = request.headers.get('authorization');
    
    let userId: string | null = null;
    
    // Tentar obter ID do usuário de várias fontes, mas continuar mesmo sem
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      userId = 'user_from_token'; // Simplificado para evitar erros de tipo
      console.log("Usando token de autorização");
    }
    
    if (!userId) {
      const xSessionToken = request.headers.get('x-session-token');
      userId = xSessionToken || 'anonymous';
      console.log(`Usuário anônimo ou token de sessão: ${userId}`);
    }
    
    // Verificar cookie de sessão para obter ID do usuário
    if (!userId && sessionCookie?.value) {
      try {
        // Verifica se o valor parece um token JWT (começa com "ey")
        if (sessionCookie.value.startsWith('ey')) {
          // É um token JWT, não um objeto JSON
          console.log("Cookie de sessão contém um token JWT");
          // Para stories, apenas registrar, não precisamos autenticar totalmente
          userId = 'user_from_jwt';
        } else {
          // Tenta processar como JSON
          const sessionData = JSON.parse(sessionCookie.value);
          if (sessionData.user && (sessionData.user.uid || sessionData.user.id)) {
            userId = sessionData.user.uid || sessionData.user.id;
            console.log("ID do usuário obtido do cookie de sessão:", userId);
          }
        }
      } catch (error) {
        console.warn("Erro ao analisar cookie de sessão:", error);
      }
    }
    
    console.log("Iniciando busca de stories ativos");
    
    // Query para obter stories ativos e não expirados
    const now = new Date();
    const storiesRef = collection(db, "stories");
    
    // Consulta simplificada para evitar necessidade de índice composto
    const storiesQuery = query(
      storiesRef,
      where("status", "==", "active")
    );
    
    const storiesSnapshot = await getDocs(storiesQuery);
    console.log(`Encontrados ${storiesSnapshot.size} stories`);
    
    // Array para armazenar os dados completos dos stories
    const storiesData = [];
    
    // Processar cada story
    for (const storyDoc of storiesSnapshot.docs) {
      const storyData = storyDoc.data();
      const storyId = storyDoc.id;
      
      console.log(`Processando story ${storyId}`);
      
      // Formatar a data de expiração
      const expiresAt = storyData.expiresAt instanceof Timestamp
        ? storyData.expiresAt.toDate()
        : new Date(storyData.expiresAt);
      
      // Verificar se o story já expirou
      const now = new Date();
      if (expiresAt < now) {
        console.log(`Story ${storyDoc.id} já expirou, pulando`);
        continue; // Pular stories expirados
      }
      
      let establishmentData = null;
      
      // Se o story estiver vinculado a um estabelecimento, buscar dados do estabelecimento
      if (storyData.establishmentId) {
        const establishmentRef = doc(db, "establishments", storyData.establishmentId);
        const establishmentSnapshot = await getDoc(establishmentRef);
        
        if (establishmentSnapshot.exists()) {
          establishmentData = {
            id: establishmentSnapshot.id,
            ...establishmentSnapshot.data()
          };
        }
      }
      
      // Formatar a data de criação
      const createdAt = storyData.createdAt instanceof Timestamp
        ? storyData.createdAt.toDate()
        : new Date(storyData.createdAt);
      
      // Calcular dias restantes
      const msInDay = 24 * 60 * 60 * 1000;
      const daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / msInDay));
      
      // Verificar valores do story
      console.log(`Story ${storyId} - URL: ${storyData.mediaUrl || storyData.imageUrl}, Tipo: ${storyData.mediaType || "image"}`);
      
      // Adicionar story processado ao array
      storiesData.push({
        id: storyId, // Adicionar ID do documento
        ...storyData,
        createdAt,
        expiresAt,
        daysRemaining,
        // Garantir que durationDays existe (para compatibilidade com stories antigos)
        durationDays: storyData.durationDays || 1,
        linkedEstablishment: establishmentData,
        // Garantir que mediaType existe (para compatibilidade com stories antigos)
        mediaType: storyData.mediaType || "image",
        // Garantir compatibilidade com o campo legado imageUrl
        mediaUrl: storyData.mediaUrl || storyData.imageUrl,
        // Adicionar dados de reações se existirem
        reactions: storyData.reactions || { likes: 0, dislikes: 0, hearts: 0, fires: 0 },
        // Incluir a reação do usuário atual, se existir
        userReaction: storyData.userReactions && storyData.userReactions[userId || 'anonymous']
      });
    }
    
    // Ordenar stories por data de criação (mais recentes primeiro)
    storiesData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    console.log(`Retornando ${storiesData.length} stories ativos`);
    
    // Retornar os dados com cabeçalhos CORS
    return NextResponse.json({
      stories: storiesData
    }, { headers: customCorsHeaders });
  } catch (error: any) {
    console.error("Erro ao buscar stories:", error);
    console.error("Detalhes do erro:", {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack?.substring(0, 200)
    });
    
    return NextResponse.json(
      { 
        error: "Erro ao buscar stories", 
        details: error.message,
        code: error.code 
      },
      { status: 500, headers: corsHeaders }
    );
  }
} 