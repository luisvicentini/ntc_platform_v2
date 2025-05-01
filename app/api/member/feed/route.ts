import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where, getDoc, doc, DocumentData } from "firebase/firestore"
import { jwtDecode } from "jwt-decode"
import type { SessionToken } from "@/types/session"
import jwt from "jsonwebtoken"

// Interface para os estabelecimentos
interface Establishment {
  id: string;
  name: string;
  status: string;
  isFeatured?: boolean;
  [key: string]: any;
}

// Função para buscar um único usuário pelo ID
async function getUserById(userId: string): Promise<DocumentData | null> {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return {
        id: userDoc.id,
        ...userDoc.data()
      };
    }
    return null;
  } catch (error) {
    console.error(`Erro ao buscar usuário ${userId}:`, error);
    return null;
  }
}

// Função para buscar assinaturas ativas de um usuário
async function getUserSubscriptions(userId: string, userEmail: string | null): Promise<DocumentData[]> {
  try {
    const activeStatuses = ["active", "ativa", "trialing", "iniciada", "paid"];
    const subscriptionsRef = collection(db, "subscriptions");
    const results: DocumentData[] = [];
    
    // Buscar por memberId
    if (userId) {
      console.log(`Buscando assinaturas por memberId: ${userId}`);
      const memberIdQuery = query(
        subscriptionsRef,
        where("memberId", "==", userId)
      );
      
      const memberIdSnapshot = await getDocs(memberIdQuery);
      
      memberIdSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (activeStatuses.includes(String(data.status))) {
          results.push({
            id: doc.id,
            ...data
          });
        }
      });
      
      // Buscar por userId também (para assinaturas da Lastlink)
      console.log(`Buscando assinaturas por userId: ${userId}`);
      const userIdQuery = query(
        subscriptionsRef,
        where("userId", "==", userId)
      );
      
      const userIdSnapshot = await getDocs(userIdQuery);
      
      userIdSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (activeStatuses.includes(String(data.status))) {
          results.push({
            id: doc.id,
            ...data
          });
        }
      });
    }
    
    // Buscar por userEmail
    if (userEmail) {
      console.log(`Buscando assinaturas por userEmail: ${userEmail}`);
      const emailQuery = query(
        subscriptionsRef,
        where("userEmail", "==", userEmail.toLowerCase())
      );
      
      const emailSnapshot = await getDocs(emailQuery);
      
      emailSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (activeStatuses.includes(String(data.status))) {
          results.push({
            id: doc.id,
            ...data
          });
        }
      });
    }
    
    console.log(`Total de assinaturas encontradas: ${results.length}`);
    return results;
  } catch (error) {
    console.error("Erro ao buscar assinaturas do usuário:", error);
    return [];
  }
}

// Função para buscar todos os estabelecimentos ativos
async function getActiveEstablishments(): Promise<Establishment[]> {
  try {
    const establishmentsRef = collection(db, "establishments")
    const activeQuery = query(
      establishmentsRef,
      where("status", "==", "active")
    )
    
    const snapshot = await getDocs(activeQuery)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Establishment[]
  } catch (error) {
    console.error("Erro ao buscar estabelecimentos:", error)
    return []
  }
}

// Função para buscar associações na coleção memberPartners
async function getMemberPartners(userId: string): Promise<DocumentData[]> {
  try {
    console.log(`Buscando memberPartners para userId: ${userId}`);
    const memberPartnersRef = collection(db, "memberPartners");
    const memberPartnersQuery = query(
      memberPartnersRef,
      where("memberId", "==", userId),
      where("status", "==", "active")
    );
    
    const snapshot = await getDocs(memberPartnersQuery);
    
    const results = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`Encontrados ${results.length} vínculos em memberPartners`);
    return results;
  } catch (error) {
    console.error("Erro ao buscar memberPartners:", error);
    return [];
  }
}

