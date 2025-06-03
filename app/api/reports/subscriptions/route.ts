import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, getDocs, doc, getDoc, DocumentData, query, where, updateDoc, setDoc } from "firebase/firestore"

interface Subscription extends DocumentData {
  id: string;
  userId?: string;
  partnerId?: string;
  status?: string;
  createdAt?: string | number;
  [key: string]: any;
}

export async function GET(request: Request) {
  try {
    const sessionToken = request.headers.get("x-session-token")
    
    // Obter todas as assinaturas da coleção
    const subscriptionsRef = collection(db, "subscriptions")
    const snapshot = await getDocs(subscriptionsRef)
    
    const subscriptions: Subscription[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // Buscar todas as transações para verificar assinaturas ativas
    const transactionsRef = collection(db, "transactions")
    const transactionsSnapshot = await getDocs(transactionsRef)
    const transactions: DocumentData[] = transactionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    // Mapeamento de userId para transações
    const userTransactions: Record<string, any[]> = {}
    transactions.forEach((transaction: DocumentData) => {
      if (transaction.userId) {
        if (!userTransactions[transaction.userId]) {
          userTransactions[transaction.userId] = []
        }
        userTransactions[transaction.userId].push(transaction)
      }
    })
    
    // Buscar todos os vouchers para verificar engajamento
    const vouchersRef = collection(db, "vouchers")
    const vouchersSnapshot = await getDocs(vouchersRef)
    const vouchers: DocumentData[] = vouchersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    // Contabilizar vouchers por usuário
    const userVouchers: Record<string, number> = {}
    vouchers.forEach((voucher: DocumentData) => {
      const userId = voucher.userId || voucher.memberId
      if (userId) {
        userVouchers[userId] = (userVouchers[userId] || 0) + 1
      }
    })

    // Enriquecer os dados com informações do parceiro e do usuário
    const enrichedSubscriptions = await Promise.all(subscriptions.map(async (subscription) => {
      let partnerData = null
      if (subscription.partnerId) {
        const partnerRef = doc(db, "users", subscription.partnerId)
        const partnerSnap = await getDoc(partnerRef)
        if (partnerSnap.exists()) {
          partnerData = partnerSnap.data()
        }
      }

      // Também enriquecer com dados do usuário quando disponíveis
      let userData = null
      if (subscription.userId) {
        const userRef = doc(db, "users", subscription.userId)
        const userSnap = await getDoc(userRef)
        if (userSnap.exists()) {
          userData = userSnap.data()
        }
      }
      
      // Verificar se existem transações para este usuário
      const hasTransactions = subscription.userId && userTransactions[subscription.userId] && 
                             userTransactions[subscription.userId].length > 0
      
      // Verificar se o usuário gerou vouchers
      const voucherCount = subscription.userId ? (userVouchers[subscription.userId] || 0) : 0
      const isEngaged = voucherCount > 0
      
      // Determinar o status real da assinatura baseado em transações
      let effectiveStatus = subscription.status || 'inactive'
      if (hasTransactions && (effectiveStatus === 'active' || effectiveStatus === 'ativa')) {
        effectiveStatus = 'active'
      } else if (!hasTransactions && (effectiveStatus === 'active' || effectiveStatus === 'ativa')) {
        // Marcar como "pendente" se não houver transações mas o status for ativo
        effectiveStatus = 'pending'
      }

      return {
        ...subscription,
        effectiveStatus,
        partner: partnerData ? {
          id: subscription.partnerId,
          name: partnerData.displayName || partnerData.name || partnerData.businessName,
          email: partnerData.email
        } : null,
        user: userData ? {
          id: subscription.userId,
          displayName: userData.displayName || userData.name,
          email: userData.email,
          phoneNumber: userData.phoneNumber
        } : null,
        hasTransactions,
        voucherCount,
        isEngaged
      }
    }))

    // Ordenar assinaturas: ativas primeiro, depois por data de criação
    enrichedSubscriptions.sort((a, b) => {
      // Priorizar assinaturas ativas
      const isActiveA = a.effectiveStatus === 'active' || a.effectiveStatus === 'ativa'
      const isActiveB = b.effectiveStatus === 'active' || b.effectiveStatus === 'ativa'
      
      if (isActiveA && !isActiveB) return -1
      if (!isActiveA && isActiveB) return 1
      
      // Em seguida, ordenar por data (mais recente primeiro)
      const dateA = new Date(a.createdAt || 0)
      const dateB = new Date(b.createdAt || 0)
      return dateB.getTime() - dateA.getTime()
    })

    return NextResponse.json(enrichedSubscriptions)

  } catch (error) {
    console.error("Erro ao buscar assinaturas para relatórios:", error)
    return NextResponse.json(
      { error: "Erro ao buscar assinaturas para relatórios" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const sessionToken = request.headers.get("x-session-token");
    
    // Obter o corpo da requisição
    const body = await request.json();
    const { id, status = "inactive" } = body;
    
    if (!id) {
      console.error("ID da assinatura não fornecido");
      return NextResponse.json(
        { error: "ID da assinatura não fornecido" },
        { status: 400 }
      );
    }
    
    console.log(`[SubscriptionAPI] Tentando atualizar assinatura com ID: ${id} para o status: ${status}`);
    
    // Verificar explicitamente a coleção que está sendo acessada
    console.log(`[SubscriptionAPI] Acessando a coleção: "subscriptions"`);
    
    // Referência ao documento da assinatura no Firestore
    const subscriptionRef = doc(db, "subscriptions", id);
    
    // Verificar se a assinatura existe
    const subscriptionSnap = await getDoc(subscriptionRef);
    if (!subscriptionSnap.exists()) {
      console.error(`[SubscriptionAPI] Assinatura com ID ${id} não encontrada`);
      
      // Tentar buscar em outras coleções como fallback (para debugging)
      try {
        const transactionRef = doc(db, "transactions", id);
        const transactionSnap = await getDoc(transactionRef);
        if (transactionSnap.exists()) {
          console.warn(`[SubscriptionAPI] Nota: ID ${id} existe na coleção "transactions", mas não em "subscriptions"`);
        }
      } catch (fallbackError) {
        // Ignorar erros no fallback
      }
      
      return NextResponse.json(
        { error: "Assinatura não encontrada" },
        { status: 404 }
      );
    }
    
    const subscriptionData = subscriptionSnap.data();
    const userId = subscriptionData?.userId || subscriptionData?.memberId;
    const currentStatus = subscriptionData?.status || 'não definido';
    
    console.log(`[SubscriptionAPI] Assinatura encontrada. Status atual: ${currentStatus}, UserId: ${userId || 'não disponível'}`);
    
    // Atualizar o status da assinatura com o valor fornecido
    try {
      const updateData = {
        status: status,
        updatedAt: new Date().toISOString()
      };
      
      console.log(`[SubscriptionAPI] Atualizando documento na coleção 'subscriptions' com os dados:`, updateData);
      
      try {
        // Primeira tentativa com updateDoc
        await updateDoc(subscriptionRef, updateData);
        console.log(`[SubscriptionAPI] Atualização com updateDoc realizada com sucesso para o ID: ${id}`);
      } catch (updateError) {
        console.warn(`[SubscriptionAPI] Erro com updateDoc: ${updateError}. Tentando com setDoc...`);
        
        // Fallback para setDoc com merge: true
        await setDoc(subscriptionRef, updateData, { merge: true });
        console.log(`[SubscriptionAPI] Atualização com setDoc realizada com sucesso para o ID: ${id}`);
      }
      
      // Verificar se a atualização foi aplicada
      const updatedSnap = await getDoc(subscriptionRef);
      const newStatus = updatedSnap.exists() ? updatedSnap.data()?.status : 'unknown';
      console.log(`[SubscriptionAPI] Status após atualização: ${newStatus}`);
      
      if (updatedSnap.exists() && updatedSnap.data()?.status !== status) {
        console.warn(`[SubscriptionAPI] A atualização parece não ter sido aplicada. Status atual: ${updatedSnap.data()?.status || 'não definido'}`);
      }
      
      // Se houver userId, procurar e atualizar outras assinaturas do mesmo usuário
      if (userId) {
        try {
          console.log(`[SubscriptionAPI] Verificando outras assinaturas para o mesmo usuário: ${userId}`);
          
          // Buscar todas as assinaturas deste usuário
          const subscriptionsRef = collection(db, "subscriptions");
          let q;
          
          // Tentar as duas possíveis chaves de userId
          try {
            q = query(subscriptionsRef, where("userId", "==", userId));
          } catch (queryError) {
            console.log(`[SubscriptionAPI] Erro na primeira query, tentando com memberId: ${queryError}`);
            q = query(subscriptionsRef, where("memberId", "==", userId));
          }
          
          const userSubsSnapshot = await getDocs(q);
          console.log(`[SubscriptionAPI] Encontradas ${userSubsSnapshot.docs.length} assinaturas para o usuário`);
          
          // Atualizar todas as assinaturas do usuário
          const otherUpdatePromises = userSubsSnapshot.docs
            .filter(doc => doc.id !== id) // Excluir a assinatura já atualizada
            .map(async (subDoc) => {
              console.log(`[SubscriptionAPI] Atualizando assinatura adicional ID: ${subDoc.id}`);
              
              const otherSubRef = doc(db, "subscriptions", subDoc.id);
              return updateDoc(otherSubRef, {
                status: status,
                updatedAt: new Date().toISOString()
              });
            });
          
          if (otherUpdatePromises.length > 0) {
            await Promise.all(otherUpdatePromises);
            console.log(`[SubscriptionAPI] Todas as assinaturas adicionais do usuário foram atualizadas`);
          }
        } catch (additionalUpdatesError) {
          console.error("[SubscriptionAPI] Erro ao atualizar assinaturas adicionais:", additionalUpdatesError);
          // Não falhar a operação principal se as atualizações adicionais falharem
        }
      }
      
      return NextResponse.json({
        success: true,
        message: "Status da assinatura atualizado para " + status,
        id,
        updatedStatus: newStatus
      });
    } catch (updateError) {
      console.error("[SubscriptionAPI] Erro durante a operação de atualização:", updateError);
      throw updateError; // Repassar o erro para ser capturado pelo catch externo
    }
    
  } catch (error) {
    console.error("Erro ao atualizar assinatura:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar assinatura", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 