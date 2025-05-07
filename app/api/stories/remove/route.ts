import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { db, auth } from "@/lib/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import admin from "firebase-admin"
import { getAuth as getAdminAuth } from 'firebase-admin/auth'

// Verificar se Firebase Admin já está inicializado
let adminInitialized = false;
let adminApp;

// Inicializar Firebase Admin apenas se as variáveis de ambiente necessárias estiverem configuradas
if (!admin.apps.length && 
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && 
    process.env.FIREBASE_CLIENT_EMAIL && 
    process.env.FIREBASE_PRIVATE_KEY) {
  try {
    adminApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    adminInitialized = true;
    console.log("Firebase Admin inicializado com sucesso");
  } catch (error) {
    console.error("Erro ao inicializar Firebase Admin:", error);
    adminInitialized = false;
  }
} else if (admin.apps.length) {
  adminApp = admin.app();
  adminInitialized = true;
  console.log("Firebase Admin já estava inicializado");
} else {
  console.warn("Firebase Admin não inicializado: variáveis de ambiente não configuradas");
  adminInitialized = false;
}

// Interface para o payload do request
interface RemoveStoryRequest {
  storyId: string;
}

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
    
    // Obter o token de autorização do cabeçalho
    const authHeader = request.headers.get('authorization');
    const sessionToken = request.headers.get('x-session-token');
    
    // Verificar autenticação
    let userId: string = "";
    let userData: any = null;
    let isAuthenticated = false;
    
    // Tentar autenticar usando Firebase Auth primeiro (prioridade)
    if (authHeader && authHeader.startsWith('Bearer ') && adminInitialized) {
      const token = authHeader.split('Bearer ')[1];
      try {
        // Verificar token usando Firebase Admin
        const decodedToken = await getAdminAuth().verifyIdToken(token);
        userId = decodedToken.uid;
        console.log("Usuário autenticado via Firebase Auth:", userId);
        isAuthenticated = true;
      } catch (authError) {
        console.warn("Erro ao verificar token do Firebase:", authError);
        // Continuar para tentar outros métodos
      }
    }
    
    // Verificar o cookie de sessão (__session)
    // Este cookie é definido pelo auth-context.tsx quando o usuário faz login
    const sessionCookie = request.cookies.get('__session');
    if (!isAuthenticated && sessionCookie && sessionCookie.value) {
      try {
        const sessionData = JSON.parse(sessionCookie.value);
        if (sessionData && sessionData.user) {
          userId = sessionData.user.uid || sessionData.user.id || sessionData.user.userId;
          console.log("Usuário autenticado via cookie de sessão:", userId);
          
          // Usar os dados do usuário diretamente do cookie
          userData = {
            displayName: sessionData.user.displayName || sessionData.user.name,
            photoURL: sessionData.user.photoURL || sessionData.user.avatar,
            isContentProducer: sessionData.user.isContentProducer || false,
            role: sessionData.user.role,
            roles: sessionData.user.roles,
            email: sessionData.user.email
          };
          
          isAuthenticated = true;
        }
      } catch (cookieError) {
        console.warn("Erro ao analisar cookie de sessão:", cookieError);
      }
    }
    
    // Se não conseguiu autenticar, retornar erro
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401, headers: customCorsHeaders }
      );
    }
    
    // Obter dados do request
    const requestData = await request.json();
    const { storyId } = requestData as RemoveStoryRequest;
    
    // Validações básicas do payload
    if (!storyId) {
      return NextResponse.json(
        { error: "ID do story é obrigatório" },
        { status: 400, headers: customCorsHeaders }
      );
    }
    
    // Verificar se o usuário existe e se tem permissão
    if (!userData) {
      const userRef = doc(db, "users", userId);
      const userSnapshot = await getDoc(userRef);
      
      if (userSnapshot.exists()) {
        userData = userSnapshot.data();
        console.log("Usuário encontrado no Firestore:", userData.displayName || userData.name);
      } else {
        return NextResponse.json(
          { error: "Usuário não encontrado" },
          { status: 404, headers: customCorsHeaders }
        );
      }
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
    
    // Verificar se o usuário tem permissão para remover o story
    // Apenas o criador do story ou um admin/produtor de conteúdo pode removê-lo
    const isOwner = storyData.userId === userId;
    const isContentProducer = 
      userData.isContentProducer === true || 
      userData.role === "contentProducer";
    const isAdmin = 
      userData.role === "admin" || 
      (userData.roles && userData.roles.includes("admin"));
    
    if (!isOwner && !isContentProducer && !isAdmin) {
      return NextResponse.json(
        { error: "Você não tem permissão para remover este story" },
        { status: 403, headers: customCorsHeaders }
      );
    }
    
    // Alterar o status para inativo
    await updateDoc(storyRef, {
      status: "inactive",
      removedAt: new Date(),
      removedBy: userId
    });
    
    console.log(`Story ${storyId} foi inativado por ${userId}`);
    
    // Retornar sucesso
    return NextResponse.json({
      success: true,
      message: "Story removido com sucesso"
    }, { headers: customCorsHeaders });
    
  } catch (error: any) {
    console.error("Erro ao remover story:", error);
    
    return NextResponse.json(
      { 
        error: "Erro ao remover story", 
        details: error.message,
        code: error.code 
      },
      { status: 500, headers: corsHeaders }
    );
  }
} 