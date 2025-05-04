import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore"

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
    
    // Verificar a senha na query para autorização (simples)
    const { searchParams } = new URL(request.url);
    const password = searchParams.get('password');
    
    // Senha simples para proteger este endpoint (deve ser mais seguro em produção)
    if (password !== "NTCstoriesfixer") {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401, headers: customCorsHeaders }
      );
    }
    
    // Verificar se é para executar a correção ou apenas relatório
    const dryRun = searchParams.get('dryRun') === 'true';
    
    // Array para armazenar resultados
    const results = {
      storiesWithPlaceholder: 0,
      storiesFixed: 0,
      details: [] as any[]
    };
    
    // Buscar todos os stories ativos
    const storiesRef = collection(db, "stories");
    const storiesQuery = query(
      storiesRef,
      where("status", "==", "active")
    );
    
    const storiesSnapshot = await getDocs(storiesQuery);
    
    // Obter o host atual para usar nas URLs absolutas
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    
    // Verificar cada story
    for (const storyDoc of storiesSnapshot.docs) {
      const storyData = storyDoc.data();
      const mediaUrl = storyData.mediaUrl || '';
      
      // Verificar se é URL de placeholder
      const isPlaceholder = 
        mediaUrl.includes('placehold.co') || 
        mediaUrl.includes('placeholder');
      
      if (isPlaceholder) {
        results.storiesWithPlaceholder++;
        
        // Adicionar aos detalhes
        results.details.push({
          id: storyDoc.id,
          mediaUrl,
          userName: storyData.userName,
          mediaType: storyData.mediaType,
          createdAt: storyData.createdAt?.toDate?.() || storyData.createdAt
        });
        
        // Se não for apenas simulação, corrigir o story
        if (!dryRun) {
          // Definir uma URL de fallback para imagem real - usando imagens locais
          const newMediaUrl = storyData.mediaType === 'image'
            ? `${protocol}://${host}/images/default-story-image.jpg`
            : `${protocol}://${host}/images/default-story-video.mp4`;
            
          // Atualizar o story no banco de dados
          await updateDoc(doc(db, "stories", storyDoc.id), {
            mediaUrl: newMediaUrl,
            __fixedPlaceholder: true, // Marcar como corrigido
            __fixedAt: new Date()
          });
          
          results.storiesFixed++;
        }
      }
    }
    
    // Retornar resultados
    return NextResponse.json({
      success: true,
      mode: dryRun ? "relatório (sem alterações)" : "correção aplicada",
      totalStories: storiesSnapshot.size,
      results
    }, { headers: customCorsHeaders });
    
  } catch (error: any) {
    console.error("Erro ao corrigir stories:", error);
    
    return NextResponse.json(
      { 
        error: "Erro ao processar stories", 
        details: error.message,
        code: error.code 
      },
      { status: 500, headers: corsHeaders }
    );
  }
} 