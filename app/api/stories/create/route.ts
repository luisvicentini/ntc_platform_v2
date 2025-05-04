import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { db, storage, auth } from "@/lib/firebase"
import { collection, doc, setDoc, getDoc, query, where, getDocs } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, getStorage } from "firebase/storage"
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
interface CreateStoryRequest {
  mediaBase64: string
  mediaType: "image" | "video"
  establishmentId?: string | null
  durationDays?: number
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
    
    // Se não conseguiu autenticar via Firebase, tentar via token de sessão
    if (!isAuthenticated && sessionToken) {
      userId = sessionToken;
      console.log("Usando token de sessão como ID:", userId);
    } else if (!isAuthenticated) {
      // Último recurso: usar ID temporário, mas só para fins de desenvolvimento
      console.warn("AVISO: Nenhum método de autenticação válido. Usando ID de usuário temporário.");
      // userId já tem o valor padrão definido acima
    }
    
    // Obter dados do request
    const requestData = await request.json();
    const { mediaBase64, mediaType, establishmentId, durationDays = 1 } = requestData as CreateStoryRequest;
    
    // Validar duração (entre 1 e 7 dias)
    const validatedDurationDays = Math.min(Math.max(durationDays || 1, 1), 7);
    
    // Validações básicas do payload
    if (!mediaBase64) {
      return NextResponse.json(
        { error: "Arquivo de mídia é obrigatório" },
        { status: 400, headers: customCorsHeaders }
      );
    }
    
