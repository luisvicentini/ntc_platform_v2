import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore"

/**
 * API endpoint dedicado para desativar assinaturas na coleção "subscriptions"
 */
export async function POST(request: Request) {
  try {
    const sessionToken = request.headers.get("x-session-token");
    
    // Obter o corpo da requisição
    const body = await request.json();
    const { id } = body;
    
    if (!id) {
      console.error("ID da assinatura não fornecido");
      return NextResponse.json(
        { error: "ID da assinatura não fornecido" },
        { status: 400 }
      );
    }
    
    console.log(`[API Desativação] Tentando desativar assinatura com ID: ${id}`);
    
    // Referência ao documento da assinatura no Firestore
    const subscriptionRef = doc(db, "subscriptions", id);
    
    // Verificar se a assinatura existe
    const subscriptionSnap = await getDoc(subscriptionRef);
    if (!subscriptionSnap.exists()) {
      console.error(`Assinatura com ID ${id} não encontrada`);
      return NextResponse.json(
        { error: "Assinatura não encontrada" },
        { status: 404 }
      );
    }
    
    const currentStatus = subscriptionSnap.data()?.status || 'não definido';
    console.log(`[API Desativação] Assinatura encontrada. Status atual: ${currentStatus}`);
    
    // Dados a serem atualizados
    const updateData = {
      status: "inactive",
      updatedAt: new Date().toISOString()
    };
    
    console.log(`[API Desativação] Atualizando status para 'inactive'`);
    
    // Tentar ambos os métodos para garantir a atualização
    try {
      // Primeira tentativa com updateDoc
      await updateDoc(subscriptionRef, updateData);
      console.log(`[API Desativação] Atualização com updateDoc bem-sucedida`);
    } catch (updateError) {
      console.warn(`[API Desativação] Erro no updateDoc: ${updateError}. Tentando com setDoc...`);
      
      // Fallback para setDoc com merge
      await setDoc(subscriptionRef, updateData, { merge: true });
      console.log(`[API Desativação] Atualização com setDoc bem-sucedida`);
    }
    
    // Verificar se a atualização foi aplicada
    const updatedSnap = await getDoc(subscriptionRef);
    const newStatus = updatedSnap.exists() ? updatedSnap.data()?.status : 'unknown';
    console.log(`[API Desativação] Status após atualização: ${newStatus}`);
    
    if (updatedSnap.exists() && newStatus !== "inactive") {
      console.warn(`[API Desativação] A atualização não foi aplicada. Status continua: ${newStatus}`);
      return NextResponse.json(
        { error: "Falha na atualização do status", currentStatus: newStatus },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: "Status da assinatura atualizado para 'inactive'",
      id,
      oldStatus: currentStatus,
      newStatus
    });
    
  } catch (error) {
    console.error("[API Desativação] Erro ao desativar assinatura:", error);
    return NextResponse.json(
      { error: "Erro ao desativar assinatura", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 