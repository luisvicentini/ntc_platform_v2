import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, getDocs, doc, getDoc, DocumentData, query, where, updateDoc, setDoc } from "firebase/firestore"

/**
 * API endpoint para operações em lote na coleção "subscriptions"
 */
export async function POST(request: Request) {
  try {
    const sessionToken = request.headers.get("x-session-token");
    
    // Obter o corpo da requisição
    const body = await request.json();
    const { ids, status = "inactive" } = body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      console.error("[BulkAPI] IDs das assinaturas não fornecidos ou formato inválido");
      return NextResponse.json(
        { error: "IDs das assinaturas não fornecidos ou formato inválido" },
        { status: 400 }
      );
    }
    
    console.log(`[BulkAPI] Processando operação em lote para ${ids.length} assinaturas, status: ${status}`);
    
    // Registrar resultados de sucesso e falha
    const results = {
      success: [] as string[],
      failed: [] as { id: string; reason: string }[]
    };
    
    // Processar cada assinatura individualmente
    for (const id of ids) {
      try {
        // Referência ao documento da assinatura no Firestore
        const subscriptionRef = doc(db, "subscriptions", id);
        
        // Verificar se a assinatura existe
        const subscriptionSnap = await getDoc(subscriptionRef);
        if (!subscriptionSnap.exists()) {
          console.error(`[BulkAPI] Assinatura com ID ${id} não encontrada`);
          results.failed.push({ id, reason: "Assinatura não encontrada" });
          continue;
        }
        
        // Dados a serem atualizados
        const updateData = {
          status: status,
          updatedAt: new Date().toISOString()
        };
        
        try {
          // Primeira tentativa com updateDoc
          await updateDoc(subscriptionRef, updateData);
          console.log(`[BulkAPI] Assinatura ${id} atualizada com sucesso`);
        } catch (updateError) {
          // Fallback para setDoc com merge: true
          await setDoc(subscriptionRef, updateData, { merge: true });
          console.log(`[BulkAPI] Assinatura ${id} atualizada com setDoc`);
        }
        
        // Verificar se a atualização foi aplicada
        const updatedSnap = await getDoc(subscriptionRef);
        if (updatedSnap.exists() && updatedSnap.data()?.status === status) {
          results.success.push(id);
        } else {
          console.warn(`[BulkAPI] A atualização para ${id} não foi confirmada`);
          results.failed.push({ id, reason: "Atualização não confirmada" });
        }
      } catch (singleError) {
        console.error(`[BulkAPI] Erro ao processar ID ${id}:`, singleError);
        results.failed.push({ id, reason: singleError instanceof Error ? singleError.message : String(singleError) });
      }
    }
    
    // Relatório final
    console.log(`[BulkAPI] Relatório final: ${results.success.length} sucessos, ${results.failed.length} falhas`);
    
    return NextResponse.json({
      success: results.success.length > 0,
      message: `${results.success.length} assinaturas atualizadas com sucesso`,
      successCount: results.success.length,
      failCount: results.failed.length,
      successful: results.success,
      failed: results.failed
    });
    
  } catch (error) {
    console.error("[BulkAPI] Erro ao processar operação em lote:", error);
    return NextResponse.json(
      { error: "Erro ao processar operação em lote", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 