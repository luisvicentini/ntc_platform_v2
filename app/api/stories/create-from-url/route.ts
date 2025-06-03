import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { db, auth } from "@/lib/firebase"
import { collection, doc, setDoc, getDoc, query, where, getDocs } from "firebase/firestore"
import { v4 as uuidv4 } from "uuid"
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
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
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
interface CreateStoryFromUrlRequest {
  mediaUrl: string
  mediaType: "image" | "video"
  establishmentId?: string | null
  durationDays?: number
}

// Configurar cabeçalhos CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version, x-session-user-id, x-session-token, x-user-data'
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
    let userId: string = "temp_user_id_for_testing"; // Valor padrão para usuário não autenticado
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
    const sessionCookie = request.cookies.get('__session');
    
    if (!isAuthenticated && sessionCookie && sessionCookie.value) {
      try {
        // Verifica se o valor parece um token JWT (começa com "ey")
        if (sessionCookie.value.startsWith('ey')) {
          // É um token JWT, não um objeto JSON
          console.log("Cookie de sessão contém um token JWT");
          
          // Se o Firebase Admin estiver inicializado, tentar verificar o token
          if (adminInitialized) {
            try {
              const decodedToken = await getAdminAuth().verifyIdToken(sessionCookie.value);
              userId = decodedToken.uid;
              isAuthenticated = true;
              console.log("Usuário autenticado via token JWT em cookie:", userId);
              
              // Buscar dados do usuário do Firestore
              const userRef = doc(db, "users", userId);
              const userSnapshot = await getDoc(userRef);
              if (userSnapshot.exists()) {
                userData = userSnapshot.data();
              }
            } catch (jwtError) {
              console.warn("Não foi possível verificar token JWT:", jwtError);
            }
          }
        } else {
          // Tenta processar como JSON
          const sessionData = JSON.parse(sessionCookie.value);
          if (sessionData && sessionData.user) {
            userId = sessionData.user.uid || sessionData.user.id || sessionData.user.userId;
            console.log("Usuário autenticado via cookie de sessão:", userId);
            
            // Usar os dados do usuário diretamente do cookie
            userData = {
              displayName: sessionData.user.displayName || sessionData.user.name,
              photoURL: sessionData.user.photoURL || sessionData.user.avatar,
              isContentProducer: sessionData.user.isContentProducer || false,
              email: sessionData.user.email
            };
            
            isAuthenticated = true;
          }
        }
      } catch (cookieError) {
        console.warn("Erro ao analisar cookie de sessão:", cookieError);
      }
    }
    
    // Se não conseguiu autenticar via Firebase ou cookie, tentar via token de sessão
    if (!isAuthenticated && sessionToken) {
      userId = sessionToken;
      console.log("Usando token de sessão como ID:", userId);
      
      // Verificar header x-user-data que pode conter dados do usuário em JSON
      const userDataHeader = request.headers.get('x-user-data');
      if (userDataHeader) {
        try {
          const parsedUserData = JSON.parse(userDataHeader);
          userData = {
            displayName: parsedUserData.displayName || parsedUserData.name,
            photoURL: parsedUserData.photoURL || parsedUserData.avatar,
            isContentProducer: parsedUserData.isContentProducer || false
          };
          console.log("Dados do usuário obtidos do cabeçalho x-user-data");
        } catch (error) {
          console.warn("Erro ao analisar cabeçalho x-user-data:", error);
        }
      }
    } else if (!isAuthenticated) {
      // Último recurso: tentar obter ID do usuário de outros cabeçalhos
      const userIdHeader = request.headers.get('x-session-user-id');
      if (userIdHeader) {
        userId = userIdHeader;
        console.log("Usando ID do usuário do cabeçalho x-session-user-id:", userId);
      }
    }
    
    // Obter dados do request
    const requestData = await request.json();
    const { mediaUrl, mediaType, establishmentId, durationDays = 1 } = requestData as CreateStoryFromUrlRequest;
    
    // Validar duração (entre 1 e 7 dias)
    const validatedDurationDays = Math.min(Math.max(durationDays || 1, 1), 7);
    
    // Validações básicas do payload
    if (!mediaUrl) {
      return NextResponse.json(
        { error: "URL da mídia é obrigatória" },
        { status: 400, headers: customCorsHeaders }
      );
    }
    
    if (!mediaUrl.startsWith('http')) {
      return NextResponse.json(
        { error: "URL da mídia inválida. Deve ser uma URL válida começando com http." },
        { status: 400, headers: customCorsHeaders }
      );
    }
    
    if (!mediaType || (mediaType !== "image" && mediaType !== "video")) {
      return NextResponse.json(
        { error: "Tipo de mídia inválido. Deve ser 'image' ou 'video'" },
        { status: 400, headers: customCorsHeaders }
      );
    }
    
    // Verificar se o usuário existe e se tem permissão
    const userRef = doc(db, "users", userId);
    const userSnapshot = await getDoc(userRef);
    
    if (userSnapshot.exists()) {
      userData = userSnapshot.data();
      console.log("Usuário encontrado no Firestore:", userData.displayName || userData.name);
      
      // Registrar se o usuário tem permissão para criar stories
      console.log("Permissão de produtor de conteúdo:", 
        userData.isContentProducer === true ? "Sim" : "Não", 
        userData.role === "contentProducer" ? "(via role)" : "");
    } else {
      // Se não encontrar pelo ID exato, tentar buscar pelo header x-session-user-id
      const userIdFromHeader = request.headers.get('x-session-user-id');
      
      if (userIdFromHeader && userIdFromHeader !== userId) {
        console.log("Tentando buscar usuário pelo x-session-user-id:", userIdFromHeader);
        const alternativeUserRef = doc(db, "users", userIdFromHeader);
        const alternativeUserSnapshot = await getDoc(alternativeUserRef);
        
        if (alternativeUserSnapshot.exists()) {
          userData = alternativeUserSnapshot.data();
          userId = userIdFromHeader; // Atualizar o userId para o correto
          console.log("Usuário encontrado pelo ID alternativo:", userData.displayName || userData.name);
        }
      }
      
      // Se ainda não encontrou o usuário, usar dados temporários para testes
      if (!userData) {
        // Verificar o header x-user-data que pode conter dados do usuário em JSON
        const userDataHeader = request.headers.get('x-user-data');
        if (userDataHeader) {
          try {
            userData = JSON.parse(userDataHeader);
            console.log("Dados do usuário obtidos do cabeçalho x-user-data:", userData.displayName);
          } catch (error) {
            console.warn("Erro ao processar header x-user-data:", error);
            // Usar valores padrão
            userData = { 
              isContentProducer: true,
              displayName: "Usuário",
              photoURL: null
            };
          }
        } else {
          console.warn("AVISO: Usuário não encontrado por nenhum método, criando dados temporários");
          userData = { 
            isContentProducer: true,
            displayName: "Usuário",
            photoURL: null
          };
        }
      }
    }
    
    // Para debug: Exibir dados do usuário
    console.log("Dados do usuário para publicação:", {
      uid: userId,
      displayName: userData.displayName || userData.name,
      photoURL: userData.photoURL,
      isContentProducer: userData.isContentProducer
    });
    
    // Verificar se o usuário tem permissão para criar stories
    const hasContentProducerPermission = 
      userData.isContentProducer === true || 
      userData.role === "contentProducer" || 
      userData.role === "admin" ||
      (userData.roles && (
        userData.roles.includes("contentProducer") || 
        userData.roles.includes("admin")
      ));
    
    // Se o usuário não tiver permissão e não estivermos em desenvolvimento, retornar erro
    if (!hasContentProducerPermission) {
      console.warn(`Usuário ${userId} não tem permissão para criar stories`);
      return NextResponse.json(
        { 
          error: "Você não tem permissão para publicar stories", 
          details: "Apenas produtores de conteúdo podem criar stories."
        },
        { status: 403, headers: customCorsHeaders }
      );
    }
    
    // Verificar estabelecimento se fornecido
    let establishmentData = null;
    if (establishmentId) {
      const establishmentRef = doc(db, "establishments", establishmentId);
      const establishmentSnapshot = await getDoc(establishmentRef);
      
      if (!establishmentSnapshot.exists()) {
        return NextResponse.json(
          { error: "Estabelecimento não encontrado" },
          { status: 404, headers: customCorsHeaders }
        );
      }
      
      establishmentData = {
        id: establishmentSnapshot.id,
        ...establishmentSnapshot.data()
      };
    }
    
    // Gerar ID único para o story
    const storyId = uuidv4();
    
    // Calcular data de expiração baseada na duração selecionada
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + validatedDurationDays);
    
    // Preparar dados do story
    const storyData = {
      id: storyId,
      userId: userId,
      userName: userData.displayName || userData.name || "Usuário",
      userAvatar: userData.photoURL || userData.profilePicture || null,
      mediaType: mediaType,
      mediaUrl: mediaUrl, // URL já carregada diretamente no cliente
      createdAt: new Date(),
      durationDays: validatedDurationDays,
      establishmentId: establishmentId || null,
      expiresAt: expirationDate,
      status: "active",
      views: 0,
      interactions: 0
    };
    
    console.log("Dados do story a serem salvos:", {
      storyId,
      userId,
      userName: storyData.userName,
      mediaType,
      expiresAt: expirationDate
    });
    
    // Salvar no Firestore
    console.log("Salvando dados no Firestore");
    await setDoc(doc(db, "stories", storyId), storyData);
    
    console.log("Story criado com sucesso:", storyId);
    
    // Retornar sucesso com os dados
    return NextResponse.json({
      success: true,
      story: {
        ...storyData,
        linkedEstablishment: establishmentData
      }
    }, { headers: customCorsHeaders });
  } catch (error: any) {
    console.error("Erro ao criar story:", error);
    
    // Log detalhado do erro
    console.error("Detalhes do erro:", {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack?.substring(0, 200)
    });
    
    return NextResponse.json(
      { 
        error: "Erro ao criar story", 
        details: error.message,
        code: error.code 
      },
      { status: 500, headers: corsHeaders }
    );
  }
} 