export async function GET(request: Request) {
  try {
    console.log("Iniciando API /api/member/feed com debug avançado");
    
    // Obter token de autenticação do cabeçalho
    const sessionToken = request.headers.get("x-session-token");
    
    if (!sessionToken) {
      console.log("Token de sessão não fornecido, retornando todos os estabelecimentos");
      const allEstablishments = await getActiveEstablishments();
      return NextResponse.json({
        status: "none",
        message: "Sessão não fornecida",
        establishments: allEstablishments
      });
    }
    
    // Extrair informações do usuário
    let userId = null;
    let userEmail = null;
    
    try {
      // Tentar tanto decodificação com verify quanto sem
      try {
        const jwtSecret = process.env.JWT_SECRET;
        if (jwtSecret) {
          const decoded = jwt.verify(sessionToken, jwtSecret);
          if (typeof decoded === "object" && decoded !== null) {
            userId = decoded.uid || decoded.id;
            userEmail = decoded.email;
          }
        }
      } catch (verifyError) {
        console.log("Erro na verificação JWT, tentando decode simples");
      }
      
      // Se não conseguiu com verify, tentar com decode simples
      if (!userId) {
        const decoded = jwtDecode(sessionToken);
        userId = decoded.uid || decoded.id || decoded.sub;
        userEmail = decoded.email;
      }
      
      console.log(`Usuário identificado: ID=${userId}, Email=${userEmail}`);
    } catch (error) {
      console.error("Erro ao decodificar token:", error);
    }
    
    if (!userId && !userEmail) {
      console.log("Não foi possível identificar o usuário a partir do token");
      const allEstablishments = await getActiveEstablishments();
      return NextResponse.json({
        status: "none",
        message: "Usuário não identificado",
        establishments: allEstablishments
      });
    }
    
    // Buscar dados completos do usuário
    let userDoc = null;
    if (userId) {
      userDoc = await getUserById(userId);
      console.log(`Dados do usuário:`, JSON.stringify(userDoc || {}));
    }
    
    // Buscar assinaturas e memberPartners
    const [subscriptions, memberPartners] = await Promise.all([
      getUserSubscriptions(userId, userEmail),
      getMemberPartners(userId)
    ]);
    
    // Extrair partnerId de todas as fontes
    const partnerIds = new Set<string>();
    
    // 1. Do documento do usuário
    if (userDoc && userDoc.partnerId) {
      console.log(`Adicionando partnerId do usuário: ${userDoc.partnerId}`);
      partnerIds.add(userDoc.partnerId);
    }
    
    // 2. Das assinaturas
    subscriptions.forEach(sub => {
      if (sub.partnerId) {
        console.log(`Adicionando partnerId da assinatura: ${sub.partnerId}`);
        partnerIds.add(sub.partnerId);
      }
    });
    
    // 3. Dos memberPartners
    memberPartners.forEach(mp => {
      if (mp.partnerId) {
        console.log(`Adicionando partnerId do memberPartner: ${mp.partnerId}`);
        partnerIds.add(mp.partnerId);
      }
    });
    
    console.log(`Total de partnerIds únicos encontrados: ${partnerIds.size}`);
    
    // Buscar estabelecimentos ativos
    const allEstablishments = await getActiveEstablishments();
    console.log(`Total de estabelecimentos ativos: ${allEstablishments.length}`);
    
    // Determinar se o usuário tem acesso completo aos estabelecimentos
    const hasActiveSubscription = subscriptions.length > 0 || memberPartners.length > 0;
    console.log(`Usuário tem assinatura ativa? ${hasActiveSubscription ? 'SIM' : 'NÃO'}`);
    
    // Retornar resposta
    return NextResponse.json({
      status: hasActiveSubscription ? "active" : "none",
      message: hasActiveSubscription ? "" : "Você não possui uma assinatura ativa.",
      establishments: allEstablishments,
      featuredCount: allEstablishments.filter(e => e.isFeatured).length,
      partnerCount: allEstablishments.length,
      debug: {
        userId,
        userEmail,
        subscriptionsCount: subscriptions.length,
        memberPartnersCount: memberPartners.length,
        partnerIdsCount: partnerIds.size
      }
    });
  } catch (error) {
    console.error("Erro na API /api/member/feed:", error);
    
    // Em caso de erro, ainda tentar retornar algum dado útil
    try {
      const allEstablishments = await getActiveEstablishments();
      return NextResponse.json({
        status: "error",
        message: "Ocorreu um erro ao processar a solicitação",
        establishments: allEstablishments,
        error: error.message
      });
    } catch (fallbackError) {
      return NextResponse.json({
        status: "error",
        message: "Erro crítico ao processar a solicitação",
        establishments: [],
        error: error.message
      });
    }
  }
}