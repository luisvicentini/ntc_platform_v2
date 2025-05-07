import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc, increment } from "firebase/firestore"

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
        // Verifica se o valor parece um token JWT (começa com "ey")
        if (sessionCookie.value.startsWith('ey')) {
          // É um token JWT, não um objeto JSON
          console.log("Cookie de sessão contém um token JWT");
          // Para reações, usamos ID genérico, mas único para o token
          userId = 'jwt_user_' + sessionCookie.value.substring(0, 8);
          console.log("ID de usuário baseado em JWT gerado:", userId);
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
    
    // Criar formato seguro para o ID do usuário para ser usado como chave no objeto
    const safeUserId = userId?.replace(/\./g, '_').replace(/\$/g, '_') || 'anonymous';
    
    // Conjunto de campos de reação
    const reactionFields = {
      like: 'likes',
      dislike: 'dislikes',
      heart: 'hearts',
      fire: 'fires'
    };
    
    // Obter a reação atual do usuário (se houver)
    const userReactionsKey = `userReactions.${safeUserId}`;
    const currentReaction = storyData.userReactions && storyData.userReactions[safeUserId];
    
    // Preparar atualizações
    const updates: any = {};
    
    // Se o usuário já reagiu, decrementar a reação anterior
    if (currentReaction && currentReaction !== reaction && reactionFields[currentReaction as keyof typeof reactionFields]) {
      const previousReactionField = `reactions.${reactionFields[currentReaction as keyof typeof reactionFields]}`;
      updates[previousReactionField] = increment(-1);
      console.log(`Decrementando reação anterior: ${currentReaction}`);
    }
    
    // Incrementar a nova reação apenas se for diferente da atual
    if (!currentReaction || currentReaction !== reaction) {
      const reactionField = `reactions.${reactionFields[reaction as keyof typeof reactionFields]}`;
      updates[reactionField] = increment(1);
      console.log(`Incrementando nova reação: ${reaction}`);
    }
    
    // Atualizar a reação do usuário no registro para fins de UI
    updates[userReactionsKey] = reaction;
    
    // Registrar a ação no histórico de reações
    const timestamp = new Date();
    const reactionHistoryField = `reactionHistory.${reactionFields[reaction as keyof typeof reactionFields]}`;
    
    if (!storyData.reactionHistory) {
      updates.reactionHistory = {
        [reactionFields[reaction as keyof typeof reactionFields]]: [{
          userId: safeUserId,
          timestamp
        }]
      };
    } else {
      // O Firestore não suporta arrayUnion com objetos que contêm datas, então usamos um método alternativo
      if (!storyData.reactionHistory[reactionFields[reaction as keyof typeof reactionFields]]) {
        updates[reactionHistoryField] = [{
          userId: safeUserId,
          timestamp
        }];
      } else {
        const existingHistory = storyData.reactionHistory[reactionFields[reaction as keyof typeof reactionFields]] || [];
        updates[reactionHistoryField] = [
          ...existingHistory,
          {
            userId: safeUserId,
            timestamp
          }
        ];
      }
    }
    
    // Atualizar contador de interações
    updates.interactions = increment(1);
    
    // Salvar no Firestore
    await updateDoc(storyRef, updates);
    
    // Calcular contagens atualizadas para retornar
    const updatedReactions = { ...storyData.reactions || {} };
    
    // Se havia uma reação anterior e foi mudada, decrementar
    if (currentReaction && currentReaction !== reaction && reactionFields[currentReaction as keyof typeof reactionFields]) {
      const field = reactionFields[currentReaction as keyof typeof reactionFields];
      updatedReactions[field] = Math.max(0, (updatedReactions[field] || 0) - 1);
    }
    
    // Se a nova reação é diferente da anterior, incrementar
    if (!currentReaction || currentReaction !== reaction) {
      const field = reactionFields[reaction as keyof typeof reactionFields];
      updatedReactions[field] = (updatedReactions[field] || 0) + 1;
    }
    
    return NextResponse.json({
      success: true,
      reaction,
      message: "Reação registrada com sucesso",
      reactions: updatedReactions
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