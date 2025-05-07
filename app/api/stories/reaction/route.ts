import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, increment } from "firebase/firestore"

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

export async function POST(request: NextRequest) {
  try {
    // Definir origem para CORS
    const origin = request.headers.get('origin') || '*';
    const customCorsHeaders = {
      ...corsHeaders,
      'Access-Control-Allow-Origin': origin
    };
    
    // Verificar autenticação pelo cookie, token de sessão ou header de autorização
    const sessionCookie = request.cookies.get('__session');
    const authHeader = request.headers.get('authorization');
    const sessionToken = request.headers.get('x-session-token');
    const userIdHeader = request.headers.get('x-session-user-id');
    
    // Obter ID do usuário de alguma fonte disponível
    let userId: string | null = null;
    
    // Extrair ID do usuário do token de autenticação, se disponível
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Em um ambiente de produção, deveria verificar o token
      // Aqui apenas registramos que o token está presente
      userId = 'user_from_token';
      console.log("Token de autorização presente");
    }
    
    // Extrair ID do usuário do cookie de sessão, se disponível
    if (!userId && sessionCookie?.value) {
      try {
        const sessionData = JSON.parse(sessionCookie.value);
        if (sessionData.user && (sessionData.user.uid || sessionData.user.id)) {
          userId = sessionData.user.uid || sessionData.user.id;
          console.log("ID do usuário obtido do cookie de sessão:", userId);
        }
      } catch (error) {
        console.warn("Erro ao analisar cookie de sessão:", error);
      }
    }
    
    // Extrair ID do usuário do token de sessão ou header específico, se disponível
    if (!userId) {
      userId = userIdHeader || sessionToken || 'anonymous';
      console.log("ID do usuário obtido de cabeçalho ou token de sessão:", userId);
    }
    
    // Obter dados do request
    const requestData = await request.json();
    const { storyId, reaction } = requestData;
    
    // Validações básicas
    if (!storyId) {
      return NextResponse.json(
        { error: "ID do story é obrigatório" },
        { status: 400, headers: customCorsHeaders }
      );
    }
    
    if (!reaction || !['like', 'dislike', 'heart', 'fire'].includes(reaction)) {
      return NextResponse.json(
        { error: "Reação inválida. Deve ser 'like', 'dislike', 'heart' ou 'fire'" },
        { status: 400, headers: customCorsHeaders }
      );
    }
    
    // Verificar se o story existe
    const storyRef = doc(db, "stories", storyId);
    const storySnapshot = await getDoc(storyRef);
    
    if (!storySnapshot.exists()) {
      return NextResponse.json(
        { error: "Story não encontrado" },
        { status: 404, headers: customCorsHeaders }
      );
    }
    
    const storyData = storySnapshot.data();
    
    // Verificar se o story já expirou
    const expiresAt = storyData.expiresAt?.toDate ? storyData.expiresAt.toDate() : new Date(storyData.expiresAt);
    const now = new Date();
    
    if (expiresAt < now) {
      return NextResponse.json(
        { error: "Este story já expirou e não pode mais receber reações" },
        { status: 400, headers: customCorsHeaders }
      );
    }
    
    // Conjunto de campos de reação
    const reactionFields = {
      like: 'likes',
      dislike: 'dislikes',
      heart: 'hearts',
      fire: 'fires'
    };
    
    // Obter a reação atual do usuário (se houver)
    const userReactionsKey = `userReactions.${userId?.replace(/\./g, '_').replace(/\$/g, '_')}`;
    const currentReaction = storyData.userReactions && storyData.userReactions[userId || 'anonymous'];
    
    // Preparar atualizações
    const updates: any = {};
    
    // Se o usuário já reagiu, remover a reação anterior
    if (currentReaction && currentReaction !== reaction) {
      const previousReactionField = `reactions.${reactionFields[currentReaction as keyof typeof reactionFields]}`;
      updates[previousReactionField] = increment(-1);
    }
    
    // Adicionar a nova reação
    const newReactionField = `reactions.${reactionFields[reaction as keyof typeof reactionFields]}`;
    updates[newReactionField] = currentReaction === reaction ? increment(0) : increment(1);
    
    // Atualizar a reação do usuário
    updates[userReactionsKey] = reaction;
    
    // Atualizar contador de interações
    if (!currentReaction || currentReaction !== reaction) {
      updates.interactions = increment(1);
    }
    
    // Salvar no Firestore
    await updateDoc(storyRef, updates);
    
    return NextResponse.json({
      success: true,
      reaction,
      message: "Reação registrada com sucesso"
    }, { headers: customCorsHeaders });
    
  } catch (error: any) {
    console.error("Erro ao processar reação:", error);
    
    return NextResponse.json(
      { 
        error: "Erro ao processar reação", 
        details: error.message
      },
      { status: 500, headers: corsHeaders }
    );
  }
} 