    if (!mediaBase64.startsWith('data:')) {
      return NextResponse.json(
        { error: "Formato de mídia inválido. Deve ser uma string base64 com prefixo data:URL" },
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
        } else {
          // Se ainda não encontrar, buscar pela coleção de usuários pelo email
          const authHeader = request.headers.get('authorization');
          
          if (authHeader && authHeader.startsWith('Bearer ') && adminInitialized) {
            try {
              // Verificar token usando Firebase Admin
              const token = authHeader.split('Bearer ')[1];
              const decodedToken = await getAdminAuth().verifyIdToken(token);
              
              if (decodedToken.email) {
                console.log("Buscando usuário pelo email:", decodedToken.email);
                const usersRef = collection(db, "users");
                const emailQuery = query(usersRef, where("email", "==", decodedToken.email.toLowerCase()));
                const querySnapshot = await getDocs(emailQuery);
                
                if (!querySnapshot.empty) {
                  const userDoc = querySnapshot.docs[0];
                  userData = userDoc.data();
                  userId = userDoc.id;
                  console.log("Usuário encontrado pelo email:", userData.displayName || userData.name);
                }
              }
            } catch (error) {
              console.warn("Erro ao verificar token ou buscar usuário pelo email:", error);
            }
          }
          
          // Se ainda não encontrou o usuário, usar dados do cookie de sessão
          if (!userData) {
            const sessionCookie = request.cookies.get('__session');
            if (sessionCookie?.value) {
              try {
                const sessionData = JSON.parse(sessionCookie.value);
                if (sessionData.user) {
                  userData = {
                    displayName: sessionData.user.displayName || sessionData.user.name,
                    photoURL: sessionData.user.photoURL || sessionData.user.avatar,
                    isContentProducer: true
                  };
                  console.log("Usuário encontrado no cookie de sessão:", userData.displayName);
                }
              } catch (error) {
                console.warn("Erro ao processar cookie de sessão:", error);
              }
            }
          }
          
          // Se ainda não encontrou, usar dados temporários mas mais genéricos
          if (!userData) {
            console.warn("AVISO: Usuário não encontrado por nenhum método, criando dados temporários");
            userData = { 
              isContentProducer: true,
              displayName: "Usuário",
              photoURL: null
            };
          }
        }
      } else {
        // Verificar nas variáveis do request se há informações do usuário
        const userFromCookie = request.cookies.get('__user')?.value ? 
                    JSON.parse(request.cookies.get('__user')?.value || '{}') : null;
                    
        // Criar um usuário temporário para testes se não existir
        console.warn("AVISO: Usuário não encontrado pelo ID, criando dados temporários");
        userData = { 
          isContentProducer: true,
          displayName: userFromCookie?.displayName || request.headers.get('x-user-name') || "Usuário",
          photoURL: userFromCookie?.photoURL || request.headers.get('x-user-avatar') || null
        };
      }
    }
    
    // Para debug: Exibir dados do usuário
    console.log("Dados do usuário para publicação:", {
      uid: userId,
      displayName: userData.displayName || userData.name,
      photoURL: userData.photoURL,
      isContentProducer: userData.isContentProducer
    });
    
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
    const fileExtension = mediaType === "image" ? ".jpg" : ".mp4";
    
    try {
      // Verificar a configuração do storage
      const currentStorage = getStorage();
      console.log("Bucket do storage:", currentStorage.app.options.storageBucket || "default");
      
      // Usar o mesmo padrão de caminho que funciona na rota de estabelecimentos
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(7);
      const storageFilePath = `stories/${userId}/${timestamp}-${randomSuffix}${fileExtension}`;
      
      console.log(`Criando referência para arquivo: ${storageFilePath}`);
      
      let mediaUrl: string;
      
      // Se autenticado pelo Firebase e o Admin está inicializado, usar Firebase Admin para upload
      if (isAuthenticated && adminInitialized) {
        console.log("Usando Firebase Admin para upload com autenticação");
        try {
          // Converter base64 para buffer
          const base64Data = mediaBase64.split(',')[1]; // Remover o prefixo data:image/jpeg;base64,
          const mediaBuffer = Buffer.from(base64Data, 'base64');
          
          // Upload via Firebase Admin Storage
          const bucket = admin.storage().bucket();
          const file = bucket.file(storageFilePath);
          
          const contentType = mediaType === "image" 
            ? "image/jpeg" 
            : "video/mp4";
            
          await file.save(mediaBuffer, {
            contentType,
            metadata: {
              contentType,
              firebaseStorageDownloadTokens: uuidv4(),
            }
          });
          
          // Gerar URL de download
          mediaUrl = `https://firebasestorage.googleapis.com/v0/b/${
            bucket.name
          }/o/${encodeURIComponent(storageFilePath)}?alt=media`;
          
          console.log("Upload concluído com sucesso via Firebase Admin!");
        } catch (adminError) {
          console.error("Erro no upload via Firebase Admin:", adminError);
          console.log("Tentando método alternativo de upload...");
          
          // Se falhar com o Admin, tentar com o método client-side
          throw adminError; // Isso fará cair no método client-side abaixo
        }
      } else {
        // Usar o método client-side se não estiver autenticado ou Admin não estiver inicializado
        console.log("Usando método client-side para upload");
        
        // Usando o SDK do client-side
        const storageRef = ref(storage, storageFilePath);
        
        // Utilizando a mesma abordagem do estabelecimento
        console.log("Convertendo base64 para blob...");
        const mediaBlob = await fetch(mediaBase64).then(r => r.blob());
        
        console.log(`Tamanho do blob: ${mediaBlob.size} bytes`);
        console.log(`Tipo do blob: ${mediaBlob.type}`);
        
        // Upload direto sem verificações adicionais
        console.log("Iniciando upload para o Firebase Storage...");
        await uploadBytes(storageRef, mediaBlob);
        console.log("Upload concluído com sucesso via client SDK!");
        
        // Obter URL da mídia
        console.log("Obtendo URL do arquivo...");
        mediaUrl = await getDownloadURL(storageRef);
        console.log("URL do arquivo obtida:", mediaUrl.substring(0, 50) + "...");
      }
      
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
        mediaUrl: mediaUrl,
        createdAt: new Date(),
        durationDays: validatedDurationDays,
        establishmentId: establishmentId || null,
        expiresAt: expirationDate,
        status: "active",
        views: 0,
        interactions: 0
      };
      
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
    } catch (storageError: any) {
      console.error("Erro ao manipular Firebase Storage:", storageError);
      
      // Log detalhado do erro
      console.error("Detalhes do erro:", {
        message: storageError.message,
        code: storageError.code,
        name: storageError.name,
        stack: storageError.stack?.substring(0, 200)
      });
      
      // Verificar o tipo específico de erro para dar uma mensagem mais precisa
      if (storageError.code === 'storage/unauthorized') {
        return NextResponse.json(
          { 
            error: "Erro de permissão ao fazer upload da mídia", 
            details: "Verifique se as regras do Firebase Storage permitem uploads para o caminho: " + storageError.path
          },
          { status: 403, headers: customCorsHeaders }
        );
      } else if (storageError.code === 'storage/unknown' && storageError.status_ === 404) {
        const currentStorage = getStorage();
        return NextResponse.json(
          { 
            error: "Bucket de armazenamento não encontrado", 
            details: `Verifique se o bucket "${currentStorage.app.options.storageBucket}" existe no console do Firebase.`
          },
          { status: 404, headers: customCorsHeaders }
        );
      }
      
      return NextResponse.json(
        { 
          error: "Erro ao manipular Firebase Storage", 
          details: storageError.message,
          code: storageError.code
        },
        { status: 500, headers: customCorsHeaders }
      );
    }
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