import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, getDocs, doc, getDoc, DocumentData, query, where, updateDoc } from "firebase/firestore"

interface AbandonedCart extends DocumentData {
  id: string;
  userId?: string;
  status?: string;
  createdAt?: string | number;
  rawData?: string;
  price?: string | number;
  [key: string]: any;
}

export async function GET(request: Request) {
  try {
    const sessionToken = request.headers.get("x-session-token")
    
    // Obter todas as transações
    const transactionsRef = collection(db, "transactions")
    const snapshot = await getDocs(transactionsRef)
    
    // Filtrar apenas transações com rawData contendo "Abandoned_Cart" e preço 0.00
    const abandonedCarts: AbandonedCart[] = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AbandonedCart))
      .filter(transaction => {
        // Verificar se rawData contém "Abandoned_Cart"
        const hasAbandonedCartEvent = transaction.rawData && 
          typeof transaction.rawData === 'string' &&
          transaction.rawData.includes('Abandoned_Cart');
        
        // Verificar se o preço é zero ou não existe
        const hasZeroPrice = !transaction.price || 
          parseFloat(transaction.price?.toString() || '0') === 0 || 
          transaction.price === '0' || 
          transaction.price === '0.00';
        
        return hasAbandonedCartEvent && hasZeroPrice;
      });

    // Enriquecer os dados com informações do usuário
    const enrichedAbandonedCarts = await Promise.all(abandonedCarts.map(async (cart) => {
      // Buscar dados do usuário quando disponíveis
      let userData = null;
      if (cart.userId) {
        const userRef = doc(db, "users", cart.userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          userData = userSnap.data();
        }
      }
      
      // Extrair email do rawData se não estiver nos dados do usuário
      let extractedEmail = "";
      if (cart.rawData) {
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
        const match = cart.rawData.match(emailRegex);
        if (match) {
          extractedEmail = match[0];
        }
      }
      
      return {
        ...cart,
        user: userData ? {
          id: cart.userId,
          displayName: userData.displayName || userData.name || 'Usuário',
          email: userData.email || extractedEmail,
          phoneNumber: userData.phoneNumber
        } : {
          id: cart.userId || '',
          displayName: cart.userName || 'Usuário',
          email: cart.userEmail || extractedEmail,
          phoneNumber: cart.userPhone || ''
        },
        extractedData: {
          email: extractedEmail
        }
      };
    }));

    // Ordenar por data de criação (mais recente primeiro)
    enrichedAbandonedCarts.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB.getTime() - dateA.getTime();
    });

    return NextResponse.json(enrichedAbandonedCarts);

  } catch (error) {
    console.error("Erro ao buscar carrinhos abandonados:", error);
    return NextResponse.json(
      { error: "Erro ao buscar carrinhos abandonados" },
      { status: 500 }
    );
  }
}

// Rota PATCH para desativar um carrinho abandonado
export async function PATCH(request: Request) {
  try {
    const sessionToken = request.headers.get("x-session-token");
    const data = await request.json();
    const { id, status } = data;
    
    if (!id) {
      return NextResponse.json(
        { error: "ID do carrinho abandonado não fornecido" },
        { status: 400 }
      );
    }
    
    console.log(`[AbandonedCarts] Processando atualização para ID: ${id}, status: ${status || 'inactive'}`);
    
    // 1. Atualizar o status da transação para 'inactive'
    const transactionRef = doc(db, "transactions", id);
    const transactionSnap = await getDoc(transactionRef);
    
    if (!transactionSnap.exists()) {
      return NextResponse.json(
        { error: "Carrinho abandonado não encontrado" },
        { status: 404 }
      );
    }
    
    // Obter o userId da transação
    const userId = transactionSnap.data()?.userId;
    console.log(`[AbandonedCarts] UserId encontrado: ${userId || 'não disponível'}`);
    
    // Atualizar o status da transação
    await updateDoc(transactionRef, {
      status: status || 'inactive',
      updatedAt: new Date().toISOString()
    });
    console.log(`[AbandonedCarts] Transação atualizada com sucesso`);
    
    // 2. Se tiver userId, também atualize todas as assinaturas relacionadas a este usuário
    if (userId) {
      try {
        // Consultar assinaturas do usuário
        const subscriptionsRef = collection(db, "subscriptions");
        const q = query(subscriptionsRef, where("userId", "==", userId));
        const subsSnapshot = await getDocs(q);
        
        console.log(`[AbandonedCarts] Encontradas ${subsSnapshot.docs.length} assinaturas para o usuário`);
        
        // Atualizar cada assinatura
        const updatePromises = subsSnapshot.docs.map(async (subDoc) => {
          const subRef = doc(db, "subscriptions", subDoc.id);
          console.log(`[AbandonedCarts] Atualizando assinatura ID: ${subDoc.id}`);
          
          return updateDoc(subRef, {
            status: status || 'inactive',
            updatedAt: new Date().toISOString()
          });
        });
        
        await Promise.all(updatePromises);
        console.log(`[AbandonedCarts] Todas as assinaturas foram atualizadas`);
      } catch (subError) {
        console.error("[AbandonedCarts] Erro ao atualizar assinaturas:", subError);
        // Não falhar todo o processo se a atualização de assinatura falhar
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Status do carrinho abandonado e assinaturas relacionadas atualizados com sucesso"
    });
    
  } catch (error) {
    console.error("Erro ao atualizar status do carrinho abandonado:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar status do carrinho abandonado" },
      { status: 500 }
    );
  }
} 